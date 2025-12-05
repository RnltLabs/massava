/**
 * Notification Settings Component
 *
 * Matrix-based form for managing granular notification preferences.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Mail,
  Smartphone,
  Moon,
  Calendar,
  Clock,
  AlertTriangle,
  Megaphone,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePushRegistration } from '@/hooks/usePushRegistration';

const formSchema = z.object({
  // Global channel toggles
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),

  // Granular category preferences
  pushBookings: z.boolean(),
  emailBookings: z.boolean(),

  pushCancellations: z.boolean(),
  emailCancellations: z.boolean(),

  pushReminders: z.boolean(),
  emailReminders: z.boolean(),

  pushMarketing: z.boolean(),
  emailMarketing: z.boolean(),

  // Quiet hours
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

// Preset definitions
type PresetType = 'all' | 'important' | 'minimal' | 'off';

interface Preset {
  id: PresetType;
  label: string;
  description: string;
  values: Partial<FormValues>;
}

const PRESETS: Preset[] = [
  {
    id: 'all',
    label: 'Alle',
    description: 'Alle Benachrichtigungen aktiviert',
    values: {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      pushBookings: true,
      emailBookings: true,
      pushCancellations: true,
      emailCancellations: true,
      pushReminders: true,
      emailReminders: true,
      pushMarketing: true,
      emailMarketing: true,
    },
  },
  {
    id: 'important',
    label: 'Wichtig',
    description: 'Nur geschäftskritische Benachrichtigungen',
    values: {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      pushBookings: true,
      emailBookings: true,
      pushCancellations: true,
      emailCancellations: true,
      pushReminders: false,
      emailReminders: false,
      pushMarketing: false,
      emailMarketing: false,
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Nur Bestätigungen',
    values: {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      pushBookings: true,
      emailBookings: true,
      pushCancellations: false,
      emailCancellations: false,
      pushReminders: false,
      emailReminders: false,
      pushMarketing: false,
      emailMarketing: false,
    },
  },
  {
    id: 'off',
    label: 'Aus',
    description: 'Alle Benachrichtigungen deaktiviert',
    values: {
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: false,
      pushBookings: false,
      emailBookings: false,
      pushCancellations: false,
      emailCancellations: false,
      pushReminders: false,
      emailReminders: false,
      pushMarketing: false,
      emailMarketing: false,
    },
  },
];

// Category definitions for matrix view
interface NotificationCategory {
  id: string;
  icon: typeof Calendar;
  label: string;
  description: string;
  pushField: keyof FormValues;
  emailField: keyof FormValues;
  isOptional?: boolean;
}

const CATEGORIES: NotificationCategory[] = [
  {
    id: 'bookings',
    icon: Calendar,
    label: 'Buchungen',
    description: 'Neue Anfragen & Bestätigungen',
    pushField: 'pushBookings',
    emailField: 'emailBookings',
  },
  {
    id: 'cancellations',
    icon: AlertTriangle,
    label: 'Stornierungen',
    description: 'Wenn Buchungen storniert werden',
    pushField: 'pushCancellations',
    emailField: 'emailCancellations',
  },
  {
    id: 'reminders',
    icon: Clock,
    label: 'Erinnerungen',
    description: '24h vor Termin',
    pushField: 'pushReminders',
    emailField: 'emailReminders',
  },
  {
    id: 'marketing',
    icon: Megaphone,
    label: 'Marketing',
    description: 'Angebote & Promotions',
    pushField: 'pushMarketing',
    emailField: 'emailMarketing',
    isOptional: true,
  },
];

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);
  const {
    isSupported: isPushSupported,
    isRegistered: isPushRegistered,
    isRegistering,
    permissionStatus,
    register: registerPush,
  } = usePushRegistration();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      pushBookings: true,
      emailBookings: true,
      pushCancellations: true,
      emailCancellations: true,
      pushReminders: true,
      emailReminders: true,
      pushMarketing: false,
      emailMarketing: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    },
  });

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (response.ok) {
          const data = await response.json();

          // Map API response to form values
          form.reset({
            pushEnabled: data.push?.enabled ?? true,
            emailEnabled: data.email?.enabled ?? true,
            inAppEnabled: data.inApp?.enabled ?? true,
            pushBookings: data.push?.bookings ?? true,
            emailBookings: data.email?.bookings ?? true,
            pushCancellations: data.push?.cancellations ?? true,
            emailCancellations: data.email?.cancellations ?? true,
            pushReminders: data.push?.reminders ?? true,
            emailReminders: data.email?.reminders ?? true,
            pushMarketing: data.push?.marketing ?? false,
            emailMarketing: data.email?.marketing ?? false,
            quietHoursEnabled: false, // TODO: Add to API
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
          });
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
        toast.error('Einstellungen konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Einstellungen gespeichert');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const success = await registerPush();
    if (success) {
      form.setValue('pushEnabled', true);
      toast.success('Push-Benachrichtigungen aktiviert');
    } else if (permissionStatus === 'denied') {
      toast.error('Benachrichtigungen wurden im Browser blockiert. Bitte aktiviere sie in den Browser-Einstellungen.');
    }
  };

  const applyPreset = (preset: Preset) => {
    Object.entries(preset.values).forEach(([key, value]) => {
      form.setValue(key as keyof FormValues, value as any);
    });
    setSelectedPreset(preset.id);
  };

  // Detect current preset based on form values
  useEffect(() => {
    const currentValues = form.watch();
    const matchingPreset = PRESETS.find((preset) => {
      return Object.entries(preset.values).every(
        ([key, value]) => currentValues[key as keyof FormValues] === value
      );
    });
    setSelectedPreset(matchingPreset?.id ?? null);
  }, [form.watch()]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const isPushDisabled = !isPushSupported || permissionStatus === 'denied';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Notification Matrix Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungs-Einstellungen
            </CardTitle>
            <CardDescription>
              Wähle, wie du über wichtige Ereignisse informiert werden möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Preset Selection */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Label className="text-sm font-medium">Schnellauswahl:</Label>
              </div>
              <RadioGroup
                value={selectedPreset ?? ''}
                onValueChange={(value) => {
                  const preset = PRESETS.find((p) => p.id === value);
                  if (preset) applyPreset(preset);
                }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {PRESETS.map((preset) => (
                  <div key={preset.id} className="relative">
                    <RadioGroupItem
                      value={preset.id}
                      id={`preset-${preset.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`preset-${preset.id}`}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-3 text-center hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-sm font-medium">{preset.label}</span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Push Notification Setup Banner (if needed) */}
            {isPushSupported && !isPushRegistered && permissionStatus !== 'denied' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900">
                      Push-Benachrichtigungen aktivieren
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Aktiviere Push-Benachrichtigungen, um wichtige Updates in Echtzeit zu erhalten
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnablePush}
                      disabled={isRegistering}
                      className="mt-3 border-amber-300 bg-white hover:bg-amber-50"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aktiviere...
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-4 w-4" />
                          Jetzt aktivieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Permission Denied Banner */}
            {permissionStatus === 'denied' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">
                      Benachrichtigungen blockiert
                    </h4>
                    <p className="mt-1 text-sm text-red-700">
                      Bitte aktiviere Benachrichtigungen in deinen Browser-Einstellungen
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Matrix Header */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left text-sm font-medium text-muted-foreground">
                      Kategorie
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <Smartphone className="h-4 w-4" />
                        <span>Push</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>E-Mail</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <Bell className="h-4 w-4" />
                        <span>In-App</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <tr
                        key={category.id}
                        className={`border-b ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="py-4">
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{category.label}</span>
                                {category.isOptional && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Optional
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormField
                            control={form.control}
                            name={category.pushField}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                    disabled={isPushDisabled || !form.watch('pushEnabled')}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormField
                            control={form.control}
                            name={category.emailField}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                    disabled={!form.watch('emailEnabled')}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Checkbox
                            checked={form.watch('inAppEnabled')}
                            disabled
                            className="opacity-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Ruhezeiten
            </CardTitle>
            <CardDescription>
              Pausiere Push-Benachrichtigungen während bestimmter Zeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Ruhezeiten aktivieren</FormLabel>
                    <FormDescription>
                      Keine Push-Benachrichtigungen während dieser Zeiten
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('quietHoursEnabled') && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Von</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bis</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch('quietHoursEnabled') && (
              <p className="text-sm text-muted-foreground">
                Aktuelle Einstellung: {form.watch('quietHoursStart')} -{' '}
                {form.watch('quietHoursEnd')} Uhr
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              'Einstellungen speichern'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
