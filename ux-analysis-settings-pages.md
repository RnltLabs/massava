# UX/UI Analysis: Settings Pages

**Analysis Date**: 2025-11-11
**Branch**: feature/complete-settings-pages
**Analyst**: Claude (UX Designer Agent)
**Target Users**: Thai massage studios with low technical affinity

---

## Executive Summary

### Critical Issues Found
1. ⛔ **Account Settings**: Overly complex forms with too many fields on one page
2. ⛔ **Location Settings**: MAJOR UX FLAW - Requires latitude/longitude input for address changes
3. ⛔ **Hours Settings**: Complex form instead of intuitive time pickers
4. ⛔ **Images Settings**: Missing companion-style popups for image uploads
5. ⛔ **General**: Inconsistent use of companion popups vs. inline forms

### Design Philosophy Violations
- ❌ Desktop-first approach (should be mobile-first)
- ❌ Forms instead of companion popups
- ❌ Complex inputs for non-technical users
- ❌ Missing visual guidance and contextual help
- ❌ Not following Service page gold standard

---

## Page-by-Page Analysis

## 1. Account Settings Page
**Location**: `app/[locale]/business/settings/account/`

### Current Implementation Issues

#### ⛔ CRITICAL: Monolithic Form Overload
**Problem**: All settings crammed into one scrolling form
- Email settings
- Password change
- Two-factor authentication
- Notification preferences
- Privacy settings
- Security settings
- Danger zone

**Why This Is Wrong**:
- Overwhelming for users with low technical affinity
- Violates mobile-first principle (too much scrolling)
- No clear visual hierarchy
- Users can't focus on one task at a time

**Expected UX** (following Service page pattern):
```
Account Settings Page
├─ Navigation bar (fixed, no scrolling)
├─ Card: "Email & Login" → Opens companion popup
├─ Card: "Password & Security" → Opens companion popup
├─ Card: "Notifications" → Opens companion popup
├─ Card: "Privacy" → Opens companion popup
└─ Card: "Delete Account" → Opens confirmation dialog
```

#### ⛔ Password Strength Indicator Anti-pattern
**Current**: Real-time password strength validation in form
**Problem**: Creates anxiety for non-technical users
**Better**: Simple requirements list, validate on submit

#### ⛔ Two-Factor Authentication Complexity
**Current**: QR code, backup codes, all visible at once
**Problem**: Confusing for users unfamiliar with 2FA
**Better**: Step-by-step companion popup with explanations

#### ❌ Missing Visual Guidance
- No icons to distinguish setting types
- No helper text for complex features (2FA, backup codes)
- No visual feedback for security level

#### ❌ Notification Settings Buried
**Current**: Checkboxes in long form
**Better**: Toggle switches in companion popup with categories:
- Booking notifications
- Customer messages
- Marketing updates
- System alerts

### Recommended Redesign

