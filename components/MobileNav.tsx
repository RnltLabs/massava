'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, User, Calendar, HelpCircle, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface MobileNavProps {
  locale: string
  isAuthenticated: boolean
  onLoginClick?: () => void
  onSignupClick?: () => void
  onLogoutClick?: () => void
  displayName?: string
}

export function MobileNav({
  locale,
  isAuthenticated,
  onLoginClick,
  onSignupClick,
  onLogoutClick,
  displayName,
}: MobileNavProps) {
  const t = useTranslations('navigation')
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-12 w-12"
          aria-label={t('openMenu')}
        >
          <Menu className="h-7 w-7" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[280px] sm:w-[320px] flex flex-col"
      >
        {/* Language Switcher - Top Priority */}
        <div className="flex flex-col gap-2 pt-6 pb-4 px-3">
          <span className="text-base font-medium text-center">
            {t('selectLanguage')}
          </span>
          <LanguageSwitcher />
        </div>

        <Separator />

        {/* Header Section */}
        <SheetHeader className="text-center space-y-3 pt-4">
          <SheetTitle className="text-3xl font-semibold">
            {isAuthenticated && displayName
              ? t('welcomeBack', { name: displayName })
              : t('welcome')}
          </SheetTitle>
          <SheetDescription className="text-base">
            {isAuthenticated ? t('manageAccount') : t('getStarted')}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Main Navigation Content */}
        <nav className="flex-1 flex flex-col">
          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="flex flex-col gap-3 px-3">
              {/* Primary CTA */}
              <Button
                className="w-full h-11 text-base font-medium"
                onClick={() => {
                  setOpen(false)
                  onSignupClick?.()
                }}
              >
                {t('register')}
              </Button>

              {/* Secondary CTA */}
              <Button
                variant="outline"
                className="w-full h-11 text-base font-medium"
                onClick={() => {
                  setOpen(false)
                  onLoginClick?.()
                }}
              >
                {t('signIn')}
              </Button>

              {/* Value Proposition */}
              <p className="text-xs text-muted-foreground text-center pt-1">
                {t('registerBenefit')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 px-3">
              {/* Display Name */}
              {displayName && (
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground truncate">
                  {displayName}
                </div>
              )}

              {/* Authenticated User Actions */}
              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="h-11 justify-start text-base font-medium"
                >
                  <User className="mr-3 h-5 w-5" />
                  {t('myProfile')}
                </Button>
              </Link>

              <Link
                href={`/${locale}/customer/dashboard`}
                onClick={() => setOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="h-11 justify-start text-base font-medium"
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  {t('myBookings')}
                </Button>
              </Link>
            </div>
          )}

          <Separator className="my-8" />

          {/* Studio Registration Card - Centered between sections */}
          {!isAuthenticated && (
            <div className="px-3 mb-8">
              <div className="rounded-xl border-2 border-accent/50 bg-accent/5 p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">
                    {t('studioOwnerTitle')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('studioOwnerDescription')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/studios/register`}
                  onClick={() => setOpen(false)}
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base font-medium border-2 border-accent hover:bg-accent/10"
                  >
                    {t('registerStudioCta')}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          {/* Secondary Navigation - Above Footer */}
          <div className="flex flex-col gap-3 px-3 mb-6">
            <Button
              variant="outline"
              className="w-full h-11 justify-center text-base font-medium"
              onClick={() => {
                setOpen(false)
                // Navigate to help page
              }}
            >
              <HelpCircle className="mr-2 h-5 w-5" />
              {t('helpSupport')}
            </Button>

            {isAuthenticated && (
              <Button
                variant="ghost"
                className="w-full h-11 justify-start text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setOpen(false)
                  onLogoutClick?.()
                }}
              >
                <LogOut className="mr-3 h-5 w-5" />
                {t('signOut')}
              </Button>
            )}
          </div>
        </nav>

        {/* Footer Section */}
        <SheetFooter className="flex-col sm:flex-col gap-2 pt-4 border-t mt-auto">
          {/* App Version */}
          <p className="text-xs text-muted-foreground text-center">
            {t('appVersion', { version: '1.0.0' })}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
