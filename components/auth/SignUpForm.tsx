/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unified Sign Up Form Component
 * Single registration form for all users (customers and studio owners)
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signUp } from '@/app/actions/auth';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import type { AccountType } from './AccountTypeSelector';
import Link from 'next/link';

type PasswordStrength = {
  label: string;
  color: string;
  percentage: number;
};

export function SignUpForm({
  locale = 'en',
  accountType = 'customer',
}: {
  locale?: string;
  accountType?: AccountType;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Real-time password strength validation
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { label: '', color: 'bg-gray-200', percentage: 0 };
    }

    const checks = {
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    if (passedChecks === 0) {
      return { label: 'Weak', color: 'bg-red-500', percentage: 20 };
    }
    if (passedChecks === 1) {
      return { label: 'Fair', color: 'bg-orange-500', percentage: 40 };
    }
    if (passedChecks === 2) {
      return { label: 'Good', color: 'bg-yellow-500', percentage: 70 };
    }
    return { label: 'Strong', color: 'bg-green-500', percentage: 100 };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});

    const result = await signUp({ ...formData, accountType }, locale);

    if (result.success) {
      setSuccess(true);
    } else {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    }

    setLoading(false);
  };

  // Success state - Email verification message
  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">
            E-Mail überprüfen
          </h3>

          <p className="text-muted-foreground mb-2">
            Wir haben einen Bestätigungslink an
          </p>

          <p className="font-medium mb-6">{formData.email}</p>

          <p className="text-sm text-muted-foreground mb-4">
            Klicke auf den Link in der E-Mail, um dein Konto zu verifizieren.
          </p>

          <p className="text-xs text-muted-foreground">
            E-Mail nicht erhalten? Überprüfe deinen Spam-Ordner oder{' '}
            <button
              className="text-primary hover:underline"
              onClick={() => setSuccess(false)}
            >
              versuche es erneut
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Google OAuth */}
      <GoogleOAuthButton />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Oder mit E-Mail fortfahren
          </span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Dein vollständiger Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            disabled={loading}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name[0]}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@beispiel.de"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            disabled={loading}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email[0]}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Erstelle ein sicheres Passwort"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loading}
              className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Passwortstärke:
                </span>
                <span
                  className={`font-medium ${
                    passwordStrength.percentage === 100
                      ? 'text-green-600'
                      : passwordStrength.percentage >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className={formData.password.length >= 10 ? 'text-green-600' : ''}>
              {formData.password.length >= 10 ? '✓' : '○'} Mindestens 10 Zeichen
            </p>
            <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(formData.password) ? '✓' : '○'} Ein Großbuchstabe
            </p>
            <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[0-9]/.test(formData.password) ? '✓' : '○'} Eine Zahl
            </p>
          </div>

          {errors.password && (
            <p className="text-sm text-destructive">{errors.password[0]}</p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.checked })
            }
            className="mt-1"
            required
            disabled={loading}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            Ich akzeptiere die{' '}
            <Link
              href={`/${locale}/legal/terms`}
              className="text-primary hover:underline"
              target="_blank"
            >
              Nutzungsbedingungen
            </Link>{' '}
            und{' '}
            <Link
              href={`/${locale}/legal/privacy`}
              className="text-primary hover:underline"
              target="_blank"
            >
              Datenschutzerklärung
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-sm text-destructive">{errors.terms[0]}</p>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Konto wird erstellt...
            </>
          ) : (
            'Konto erstellen'
          )}
        </Button>
      </form>
    </div>
  );
}
