'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SignUpFormProps {
  accountType: 'customer' | 'studio';
  onSubmit: (data: SignUpFormData) => Promise<void>;
  isLoading?: boolean;
  onSwitchToLogin?: () => void;
}

interface SignUpFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export function SignUpForm({
  accountType,
  onSubmit,
  isLoading = false,
  onSwitchToLogin,
}: SignUpFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const accountTypeValue = accountType; // Reserved for future use

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, label: '', color: '' };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengthMap = [
      { score: 0, label: 'Sehr schwach', color: 'bg-red-500' },
      { score: 1, label: 'Schwach', color: 'bg-orange-500' },
      { score: 2, label: 'Mittel', color: 'bg-yellow-500' },
      { score: 3, label: 'Gut', color: 'bg-lime-500' },
      { score: 4, label: 'Sehr gut', color: 'bg-sage-600' },
    ];

    return strengthMap[Math.min(score, 4)];
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
        if (value.length < 8) return 'Mindestens 8 Zeichen erforderlich';
        return '';
      case 'passwordConfirm':
        if (!value) return 'Passwort-Bestätigung ist erforderlich';
        if (value !== formData.password) return 'Passwörter stimmen nicht überein';
        return '';
      case 'firstName':
        if (!value.trim()) return 'Vorname ist erforderlich';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Nachname ist erforderlich';
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

    // Also validate password confirmation if password changes
    if (name === 'password' && touched.passwordConfirm) {
      const confirmError = validateField('passwordConfirm', formData.passwordConfirm);
      setErrors((prev) => ({ ...prev, passwordConfirm: confirmError }));
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
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.length >= 8 &&
      formData.password === formData.passwordConfirm &&
      formData.termsAccepted &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.email &&
      !errors.password &&
      !errors.passwordConfirm
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    console.log('🟢 [SIGNUP FORM] Submit button clicked!');
    console.log('🟢 [SIGNUP FORM] Form data:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      termsAccepted: formData.termsAccepted,
      passwordLength: formData.password.length,
      passwordsMatch: formData.password === formData.passwordConfirm,
    });

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'termsAccepted') {
        const error = validateField(key, formData[key as keyof SignUpFormData] as string);
        if (error) newErrors[key] = error;
      }
    });

    if (!formData.termsAccepted) {
      newErrors.terms = 'Sie müssen die Nutzungsbedingungen akzeptieren';
    }

    if (Object.keys(newErrors).length > 0) {
      console.error('❌ [SIGNUP FORM] Validation errors:', newErrors);
      setErrors(newErrors);
      setTouched({
        email: true,
        password: true,
        passwordConfirm: true,
        firstName: true,
        lastName: true,
      });
      return;
    }

    console.log('✅ [SIGNUP FORM] Validation passed, calling onSubmit...');
    try {
      await onSubmit(formData);
      console.log('✅ [SIGNUP FORM] onSubmit completed successfully');
      setSuccess(true);
    } catch (error) {
      console.error('❌ [SIGNUP FORM] Form submission error:', error);
      // Error will be shown by the form
    }
  };

  // Success state - Email verification message
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 py-8"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-sage-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900">
            E-Mail überprüfen
          </h3>
          <p className="text-gray-600">
            Wir haben einen Bestätigungslink an
          </p>
          <p className="font-medium text-gray-900">{formData.email}</p>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Klicke auf den Link in der E-Mail, um dein Konto zu verifizieren.
          </p>
          <p className="text-xs">
            E-Mail nicht erhalten? Überprüfe deinen Spam-Ordner oder{' '}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-sage-700 hover:text-sage-800 font-medium underline"
            >
              versuche es erneut
            </button>
            .
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="relative">
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder=" "
            disabled={isLoading}
            className={cn(
              'peer w-full px-4 pt-6 pb-2 rounded-xl border-2 transition-all',
              'focus:outline-none focus:ring-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              errors.firstName && touched.firstName
                ? 'border-red-500 focus:border-red-600'
                : 'border-gray-300 focus:border-sage-600'
            )}
          />
          <label
            htmlFor="firstName"
            className={cn(
              'absolute left-4 transition-all pointer-events-none',
              'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
              'peer-focus:top-2 peer-focus:text-xs peer-focus:text-sage-700',
              'top-2 text-xs',
              formData.firstName ? 'text-sage-700' : 'text-gray-500'
            )}
          >
            Vorname
          </label>
          {errors.firstName && touched.firstName && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.firstName}
            </motion.p>
          )}
        </div>

        {/* Last Name */}
        <div className="relative">
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder=" "
            disabled={isLoading}
            className={cn(
              'peer w-full px-4 pt-6 pb-2 rounded-xl border-2 transition-all',
              'focus:outline-none focus:ring-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              errors.lastName && touched.lastName
                ? 'border-red-500 focus:border-red-600'
                : 'border-gray-300 focus:border-sage-600'
            )}
          />
          <label
            htmlFor="lastName"
            className={cn(
              'absolute left-4 transition-all pointer-events-none',
              'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
              'peer-focus:top-2 peer-focus:text-xs peer-focus:text-sage-700',
              'top-2 text-xs',
              formData.lastName ? 'text-sage-700' : 'text-gray-500'
            )}
          >
            Nachname
          </label>
          {errors.lastName && touched.lastName && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.lastName}
            </motion.p>
          )}
        </div>
      </div>

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

        {/* Password strength indicator */}
        {formData.password && !errors.password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 space-y-1"
          >
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    level <= passwordStrength.score
                      ? passwordStrength.color
                      : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600">
              Passwortstärke: <span className="font-medium">{passwordStrength.label}</span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Password Confirmation */}
      <div className="relative">
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type={showPasswordConfirm ? 'text' : 'password'}
          value={formData.passwordConfirm}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder=" "
          disabled={isLoading}
          className={cn(
            'peer w-full px-4 pt-6 pb-2 pr-12 rounded-xl border-2 transition-all',
            'focus:outline-none focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            errors.passwordConfirm && touched.passwordConfirm
              ? 'border-red-500 focus:border-red-600'
              : formData.passwordConfirm && formData.passwordConfirm === formData.password
              ? 'border-sage-600'
              : 'border-gray-300 focus:border-sage-600'
          )}
        />
        <label
          htmlFor="passwordConfirm"
          className={cn(
            'absolute left-4 transition-all pointer-events-none',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-sage-700',
            'top-2 text-xs',
            formData.passwordConfirm ? 'text-sage-700' : 'text-gray-500'
          )}
        >
          Passwort bestätigen
        </label>
        <button
          type="button"
          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
          tabIndex={-1}
        >
          {showPasswordConfirm ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
        {errors.passwordConfirm && touched.passwordConfirm && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {errors.passwordConfirm}
          </motion.p>
        )}
        {formData.passwordConfirm &&
          formData.passwordConfirm === formData.password &&
          !errors.passwordConfirm && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-sage-600 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Passwörter stimmen überein
            </motion.p>
          )}
      </div>

      {/* Terms Acceptance - Large Tappable Card (Mobile-Friendly) */}
      <div>
        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({ ...prev, termsAccepted: !prev.termsAccepted }))
          }
          disabled={isLoading}
          className={cn(
            'w-full p-3 rounded-xl border-2 transition-all text-left',
            'min-h-[56px] flex items-center gap-3',
            'focus:outline-none focus:ring-2 focus:ring-sage-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            formData.termsAccepted
              ? 'border-sage-600 bg-sage-50 shadow-sm'
              : 'border-gray-300 bg-white hover:border-sage-400 hover:bg-gray-50'
          )}
        >
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
              formData.termsAccepted
                ? 'bg-sage-600 border-sage-600'
                : 'border-gray-400 bg-white'
            )}
          >
            {formData.termsAccepted && (
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            )}
          </div>
          <div className="flex-1 text-sm text-gray-900 leading-relaxed">
            Ich akzeptiere die{' '}
            <Link
              href="/legal/terms"
              onClick={(e) => e.stopPropagation()}
              className="text-sage-700 hover:text-sage-800 underline font-medium"
            >
              Nutzungsbedingungen
            </Link>{' '}
            und{' '}
            <Link
              href="/legal/privacy"
              onClick={(e) => e.stopPropagation()}
              className="text-sage-700 hover:text-sage-800 underline font-medium"
            >
              Datenschutzerklärung
            </Link>
          </div>
        </button>
        {errors.terms && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {errors.terms}
          </motion.p>
        )}
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
            <span>Wird erstellt...</span>
          </>
        ) : (
          'Konto erstellen'
        )}
      </button>

      {/* Switch to Login - Always visible if callback provided */}
      <div className="text-center text-sm text-gray-600">
        Bereits ein Konto?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={isLoading || !onSwitchToLogin}
          className="text-sage-700 hover:text-sage-800 font-medium transition-colors disabled:opacity-50"
        >
          Jetzt anmelden
        </button>
      </div>
    </form>
  );
}
