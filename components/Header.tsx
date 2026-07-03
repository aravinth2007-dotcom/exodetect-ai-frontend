'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">ExoDetect AI</h1>
            <p className="text-xs text-muted-foreground">Exoplanet Detection System</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
