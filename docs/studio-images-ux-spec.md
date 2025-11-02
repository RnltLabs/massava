# Design Specification: Studio Image Upload (Logo & Gallery)

## Overview
Add logo and gallery image upload functionality to the studio registration flow, designed for non-tech-savvy studio owners who currently work with pen and paper. The interface must be mobile-first, intuitive, and feel as simple as taking photos with their phone.

**Target Users**: Thai massage studio owners (40-60 years old, smartphone users but not tech-savvy)
**Primary Device**: Mobile (iOS/Android)
**Context**: Registration flow and settings management

---

## User Flow

### Entry Points
1. **Registration Flow**: Sequential step after Address information
2. **Settings**: Dashboard → Studio Settings → Images tab
3. **Quick Edit**: Dashboard → Edit Studio button → Images section

### Recommended Flow Placement

**Proposed Order**:
```
1. Welcome
2. Basic Info (Name, Type)
3. Address (Location)
4. Images (Logo & Gallery) ← NEW STEP
5. Contact (Phone, Email)
6. Opening Hours
7. Capacity
8. Services
9. Success
```

**Rationale**:
- **After Address**: Studio's physical presence is established, images help visualize it
- **Before Contact**: Images are visual/creative (engaging), contact is data entry (boring)
- **Before Hours/Capacity**: Keep complex scheduling steps together at the end
- **Psychology**: Start with easy visual tasks → build confidence → end with complex business rules

### User Journey: Image Upload Flow

```
Registration Path:
1. User completes Address step
   → Sees success feedback
   → Auto-advances to Images step

2. User lands on Images step
   → Sees two sections: Logo (optional) + Gallery (optional)
   → Sees skip button (images are not required for registration)

3. User uploads Logo
   → Taps "Add Logo" card
   → Phone camera opens OR file picker
   → Takes photo or selects existing
   → Sees instant preview with crop overlay
   → Confirms crop
   → Logo appears in preview area

4. User uploads Gallery images
   → Taps "Add Photos" button
   → Phone gallery/camera opens
   → Selects multiple photos (up to 10)
   → Sees grid of thumbnails
   → Can delete or reorder by dragging
   → First image becomes cover photo

5. User proceeds
   → Taps "Continue" button
   → Images upload in background (with progress)
   → Advances to Contact step
   → Upload continues even if user proceeds

Alternative Flows:
- User skips images → Goes to Contact step, can add images later in settings
- User uploads wrong image → Taps X icon → Replaces with new image
- Upload fails → Shows retry button, doesn't block progression
- User wants to reorder → Long press and drag (mobile), drag handle (desktop)

Settings Path:
1. User navigates to Dashboard → Studio Settings
   → Sees tabs: Basic Info | Address | Images | Contact | Hours | Services
   → Taps "Images" tab

2. User sees current logo and gallery
   → Can replace logo by tapping on it
   → Can add more gallery images
   → Can delete or reorder existing images
   → Changes save automatically

Exit Points:
- Success: Images uploaded, user continues to next step
- Skip: User proceeds without images, can add later
- Save (Settings): Auto-save on change, toast confirmation
```

---

## Wireframes

### Mobile Layout: Registration Step (< 640px)

```
┌─────────────────────────────────────┐
│ ← Back        Images        ✕ Close │
│                                     │
│ ●●○○○○○○  (Progress: 4/9)          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│  Add Your Studio Photos             │
│  Help customers see your space      │
│  (Optional - you can add later)     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📷 Logo                     │   │
│  │  (Optional)                  │   │
│  │                              │   │
│  │  ┌─────────────────┐        │   │
│  │  │                 │        │   │
│  │  │  [Logo Image]   │        │   │
│  │  │  or              │        │   │
│  │  │  + Add Logo     │        │   │
│  │  │                 │        │   │
│  │  └─────────────────┘        │   │
│  │                              │   │
│  │  ┌─────────────────┐        │   │
│  │  │ 📸 Take Photo   │        │   │
│  │  │ 🖼️  Choose Image │        │   │
│  │  └─────────────────┘        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🖼️ Gallery Photos           │   │
│  │  (Optional - up to 10)       │   │
│  │                              │   │
│  │  ┌────┐ ┌────┐ ┌────┐       │   │
│  │  │IMG1│ │IMG2│ │IMG3│       │   │
│  │  │ ✕  │ │ ✕  │ │ ✕  │       │   │
│  │  └────┘ └────┘ └────┘       │   │
│  │                              │   │
│  │  ┌────┐ ┌────┐              │   │
│  │  │ +  │ │    │  3/10 photos │   │
│  │  │Add │ │    │              │   │
│  │  └────┘ └────┘              │   │
│  │                              │   │
│  │  💡 Tip: First photo appears │   │
│  │     in search results        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ℹ️  Image Guidelines        │   │
│  │  • Logo: Square, min 200×200 │   │
│  │  • Photos: Any size          │   │
│  │  • Max 5MB per image         │   │
│  │  • JPG, PNG, WebP            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Continue               │   │
│  │   (or Skip for now)          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Skip - Add Images Later     │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Mobile: Logo Upload Interaction

```
State 1: Empty State
┌─────────────────────┐
│  📷 Logo            │
│  (Optional)         │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │   ┌─────┐    │  │
│  │   │ 📷  │    │  │
│  │   │Add  │    │  │
│  │   │Logo │    │  │
│  │   └─────┘    │  │
│  │               │  │
│  │  Tap to add   │  │
│  └───────────────┘  │
└─────────────────────┘

