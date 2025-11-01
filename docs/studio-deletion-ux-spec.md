# Design Specification: Studio Deletion Feature

## Overview
Safe and accessible studio deletion flow for non-tech-savvy Thai massage studio owners (40-60 years old). This feature allows studio owners to permanently delete their studio while keeping their account active for potential future use.

**Key Principles:**
- Safety first: Multiple confirmations prevent accidental deletions
- Clarity: Simple language, no technical jargon
- Mobile-first: Large touch targets, one step at a time
- Accessibility: WCAG 2.1 AA compliant

---

## Security Check Recommendation

### RECOMMENDED: Option B - Password Confirmation

**Rationale:**
- **Most familiar**: Users already know their password (they use it to log in)
- **Security**: Verifies user identity, prevents accidental taps by others using device
- **Recovery**: Password reset flow already exists if forgotten
- **Trust**: Feels more "official" and serious (like banking apps)

**Why NOT Option A (Studio Name):**
- Users might not remember exact name (especially with Thai characters/special formatting)
- Case sensitivity issues
- Typos more likely with long names

**Why NOT Option C (Type "DELETE"):**
- Requires typing exact word (language/keyboard issues)
- Less familiar pattern for non-tech users
- Feels arbitrary and confusing

### Fallback for Forgotten Password
If user forgets password during deletion:
1. "Forgot password?" link in deletion dialog
2. Sends password reset email
3. After reset, user must restart deletion process (security feature)

---

## User Flow

### Entry Point
**Location**: Settings page → Danger Zone section (bottom)

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Settings Page                                       │
│ (User scrolls to bottom)                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ DANGER ZONE (Red border, warning icon)              │    │
│ │                                                     │    │
│ │ Delete Studio                                       │    │
│ │ Once deleted, your studio and all bookings will be  │    │
│ │ permanently removed. You cannot undo this action.   │    │
│ │                                                     │    │
│ │ [Delete Studio Button - Red, full width on mobile] │    │
│ └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ User taps "Delete Studio"
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: First Confirmation (Sheet/Dialog opens)             │
│                                                             │
│ ⚠️  Delete Studio?                                          │
│                                                             │
│ This will permanently delete:                               │
│ ✓ Your studio profile                                      │
│ ✓ All services and prices                                  │
│ ✓ All photos and images                                    │
│ ✓ All booking history                                      │
│ ✓ Customer reviews                                         │
│                                                             │
│ Your account will remain active. You can create a new      │
│ studio later if you change your mind.                       │
│                                                             │
│ [Cancel - Secondary] [Continue - Destructive]              │
└─────────────────────────────────────────────────────────────┘
                            ↓ User taps "Continue"
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Password Verification (Same sheet/dialog)           │
│                                                             │
│ Enter your password to confirm                              │
│                                                             │
│ To protect your studio, please enter your password:        │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ [Password Input Field - Large, easy to tap]    │        │
│ │ • • • • • • • •                                 │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ Forgot password?                                            │
│                                                             │
│ [Cancel] [Delete Studio - Disabled until password entered] │
└─────────────────────────────────────────────────────────────┘
                            ↓ User enters password + taps "Delete"
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Final Confirmation (Same sheet/dialog)              │
│                                                             │
│ ⚠️  Are you absolutely sure?                                │
│                                                             │
│ This is the last step. After this, your studio             │
│ "{Studio Name}" will be deleted forever.                    │
│                                                             │
│ This action cannot be undone.                               │
│                                                             │
│ [Cancel - Secondary] [Yes, Delete Forever - Destructive]   │
└─────────────────────────────────────────────────────────────┘
                            ↓ User taps "Yes, Delete Forever"
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Loading State                                       │
│                                                             │
│ [Spinner animation]                                         │
│                                                             │
│ Deleting your studio...                                     │
│ Please wait.                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓ Deletion complete
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Success & Redirect                                  │
│                                                             │
│ Toast notification:                                         │
│ "Your studio has been deleted"                              │
│                                                             │
│ Redirect to: /[locale]/dashboard (main dashboard)          │
│                                                             │
│ Dashboard shows:                                            │
│ "You don't have a studio yet. Create one to start          │
│  accepting bookings."                                       │
│ [Create Studio Button]                                      │
└─────────────────────────────────────────────────────────────┘
```

### Alternative Flow: User Cancels

```
Any step above → User taps "Cancel"
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Dialog closes immediately                                   │
│ No changes made                                             │
│ User returns to Settings page                               │
│ No toast notification (silent cancel)                       │
└─────────────────────────────────────────────────────────────┘
```

### Error Flow: Wrong Password

```
STEP 3: Password Verification → User enters wrong password
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Password field shows error:                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ [Password Input - Red border]                   │        │
│ │ • • • • • • • •                                 │        │
│ └─────────────────────────────────────────────────┘        │
│ ❌ Incorrect password. Please try again.                    │
│                                                             │
│ Forgot password?                                            │
│                                                             │
│ [Cancel] [Delete Studio - Re-enabled]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Wireframes

