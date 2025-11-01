'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, User, Calendar, HelpCircle, LogOut, Briefcase } from 'lucide-react'
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
  hasStudio?: boolean
}

export function MobileNav({
  locale,
  isAuthenticated,
  onLoginClick,
  onSignupClick,
  onLogoutClick,
  displayName,
  hasStudio = false,
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
        className="w-[280px] sm:w-[320px] flex flex-col h-full"
      >
        {/* Language Switcher - Top Priority */}
        <div className="flex flex-col gap-1 pt-3 pb-2 px-3">
          <span className="text-xs font-medium text-center">
            {t('selectLanguage')}
          </span>
          <LanguageSwitcher compact />
        </div>

        <Separator />

        {/* Header Section */}
        <SheetHeader className="text-center space-y-1 py-0 pt-1 pb-2">
          <SheetTitle className="text-xl font-semibold leading-tight">
            {isAuthenticated && displayName
              ? t('welcomeBack', { name: displayName })
              : t('welcome')}
          </SheetTitle>
          <SheetDescription className="text-xs leading-tight">
            {isAuthenticated ? t('manageAccount') : t('getStarted')}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-2" />

        {/* Main Navigation Content */}
        <nav className="flex-1 flex flex-col">
          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2 px-3 pt-2 pb-3">
              {/* Primary CTA */}
              <Button
                className="w-full h-8 text-xs font-medium"
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
                className="w-full h-8 text-xs font-medium"
                onClick={() => {
                  setOpen(false)
                  onLoginClick?.()
                }}
              >
                {t('signIn')}
              </Button>

              {/* Value Proposition */}
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                {t('registerBenefit')}
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-3 pt-2 pb-3">
              {/* Display Name */}
              {displayName && (
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground truncate">
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
                  className="w-full h-8 justify-start text-xs font-medium"
                >
                  <User className="mr-2 h-4 w-4" />
                  {t('myProfile')}
                </Button>
              </Link>

              {hasStudio && (
                <>
                  <Link
                    href={`/${locale}/dashboard/owner/calendar`}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-8 justify-start text-xs font-medium"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Kalender
                    </Button>
                  </Link>

                  <Link
                    href={`/${locale}/dashboard/owner/services`}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-8 justify-start text-xs font-medium"
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      Leistungen
                    </Button>
                  </Link>
                </>
              )}

              <Link
                href={`/${locale}/customer/dashboard`}
                onClick={() => setOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full h-8 justify-start text-xs font-medium"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('myBookings')}
                </Button>
              </Link>
            </div>
          )}

          <Separator />

          {/* Studio Registration Card - Centered between sections */}
          {!isAuthenticated && (
            <div className="px-3 flex-1 flex items-center">
              <div className="w-full rounded-xl border-2 border-accent/50 bg-accent/5 p-3 space-y-2">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">
                    {t('studioOwnerTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-snug">
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
                    className="w-full h-9 text-xs font-medium border-2 border-accent hover:bg-accent/10"
                  >
                    {t('registerStudioCta')}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Secondary Navigation - Above Footer */}
          <div className="flex flex-col gap-1.5 px-3 mb-2 mt-3">
            <Button
              variant="outline"
              className="w-full h-8 justify-center text-xs font-medium"
              onClick={() => {
                setOpen(false)
                // Navigate to help page
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              {t('helpSupport')}
            </Button>

            {isAuthenticated && (
              <Button
                variant="ghost"
                className="w-full h-8 justify-start text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setOpen(false)
                  onLogoutClick?.()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut')}
              </Button>
            )}
          </div>
        </nav>

        {/* Footer Section */}
        <SheetFooter className="flex-col sm:flex-col gap-1 pt-2 border-t">
          {/* App Version */}
          <p className="text-[9px] text-muted-foreground text-center">
            {t('appVersion', { version: '1.0.0' })}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