State 2: Selection Menu (Bottom Sheet)
┌─────────────────────┐
│                     │
│  [Backdrop]         │
│                     │
│  ┌───────────────┐  │
│  │ Add Logo      │  │
│  ├───────────────┤  │
│  │ 📸 Take Photo │  │
│  ├───────────────┤  │
│  │ 🖼️  Gallery   │  │
│  ├───────────────┤  │
│  │ Cancel        │  │
│  └───────────────┘  │
└─────────────────────┘

State 3: Uploading
┌─────────────────────┐
│  📷 Logo            │
│                     │
│  ┌───────────────┐  │
│  │ [Blurred Img] │  │
│  │               │  │
│  │   ⏳ 67%      │  │
│  │   ━━━━━━━━░░  │  │
│  │               │  │
│  └───────────────┘  │
└─────────────────────┘

State 4: Uploaded with Actions
┌─────────────────────┐
│  📷 Logo            │
│                     │
│  ┌───────────────┐  │
│  │   [Logo]      │  │
│  │      ✓        │  │
│  │               │  │
│  │  ┌──┐  ┌──┐  │  │
│  │  │✏️│  │🗑️ │  │  │
│  │  └──┘  └──┘  │  │
│  │ Edit  Delete │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Mobile: Gallery Upload Interaction

```
State 1: Empty Gallery
┌─────────────────────────────┐
│  🖼️ Gallery Photos           │
│  (Optional - up to 10)       │
│                              │
│  ┌────────────────────┐      │
│  │                    │      │
│  │   ┌─────────┐      │      │
│  │   │    📷   │      │      │
│  │   │  Add    │      │      │
│  │   │  Photos │      │      │
│  │   └─────────┘      │      │
│  │                    │      │
│  │  Tap to add up to  │      │
│  │  10 photos         │      │
│  └────────────────────┘      │
└─────────────────────────────┘

State 2: With Images (3 uploaded)
┌─────────────────────────────┐
│  🖼️ Gallery Photos           │
│  (Optional - up to 10)       │
│                              │
│  ┌───┐ ┌───┐ ┌───┐          │
│  │[1]│ │[2]│ │[3]│          │
│  │ ✕ │ │ ✕ │ │ ✕ │          │
│  │⋮⋮ │ │⋮⋮ │ │⋮⋮ │ ← Drag   │
│  └───┘ └───┘ └───┘  handles │
│  Cover                       │
│                              │
│  ┌───┐                       │
│  │ + │  3/10 photos          │
│  │Add│                       │
│  └───┘                       │
│                              │
│  💡 Tip: First photo appears │
│     in search results        │
└─────────────────────────────┘

State 3: Image Actions (Long Press)
┌─────────────────────────────┐
│  ┌───┐                       │
│  │[1]│ ← Selected            │
│  │   │                       │
│  └───┘                       │
│                              │
│  ┌──────────────────┐        │
│  │ Set as Cover     │        │
│  ├──────────────────┤        │
│  │ Delete           │        │
│  ├──────────────────┤        │
│  │ Cancel           │        │
│  └──────────────────┘        │
└─────────────────────────────┘
```

### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────┐
│  Dialog: Add Studio Images                     ✕ Close  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ●●○○○○○○  Step 4 of 9: Images                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Add Your Studio Photos                         │   │
│  │  Help customers see your space (Optional)       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  📷 Logo         │  │  🖼️ Gallery Photos        │   │
│  │  (Optional)      │  │  (Optional - up to 10)    │   │
│  │                  │  │                           │   │
│  │  ┌────────────┐  │  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐│   │
│  │  │            │  │  │  │[1]│ │[2]│ │[3]│ │ + ││   │
│  │  │  [Logo]    │  │  │  │ ✕ │ │ ✕ │ │ ✕ │ │Add││   │
│  │  │  Preview   │  │  │  └───┘ └───┘ └───┘ └───┘│   │
│  │  │            │  │  │                           │   │
│  │  │  or        │  │  │  ┌───┐ ┌───┐            │   │
│  │  │  + Add     │  │  │  │[4]│ │[5]│  5/10       │   │
│  │  │            │  │  │  │ ✕ │ │ ✕ │            │   │
│  │  └────────────┘  │  │  └───┘ └───┘            │   │
│  │                  │  │                           │   │
│  │  [Upload Button] │  │  Drag to reorder          │   │
│  │  [Replace]       │  │  First = cover photo      │   │
│  └──────────────────┘  └──────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ℹ️  Image Guidelines                            │   │
│  │  • Logo: Square format, minimum 200×200px       │   │
│  │  • Gallery: Any size, horizontal recommended    │   │
│  │  • Max 5MB per image, formats: JPG, PNG, WebP   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌────────────────────┐                 │
│  │  ← Back  │  │  Continue →        │                 │
│  └──────────┘  └────────────────────┘                 │
│                                                         │
│  Skip - Add Images Later (text link)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Settings: Images Tab

```
Mobile Settings View
┌─────────────────────────────────────┐
│ ← Dashboard     Studio Settings     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Basic | Address | Images | Contact  │
│ Hours | Services                    │
│         ▔▔▔▔▔▔                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│  Studio Images                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📷 Studio Logo              │   │
│  │                              │   │
│  │  ┌─────────────┐             │   │
│  │  │  [Current]  │  Change     │   │
│  │  │   Logo      │  Remove     │   │
│  │  └─────────────┘             │   │
│  │                              │   │
│  │  Last updated: 2 days ago    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🖼️ Gallery Photos (5/10)    │   │
│  │                              │   │
│  │  ┌───┐ ┌───┐ ┌───┐          │   │
│  │  │[1]│ │[2]│ │[3]│          │   │
│  │  │ ✕ │ │ ✕ │ │ ✕ │          │   │
│  │  │⋮⋮ │ │⋮⋮ │ │⋮⋮ │          │   │
│  │  └───┘ └───┘ └───┘          │   │
│  │  Cover                       │   │
│  │                              │   │
│  │  ┌───┐ ┌───┐ ┌───┐          │   │
│  │  │[4]│ │[5]│ │ + │          │   │
│  │  │ ✕ │ │ ✕ │ │Add│          │   │
│  │  │⋮⋮ │ │⋮⋮ │ │   │          │   │
│  │  └───┘ └───┘ └───┘          │   │
│  │                              │   │
│  │  Tap to reorder, long press  │   │
│  │  for options                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  Changes save automatically ✓      │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Specification

### shadcn/ui Components Used

```typescript
1. ImagesStep Component (Registration)
   - Card (container)
   - Separator (between logo and gallery)
   - Button (upload, continue, skip)
   - Progress (upload progress bar)
   - Alert (guidelines, tips)
   - Sheet (mobile) / Dialog (desktop)
   - Toast (success/error notifications)

2. ImageUpload Component (Reusable)
   - Card (upload area)
   - Input (type="file", hidden)
   - Button (trigger upload)
   - Progress (upload state)
   - AspectRatio (logo preview)
   - DropdownMenu (image actions: edit, delete)

3. GalleryUpload Component (Reusable)
   - Card (gallery container)
   - ScrollArea (horizontal gallery)
   - Button (add photos)
   - Badge (photo count)
   - AlertDialog (delete confirmation)
   - DndContext (drag and drop - from @dnd-kit)

4. ImagePreview Component
   - AspectRatio (maintain ratio)
   - Avatar (fallback for logo)
   - Skeleton (loading state)
   - Button (actions overlay)
```

### Component Structure

```typescript
// File: app/(main)/dashboard/_components/studio-registration/steps/ImagesStep.tsx

"use client"

