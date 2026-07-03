import { LightCurveData, DetectionResult, ProcessedData } from '@/types';
import {
  parseCSV,
  normalizeLightCurve,
  medianFilter,
  polynomialDetrend,
} from './dataProcessor';
import {
  computePeriodogram,
  findDominantPeaks,
  foldLightCurve,
  calculateSignalToNoise,
  detectTransitDepth,
} from './signalProcessing';

const DETECTION_THRESHOLDS = {
  minTransitDepth: 50, // ppm
  minSNR: 7.0,
  minPower: 0.01,
};

export async function detectExoplanet(
  csvContent: string
): Promise<DetectionResult> {
  try {
    // Step 1: Parse CSV
    const originalData = parseCSV(csvContent);
    if (!originalData) {
      throw new Error('Failed to parse CSV file');
    }

    console.log('[v0] Original data points:', originalData.flux.length);

    // Step 2: Normalize
    const normalized = normalizeLightCurve(originalData);
    console.log('[v0] Data normalized');

    // Step 3: Apply median filter to reduce noise
    const smoothedFlux = medianFilter(normalized.flux, 5);
    const smoothed: LightCurveData = {
      time: normalized.time,
      flux: smoothedFlux,
    };

    // Step 4: Detrend the data
    const detrendedFlux = polynomialDetrend(smoothed.flux, 2);
    const detrended: LightCurveData = {
      time: normalized.time,
      flux: detrendedFlux,
    };

    console.log('[v0] Data detrended');

    // Step 5: Compute periodogram
    const periodogram = computePeriodogram(detrended.time, detrended.flux);
    console.log('[v0] Periodogram computed, peaks:', periodogram.length);

    // Step 6: Find dominant peaks (potential orbital periods)
    const peaks = findDominantPeaks(periodogram, 5);
    console.log('[v0] Dominant peaks found:', peaks.length);

    if (peaks.length === 0) {
      return {
        isExoplanet: false,
        confidence: 0,
        orbitalPeriod: null,
        transitDepth: null,
        snr: null,
        dominantFrequency: null,
        processedData: {
          original: originalData,
          normalized: normalized,
          detrended: detrended,
          periodogram: {
            frequencies: periodogram.map(p => p.frequency),
            power: periodogram.map(p => p.power),
          },
        },
        message: 'No significant periodic signals detected in the data.',
      };
    }

    // Step 7: Analyze top peaks to find exoplanet signature
    let bestDetection = {
      orbitalPeriod: 0,
      transitDepth: 0,
      snr: 0,
      confidence: 0,
      peakPower: 0,
    };

    for (const peak of peaks) {
      // Validate peak frequency
      if (!peak.frequency || peak.frequency <= 0 || !isFinite(peak.frequency)) {
        continue;
      }

      // Convert frequency to period (in days)
      const frequencyInDaysInverse = peak.frequency / (24 * 60 * 60);
      if (frequencyInDaysInverse === 0 || !isFinite(frequencyInDaysInverse)) {
        continue;
      }
      const period = 1 / frequencyInDaysInverse;

      if (!isFinite(period) || period <= 0) {
        continue;
      }

      // Calculate transit depth
      const transitDepth = detectTransitDepth(
        detrended.flux,
        period,
        detrended.time
      );

      if (!isFinite(transitDepth) || transitDepth < 0) {
        continue;
      }

      // Calculate SNR
      const snr = calculateSignalToNoise(detrended.flux, transitDepth / 1e6);

      if (!isFinite(snr) || snr < 0) {
        continue;
      }

      // Calculate confidence based on multiple factors
      const confidence = calculateConfidence(
        transitDepth,
        snr,
        peak.power,
        periodogram
      );

      console.log(
        '[v0] Peak analysis - Period:',
        period.toFixed(2),
        'Depth:',
        transitDepth.toFixed(1),
        'SNR:',
        snr.toFixed(2),
        'Confidence:',
        confidence.toFixed(2)
      );

      if (confidence > bestDetection.confidence) {
        bestDetection = {
          orbitalPeriod: period,
          transitDepth,
          snr,
          confidence,
          peakPower: peak.power,
        };
      }
    }

    // Step 8: Determine if exoplanet is detected
    const isExoplanet =
      bestDetection.transitDepth >= DETECTION_THRESHOLDS.minTransitDepth &&
      bestDetection.snr >= DETECTION_THRESHOLDS.minSNR &&
      bestDetection.peakPower >= DETECTION_THRESHOLDS.minPower &&
      bestDetection.confidence >= 40; // 40% confidence threshold

    console.log('[v0] Detection result:', isExoplanet, bestDetection);

    return {
      isExoplanet,
      confidence: Math.min(100, bestDetection.confidence),
      orbitalPeriod: isExoplanet ? bestDetection.orbitalPeriod : null,
      transitDepth: isExoplanet ? bestDetection.transitDepth : null,
      snr: isExoplanet ? bestDetection.snr : null,
      dominantFrequency: isExoplanet && bestDetection.orbitalPeriod > 0 ? 1 / bestDetection.orbitalPeriod : null,
      processedData: {
        original: originalData,
        normalized: normalized,
        detrended: detrended,
        periodogram: {
          frequencies: periodogram.map(p => p.frequency),
          power: periodogram.map(p => p.power),
        },
      },
      message: isExoplanet
        ? `Exoplanet candidate detected with ${bestDetection.confidence.toFixed(1)}% confidence. Orbital period: ${bestDetection.orbitalPeriod.toFixed(2)} days.`
        : 'No exoplanet signature detected. The light curve does not show sufficient transit characteristics.',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Detection error:', errorMessage);

    return {
      isExoplanet: false,
      confidence: 0,
      orbitalPeriod: null,
      transitDepth: null,
      snr: null,
      dominantFrequency: null,
      processedData: {
        original: { time: [], flux: [] },
        normalized: { time: [], flux: [] },
        detrended: { time: [], flux: [] },
        periodogram: { frequencies: [], power: [] },
      },
      message: `Error during analysis: ${errorMessage}`,
    };
  }
}

function calculateConfidence(
  transitDepth: number,
  snr: number,
  peakPower: number,
  periodogram: Array<{ frequency: number; power: number }>
): number {
  let confidence = 0;

  // Validate inputs
  if (!isFinite(transitDepth) || !isFinite(snr) || !isFinite(peakPower)) {
    return 0;
  }

  // Transit depth contribution (max 40%)
  if (transitDepth >= 50) {
    const depthFactor = Math.log(transitDepth / 50 + 1) / Math.log(11);
    if (isFinite(depthFactor)) {
      confidence += Math.min(40, 40 * depthFactor);
    }
  }

  // SNR contribution (max 35%)
  if (snr >= 7 && isFinite(snr)) {
    confidence += Math.min(35, 35 * (snr / 10));
  }

  // Peak power contribution (max 25%)
  if (periodogram && periodogram.length > 0) {
    const powerValues = periodogram.map(p => p.power).filter(p => isFinite(p));
    if (powerValues.length > 0) {
      const maxPower = Math.max(...powerValues);
      if (maxPower > 0 && isFinite(peakPower)) {
        const normalizedPower = peakPower / maxPower;
        if (isFinite(normalizedPower)) {
          confidence += 25 * Math.pow(Math.max(0, normalizedPower), 0.5);
        }
      }
    }
  }

  return Math.min(100, Math.max(0, confidence));
}