```typescript
// account/page.tsx (MOBILE-FIRST)
<div className="container mx-auto p-4 max-w-2xl">
  {/* Fixed navigation bar - NEVER scrolls */}
  <div className="sticky top-0 z-10 bg-background border-b mb-4">
    <Button variant="ghost" onClick={router.back}>
      <ArrowLeft /> Back to Settings
    </Button>
  </div>

  {/* Card-based navigation to companion popups */}
  <div className="space-y-3">
    <Card onClick={() => openEmailPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Email & Login</CardTitle>
            <CardDescription>studio@example.com</CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>

    <Card onClick={() => openPasswordPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Password & Security</CardTitle>
            <CardDescription>Change password, enable 2FA</CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>

    <Card onClick={() => openNotificationsPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Email, SMS, push notifications</CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>

    <Card onClick={() => openPrivacyPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Privacy Settings</CardTitle>
            <CardDescription>Data visibility, profile settings</CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>

    {/* Danger Zone - visually distinct */}
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
            <CardDescription>Permanently delete your studio account</CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-destructive" />
        </div>
      </CardHeader>
    </Card>
  </div>
</div>

{/* Companion Popups (Sheet on mobile, Dialog on desktop) */}
<Sheet open={emailPopupOpen} onOpenChange={setEmailPopupOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Email & Login</SheetTitle>
      <SheetDescription>
        Update your email address and login credentials
      </SheetDescription>
    </SheetHeader>
    <div className="py-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" defaultValue={currentEmail} />
        <p className="text-xs text-muted-foreground">
          You'll receive a confirmation email to verify changes
        </p>
      </div>
      <Button className="w-full">Save Changes</Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## 2. Opening Hours Settings
**Location**: `app/[locale]/business/settings/hours/`

### Current Implementation Issues

#### ⛔ CRITICAL: Complex Form Instead of Intuitive Interface
**Problem**: Users must type times manually or use complex time pickers
**Why This Is Wrong**:
- Non-technical users struggle with time format (24h vs 12h)
- No visual representation of weekly schedule
- Hard to see patterns (closed days, split shifts)

**Expected UX**:
- Visual weekly calendar
- Tap to toggle open/closed
- Drag handles to adjust times
- Copy times to other days
- Preset templates (e.g., "Mon-Fri 9-5")

#### ❌ Missing Quick Actions
**Current**: Must set each day individually
**Better**:
- "Copy to all weekdays" button
- "Set same hours for all days"
- "Copy from last week"

#### ❌ No Visual Feedback for Closed Days
**Current**: Empty form or disabled inputs
**Better**: Grayed out card with "Closed" badge

#### ❌ Split Shifts Complexity
**Current**: Add/remove button for multiple time ranges
**Problem**: Confusing for users unfamiliar with the concept
**Better**:
- Start with single range
- Clear "Add lunch break" or "Add split shift" button
- Visual timeline showing gaps

### Recommended Redesign

```typescript
// hours/page.tsx (MOBILE-FIRST)
<div className="container mx-auto p-4 max-w-2xl">
  {/* Fixed navigation bar */}
  <div className="sticky top-0 z-10 bg-background border-b mb-4">
    <Button variant="ghost" onClick={router.back}>
      <ArrowLeft /> Back to Settings
    </Button>
  </div>

  {/* Quick Actions */}
  <div className="mb-4 flex gap-2 overflow-x-auto">
    <Button variant="outline" size="sm">
      <Copy className="mr-2 h-4 w-4" />
      Copy to Weekdays
    </Button>
    <Button variant="outline" size="sm">
      <Calendar className="mr-2 h-4 w-4" />
      Use Template
    </Button>
  </div>

  {/* Day-by-day cards */}
  <div className="space-y-3">
    {DAYS.map(day => (
      <Card key={day.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{day.name}</CardTitle>
              {day.isClosed ? (
                <Badge variant="secondary">Closed</Badge>
              ) : (
                <CardDescription>
                  {formatTimeRange(day.hours)}
                </CardDescription>
              )}
            </div>
            <Switch
              checked={!day.isClosed}
              onCheckedChange={() => toggleDay(day.id)}
            />
          </div>
        </CardHeader>

        {!day.isClosed && (
          <CardContent>
            {/* Visual time range selector */}
            <div className="space-y-3">
              {day.hours.map((range, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Time picker as companion popup */}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openTimePickerPopup(day.id, idx, 'start')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {range.start}
                  </Button>
                  <span className="text-muted-foreground">–</span>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openTimePickerPopup(day.id, idx, 'end')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {range.end}
                  </Button>
                  {day.hours.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeRange(day.id, idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add split shift */}
              {day.hours.length === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSplitShift(day.id)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Split Shift
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    ))}
  </div>

  {/* Save button - fixed at bottom on mobile */}
  <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
    <Button className="w-full" size="lg">
      Save Opening Hours
    </Button>
  </div>
</div>

{/* Time Picker Companion Popup */}
<Sheet open={timePickerOpen} onOpenChange={setTimePickerOpen}>
  <SheetContent side="bottom" className="h-[60vh]">
    <SheetHeader>
      <SheetTitle>Select Time</SheetTitle>
    </SheetHeader>
    {/* iOS-style scrollable time picker */}
    <div className="py-4">
      <TimePicker
        value={selectedTime}
        onChange={setSelectedTime}
        format="12h" // or 24h based on locale
      />
      <Button className="w-full mt-4" onClick={confirmTime}>
        Confirm
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## 3. Location Settings
**Location**: `app/[locale]/business/settings/location/`

### Current Implementation Issues

#### ⛔ CRITICAL: LATITUDE/LONGITUDE INPUT REQUIREMENT
**This is the WORST UX issue in the entire settings section**

**Problem**: Users must manually input latitude and longitude coordinates to set their address

**Why This Is Completely Wrong**:
- ❌ 99% of Thai massage studio owners don't know their coordinates
- ❌ Requires external tools (Google Maps, GPS device)
- ❌ High risk of errors (wrong coordinates = wrong map location)
- ❌ Creates anxiety and frustration
- ❌ Violates basic UX principle: "Don't make users think"

**What Users ACTUALLY Want**:
1. Type their address in plain text
2. See their location on a map
3. Adjust pin if needed by dragging
4. System auto-fills coordinates in background

**Expected UX** (following modern map interfaces):
```typescript
// Location input flow:
1. User taps "Location" card
2. Companion popup opens with:
   - Address search box (autocomplete)
   - Interactive map preview
   - "Use current location" button
3. User types address → Map updates automatically
4. User confirms → Coordinates saved automatically
```

#### ⛔ No Address Autocomplete
**Current**: Plain text inputs for street, city, postal code
**Problem**: Users make typos, use inconsistent formats
**Better**: Google Places API autocomplete

#### ❌ Missing Map Preview
**Current**: No visual confirmation of location
**Problem**: Users can't verify their studio is correctly placed
**Better**: Interactive map with draggable pin

#### ❌ Contact Fields in Wrong Place
**Current**: Phone, website, email in location form
**Problem**: These aren't location data, they're contact data
**Better**: Separate "Contact Information" card

#### ❌ No "Use Current Location" Button
**Problem**: Mobile users can't quickly set location via GPS
**Better**: Prominent button to get device GPS coordinates

### Recommended Redesign

```typescript
// location/page.tsx (MOBILE-FIRST)
<div className="container mx-auto p-4 max-w-2xl">
  {/* Fixed navigation bar */}
  <div className="sticky top-0 z-10 bg-background border-b mb-4">
    <Button variant="ghost" onClick={router.back}>
      <ArrowLeft /> Back to Settings
    </Button>
  </div>

  <div className="space-y-3">
    {/* Address Card */}
    <Card onClick={() => openAddressPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <CardTitle className="text-lg">Studio Address</CardTitle>
            <CardDescription className="line-clamp-2">
              {currentAddress || "No address set"}
            </CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>

    {/* Contact Information Card */}
    <Card onClick={() => openContactPopup()} className="cursor-pointer hover:bg-accent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>
              Phone, email, website
            </CardDescription>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  </div>
</div>

{/* Address Companion Popup */}
<Sheet open={addressPopupOpen} onOpenChange={setAddressPopupOpen}>
  <SheetContent side="bottom" className="h-[90vh]">
    <SheetHeader>
      <SheetTitle>Studio Address</SheetTitle>
      <SheetDescription>
        Set your studio's location for customers to find you
      </SheetDescription>
    </SheetHeader>

    <div className="py-4 space-y-4">
      {/* Primary action: Use current location */}
      <Button
        variant="outline"
        className="w-full"
        onClick={useCurrentLocation}
      >
        <Navigation className="mr-2 h-4 w-4" />
        Use My Current Location
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or search address
          </span>
        </div>
      </div>

      {/* Address autocomplete (Google Places API) */}
      <div className="space-y-2">
        <Label htmlFor="address-search">Search Address</Label>
        <Input
          id="address-search"
          placeholder="Start typing your address..."
          value={searchQuery}
          onChange={handleAddressSearch}
          autoComplete="off"
        />
        {searchResults.length > 0 && (
          <div className="border rounded-md divide-y">
            {searchResults.map(result => (
              <button
                key={result.place_id}
                className="w-full px-3 py-2 text-left hover:bg-accent"
                onClick={() => selectAddress(result)}
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-muted-foreground">
                  {result.formatted_address}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive map preview */}
      {selectedLocation && (
        <div className="space-y-2">
          <Label>Confirm Location</Label>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <GoogleMap
              center={selectedLocation}
              zoom={16}
              draggable={true}
              onDragEnd={handleMapDragEnd}
            >
              <Marker
                position={selectedLocation}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
              />
            </GoogleMap>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag the pin to adjust your exact location
          </p>
        </div>
      )}

      {/* Manual address fields (hidden by default) */}
      <Accordion type="single" collapsible>
        <AccordionItem value="manual">
          <AccordionTrigger className="text-sm">
            Enter address manually
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Bangkok" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input id="postal" placeholder="10110" />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Hidden fields - auto-populated */}
      <input type="hidden" name="latitude" value={selectedLocation?.lat} />
      <input type="hidden" name="longitude" value={selectedLocation?.lng} />

      <Button className="w-full" onClick={saveAddress}>
        Save Address
      </Button>
    </div>
  </SheetContent>
</Sheet>

{/* Contact Information Companion Popup */}
<Sheet open={contactPopupOpen} onOpenChange={setContactPopupOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Contact Information</SheetTitle>
      <SheetDescription>
        How customers can reach you
      </SheetDescription>
    </SheetHeader>

    <div className="py-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+66 12 345 6789"
          defaultValue={currentPhone}
        />
        <p className="text-xs text-muted-foreground">
          Customers will see this number on your profile
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="studio@example.com"
          defaultValue={currentEmail}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website (Optional)</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://yourwebsite.com"
          defaultValue={currentWebsite}
        />
      </div>

      <Button className="w-full">Save Contact Info</Button>
    </div>
  </SheetContent>
</Sheet>
```

**Key Improvements**:
1. ✅ NO latitude/longitude input from users
2. ✅ Address autocomplete with Google Places API
3. ✅ Visual map preview with draggable pin
4. ✅ "Use current location" quick action
5. ✅ Coordinates auto-populated in hidden fields
6. ✅ Contact info separated from location
7. ✅ Mobile-first companion popup pattern

---

## 4. Images Settings
**Location**: `app/[locale]/business/settings/images/`

### Current Implementation Issues

#### ⛔ Complex Upload UI
**Problem**: Traditional file upload interface instead of modern image handling
**Why This Is Wrong**:
- Small tap targets for mobile users
- No image preview before upload
- No crop/rotate functionality
- Unclear size/format requirements

**Expected UX**:
- Large tap area for upload
- Instant preview after selection
- Inline crop/rotate tools
- Clear visual feedback for upload progress

#### ❌ Logo vs Gallery Confusion
**Current**: Separate sections but similar UI
**Problem**: Users might upload gallery images as logo and vice versa
**Better**: Distinct visual treatment for each type

#### ❌ No Image Guidelines
**Current**: No size recommendations or examples
**Problem**: Users upload wrong dimensions, low quality images
**Better**:
- Show example images
- Display recommended dimensions
- Suggest aspect ratios

#### ❌ Missing Drag-and-Drop Reordering
**Current**: Gallery images in fixed order
**Problem**: Users can't prioritize their best photos
**Better**: Drag handles to reorder

#### ❌ No Batch Upload
**Current**: One image at a time
**Problem**: Tedious for users adding multiple gallery images
**Better**: Multi-select file picker

### Recommended Redesign

```typescript
// images/page.tsx (MOBILE-FIRST)
<div className="container mx-auto p-4 max-w-2xl">
  {/* Fixed navigation bar */}
  <div className="sticky top-0 z-10 bg-background border-b mb-4">
    <Button variant="ghost" onClick={router.back}>
      <ArrowLeft /> Back to Settings
    </Button>
  </div>

  <div className="space-y-6">
    {/* Studio Logo Section */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Studio Logo
        </CardTitle>
        <CardDescription>
          This appears on your profile and booking pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentLogo ? (
          <div className="relative aspect-square max-w-[200px] mx-auto">
            <img
              src={currentLogo}
              alt="Studio logo"
              className="rounded-lg object-cover w-full h-full border-2 border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeLogo}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="absolute bottom-2 right-2"
              onClick={() => openImageEditor('logo')}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        ) : (
          <button
            onClick={() => openImageUploadPopup('logo')}
            className="w-full aspect-square max-w-[200px] mx-auto border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Upload Logo</span>
            <span className="text-xs">Recommended: 500×500px</span>
          </button>
        )}
      </CardContent>
    </Card>

    {/* Gallery Section */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gallery className="h-5 w-5" />
              Photo Gallery
            </CardTitle>
            <CardDescription>
              Show customers your studio ({galleryImages.length}/10)
            </CardDescription>
          </div>
          {galleryImages.length < 10 && (
            <Button
              size="sm"
              onClick={() => openImageUploadPopup('gallery')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {galleryImages.length > 0 ? (
          <div className="space-y-3">
            {/* Sortable grid */}
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square group"
                >
                  <img
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full"
                  />
                  {/* Drag handle */}
                  <div className="absolute top-2 left-2 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openImageEditor('gallery', image.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeGalleryImage(image.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Order indicator */}
                  <div className="absolute bottom-2 left-2 bg-background/80 rounded px-2 py-1 text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Drag images to reorder. First image appears as cover photo.
            </p>
          </div>
        ) : (
          <button
            onClick={() => openImageUploadPopup('gallery')}
            className="w-full aspect-video border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Add Gallery Photos</span>
            <span className="text-xs">Recommended: 1200×800px</span>
          </button>
        )}
      </CardContent>
    </Card>
  </div>
</div>

{/* Image Upload Companion Popup */}
<Sheet open={uploadPopupOpen} onOpenChange={setUploadPopupOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>
        {uploadType === 'logo' ? 'Upload Studio Logo' : 'Add Gallery Photos'}
      </SheetTitle>
      <SheetDescription>
        {uploadType === 'logo'
          ? 'Recommended size: 500×500px (square)'
          : 'Recommended size: 1200×800px (landscape)'
        }
      </SheetDescription>
    </SheetHeader>

    <div className="py-4 space-y-4">
      {/* File picker */}
      {!selectedFile ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={uploadType === 'gallery'}
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            className="w-full h-24"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Choose from Device</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-24"
            onClick={openCamera}
          >
            <div className="flex flex-col items-center gap-2">
              <Camera className="h-6 w-6" />
              <span>Take Photo</span>
            </div>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image preview with crop tool */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <ImageCropper
              image={selectedFile}
              aspect={uploadType === 'logo' ? 1 : 3/2}
              onCropComplete={handleCropComplete}
            />
          </div>

          {/* Editing tools */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={rotateLeft}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate
            </Button>
            <Button variant="outline" onClick={flipHorizontal}>
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Flip
            </Button>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={cancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={confirmUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  </SheetContent>
</Sheet>
```

**Key Improvements**:
1. ✅ Large tap targets for mobile users
2. ✅ Companion popup for upload flow
3. ✅ Inline crop/rotate tools
4. ✅ Clear visual distinction between logo and gallery
5. ✅ Drag-and-drop reordering for gallery
6. ✅ Camera access for mobile devices
7. ✅ Upload progress feedback

---

## General Issues Across All Pages

### 1. ⛔ Inconsistent Back Navigation
**Problem**: Back-to-settings bar implementation varies across pages
**Expected**: Fixed position, never scrolls, consistent styling

**Standard Implementation**:
```typescript
<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
  <div className="container mx-auto px-4 py-3">
    <Button variant="ghost" onClick={() => router.push('/business/settings')}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Settings
    </Button>
  </div>
</div>
```

### 2. ❌ Missing Loading States
**Problem**: No skeleton loaders or loading indicators on initial page load
**Better**: Show skeleton UI while fetching data

### 3. ❌ No Success/Error Toast Notifications
**Problem**: Users don't get clear feedback after actions
**Better**: Toast notifications for all state changes

### 4. ❌ Form Validation Not User-Friendly
**Problem**: Technical error messages (e.g., "Field required")
**Better**: Contextual, helpful messages (e.g., "Please enter your email address so we can contact you")

### 5. ❌ No Unsaved Changes Warning
**Problem**: Users can navigate away and lose work
**Better**: "You have unsaved changes" dialog when leaving

---

## Comparison with Service Page (Gold Standard)

### Service Page Does Well:
✅ Card-based navigation (not forms)
✅ Companion-style bottom sheets for inputs
✅ Clear visual hierarchy
✅ Mobile-first design
✅ Fixed navigation bar
✅ Large tap targets
✅ Visual feedback for actions

### Settings Pages Need to Match:
❌ Replace inline forms with cards → companion popups
❌ Use bottom sheets on mobile, dialogs on desktop
❌ Implement consistent navigation patterns
❌ Add visual hierarchy with icons and badges
❌ Ensure all interactive elements are touch-friendly
❌ Add loading states and error handling

---

## Priority Recommendations

### Immediate (Critical UX Flaws):
1. **🔥 REMOVE latitude/longitude input requirement** (Location page)
   - Implement Google Places API autocomplete
   - Add interactive map with draggable pin
   - Auto-populate coordinates in hidden fields

2. **🔥 Convert Account page to card-based navigation**
   - Split monolithic form into separate companion popups
   - One card per setting category

3. **🔥 Fix back navigation consistency**
   - Implement sticky header across all pages
   - Ensure it never scrolls

### High Priority (Major UX Improvements):
4. **Redesign Opening Hours with visual interface**
   - Replace form with weekly calendar view
   - Add quick actions (copy to weekdays, templates)
   - Use companion popups for time selection

5. **Improve Images page upload flow**
   - Add crop/rotate functionality
   - Implement drag-and-drop reordering
   - Clear distinction between logo and gallery

6. **Add comprehensive error handling**
   - Toast notifications for all actions
   - Helpful error messages
   - Unsaved changes warnings

### Medium Priority (Polish):
7. Add skeleton loading states
8. Improve form validation messaging
9. Add contextual help text and tooltips
10. Implement optimistic UI updates

---

## Mobile-First Design Checklist

### ❌ Current Issues:
- [ ] Forms are too long for mobile screens
- [ ] Small tap targets (< 44×44px)
- [ ] No consideration for one-handed use
- [ ] Desktop-first layout that breaks on mobile
- [ ] Missing touch-friendly interactions

### ✅ Should Be:
- [x] Card-based navigation fits mobile viewport
- [x] Companion popups optimize screen real estate
- [x] Large tap targets (minimum 44×44px)
- [x] Important actions within thumb reach
- [x] Responsive breakpoints tested on real devices

---

## Accessibility Audit

### Issues Found:
1. ❌ Missing ARIA labels on icon-only buttons
2. ❌ No keyboard navigation testing
3. ❌ Color contrast issues in some text (muted-foreground)
4. ❌ Forms missing fieldset/legend grouping
5. ❌ No screen reader announcements for dynamic changes

### Required Fixes:
1. Add aria-label to all icon buttons
2. Test Tab navigation flow
3. Ensure 4.5:1 contrast ratio for all text
4. Group related form fields with fieldset
5. Use aria-live for status messages

---

## Implementation Checklist

### For Each Settings Page:

**Phase 1: Structure**
- [ ] Remove inline forms
- [ ] Create card-based navigation
- [ ] Implement companion popups (Sheet/Dialog)
- [ ] Add fixed back navigation bar

**Phase 2: Mobile Optimization**
- [ ] Test on mobile devices (not just browser dev tools)
- [ ] Ensure tap targets are minimum 44×44px
- [ ] Verify one-handed usability
- [ ] Test with slow network (loading states)

**Phase 3: User Experience**
- [ ] Add loading skeletons
- [ ] Implement toast notifications
- [ ] Add unsaved changes warnings
- [ ] Write helpful error messages

**Phase 4: Accessibility**
- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Verify color contrast
- [ ] Test with screen reader

**Phase 5: Polish**
- [ ] Add animations/transitions
- [ ] Optimize images
- [ ] Test edge cases
- [ ] Get user feedback

---

## Conclusion

The settings pages need a fundamental redesign to match the quality of the Service page. The current implementation suffers from:

1. **Desktop-first thinking** instead of mobile-first
2. **Complex forms** instead of simple card navigation
3. **Technical requirements** (lat/lng) instead of user-friendly inputs
4. **Inconsistent patterns** across pages

**The location page's latitude/longitude requirement is particularly egregious** and should be the first thing fixed. This single issue could cause user frustration and abandonment.

By following the Service page pattern (card navigation → companion popups → simple inputs), these pages can become intuitive and pleasant to use, even for users with low technical affinity.

---

**Next Steps**:
1. Start with Location page (biggest UX flaw)
2. Then Account page (most complex)
3. Then Hours page (needs visual redesign)
4. Finally Images page (needs upload flow improvement)
5. Test each page with actual Thai massage studio owners