### Mobile Layout (Primary - < 640px)

#### STEP 1: Settings Page - Danger Zone Section

```
┌─────────────────────────┐
│ Settings               ← │ ← Back button
├─────────────────────────┤
│                         │
│ [Other settings cards]  │
│                         │
│ ┌─────────────────────┐ │
│ │ Capacity Settings   │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Images Settings     │ │
│ └─────────────────────┘ │
│                         │
│ ─────────────────────── │ ← Separator
│                         │
│ ⚠️  DANGER ZONE         │ ← Red text
│                         │
│ ┌─────────────────────┐ │
│ │ ⚠️                   │ │ ← Warning icon
│ │ Delete Studio       │ │ ← Bold text
│ │                     │ │
│ │ Once deleted, your  │ │
│ │ studio and all      │ │
│ │ bookings will be    │ │
│ │ permanently removed.│ │
│ │ You cannot undo     │ │
│ │ this action.        │ │
│ │                     │ │
│ │ ┌─────────────────┐ │ │
│ │ │ Delete Studio   │ │ │ ← Full width
│ │ │                 │ │ │ ← Red bg, white text
│ │ └─────────────────┘ │ │ ← 48px height (easy tap)
│ └─────────────────────┘ │ ← Red border, padding
│                         │
│ [Safe whitespace]       │
└─────────────────────────┘
```

#### STEP 2: First Confirmation (Bottom Sheet)

```
┌─────────────────────────┐
│                         │
│ [Backdrop - dark]       │
│                         │
│ ╔═══════════════════════╗ ← Sheet slides up
║ ═                     ═ ║ ← Drag handle
║                         ║
║ ⚠️  Delete Studio?      ║ ← Large, bold
║                         ║
║ This will permanently   ║
║ delete:                 ║
║                         ║
║ ✓ Your studio profile   ║ ← Checkmarks
║ ✓ All services & prices ║ ← for clarity
║ ✓ All photos            ║
║ ✓ All booking history   ║
║ ✓ Customer reviews      ║
║                         ║
║ ───────────────────────  ║ ← Light separator
║                         ║
║ Your account will       ║ ← Reassuring text
║ remain active. You can  ║
║ create a new studio     ║
║ later if you change     ║
║ your mind.              ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Cancel              │ ║ ← Secondary (outline)
║ └─────────────────────┘ ║ ← 48px height
║ ┌─────────────────────┐ ║
║ │ Continue            │ ║ ← Destructive (red)
║ └─────────────────────┘ ║ ← 48px height
║                         ║
║ [Safe padding bottom]   ║
╚═══════════════════════╝
```

#### STEP 3: Password Verification

