'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { detectExoplanet } from '@/lib/exoplanetDetector';
import { Zap, Microscope, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const fileContent = await file.text();
      
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error('CSV file is empty');
      }

      const result = await detectExoplanet(fileContent);

      if (!result) {
        throw new Error('Failed to analyze data');
      }

      // Store result in sessionStorage for results page
      sessionStorage.setItem('detectionResult', JSON.stringify(result));
      
      // Navigate to results page
      router.push('/results');
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please check your CSV file format.';
      console.error('[v0] Error:', error);
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Discover Exoplanets with AI
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-balance">
              Analyze NASA Kepler light curve data to detect exoplanets using advanced signal processing algorithms
            </p>
          </div>

          {/* Main Upload Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Fast Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Analyze light curve data in seconds using optimized signal processing algorithms
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Microscope className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Accurate Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Uses Fourier transform and transit detection methods like real astronomers
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Full Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get orbital period, transit depth, SNR, and interactive visualizations
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Information Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
                    Upload Light Curve Data
                  </h4>
                  <p className="text-sm text-muted-foreground ml-10">
                    Submit a CSV file containing NASA Kepler light curve measurements. Expected columns: TIME/JD (time data) and FLUX/SAP_FLUX (brightness measurements).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</span>
                    Data Processing
                  </h4>
                  <p className="text-sm text-muted-foreground ml-10">
                    The algorithm normalizes your data, removes noise using median filtering, and detrends the light curve to remove long-term variations.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">3</span>
                    Signal Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground ml-10">
                    Fast Fourier Transform reveals periodic signals. Peak detection identifies candidate orbital periods and their strengths.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">4</span>
                    Exoplanet Signature Detection
                  </h4>
                  <p className="text-sm text-muted-foreground ml-10">
                    Analyzes transit depth, signal-to-noise ratio, and consistency of periodic dips to confirm exoplanet candidates with confidence scoring.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scientific Info */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card>
              <CardHeader>
                <CardTitle>The Science</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  ExoDetect AI uses the transit method, the most successful technique for discovering exoplanets. When a planet passes in front of its host star from our perspective, it causes a small, periodic dip in the star's brightness. These dips, called transits, repeat with the planet's orbital period.
                </p>
                <p>
                  The algorithm uses Fast Fourier Transform (FFT) to detect periodic signals in the light curve data, then analyzes the characteristics of these signals:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Orbital Period:</strong> How long the planet takes to orbit its star (detected from dominant frequency)</li>
                  <li><strong>Transit Depth:</strong> The fractional decrease in brightness during transit (measured in parts per million)</li>
                  <li><strong>Signal-to-Noise Ratio (SNR):</strong> How clearly the signal stands out above background noise</li>
                  <li><strong>Confidence Score:</strong> A composite metric combining all factors to assess detection reliability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
