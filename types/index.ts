export interface LightCurveData {
  time: number[];
  flux: number[];
  fluxError?: number[];
}

export interface ProcessedData {
  original: LightCurveData;
  normalized: LightCurveData;
  detrended: LightCurveData;
  periodogram: {
    frequencies: number[];
    power: number[];
  };
}

export interface DetectionResult {
  isExoplanet: boolean;
  confidence: number;
  orbitalPeriod: number | null;
  transitDepth: number | null;
  snr: number | null;
  dominantFrequency: number | null;
  processedData: ProcessedData;
  message: string;
}

export interface VisualizationData {
  time: number[];
  flux: number[];
  label: string;
}

export interface PeriodicityData {
  frequency: number;
  power: number;
}

export interface FoldedLightCurveData {
  phase: number[];
  flux: number[];
}