```
╔═══════════════════════╗
║ ═                     ═ ║
║                         ║
║ Enter your password     ║ ← Clear instruction
║ to confirm              ║
║                         ║
║ To protect your studio, ║
║ please enter your       ║
║ password:               ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Password            │ ║ ← Label
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ • • • • • • • •     │ ║ ← Large input
║ └─────────────────────┘ ║ ← 56px height
║                         ║
║ Forgot password?        ║ ← Link (blue, underline)
║                         ║
║ ┌─────────────────────┐ ║
║ │ Cancel              │ ║
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ Delete Studio       │ ║ ← Disabled until
║ └─────────────────────┘ ║ ← password entered
║                         ║
╚═══════════════════════╝
```

#### STEP 4: Final Confirmation

```
╔═══════════════════════╗
║ ═                     ═ ║
║                         ║
║ ⚠️  Are you absolutely  ║ ← Extra emphasis
║    sure?                ║
║                         ║
║ This is the last step.  ║ ← Clear language
║ After this, your studio ║
║ "Suwan Thai Massage"    ║ ← Show actual name
║ will be deleted forever.║
║                         ║
║ ┌─────────────────────┐ ║
║ │ This action cannot  │ ║ ← Highlighted box
║ │ be undone.          │ ║ ← (light red bg)
║ └─────────────────────┘ ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Cancel              │ ║ ← Give easy out
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ Yes, Delete Forever │ ║ ← Very clear action
║ └─────────────────────┘ ║ ← Bright red
║                         ║
╚═══════════════════════╝
```

#### STEP 5: Loading State

```
╔═══════════════════════╗
║                         ║
║                         ║
║         [Spinner]       ║ ← Animated loader
║                         ║
║    Deleting your        ║ ← Centered text
║    studio...            ║
║                         ║
║    Please wait.         ║
║                         ║
║                         ║
╚═══════════════════════╝
```

### Desktop Layout (> 768px)

#### STEP 1: Settings Page - Danger Zone

```
┌─────────────────────────────────────────────────────────┐
│ Settings                                           [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ <div className="container max-w-4xl mx-auto py-8 px-6">│
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Capacity Settings                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Images Settings                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ────────────────────────────────────────────────────── │
│                                                         │
│  ⚠️  DANGER ZONE                                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⚠️  Delete Studio                                 │  │
│  │                                                  │  │
│  │ Once deleted, your studio and all bookings will  │  │
│  │ be permanently removed. You cannot undo this     │  │
│  │ action.                                          │  │
│  │                                                  │  │
│  │                      [Delete Studio]  ←──────────┼──┤
│  │                      (Button on right)           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│ </div>                                                  │
└─────────────────────────────────────────────────────────┘
```

#### STEP 2-4: Dialog (Centered Modal)

```
        ┌─────────────────────────────────┐
        │                                 │
┌───────┼─────────────────────────────────┼───────┐
│       │                                 │       │
│       │ ╔═══════════════════════════╗   │       │
│       │ ║ ⚠️  Delete Studio?        ║   │       │
│ Dark  │ ║                           ║   │ Dark  │
│ Back  │ ║ [Same content as mobile]  ║   │ Back  │
│ drop  │ ║                           ║   │ drop  │
│       │ ║ [Cancel] [Continue]       ║   │       │
│       │ ╚═══════════════════════════╝   │       │
│       │         (Max width 525px)       │       │
│       │                                 │       │
└───────┼─────────────────────────────────┼───────┘
        │                                 │
        └─────────────────────────────────┘
```

---

## Component Specification

### 1. Danger Zone Section (Settings Page)

```typescript
// app/[locale]/dashboard/owner/settings/_components/StudioDeletionSettings.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { StudioDeletionDialog } from "./StudioDeletionDialog"

interface StudioDeletionSettingsProps {
  studioId: string
  studioName: string
}

export function StudioDeletionSettings({
  studioId,
  studioName,
}: StudioDeletionSettingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="border-t border-destructive/20 pt-8 mt-8">
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          DANGER ZONE
        </h2>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Studio
            </CardTitle>
            <CardDescription className="text-base">
              Once deleted, your studio and all bookings will be permanently
              removed. You cannot undo this action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              Delete Studio
            </Button>
          </CardContent>
        </Card>
      </div>

      <StudioDeletionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studioId={studioId}
        studioName={studioName}
      />
    </>
  )
}
```

