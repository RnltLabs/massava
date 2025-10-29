/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Forgot Password Form Component
 * Allows users to request a password reset link
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestPasswordReset } from '@/app/actions/auth';

export function ForgotPasswordForm({
  locale = 'en',
  onBack,
}: {
  locale?: string;
  onBack?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});

    const result = await requestPasswordReset({ email }, locale);

    if (result.success) {
      setSuccess(true);
    } else {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setError(result.error || 'Failed to send reset link. Please try again.');
      }
    }

    setLoading(false);
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">
            Check Your Email
          </h3>

          <p className="text-muted-foreground mb-6">
            If an account with that email exists, we&apos;ve sent a password reset link.
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            The link will expire in 1 hour.
          </p>

          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">Reset Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={loading}
            >
              Back to Login
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
