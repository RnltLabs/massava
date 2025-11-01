'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LoginFormProps {
  accountType: 'customer' | 'studio';
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  onSwitchToSignup?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm({
  accountType,
  onSubmit,
  isLoading = false,
  onSwitchToSignup,
}: LoginFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const accountTypeValue = accountType; // Reserved for future use

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'E-Mail ist erforderlich';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Ungültige E-Mail-Adresse';
        return '';
      case 'password':
        if (!value) return 'Passwort ist erforderlich';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Check if form is valid for submit button state
  const isFormValid = (): boolean => {
    return (
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      !errors.email &&
      !errors.password
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Clear previous submit error
    setSubmitError('');

    // Validate all fields
    const newErrors: Record<string, string> = {};
    ['email', 'password'].forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData] as string);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Display user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten';
      setSubmitError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="relative">
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder=" "
          disabled={isLoading}
          autoComplete="email"
          className={cn(
            'peer w-full px-4 pt-6 pb-2 rounded-xl border-2 transition-all',
            'focus:outline-none focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            errors.email && touched.email
              ? 'border-red-500 focus:border-red-600'
              : 'border-gray-300 focus:border-sage-600'
          )}
        />
        <label
          htmlFor="email"
          className={cn(
            'absolute left-4 transition-all pointer-events-none',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-sage-700',
            'top-2 text-xs',
            formData.email ? 'text-sage-700' : 'text-gray-500'
          )}
        >
          E-Mail
        </label>
        {errors.email && touched.email && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </motion.p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder=" "
          disabled={isLoading}
          autoComplete="current-password"
          className={cn(
            'peer w-full px-4 pt-6 pb-2 pr-12 rounded-xl border-2 transition-all',
            'focus:outline-none focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            errors.password && touched.password
              ? 'border-red-500 focus:border-red-600'
              : 'border-gray-300 focus:border-sage-600'
          )}
        />
        <label
          htmlFor="password"
          className={cn(
            'absolute left-4 transition-all pointer-events-none',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-sage-700',
            'top-2 text-xs',
            formData.password ? 'text-sage-700' : 'text-gray-500'
          )}
        >
          Passwort
        </label>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
        {errors.password && touched.password && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {errors.password}
          </motion.p>
        )}
      </div>

      {/* Remember Me - Card Style */}
      <div>
        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({ ...prev, rememberMe: !prev.rememberMe }))
          }
          disabled={isLoading}
          className={cn(
            'w-full p-3 rounded-xl border-2 transition-all text-left',
            'min-h-[56px] flex items-center gap-3',
            'focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            formData.rememberMe
              ? 'border-gray-300 bg-white shadow-sm'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          )}
        >
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
              formData.rememberMe
                ? 'border-gray-400'
                : 'border-gray-400 bg-white'
            )}
            style={formData.rememberMe ? { backgroundColor: '#B56550' } : undefined}
          >
          </div>
          <div className="flex-1 text-sm text-gray-900 leading-relaxed">
            Angemeldet bleiben
          </div>
        </button>
      </div>

      {/* Forgot Password */}
      <div className="text-center">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-sage-700 hover:text-sage-800 font-medium transition-colors"
        >
          Passwort vergessen?
        </Link>
      </div>

      {/* Submit Error Message */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border-2 border-red-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {submitError}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isFormValid()}
        style={isFormValid() && !isLoading ? { backgroundColor: '#B56550' } : undefined}
        className={cn(
          'w-full h-12 rounded-xl font-semibold text-base transition-all duration-200',
          'flex items-center justify-center gap-2',
          isLoading || !isFormValid()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'text-white shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Anmeldung läuft...</span>
          </>
        ) : (
          'Anmelden'
        )}
      </button>

      {/* Switch to Signup */}
      {onSwitchToSignup && (
        <div className="text-center text-sm text-gray-600">
          Noch kein Konto?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            disabled={isLoading}
            className="text-sage-700 hover:text-sage-800 font-medium transition-colors disabled:opacity-50"
          >
            Jetzt registrieren
          </button>
        </div>
      )}
    </form>
  );
}