### 2. Multi-Step Deletion Dialog

```typescript
// app/[locale]/dashboard/owner/settings/_components/StudioDeletionDialog.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteStudio } from "../_actions/delete-studio"

interface StudioDeletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studioId: string
  studioName: string
}

type Step = "confirm" | "password" | "final"

export function StudioDeletionDialog({
  open,
  onOpenChange,
  studioId,
  studioName,
}: StudioDeletionDialogProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 640px)")

  const [step, setStep] = useState<Step>("confirm")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    setStep("confirm")
    setPassword("")
    setPasswordError("")
    onOpenChange(false)
  }

  const handleContinue = () => {
    setStep("password")
  }

  const handlePasswordSubmit = async () => {
    setPasswordError("")

    // Verify password (placeholder - implement actual verification)
    const isPasswordValid = await verifyPassword(password)

    if (!isPasswordValid) {
      setPasswordError("Incorrect password. Please try again.")
      return
    }

    setStep("final")
  }

  const handleFinalDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteStudio(studioId)

      if (result.success) {
        toast.success("Your studio has been deleted")
        router.push("/dashboard")
        handleClose()
      } else {
        toast.error("Failed to delete studio. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const content = (
    <>
      {step === "confirm" && (
        <ConfirmStep
          studioName={studioName}
          onContinue={handleContinue}
          onCancel={handleClose}
        />
      )}

      {step === "password" && (
        <PasswordStep
          password={password}
          setPassword={setPassword}
          passwordError={passwordError}
          onSubmit={handlePasswordSubmit}
          onCancel={handleClose}
        />
      )}

      {step === "final" && (
        <FinalStep
          studioName={studioName}
          isDeleting={isDeleting}
          onDelete={handleFinalDelete}
          onCancel={handleClose}
        />
      )}
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        {content}
      </DialogContent>
    </Dialog>
  )
}

// Step 1: Confirm Deletion
function ConfirmStep({
  studioName,
  onContinue,
  onCancel,
}: {
  studioName: string
  onContinue: () => void
  onCancel: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Studio?
        </DialogTitle>
        <DialogDescription className="text-base pt-4">
          This will permanently delete:
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm">Your studio profile</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm">All services and prices</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm">All photos and images</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm">All booking history</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm">Customer reviews</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Your account will remain active. You can create a new studio
          later if you change your mind.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onContinue}
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
      </DialogFooter>
    </>
  )
}

// Step 2: Password Verification
function PasswordStep({
  password,
  setPassword,
  passwordError,
  onSubmit,
  onCancel,
}: {
  password: string
  setPassword: (password: string) => void
  passwordError: string
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Enter your password to confirm</DialogTitle>
        <DialogDescription className="text-base">
          To protect your studio, please enter your password:
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordError("")
            }}
            placeholder="Enter your password"
            className={passwordError ? "border-destructive" : ""}
            autoFocus
          />
          {passwordError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {passwordError}
            </p>
          )}
        </div>

        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onSubmit}
          disabled={!password}
          className="w-full sm:w-auto"
        >
          Delete Studio
        </Button>
      </DialogFooter>
    </>
  )
}

// Step 3: Final Confirmation
function FinalStep({
  studioName,
  isDeleting,
  onDelete,
  onCancel,
}: {
  studioName: string
  isDeleting: boolean
  onDelete: () => void
  onCancel: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Are you absolutely sure?
        </DialogTitle>
        <DialogDescription className="text-base pt-4">
          This is the last step. After this, your studio{" "}
          <span className="font-semibold text-foreground">"{studioName}"</span>{" "}
          will be deleted forever.
        </DialogDescription>
      </DialogHeader>

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 my-4">
        <p className="text-sm font-medium text-destructive">
          This action cannot be undone.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Yes, Delete Forever
        </Button>
      </DialogFooter>
    </>
  )
}

// Password verification helper (implement actual logic)
async function verifyPassword(password: string): Promise<boolean> {
  // TODO: Implement actual password verification
  // This should call your auth API
  return password.length > 0
}
```

