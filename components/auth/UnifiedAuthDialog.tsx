/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unified Auth Dialog Component
 * Single modal with tabs for Sign Up and Login
 * Mobile-responsive (uses Sheet on mobile, Dialog on desktop)
 */

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpForm } from './SignUpForm';
import { LoginForm } from './LoginForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type AuthView = 'main' | 'forgot-password';

export function UnifiedAuthDialog({
  open,
  onOpenChange,
  defaultTab = 'login',
  locale = 'en',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
  locale?: string;
}) {
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(defaultTab);
  const [view, setView] = useState<AuthView>('main');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      setView('main');
      setCurrentTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Update tab when defaultTab changes
  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleForgotPassword = () => {
    setView('forgot-password');
  };

  const handleBackToLogin = () => {
    setView('main');
    setCurrentTab('login');
  };

  const content = (
    <div className="w-full">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      {/* Main view - Tabs */}
      {view === 'main' && (
        <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as 'login' | 'signup')}>
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome to Massava
              </h2>
              <p className="text-sm text-muted-foreground">
                Your gateway to Thai massage wellness
              </p>
            </div>

            {/* Tabs */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="login" className="mt-6">
              <LoginForm
                locale={locale}
                onForgotPassword={handleForgotPassword}
              />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignUpForm locale={locale} />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* Forgot Password view */}
      {view === 'forgot-password' && (
        <ForgotPasswordForm locale={locale} onBack={handleBackToLogin} />
      )}
    </div>
  );

  // Mobile: Use Sheet (full-screen bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Authentication</SheetTitle>
          </VisuallyHidden>
          <div className="p-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Authentication</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
