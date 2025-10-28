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

    await onSubmit(formData);
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

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
              }
              disabled={isLoading}
              className="peer sr-only"
            />
            <div
              className={cn(
                'w-5 h-5 rounded-md border-2 transition-all',
                'peer-focus:ring-2 peer-focus:ring-sage-500/20',
                formData.rememberMe
                  ? 'bg-sage-600 border-sage-600'
                  : 'border-gray-400 bg-white group-hover:border-sage-500'
              )}
            >
              {formData.rememberMe && (
                <svg
                  className="w-full h-full text-white p-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-700 select-none">Angemeldet bleiben</span>
        </label>

        <Link
          href="/auth/forgot-password"
          className="text-sm text-sage-700 hover:text-sage-800 font-medium transition-colors"
        >
          Passwort vergessen?
        </Link>
      </div>

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