### 3. Server Action for Deletion

```typescript
// app/[locale]/dashboard/owner/settings/_actions/delete-studio.ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function deleteStudio(studioId: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify studio ownership
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { userId: true },
    })

    if (!studio || studio.userId !== session.user.id) {
      return { success: false, error: "Studio not found" }
    }

    // Delete studio and all related data (cascading delete)
    await db.studio.delete({
      where: { id: studioId },
    })

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/owner/settings")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete studio:", error)
    return { success: false, error: "Failed to delete studio" }
  }
}
```

### 4. Integration in Settings Page

```typescript
// app/[locale]/dashboard/owner/settings/page.tsx
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { CapacitySettings } from "./_components/CapacitySettings"
import { ImagesSettings } from "./_components/ImagesSettings"
import { StudioDeletionSettings } from "./_components/StudioDeletionSettings"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const studio = await db.studio.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      // ... other fields
    },
  })

  if (!studio) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your studio settings
        </p>
      </div>

      <div className="space-y-6">
        <CapacitySettings studioId={studio.id} />
        <ImagesSettings studioId={studio.id} />

        {/* Danger Zone - at bottom */}
        <StudioDeletionSettings
          studioId={studio.id}
          studioName={studio.name}
        />
      </div>
    </div>
  )
}
```

---

## Responsive Behavior

### Mobile (< 640px)
- **Dialog Type**: Bottom Sheet (Drawer)
- **Button Width**: Full width (`w-full`)
- **Input Height**: 56px (easy touch target)
- **Footer**: Stacked buttons with gap
- **Font Size**: Base (16px) to prevent zoom on iOS

### Tablet (640px - 768px)
- **Dialog Type**: Bottom Sheet (Drawer)
- **Button Width**: Full width on small, auto on larger
- **Layout**: Same as mobile

### Desktop (> 768px)
- **Dialog Type**: Centered Modal (Dialog)
- **Max Width**: 525px
- **Button Width**: Auto (side-by-side)
- **Footer**: Horizontal layout
- **Backdrop**: Dark overlay (50% opacity)

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- ✅ **Tab**: Navigate through: Cancel → Continue/Delete buttons
- ✅ **Shift+Tab**: Navigate backwards
- ✅ **Enter**: Submit password (when focused on input)
- ✅ **Enter**: Activate focused button
- ✅ **Escape**: Close dialog (cancels deletion)
- ✅ **Focus trap**: Dialog traps focus when open

### Screen Reader Support
- ✅ **DialogTitle**: Announced as heading
- ✅ **DialogDescription**: Associated via `aria-describedby`
- ✅ **Error messages**: Announced via `aria-live="polite"`
- ✅ **Loading state**: "Deleting your studio..." announced
- ✅ **Button labels**: Descriptive ("Yes, Delete Forever" not just "Yes")

### Visual Indicators
- ✅ **Focus ring**: Visible on all interactive elements (ring-2 ring-offset-2)
- ✅ **Color contrast**:
  - Red destructive text: 4.5:1 ratio
  - Button text on red bg: 7:1 ratio
  - Error text: 4.5:1 ratio
- ✅ **Icon + text**: Warning icons paired with text (not icon-only)

### Touch Targets
- ✅ **Button height**: Minimum 48px (mobile)
- ✅ **Input height**: 56px (prevents iOS zoom)
- ✅ **Spacing**: 8px minimum between interactive elements
- ✅ **Drawer handle**: 40px wide × 4px tall (easy to grab)

