/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { Clock, Sparkles } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Organic decorative blobs - Massava style */}
      <div
        className="organic-blob"
        style={{
          width: '600px',
          height: '600px',
          background: 'oklch(0.62 0.08 140 / 0.2)',
          top: '-200px',
          left: '-100px',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'oklch(0.55 0.12 35 / 0.15)',
          top: '40%',
          right: '-150px',
          animationDelay: '5s',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '450px',
          height: '450px',
          background: 'oklch(0.88 0.03 80 / 0.25)',
          bottom: '-100px',
          left: '20%',
          animationDelay: '10s',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-8 wellness-shadow">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">In Entwicklung</span>
        </div>

        {/* Logo / Brand */}
        <div className="mb-8">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-foreground mb-4">
            Massava
          </h1>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <p className="text-xl sm:text-2xl font-medium">
              Bald verfügbar
            </p>
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* Description */}
        <div className="wellness-shadow rounded-3xl bg-card p-8 sm:p-12 mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
            Spontane Massage-Buchungen – einfach gemacht
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Wir entwickeln die Plattform, die Massagen
            so einfach buchbar macht wie Tisch-Reservierungen.
            <span className="block mt-4 font-medium text-foreground">
              Ohne Provisionen. Transparent. Unkompliziert.
            </span>
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="wellness-shadow rounded-2xl bg-card p-6">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Spontan buchen</h3>
            <p className="text-sm text-muted-foreground">
              Heute noch einen Termin finden
            </p>
          </div>
          <div className="wellness-shadow rounded-2xl bg-card p-6">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold mb-2">Keine Provisionen</h3>
            <p className="text-sm text-muted-foreground">
              Faire Preise für Studios und Kunden
            </p>
          </div>
          <div className="wellness-shadow rounded-2xl bg-card p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">In deiner Nähe</h3>
            <p className="text-sm text-muted-foreground">
              Studios direkt um die Ecke
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Ein Projekt von{' '}
            <a
              href="https://rnltlabs.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              RNLT Labs
            </a>
          </p>
          <p>
            <a
              href="https://rnltlabs.de/imprint"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Impressum
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
