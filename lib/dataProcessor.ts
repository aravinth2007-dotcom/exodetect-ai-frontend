import Papa from 'papaparse';
import { LightCurveData } from '@/types';

export function parseCSV(fileContent: string): LightCurveData | null {
  try {
    const results = Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    const data = results.data as Record<string, unknown>[];
    
    if (data.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Find columns that contain time and flux data
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Look for common column names
    const timeKey = keys.find(k => 
      k.toLowerCase().includes('time') || 
      k.toLowerCase().includes('jd') ||
      k.toLowerCase().includes('t_') ||
      k === 'TIME'
    );

    const fluxKey = keys.find(k => 
      k.toLowerCase().includes('flux') ||
      k.toLowerCase().includes('sap_flux') ||
      k.toLowerCase().includes('pdcsap') ||
      k === 'FLUX'
    );

    if (!timeKey || !fluxKey) {
      throw new Error(
        `Could not identify time and flux columns. Found columns: ${keys.join(', ')}`
      );
    }

    const time: number[] = [];
    const flux: number[] = [];

    // Extract data, skipping invalid rows
    for (const row of data) {
      const t = Number(row[timeKey]);
      const f = Number(row[fluxKey]);

      if (!isNaN(t) && !isNaN(f) && isFinite(t) && isFinite(f)) {
        time.push(t);
        flux.push(f);
      }
    }

    if (time.length < 10) {
      throw new Error(
        'Not enough valid data points. Expected at least 10 data points.'
      );
    }

    return { time, flux };
  } catch (error) {
    console.error('[v0] CSV parsing error:', error);
    throw error;
  }
}

export function normalizeLightCurve(data: LightCurveData): LightCurveData {
  const flux = [...data.flux];
  
  // Remove NaN and Inf values
  const validFlux = flux.filter(f => isFinite(f));
  
  if (validFlux.length === 0) {
    throw new Error('No valid flux values in data');
  }

  const min = Math.min(...validFlux);
  const max = Math.max(...validFlux);
  const range = max - min;

  if (range === 0) {
    throw new Error('All flux values are identical');
  }

  const normalizedFlux = flux.map(f => (f - min) / range);

  return {
    time: data.time,
    flux: normalizedFlux,
  };
}

export function medianFilter(
  flux: number[],
  windowSize: number = 5
): number[] {
  if (windowSize % 2 === 0) {
    throw new Error('Window size must be odd');
  }

  const halfWindow = Math.floor(windowSize / 2);
  const filtered = new Array(flux.length);

  for (let i = 0; i < flux.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(flux.length, i + halfWindow + 1);
    const window = flux.slice(start, end).sort((a, b) => a - b);
    filtered[i] = window[Math.floor(window.length / 2)];
  }

  return filtered;
}

export function polynomialDetrend(
  flux: number[],
  degree: number = 2
): number[] {
  const n = flux.length;
  const x = Array.from({ length: n }, (_, i) => i / (n - 1));

  // Fit polynomial using least squares
  const coeffs = fitPolynomial(x, flux, degree);
  
  // Evaluate polynomial at each point
  const trend = x.map(xi => evaluatePolynomial(xi, coeffs));
  
  // Subtract trend from original data
  return flux.map((f, i) => f - trend[i]);
}

function fitPolynomial(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const A: number[][] = [];
  const b: number[] = [];

  // Build augmented matrix for least squares
  for (let i = 0; i <= degree; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += Math.pow(x[k], i + j);
      }
      row.push(sum);
    }
    A.push(row);

    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += y[k] * Math.pow(x[k], i);
    }
    b.push(sum);
  }

  // Gaussian elimination
  return gaussianElimination(A, b);
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    if (Math.abs(augmented[i][i]) < 1e-10) {
      continue;
    }

    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i] || 1;
  }

  return x;
}

function evaluatePolynomial(x: number, coeffs: number[]): number {
  return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
}