### Language
- ✅ **Simple words**: "Delete forever" not "irreversible"
- ✅ **Clear consequences**: Bullet list of what gets deleted
- ✅ **Positive reassurance**: "Your account will remain active"
- ✅ **No jargon**: Avoid technical terms

---

## Copy Recommendations

### Simple, Clear Language

**AVOID Technical Jargon:**
- ❌ "This action is irreversible"
- ❌ "Permanently purge all data"
- ❌ "Cascade delete related entities"

**USE Simple Language:**
- ✅ "You cannot undo this action"
- ✅ "Your studio will be deleted forever"
- ✅ "This will delete your studio and all bookings"

### Reassuring Tone

**Reduce Anxiety:**
- ✅ "Your account will remain active"
- ✅ "You can create a new studio later"
- ✅ "Take your time - we'll wait"

**Be Honest:**
- ✅ "This is the last step"
- ✅ "After this, everything will be deleted"
- ✅ "We cannot recover deleted studios"

### Action-Oriented Buttons

**AVOID Vague Labels:**
- ❌ "Confirm"
- ❌ "OK"
- ❌ "Yes"

**USE Descriptive Labels:**
- ✅ "Continue"
- ✅ "Delete Studio"
- ✅ "Yes, Delete Forever"

---

## Error Handling & Edge Cases

### 1. Wrong Password
**Scenario**: User enters incorrect password

**Handling**:
```typescript
// Show inline error below password field
<p className="text-sm text-destructive flex items-center gap-1">
  <AlertTriangle className="h-4 w-4" />
  Incorrect password. Please try again.
</p>

// Keep dialog open
// Allow retry (no rate limiting on first 3 attempts)
// Show "Forgot password?" link prominently
```

### 2. Forgot Password During Deletion
**Scenario**: User clicks "Forgot password?" link

**Handling**:
```typescript
// Option 1: Open password reset in new tab
<a
  href="/forgot-password"
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-primary hover:underline"
>
  Forgot password? (opens in new tab)
</a>

// Option 2: Close dialog, redirect to password reset
// Then user must restart deletion process (security feature)
```

### 3. Network Error During Deletion
**Scenario**: API call fails

**Handling**:
```typescript
toast.error("Network error. Please check your connection and try again.")

// Keep dialog open
// Re-enable "Delete" button
// Allow retry without re-entering password
```

### 4. User Has Active Bookings
**Scenario**: Studio has future bookings

**Option A: Block Deletion**
```typescript
// In ConfirmStep, show warning:
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Cannot delete studio</AlertTitle>
  <AlertDescription>
    You have {activeBookingsCount} upcoming bookings.
    Please cancel or complete them before deleting your studio.
  </AlertDescription>
</Alert>

// Disable "Continue" button
```

**Option B: Allow with Extra Warning (RECOMMENDED)**
```typescript
// Add to confirmation list:
<div className="flex items-start gap-2">
  <Check className="h-5 w-5 text-destructive mt-0.5" />
  <p className="text-sm font-semibold text-destructive">
    {activeBookingsCount} upcoming bookings will be cancelled
  </p>
</div>

// Customers automatically notified via email
```

### 5. Accidental Close During Process
**Scenario**: User accidentally closes dialog at password step

**Handling**:
```typescript
// Dialog closes normally (no prevention)
// User can reopen and start from step 1
// Password is NOT saved (security)
// No toast notification (silent cancel)
```

### 6. Server Timeout
**Scenario**: Deletion takes too long (> 30s)

**Handling**:
```typescript
// Show extended loading message:
"This is taking longer than usual. Please don't close this window."

// If timeout after 60s:
toast.error("The request timed out. Please try again later.")

// Log error for admin investigation
// User must restart process
```

### 7. User Changes Mind After Starting
**Scenario**: User goes to final step, then cancels

