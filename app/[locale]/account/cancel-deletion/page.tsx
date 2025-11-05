/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Cancel Account Deletion Page
 * Allows users to cancel scheduled deletion within grace period
 */

import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancel Account Deletion - Massava',
  description: 'Cancel your scheduled account deletion',
};

export default function CancelDeletionPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-lg border bg-card p-8">
        <h1 className="mb-4 text-3xl font-bold">Cancel Account Deletion</h1>

        <div className="mb-6 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <p className="font-semibold">Account Deletion Scheduled</p>
          <p className="mt-1">Your account is currently scheduled for deletion. You can cancel this within the grace period.</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <CancelDeletionForm />
        </Suspense>
      </div>
    </div>
  );
}

async function CancelDeletionForm() {
  // TODO: Implement with authentication
  // This is a placeholder - actual implementation would:
  // 1. Get authenticated user session
  // 2. Check deletion status via API
  // 3. Show cancel form if within grace period
  // 4. Handle cancellation via PUT /api/gdpr/delete-data

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <p className="font-semibold">Implementation Note</p>
        <p className="mt-1">
          This page requires authentication integration. Once NextAuth is configured,
          it will allow users to:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>View their deletion status</li>
          <li>See days remaining in grace period</li>
          <li>Cancel scheduled deletion with one click</li>
          <li>Reactivate their account immediately</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">What happens when you cancel?</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Your account will be immediately reactivated</li>
          <li>All your data will be preserved</li>
          <li>You can log in and use the service normally</li>
          <li>Your account will remain active for another 3 years of inactivity</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Need help?</h2>
        <p className="text-sm text-muted-foreground">
          If you have questions about account deletion or data retention, please contact us at{' '}
          <a href="mailto:support@massava.app" className="text-primary underline">
            support@massava.app
          </a>
        </p>
      </div>

      {/* Placeholder for actual form - will be implemented with auth */}
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Authentication required to cancel deletion.
        <br />
        Please log in to access this feature.
      </div>
    </div>
  );
}
