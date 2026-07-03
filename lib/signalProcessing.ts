import { LightCurveData, FoldedLightCurveData, PeriodicityData } from '@/types';

// Simple FFT implementation using Cooley-Tukey algorithm
export function computeFFT(data: number[]): { real: number[]; imag: number[] } {
  const n = data.length;
  
  // Pad to nearest power of 2
  const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));
  const padded = new Array(paddedLength).fill(0);
  padded.splice(0, n, ...data);

  const real = new Array(paddedLength);
  const imag = new Array(paddedLength);

  for (let i = 0; i < paddedLength; i++) {
    real[i] = padded[i];
    imag[i] = 0;
  }

  return fftRecursive(real, imag);
}

function fftRecursive(
  real: number[],
  imag: number[]
): { real: number[]; imag: number[] } {
  const n = real.length;

  if (n <= 1) {
    return { real: [...real], imag: [...imag] };
  }

  // Split even and odd indices
  const evenReal = [];
  const evenImag = [];
  const oddReal = [];
  const oddImag = [];

  for (let i = 0; i < n; i += 2) {
    evenReal.push(real[i]);
    evenImag.push(imag[i]);
    if (i + 1 < n) {
      oddReal.push(real[i + 1]);
      oddImag.push(imag[i + 1]);
    }
  }

  // Recursive calls
  const evenFFT = fftRecursive(evenReal, evenImag);
  const oddFFT = fftRecursive(oddReal, oddImag);

  const outReal = new Array(n);
  const outImag = new Array(n);
  const halfN = n / 2;

  for (let k = 0; k < halfN; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const oddReal = oddFFT.real[k];
    const oddImag = oddFFT.imag[k];

    // Multiply by twiddle factor
    const tReal = cosA * oddReal - sinA * oddImag;
    const tImag = sinA * oddReal + cosA * oddImag;

    outReal[k] = evenFFT.real[k] + tReal;
    outImag[k] = evenFFT.imag[k] + tImag;

    outReal[k + halfN] = evenFFT.real[k] - tReal;
    outImag[k + halfN] = evenFFT.imag[k] - tImag;
  }

  return { real: outReal, imag: outImag };
}

export function computePeriodogram(
  time: number[],
  flux: number[]
): PeriodicityData[] {
  const n = flux.length;
  
  // Normalize time to start from 0
  const minTime = Math.min(...time);
  const normalizedTime = time.map(t => t - minTime);
  const timeSpan = normalizedTime[n - 1] - normalizedTime[0];

  // Compute FFT
  const fft = computeFFT(flux);

  // Compute power spectrum
  const power = [];
  for (let i = 0; i < fft.real.length / 2; i++) {
    const real = fft.real[i];
    const imag = fft.imag[i];
    power.push(real * real + imag * imag);
  }

  // Convert indices to frequencies (cycles per day)
  const frequencies = [];
  const periodogram: PeriodicityData[] = [];

  for (let i = 1; i < power.length; i++) {
    const frequency = (i / timeSpan) * (24 * 60 * 60); // Convert to cycles per day
    frequencies.push(frequency);
    periodogram.push({
      frequency,
      power: power[i],
    });
  }

  return periodogram;
}

export function findDominantPeaks(
  periodogram: PeriodicityData[],
  topN: number = 5
): PeriodicityData[] {
  // Sort by power in descending order
  const sorted = [...periodogram].sort((a, b) => b.power - a.power);

  // Filter out frequencies that are too close together
  const peaks: PeriodicityData[] = [];
  const minFrequencyGap = 0.1; // cycles per day

  for (const peak of sorted) {
    const isTooClose = peaks.some(
      p => Math.abs(peak.frequency - p.frequency) < minFrequencyGap
    );

    if (!isTooClose) {
      peaks.push(peak);
      if (peaks.length >= topN) break;
    }
  }

  return peaks.sort((a, b) => a.frequency - b.frequency);
}

export function foldLightCurve(
  data: LightCurveData,
  period: number
): FoldedLightCurveData {
  const minTime = Math.min(...data.time);
  const normalizedTime = data.time.map(t => t - minTime);

  const phase: number[] = [];
  const flux: number[] = [];

  for (let i = 0; i < normalizedTime.length; i++) {
    const p = (normalizedTime[i] % period) / period;
    phase.push(p);
    flux.push(data.flux[i]);
  }

  // Sort by phase for better visualization
  const sorted = phase
    .map((p, i) => ({ phase: p, flux: flux[i] }))
    .sort((a, b) => a.phase - b.phase);

  return {
    phase: sorted.map(d => d.phase),
    flux: sorted.map(d => d.flux),
  };
}

export function calculateSignalToNoise(
  flux: number[],
  transitDepth: number
): number {
  // Estimate noise as RMS of flux deviations
  const mean = flux.reduce((a, b) => a + b) / flux.length;
  const variance =
    flux.reduce((a, f) => a + Math.pow(f - mean, 2), 0) / flux.length;
  const noise = Math.sqrt(variance);

  if (noise === 0) return 0;

  // SNR is ratio of signal (transit depth) to noise
  return Math.abs(transitDepth) / noise;
}

export function detectTransitDepth(
  flux: number[],
  period: number,
  time: number[]
): number {
  const minTime = Math.min(...time);
  const normalizedTime = time.map(t => t - minTime);

  // Calculate mean flux
  const baseMeanFlux = flux.reduce((a, b) => a + b) / flux.length;

  // Divide light curve into bins by phase
  const numBins = Math.ceil(period / 2); // At least 2 bins per period
  const binnedFlux: number[][] = Array.from({ length: numBins }, () => []);

  for (let i = 0; i < flux.length; i++) {
    const phase = (normalizedTime[i] % period) / period;
    const binIndex = Math.floor(phase * numBins) % numBins;
    binnedFlux[binIndex].push(flux[i]);
  }

  // Find minimum flux bin (most likely transit)
  let minBinFlux = baseMeanFlux;
  for (const bin of binnedFlux) {
    if (bin.length > 0) {
      const binMean = bin.reduce((a, b) => a + b) / bin.length;
      minBinFlux = Math.min(minBinFlux, binMean);
    }
  }

  // Transit depth in parts per million
  const depth = (baseMeanFlux - minBinFlux) / baseMeanFlux * 1e6;

  return Math.max(0, depth);
}