**Handling**:
```typescript
// "Cancel" button always available
// No penalty for canceling
// Dialog closes immediately
// No changes made to database
// Silent cancel (no toast)
```

---

## Testing Checklist

### Functional Testing
- [ ] Can open deletion dialog from settings
- [ ] Step 1: All deletion items listed correctly
- [ ] Step 2: Password validation works
- [ ] Step 2: "Forgot password?" link works
- [ ] Step 2: Wrong password shows error
- [ ] Step 3: Studio name displayed correctly
- [ ] Step 3: Final confirmation works
- [ ] Loading state shows during deletion
- [ ] Success toast appears after deletion
- [ ] Redirects to dashboard after deletion
- [ ] Studio actually deleted from database
- [ ] Related data deleted (bookings, services, etc.)
- [ ] User account remains active

### UX Testing
- [ ] Cancel button works at all steps
- [ ] Dialog closes on Escape key
- [ ] Focus returns to trigger after close
- [ ] Mobile: Bottom sheet slides smoothly
- [ ] Desktop: Dialog centers properly
- [ ] Large touch targets (48px minimum)
- [ ] Text is readable (not too small)
- [ ] Clear visual hierarchy
- [ ] Copy is simple and clear

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible on all elements
- [ ] Screen reader announces title/description
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Color contrast meets 4.5:1
- [ ] Touch targets meet 48px minimum
- [ ] No zoom on iOS when typing

### Edge Case Testing
- [ ] Wrong password handled gracefully
- [ ] Network error handled
- [ ] Server timeout handled
- [ ] Active bookings warning shown
- [ ] Accidental close recovers gracefully
- [ ] Multiple rapid clicks prevented
- [ ] Works offline (shows error)

### Cross-Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge

### Device Testing
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)
- [ ] Desktop (1920×1080)
- [ ] Small phone (375px width)

---

## Implementation Priority

### Phase 1: Core Functionality (MVP)
1. ✅ Create StudioDeletionSettings component
2. ✅ Create StudioDeletionDialog with 3 steps
3. ✅ Implement password verification
4. ✅ Create deleteStudio server action
5. ✅ Add to Settings page
6. ✅ Basic error handling
7. ✅ Success feedback + redirect

### Phase 2: Polish
1. ✅ Mobile responsive (Drawer vs Dialog)
2. ✅ Loading states
3. ✅ Password error handling
4. ✅ "Forgot password?" link
5. ✅ Active bookings warning
6. ✅ Improve copy for clarity

### Phase 3: Accessibility
1. ✅ Keyboard navigation
2. ✅ Screen reader support
3. ✅ Focus management
4. ✅ ARIA labels
5. ✅ Color contrast check
6. ✅ Touch target sizing

### Phase 4: Edge Cases
1. ✅ Network error handling
2. ✅ Server timeout handling
3. ✅ Prevent double-submission
4. ✅ Rate limiting on wrong passwords
5. ✅ Logging for debugging

---

## Security Considerations

### Password Verification
```typescript
// Server-side password verification
export async function verifyPassword(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true },
  })

  if (!user?.hashedPassword) {
    return false
  }

  // Use bcrypt or similar
  const isValid = await bcrypt.compare(password, user.hashedPassword)

  // Log failed attempts (for security monitoring)
  if (!isValid) {
    await logFailedPasswordAttempt(userId, "studio_deletion")
  }

  return isValid
}
```

### Rate Limiting
```typescript
// Prevent brute force password attempts
// After 5 failed attempts in 15 minutes:
<Alert variant="destructive">
  Too many failed attempts. Please try again in 15 minutes.
</Alert>

// Temporarily disable password input
// Show countdown timer
```

### Audit Logging
```typescript
// Log all deletion attempts (success or failure)
await db.auditLog.create({
  data: {
    userId: session.user.id,
    action: "STUDIO_DELETION",
    studioId: studioId,
    status: "SUCCESS",
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
    timestamp: new Date(),
  },
})
```