import { useState } from "react"
import { useStudioRegistration } from "../context/StudioRegistrationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { LogoUpload } from "./images/LogoUpload"
import { GalleryUpload } from "./images/GalleryUpload"
import { Info, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImagesStepProps {
  onNext: () => void
  onBack: () => void
}

export function ImagesStep({ onNext, onBack }: ImagesStepProps) {
  const { studioData, updateStudioData } = useStudioRegistration()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(studioData.logoUrl || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(studioData.galleryImages || [])

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Upload to cloud storage (e.g., Cloudinary, S3)
      const uploadedUrl = await uploadImage(file, 'logo')
      setLogoUrl(uploadedUrl)
      updateStudioData({ logoUrl: uploadedUrl })

      toast({
        title: "Logo uploaded",
        description: "Your studio logo has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleGalleryUpload = async (files: File[]) => {
    setIsUploading(true)
    try {
      const uploadedUrls = await Promise.all(
        files.map(file => uploadImage(file, 'gallery'))
      )
      const newGallery = [...galleryImages, ...uploadedUrls]
      setGalleryImages(newGallery)
      updateStudioData({ galleryImages: newGallery })

      toast({
        title: `${files.length} photo${files.length > 1 ? 's' : ''} added`,
        description: "Gallery updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Some photos failed to upload. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleContinue = () => {
    // Images are optional, always allow to continue
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Your Studio Photos</h2>
        <p className="text-muted-foreground mt-1">
          Help customers see your space (Optional - you can add later)
        </p>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📷 Studio Logo
            <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
          </CardTitle>
          <CardDescription>
            A square logo helps customers recognize your studio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload
            currentUrl={logoUrl}
            onUpload={handleLogoUpload}
            onDelete={() => {
              setLogoUrl(null)
              updateStudioData({ logoUrl: null })
            }}
            isUploading={isUploading}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Gallery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🖼️ Gallery Photos
            <span className="text-sm font-normal text-muted-foreground">(Optional - up to 10)</span>
          </CardTitle>
          <CardDescription>
            Show your massage rooms, waiting area, and atmosphere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryUpload
            images={galleryImages}
            onUpload={handleGalleryUpload}
            onDelete={(index) => {
              const updated = galleryImages.filter((_, i) => i !== index)
              setGalleryImages(updated)
              updateStudioData({ galleryImages: updated })
            }}
            onReorder={(newOrder) => {
              setGalleryImages(newOrder)
              updateStudioData({ galleryImages: newOrder })
            }}
            isUploading={isUploading}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="text-sm space-y-1">
            <p className="font-semibold">Image Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Logo: Square format, minimum 200×200 pixels</li>
              <li>Gallery: Any size, horizontal recommended</li>
              <li>Max 5MB per image</li>
              <li>Formats: JPG, PNG, WebP</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleContinue}
          disabled={isUploading}
          size="lg"
          className="w-full"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleContinue}
          className="w-full"
        >
          Skip - Add Images Later
        </Button>
      </div>
    </div>
  )
}
```

```typescript
// File: app/(main)/dashboard/_components/studio-registration/steps/images/LogoUpload.tsx

"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoUploadProps {
  currentUrl: string | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => void
  isUploading: boolean
}

export function LogoUpload({ currentUrl, onUpload, onDelete, isUploading }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (JPG, PNG, WebP)",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    await onUpload(file)

    clearInterval(interval)
    setUploadProgress(100)
    setTimeout(() => setUploadProgress(0), 1000)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload logo image"
      />

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          currentUrl && "border-solid"
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          {currentUrl ? (
            // Preview State
            <>
              <Avatar className="h-32 w-32">
                <AvatarImage src={currentUrl} alt="Studio logo" />
                <AvatarFallback>Logo</AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </>
          ) : isUploading ? (
            // Uploading State
            <>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </>
          ) : (
            // Empty State
            <>
              <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>

              <div className="text-center space-y-2">
                <p className="font-medium">Tap to add logo</p>
                <p className="text-sm text-muted-foreground">
                  Take a photo or choose from gallery
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {currentUrl && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Logo uploaded successfully
        </div>
      )}
    </div>
  )
}
```

```typescript
// File: app/(main)/dashboard/_components/studio-registration/steps/images/GalleryUpload.tsx

"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, X, GripVertical, Star } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"

interface GalleryUploadProps {
  images: string[]
  onUpload: (files: File[]) => Promise<void>
  onDelete: (index: number) => void
  onReorder: (newOrder: string[]) => void
  isUploading: boolean
  maxImages: number
}

export function GalleryUpload({
  images,
  onUpload,
  onDelete,
  onReorder,
  isUploading,
  maxImages
}: GalleryUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    // Validate count
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload ${maxImages} images total`,
        variant: "destructive",
      })
      return
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > 5 * 1024 * 1024) return false
      return true
    })

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files skipped",
        description: "Only images under 5MB are allowed",
        variant: "destructive",
      })
    }

    if (validFiles.length > 0) {
      await onUpload(validFiles)
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = images.indexOf(active.id)
      const newIndex = images.indexOf(over.id)
      const newOrder = arrayMove(images, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload gallery images"
      />

      {/* Gallery Grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, index) => (
                <GalleryImage
                  key={url}
                  url={url}
                  index={index}
                  isCover={index === 0}
                  onDelete={() => setDeleteIndex(index)}
                />
              ))}

              {/* Add More Button */}
              {canAddMore && (
                <Card
                  className="border-2 border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AspectRatio ratio={1}>
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </div>
                  </AspectRatio>
                </Card>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">Tap to add photos</p>
              <p className="text-sm text-muted-foreground">
                Add up to {maxImages} photos of your studio
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Info Badge */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary">
            {images.length}/{maxImages} photos
          </Badge>
          <p className="text-muted-foreground">
            {images.length === 0 ? "First photo becomes cover" : "Drag to reorder"}
          </p>
        </div>
      )}

      {/* Tip */}
      {images.length > 0 && (
        <div className="flex gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Tip:</strong> Your first photo appears in search results and attracts more customers
          </p>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the photo from your gallery. You can add it back later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteIndex !== null) {
                  onDelete(deleteIndex)
                  setDeleteIndex(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function GalleryImage({
  url,
  index,
  isCover,
  onDelete
}: {
  url: string
  index: number
  isCover: boolean
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <Card className={cn(
        "overflow-hidden border-2",
        isCover && "border-primary ring-2 ring-primary/20"
      )}>
        <AspectRatio ratio={1}>
          <img
            src={url}
            alt={`Gallery image ${index + 1}`}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      </Card>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {/* Delete Button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Cover Badge */}
      {isCover && (
        <Badge className="absolute bottom-2 left-2 bg-primary">
          <Star className="h-3 w-3 mr-1" />
          Cover
        </Badge>
      )}
    </div>
  )
}
```

---

## Accessibility (WCAG 2.1 AA)

### Checklist

**Semantic HTML:**
- ✅ Use `<input type="file">` with proper `accept` attribute
- ✅ All images have descriptive `alt` text
- ✅ Headings in proper hierarchy (h2 for step title)
- ✅ Use `<button>` elements for all actions

**ARIA Labels:**
- ✅ File input: `aria-label="Upload logo image"`
- ✅ Delete buttons: `aria-label="Delete image {index}"`
- ✅ Drag handles: `aria-label="Drag to reorder"`
- ✅ Upload progress: `role="progressbar"` with `aria-valuenow`

**Keyboard Navigation:**
- ✅ Tab navigates: Logo upload → Gallery add → Each image → Continue button
- ✅ Enter/Space activates file picker
- ✅ Escape closes dialogs (delete confirmation)
- ✅ Arrow keys navigate between gallery images
- ✅ Keyboard shortcuts for reorder (Ctrl+Up/Down)

**Focus Indicators:**
- ✅ Visible focus ring on all interactive elements (`ring-2 ring-offset-2`)
- ✅ Focus remains on delete button after confirmation
- ✅ Focus returns to "Add" button after image upload

**Color Contrast:**
- ✅ Text: 4.5:1 minimum (handled by shadcn/ui theme)
- ✅ Border colors meet 3:1 for UI components
- ✅ Error messages: High contrast red
- ✅ Success indicators: High contrast green

**Screen Reader Support:**
- ✅ Upload progress announced: "Uploading image, 67% complete"
- ✅ Success announced: "Logo uploaded successfully"
- ✅ Deletion announced: "Image 3 deleted"
- ✅ Reorder announced: "Image moved from position 2 to position 1"
- ✅ Image count announced: "5 of 10 photos uploaded"

**Alternative Input:**
- ✅ Touch targets minimum 44×44px (mobile buttons)
- ✅ Long press for mobile actions (alternative to hover)
- ✅ Drag and drop optional (reorder via menu also available)

**Error Prevention:**
- ✅ File type validation before upload attempt
- ✅ File size validation with helpful error messages
- ✅ Confirmation dialog for destructive actions (delete)
- ✅ Clear visual feedback for upload status

---

## Error Handling & Validation

### Client-Side Validation

```typescript
// File validation function
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image (JPG, PNG, or WebP)'
    }
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image must be smaller than 5MB'
    }
  }

  // Check dimensions (for logo)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        resolve({
          valid: false,
          error: 'Logo must be at least 200×200 pixels'
        })
      } else {
        resolve({ valid: true })
      }
    }
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Unable to load image. Please try another file.'
      })
    }
    img.src = URL.createObjectURL(file)
  })
}
```

### Error States & Messages

**File Type Error:**
```typescript
toast({
  title: "Wrong file type",
  description: "Please select an image file (JPG, PNG, or WebP)",
  variant: "destructive",
})
```

**File Size Error:**
```typescript
toast({
  title: "File too large",
  description: "Image must be smaller than 5MB. Try compressing it first.",
  variant: "destructive",
})
```

**Dimensions Error (Logo):**
```typescript
toast({
  title: "Image too small",
  description: "Logo must be at least 200×200 pixels for best quality",
  variant: "destructive",
})
```

**Upload Network Error:**
```typescript
toast({
  title: "Upload failed",
  description: "Check your internet connection and try again",
  variant: "destructive",
  action: (
    <Button variant="outline" size="sm" onClick={retryUpload}>
      Retry
    </Button>
  ),
})
```

**Too Many Images:**
```typescript
toast({
  title: "Maximum reached",
  description: "You can only upload 10 gallery photos. Delete one to add more.",
  variant: "destructive",
})
```

**Generic Error:**
```typescript
toast({
  title: "Something went wrong",
  description: "Failed to upload image. Please try again in a moment.",
  variant: "destructive",
})
```

### Loading States

**Upload Progress:**
- Progress bar (0-100%)
- Percentage text below bar
- Blurred image preview during upload
- Disable all actions until complete

**Success Feedback:**
- Green checkmark icon
- Toast notification
- Smooth fade-in animation for new image
- Auto-save indicator in settings

**Background Upload:**
- Allow user to continue to next step while uploading
- Show persistent upload indicator (bottom toast)
- Notify on completion or failure
- Retry failed uploads automatically (up to 3 attempts)

---

## Settings Integration

### Navigation Structure

```
Dashboard
└── Studio Settings
    ├── Basic Info
    ├── Address
    ├── Images ← NEW TAB
    ├── Contact
    ├── Opening Hours
    └── Services
```

### Settings Component

```typescript
// File: app/(main)/dashboard/settings/_components/tabs/ImagesTab.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogoUpload } from "@/components/studio-registration/steps/images/LogoUpload"
import { GalleryUpload } from "@/components/studio-registration/steps/images/GalleryUpload"
import { useStudio } from "@/hooks/use-studio"
import { useToast } from "@/components/ui/use-toast"
import { updateStudioImages } from "@/app/actions/studio"

export function ImagesTab() {
  const { studio, mutate } = useStudio()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(studio?.logoUrl || null)
  const [galleryImages, setGalleryImages] = useState(studio?.galleryImages || [])

  // Auto-save on change
  useEffect(() => {
    const saveChanges = async () => {
      setIsSaving(true)
      try {
        await updateStudioImages({
          studioId: studio.id,
          logoUrl,
          galleryImages,
        })

        // Revalidate studio data
        mutate()

        toast({
          description: "Changes saved automatically ✓",
        })
      } catch (error) {
        toast({
          title: "Save failed",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }

    // Debounce auto-save
    const timeout = setTimeout(saveChanges, 1000)
    return () => clearTimeout(timeout)
  }, [logoUrl, galleryImages])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Studio Images</h2>
        <p className="text-muted-foreground">
          Manage your studio logo and gallery photos
        </p>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Logo</CardTitle>
          <CardDescription>
            Your logo appears in search results and on your studio page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload
            currentUrl={logoUrl}
            onUpload={async (file) => {
              const uploadedUrl = await uploadImage(file, 'logo')
              setLogoUrl(uploadedUrl)
            }}
            onDelete={() => setLogoUrl(null)}
            isUploading={isSaving}
          />
          {studio?.logoUrl && (
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {formatDate(studio.logoUpdatedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Gallery Section */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Photos ({galleryImages.length}/10)</CardTitle>
          <CardDescription>
            Show potential customers your massage rooms, waiting area, and atmosphere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryUpload
            images={galleryImages}
            onUpload={async (files) => {
              const uploadedUrls = await Promise.all(
                files.map(file => uploadImage(file, 'gallery'))
              )
              setGalleryImages([...galleryImages, ...uploadedUrls])
            }}
            onDelete={(index) => {
              setGalleryImages(galleryImages.filter((_, i) => i !== index))
            }}
            onReorder={(newOrder) => {
              setGalleryImages(newOrder)
            }}
            isUploading={isSaving}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving changes...
        </div>
      )}
    </div>
  )
}
```

### Settings Navigation

```typescript
// Add to: app/(main)/dashboard/settings/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, MapPin, Image, Phone, Clock, Briefcase } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="basic">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Address</span>
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="services">
            <Briefcase className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Services</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <ImagesTab />
        </TabsContent>

        {/* Other tabs... */}
      </Tabs>
    </div>
  )
}
```

---

## Design Tokens (Tailwind CSS)

### Colors
- **Primary Actions**: `bg-primary` (shadcn/ui default)
- **Destructive Actions**: `bg-destructive` (delete buttons)
- **Muted Text**: `text-muted-foreground`
- **Borders**: `border-border`
- **Success**: `text-green-600` (checkmarks)
- **Cover Badge**: `bg-primary` with star icon

### Spacing
- **Container Padding**: `px-4 md:px-6`
- **Section Gap**: `space-y-6`
- **Card Padding**: `p-6` (desktop), `p-4` (mobile)
- **Grid Gap**: `gap-3` (gallery grid)
- **Button Gap**: `gap-2` (icon + text)

### Typography
- **Step Title**: `text-2xl font-bold tracking-tight`
- **Card Title**: `text-lg font-semibold`
- **Description**: `text-muted-foreground`
- **Helper Text**: `text-sm text-muted-foreground`
- **Error Text**: `text-sm text-destructive`

### Borders
- **Default**: `border-2`
- **Dashed Upload Area**: `border-2 border-dashed`
- **Cover Photo**: `border-2 border-primary ring-2 ring-primary/20`
- **Hover**: `hover:border-primary`

### Shadows
- **Card**: `shadow-sm` (shadcn/ui default)
- **Dialog**: `shadow-lg`
- **Image Overlay**: `bg-black/60` (semi-transparent)

### Transitions
- **Border Color**: `transition-colors`
- **Opacity**: `transition-opacity`
- **All Properties**: `transition-all`
- **Image Fade In**: `animate-in fade-in duration-300`

---

## Implementation Notes

### For feature-builder Agent

**File Structure:**
```
app/(main)/dashboard/_components/studio-registration/
├── steps/
│   ├── ImagesStep.tsx (main step component)
│   └── images/
│       ├── LogoUpload.tsx (reusable logo uploader)
│       ├── GalleryUpload.tsx (reusable gallery manager)
│       └── ImagePreview.tsx (image preview with actions)
├── context/
│   └── StudioRegistrationContext.tsx (update to include images)
└── StudioRegistrationDialog.tsx (add ImagesStep to flow)

app/(main)/dashboard/settings/_components/tabs/
└── ImagesTab.tsx (settings integration)

lib/
├── upload.ts (image upload utilities)
└── image-validation.ts (client-side validation)

app/actions/
└── studio.ts (server actions for image upload)
```

**Technical Requirements:**
1. **Image Upload**:
   - Use cloud storage (Cloudinary, AWS S3, or similar)
   - Generate optimized versions (thumbnail, medium, large)
   - Return CDN URLs for fast loading

2. **Client Components**:
   - All upload components are Client Components (`"use client"`)
   - Use React state for upload progress
   - Implement optimistic UI updates

3. **Server Actions**:
   - Validate file type and size on server
   - Scan for malware (if possible)
   - Generate unique file names (prevent overwrites)
   - Update database with image URLs

4. **Database Schema**:
   ```prisma
   model Studio {
     // ... existing fields
     logoUrl        String?
     logoUpdatedAt  DateTime?
     galleryImages  String[]  // Array of image URLs
     galleryUpdatedAt DateTime?
   }
   ```

5. **Performance**:
   - Use Next.js Image component for optimized loading
   - Lazy load gallery images (below fold)
   - Compress images before upload (client-side)
   - Show thumbnails in gallery, full size on click

### For performance-optimizer Agent

**Optimization Checklist:**
1. **Image Compression**:
   - Client-side compression before upload (use `browser-image-compression`)
   - Max width: 1920px, quality: 85%
   - Convert to WebP format on server

2. **Loading Strategy**:
   - Logo: Priority load (appears above fold)
   - Gallery: Lazy load with intersection observer
   - Thumbnails: 300px width, progressive JPEG

3. **Caching**:
   - CDN caching for uploaded images
   - Browser caching headers (1 year)
   - Stale-while-revalidate strategy

4. **Bundle Size**:
   - Lazy load @dnd-kit (only when gallery has images)
   - Use dynamic imports for image cropper (if added)
   - Tree-shake unused lucide-react icons

5. **Network**:
   - Upload images in parallel (Promise.all)
   - Show progress for each upload
   - Retry failed uploads (exponential backoff)

### For security-auditor Agent

**Security Checklist:**
1. **File Validation**:
   - Server-side file type validation (magic bytes, not just extension)
   - Maximum file size enforcement (5MB)
   - Scan for embedded malware/scripts

2. **Upload Security**:
   - Generate random file names (prevent path traversal)
   - Store in isolated bucket/folder
   - Restrict file permissions (read-only public access)

3. **Input Sanitization**:
   - Strip EXIF data (may contain GPS coordinates)
   - Remove potential XSS vectors from metadata
   - Validate image dimensions

4. **Rate Limiting**:
   - Limit uploads per user per hour (e.g., 50 images/hour)
   - Implement CSRF protection (Server Actions handle this)
   - Prevent automated abuse

5. **Access Control**:
   - Only studio owner can upload to their studio
   - Verify studio ownership in Server Action
   - Log all upload attempts (audit trail)

6. **Content Moderation** (Future):
   - Consider AI moderation for inappropriate content
   - Allow users to report inappropriate images
   - Manual review queue for flagged content

---

## Testing Checklist

### Manual Testing

**Mobile (iOS/Android):**
- [ ] Logo upload from camera works
- [ ] Logo upload from gallery works
- [ ] Gallery multi-select works (10 images)
- [ ] Drag to reorder works (long press)
- [ ] Delete confirmation appears
- [ ] Upload progress shows correctly
- [ ] Images persist after navigating away
- [ ] Touch targets are at least 44×44px
- [ ] Swipe gestures don't interfere with UI

**Desktop (Chrome/Firefox/Safari):**
- [ ] Drag and drop logo works
- [ ] Click to upload logo works
- [ ] Gallery drag and drop works (multiple files)
- [ ] Drag to reorder works (mouse)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Images preview correctly
- [ ] Hover states work

**Validation:**
- [ ] Wrong file type shows error
- [ ] File too large shows error
- [ ] Image too small (logo) shows error
- [ ] Maximum images (10) enforced
- [ ] Upload continues if user navigates away

**Settings:**
- [ ] Images tab loads correctly
- [ ] Can replace logo
- [ ] Can add more gallery images
- [ ] Can delete gallery images
- [ ] Can reorder gallery images
- [ ] Auto-save works
- [ ] Last updated date shows

**Accessibility:**
- [ ] Screen reader announces uploads
- [ ] Keyboard navigation complete
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] All images have alt text
- [ ] Error messages announced

### Automated Testing

```typescript
// Example test cases

describe('ImagesStep', () => {
  it('allows logo upload', async () => {
    const { user } = render(<ImagesStep />)
    const file = new File(['logo'], 'logo.png', { type: 'image/png' })

    const input = screen.getByLabelText(/upload logo/i)
    await user.upload(input, file)

    expect(screen.getByAltText(/studio logo/i)).toBeInTheDocument()
  })

  it('validates file size', async () => {
    const { user } = render(<ImagesStep />)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
      type: 'image/png'
    })

    const input = screen.getByLabelText(/upload logo/i)
    await user.upload(input, largeFile)

    expect(screen.getByText(/must be smaller than 5MB/i)).toBeInTheDocument()
  })

  it('allows up to 10 gallery images', async () => {
    const { user } = render(<ImagesStep />)
    const files = Array.from({ length: 11 }, (_, i) =>
      new File([`img${i}`], `img${i}.png`, { type: 'image/png' })
    )

    const input = screen.getByLabelText(/upload gallery/i)
    await user.upload(input, files)

    expect(screen.getByText(/can only upload 10 images/i)).toBeInTheDocument()
  })

  it('allows continuing without images', async () => {
    const mockNext = jest.fn()
    const { user } = render(<ImagesStep onNext={mockNext} />)

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    expect(mockNext).toHaveBeenCalled()
  })
})
```

---

## Summary

### Key UX Decisions

1. **Placement**: After Address, before Contact
   - Logical flow: Location → Visuals → Communication
   - Breaks up data entry with engaging visual task
   - Keeps complex business logic (hours, capacity) grouped at end

2. **Combined Step**: Logo + Gallery in one step
   - Simpler flow (fewer steps)
   - Related tasks (both are visual)
   - Optional nature makes it low-pressure

3. **Mobile-First**: Optimized for smartphone use
   - Large touch targets (44×44px minimum)
   - Native camera integration
   - Bottom sheet for mobile, dialog for desktop
   - Simplified reordering (drag handles, long-press menu)

4. **Non-Tech-Friendly**:
   - Clear visual feedback (progress bars, checkmarks)
   - Simple language (no technical jargon)
   - Forgiving (skip option, no required images)
   - Familiar patterns (like phone gallery apps)

5. **Safety & Trust**:
   - Clear guidelines before upload
   - Instant preview before committing
   - Easy undo (delete, replace)
   - Auto-save in settings (no "Save" button to forget)

### Success Metrics

**Completion Rate**: Track % of users who upload at least one image during registration
**Target**: 60%+ (since optional, this is good engagement)

**Time on Step**: Average time spent on Images step
**Target**: 2-3 minutes (longer = engaged, not confused)

**Settings Usage**: % of users who add images later in settings
**Target**: 30%+ of users who skipped during registration

**Error Rate**: % of upload attempts that fail
**Target**: <5% (most errors should be prevented by validation)

---

**Last Updated**: 2025-11-01
**Design Lead**: Claude (UX Designer Agent)
**Status**: Ready for Implementation

