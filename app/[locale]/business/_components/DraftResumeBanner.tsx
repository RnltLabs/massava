/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hasDraft, getDraftAge, clearDraft } from '@/lib/storage/registration-draft';

interface DraftResumeBannerProps {
  onResume: () => void;
}

/**
 * DraftResumeBanner Component
 *
 * Displays a banner to resume incomplete studio registration.
 * Shows when a valid draft exists in localStorage.
 *
 * Features:
 * - Blue theme (border-blue-200, bg-blue-50)
 * - Shows draft age ("5 minutes ago", "2 hours ago")
 * - "Resume Registration" button (primary blue)
 * - "Start Fresh" button (outline)
 * - Close button (X icon)
 * - Auto-hides when no draft exists
 * - Clears draft on "Start Fresh"
 *
 * @example
 * ```tsx
 * <DraftResumeBanner onResume={() => setDialogOpen(true)} />
 * ```
 */
export function DraftResumeBanner({ onResume }: DraftResumeBannerProps): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [draftAge, setDraftAge] = useState<string | null>(null);

  useEffect(() => {
    // Check if draft exists on mount
    const draftExists = hasDraft();
    setIsVisible(draftExists);

    if (draftExists) {
      setDraftAge(getDraftAge());
    }
  }, []);

  const handleStartFresh = (): void => {
    clearDraft();
    setIsVisible(false);
  };

  const handleClose = (): void => {
    setIsVisible(false);
  };

  const handleResume = (): void => {
    onResume();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50 mb-8 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-blue-100 rounded-full">
              <RefreshCw className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Continue Where You Left Off
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              You have an incomplete registration from{' '}
              <span className="font-medium">{draftAge}</span>. Pick up where you left off or
              start fresh.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleResume}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Resume Registration
              </Button>
              <Button onClick={handleStartFresh} variant="outline" size="sm">
                Start Fresh
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Close banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