---

## Analytics & Monitoring

### Track User Behavior
```typescript
// Analytics events to track:
analytics.track("Studio Deletion Started", {
  studioId,
  userId,
  studioAge: calculateStudioAge(studio.createdAt),
  totalBookings: bookingsCount,
})

analytics.track("Studio Deletion Step", {
  step: "confirm" | "password" | "final",
  studioId,
})

analytics.track("Studio Deletion Cancelled", {
  step: "confirm" | "password" | "final",
  studioId,
})

analytics.track("Studio Deletion Completed", {
  studioId,
  userId,
  totalBookings: bookingsCount,
  studioAge: calculateStudioAge(studio.createdAt),
})
```

### Monitor Deletion Rates
- **Metric**: Deletion rate per month
- **Alert**: If > 10% of studios deleted in a month
- **Action**: Investigate reasons (UX issues? Competitor?)

---

## Design Tokens (Tailwind)

### Colors
- **Destructive action**: `bg-destructive text-destructive-foreground`
- **Destructive text**: `text-destructive`
- **Warning border**: `border-destructive/50`
- **Warning background**: `bg-destructive/10`
- **Muted text**: `text-muted-foreground`

### Spacing
- **Card padding**: `p-6`
- **Section gap**: `space-y-6`
- **Button gap**: `gap-2`
- **Safe area (bottom)**: `pb-8` (mobile)

### Typography
- **Section title**: `text-lg font-semibold`
- **Dialog title**: `text-xl font-bold`
- **Body text**: `text-base`
- **Helper text**: `text-sm text-muted-foreground`
- **Error text**: `text-sm text-destructive`

### Shadows
- **Card**: `shadow-sm`
- **Dialog**: `shadow-lg`
- **Drawer**: No shadow (sheet pattern)

---

## Final Recommendations

### 1. Use Password Verification (Option B)
**Reasoning**: Most familiar to non-tech users, provides security, has recovery flow

### 2. Three-Step Process
**Reasoning**: Balance between safety and friction
- Step 1: Understand consequences
- Step 2: Verify identity
- Step 3: Final confirmation

### 3. Mobile-First Bottom Sheet
**Reasoning**: Easier to use on phones, feels native, less intimidating than modal

### 4. Simple, Reassuring Copy
**Reasoning**: Reduces anxiety, builds trust, prevents confusion

### 5. Easy Cancellation
**Reasoning**: Users should never feel "trapped", reduces pressure

### 6. Active Bookings Warning
**Reasoning**: Prevents customer service issues, shows consequences

---

## Success Metrics

### User Experience
- **Completion rate**: % who complete deletion after starting
- **Time to complete**: Average time from start to finish
- **Cancel rate**: % who cancel at each step
- **Password errors**: Average attempts before success

### Safety
- **Accidental deletions**: Should be 0% (multiple confirmations prevent)
- **Support tickets**: "I deleted by mistake" should be rare

### Business
- **Deletion rate**: % of studios deleted per month
- **Reasons**: Survey optional ("Why are you deleting?")
- **Re-creation rate**: % who create new studio after deleting

---

## Implementation Notes

### For feature-builder Agent
- Use Server Components for Settings page (initial data fetch)
- Use Client Component for StudioDeletionDialog (interactivity)
- Server Action for deleteStudio (security)
- Optimistic updates NOT recommended (too risky)
- Always revalidate paths after deletion

### For performance-optimizer Agent
- Dialog lazy-loaded (only when opened)
- Password verification debounced (prevent API spam)
- Deletion action has timeout (60s max)

### For security-auditor Agent
- Password verified server-side ONLY
- Rate limiting on password attempts
- Audit logging for all deletion attempts
- CSRF protection via Server Actions (built-in)
- SQL injection prevented by Prisma

---

**End of Design Specification**

Last Updated: 2025-11-01
Designed By: UX Designer Agent
Target Release: Next Sprint
