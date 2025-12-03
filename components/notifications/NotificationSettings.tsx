/**
 * Notification Settings Component
 * 
 * Form for managing notification preferences.
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Smartphone, Moon, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePushRegistration } from '@/hooks/usePushRegistration';

const formSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  emailDigestEnabled: z.boolean(),
  digestFrequency: z.enum(['DAILY', 'WEEKLY']),
});

type FormValues = z.infer<typeof formSchema>;

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      emailDigestEnabled: false,
      digestFrequency: 'DAILY',
    },
  });

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (response.ok) {
          const data = await response.json();
          form.reset({
            pushEnabled: data.pushEnabled ?? true,
            emailEnabled: data.emailEnabled ?? true,
            inAppEnabled: data.inAppEnabled ?? true,
            quietHoursEnabled: data.quietHoursEnabled ?? false,
            quietHoursStart: data.quietHoursStart ?? '22:00',
            quietHoursEnd: data.quietHoursEnd ?? '08:00',
            emailDigestEnabled: data.emailDigestEnabled ?? false,
            digestFrequency: data.digestFrequency ?? 'DAILY',
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungskanäle
            </CardTitle>
            <CardDescription>
              Wähle, wie du Benachrichtigungen erhalten möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications */}
            <FormField
              control={form.control}
              name="pushEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Push-Benachrichtigungen
                    </FormLabel>
                    <FormDescription>
                      Erhalte Benachrichtigungen auf diesem Gerät
                    </FormDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPushSupported && !isPushRegistered && permissionStatus !== 'denied' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEnablePush}
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Aktivieren'
                        )}
                      </Button>
                    )}
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isPushSupported || permissionStatus === 'denied'}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            {/* Email Notifications */}
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-Mail-Benachrichtigungen
                    </FormLabel>
                    <FormDescription>
                      Wichtige Updates per E-Mail erhalten
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {/* In-App Notifications */}
            <FormField
              control={form.control}
              name="inAppEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      In-App-Benachrichtigungen
                    </FormLabel>
                    <FormDescription>
                      Benachrichtigungen innerhalb der App anzeigen
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
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
              Pausiere nicht-dringende Benachrichtigungen während bestimmter Zeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Ruhezeiten aktivieren</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('quietHoursEnabled') && (
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem className="flex-1">
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
                    <FormItem className="flex-1">
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
          </CardContent>
        </Card>

        {/* Email Digest */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              E-Mail-Zusammenfassung
            </CardTitle>
            <CardDescription>
              Erhalte eine Zusammenfassung statt einzelner E-Mails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="emailDigestEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Zusammenfassung aktivieren</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('emailDigestEnabled') && (
              <FormField
                control={form.control}
                name="digestFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Häufigkeit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Täglich</SelectItem>
                        <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
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
