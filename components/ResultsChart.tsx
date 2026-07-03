'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetectionResult } from '@/types';
import { foldLightCurve } from '@/lib/signalProcessing';

interface ResultsChartProps {
  result: DetectionResult;
}

export function ResultsChart({ result }: ResultsChartProps) {
  const [activeTab, setActiveTab] = useState('original');

  // Prepare data for charts
  const originalChartData = result.processedData.original.time.map((t, i) => ({
    time: t,
    flux: result.processedData.original.flux[i],
  }));

  const detrendedChartData = result.processedData.detrended.time.map((t, i) => ({
    time: t,
    flux: result.processedData.detrended.flux[i],
  }));

  const periodogramData = result.processedData.periodogram.frequencies
    .slice(0, 500)
    .map((freq, i) => ({
      frequency: freq,
      power: result.processedData.periodogram.power[i],
    }))
    .filter(d => d.power > 0);

  // Folded light curve (if exoplanet detected)
  let foldedChartData: Array<{ phase: number; flux: number }> = [];
  if (result.isExoplanet && result.orbitalPeriod) {
    const folded = foldLightCurve(
      result.processedData.detrended,
      result.orbitalPeriod
    );
    // Add second copy of data shifted by 1 for continuous visualization
    foldedChartData = [
      ...folded.phase.map((p, i) => ({
        phase: p,
        flux: folded.flux[i],
      })),
      ...folded.phase.map((p, i) => ({
        phase: p + 1,
        flux: folded.flux[i],
      })),
    ];
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="original">Light Curve</TabsTrigger>
        <TabsTrigger value="detrended">Detrended</TabsTrigger>
        <TabsTrigger value="periodogram">Periodogram</TabsTrigger>
        {result.isExoplanet && <TabsTrigger value="folded">Folded</TabsTrigger>}
      </TabsList>

      <TabsContent value="original" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Original Light Curve</CardTitle>
            <CardDescription>
              Normalized stellar brightness measurements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={originalChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (JD)', position: 'insideBottomRight', offset: -5 }}
                  type="number"
                />
                <YAxis
                  label={{ value: 'Normalized Flux', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? value.toFixed(6) : value
                  }
                  labelFormatter={(label) =>
                    typeof label === 'number' ? label.toFixed(2) : label
                  }
                />
                <Line
                  type="monotone"
                  dataKey="flux"
                  stroke="#3b82f6"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="detrended" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Detrended Light Curve</CardTitle>
            <CardDescription>
              Light curve with long-term trends removed, highlighting transit signals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detrendedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (JD)', position: 'insideBottomRight', offset: -5 }}
                  type="number"
                />
                <YAxis
                  label={{ value: 'Flux Deviation', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? value.toFixed(6) : value
                  }
                  labelFormatter={(label) =>
                    typeof label === 'number' ? label.toFixed(2) : label
                  }
                />
                <Line
                  type="monotone"
                  dataKey="flux"
                  stroke="#10b981"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="periodogram" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Power Spectrum (Periodogram)</CardTitle>
            <CardDescription>
              Frequency analysis showing periodic signals in the data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={periodogramData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="frequency"
                  label={{
                    value: 'Frequency (cycles/day)',
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                  type="number"
                />
                <YAxis
                  scale="log"
                  label={{
                    value: 'Power (log scale)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? value.toExponential(2) : value
                  }
                  labelFormatter={(label) =>
                    typeof label === 'number' ? label.toFixed(3) : label
                  }
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorPower)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {result.isExoplanet && (
        <TabsContent value="folded" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Folded Light Curve</CardTitle>
              <CardDescription>
                Light curve folded at the detected orbital period showing transit signature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={foldedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="phase"
                    label={{
                      value: 'Orbital Phase',
                      position: 'insideBottomRight',
                      offset: -5,
                    }}
                    type="number"
                  />
                  <YAxis
                    label={{
                      value: 'Normalized Flux',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === 'number' ? value.toFixed(6) : value
                    }
                    labelFormatter={(label) =>
                      typeof label === 'number' ? label.toFixed(3) : label
                    }
                  />
                  <Scatter
                    name="Folded Data"
                    dataKey="flux"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
