/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

type Props = {
  studioId: string;
  studioName: string;
  services: Service[];
  locale: string;
};

export function BookingForm({ studioId, services, locale }: Props) {
  const t = useTranslations('booking');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceId: services[0]?.id || '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/${locale}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studioId,
        }),
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      setSuccess(true);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        serviceId: services[0]?.id || '',
        preferredDate: '',
        preferredTime: '',
        message: '',
      });
    } catch (err) {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{t('success_title')}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t('success_description')}</p>
        <button
          onClick={() => setSuccess(false)}
          className="text-primary hover:underline text-sm"
        >
          {t('book_another')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service Selection */}
      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">{t('service')}</label>
          <select
            required
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors bg-card"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price.toFixed(2)}€ ({service.duration} min)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Customer Name */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('name')}</label>
        <input
          type="text"
          required
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('email')}</label>
        <input
          type="email"
          required
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('phone')}</label>
        <input
          type="tel"
          required
          value={formData.customerPhone}
          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Preferred Date */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('preferred_date')}</label>
        <input
          type="text"
          required
          placeholder={t('preferred_date_placeholder')}
          value={formData.preferredDate}
          onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Preferred Time */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('preferred_time')}</label>
        <input
          type="text"
          required
          placeholder={t('preferred_time_placeholder')}
          value={formData.preferredTime}
          onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('message')}</label>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder={t('message_placeholder')}
          className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all wellness-shadow"
      >
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading ? t('submitting') : t('submit')}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        {t('disclaimer')}
      </p>
    </form>
  );
}
