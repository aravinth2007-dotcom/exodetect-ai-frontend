'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricsPanelProps {
  isExoplanet: boolean;
  confidence: number;
  orbitalPeriod: number | null;
  transitDepth: number | null;
  snr: number | null;
  message: string;
}

export function MetricsPanel({
  isExoplanet,
  confidence,
  orbitalPeriod,
  transitDepth,
  snr,
  message,
}: MetricsPanelProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return 'bg-green-500/10 text-green-700 border-green-200';
    if (conf >= 50) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  const getResultColor = isExoplanet
    ? 'bg-green-500/10 border-green-200'
    : 'bg-blue-500/10 border-blue-200';

  const resultText = isExoplanet ? 'Exoplanet Detected ✓' : 'No Exoplanet Detected';
  const resultTextColor = isExoplanet ? 'text-green-700' : 'text-blue-700';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {/* Result Card */}
      <Card className={`${getResultColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detection Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${resultTextColor}`}>{resultText}</div>
        </CardContent>
      </Card>

      {/* Confidence Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{confidence.toFixed(1)}%</div>
          <Badge className={`mt-2 ${getConfidenceColor()}`}>
            {confidence >= 70 ? 'High' : confidence >= 50 ? 'Medium' : 'Low'}
          </Badge>
        </CardContent>
      </Card>

      {/* Orbital Period */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Orbital Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {orbitalPeriod !== null ? `${orbitalPeriod.toFixed(2)}` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">days</p>
        </CardContent>
      </Card>

      {/* Transit Depth */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Transit Depth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {transitDepth !== null ? `${transitDepth.toFixed(1)}` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">ppm</p>
        </CardContent>
      </Card>

      {/* Signal-to-Noise Ratio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">SNR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {snr !== null ? `${snr.toFixed(2)}` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">ratio</p>
        </CardContent>
      </Card>
    </div>
  );
}
