/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

type Service = {
  name: string;
  description: string;
  price: string;
  duration: string;
};

type Props = {
  locale: string;
};

export function StudioRegistrationForm({ locale }: Props) {
  const t = useTranslations('studio_register');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
  });

  const [services, setServices] = useState<Service[]>([
    { name: '', description: '', price: '', duration: '' },
  ]);

  const addService = () => {
    setServices([...services, { name: '', description: '', price: '', duration: '' }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch(`/${locale}/api/studios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          services: services.filter(s => s.name && s.price && s.duration),
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      setStudioId(data.studio.id);
      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        email: '',
      });
      setServices([{ name: '', description: '', price: '', duration: '' }]);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success && studioId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">{t('success_title')}</h2>
        <p className="text-muted-foreground mb-6">{t('success_description')}</p>
        <a
          href={`/${locale}/studios/${studioId}`}
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-semibold"
        >
          {t('view_studio_profile')}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Studio Information */}
      <div>
        <h3 className="text-xl font-bold mb-4">{t('studio_info')}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('studio_name')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('description')}</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('address')}</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('city')}</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('postal_code')}</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('phone')}</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('email')}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{t('services')}</h3>
          <button
            type="button"
            onClick={addService}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="h-4 w-4" />
            {t('add_service')}
          </button>
        </div>

        <div className="space-y-4">
          {services.map((service, index) => (
            <div key={index} className="p-4 border-2 border-muted rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('service')} {index + 1}</span>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t('service_name')}
                  value={service.name}
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-muted focus:border-primary outline-none transition-colors"
                />
                <input
                  type="text"
                  placeholder={t('service_description')}
                  value={service.description}
                  onChange={(e) => updateService(index, 'description', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-muted focus:border-primary outline-none transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={t('price')}
                    value={service.price}
                    onChange={(e) => updateService(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-muted focus:border-primary outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={t('duration')}
                    value={service.duration}
                    onChange={(e) => updateService(index, 'duration', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-muted focus:border-primary outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-200">
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
    </form>
  );
}
