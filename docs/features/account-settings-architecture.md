# Account Settings Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ AccountSettingsClient.tsx (Main Container)                  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PageHeader (Fixed with Blur Backdrop)                │    │
│ │ - Title: "Konto & Sicherheit"                        │    │
│ │ - Back Button → /business/more                       │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Scrollable Card Grid (2 cols desktop, 1 col mobile) │    │
│ │                                                       │    │
│ │  ┌────────────────┐  ┌────────────────┐             │    │
│ │  │ 📧 Email       │  │ 🔑 Password    │             │    │
│ │  │                │  │                │             │    │
│ │  │ user@email.com │  │ ••••••••       │             │    │
│ │  │                │  │                │             │    │
│ │  │ [Bearbeiten]   │  │ [Bearbeiten]   │             │    │
│ │  └────────────────┘  └────────────────┘             │    │
│ │                                                       │    │
│ │  ┌────────────────┐  ┌────────────────┐             │    │
│ │  │ 🛡️ 2FA         │  │ 🔔 Notifications│            │    │
│ │  │                │  │                │             │    │
│ │  │ [Deaktiviert]  │  │                │             │    │
│ │  │                │  │                │             │    │
│ │  │ [Verwalten]    │  │ [Verwalten]    │             │    │
│ │  └────────────────┘  └────────────────┘             │    │
│ │                                                       │    │
│ │  ┌────────────────┐  ┌────────────────────────────┐  │    │
│ │  │ ⚙️ Privacy      │  │ ⚠️ Danger Zone (Fullwidth)│  │    │
│ │  │                │  │                            │  │    │
│ │  │                │  │ Red border/background      │  │    │
│ │  │                │  │                            │  │    │
│ │  │ [Verwalten]    │  │ [⚠️ Konto löschen]         │  │    │
│ │  └────────────────┘  └────────────────────────────┘  │    │
│ │                                                       │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Popup Flow Diagram

```
┌────────────────┐
│ Email Card     │ ──click──> EmailChangeDialog (Dialog)
└────────────────┘              ├─ Step 1: Request new email
                                ├─ Step 2: Enter 6-digit code
                                └─ Step 3: Email updated

┌────────────────┐
│ Password Card  │ ──click──> PasswordChangeDialog (Dialog)
└────────────────┘              ├─ Current password
                                ├─ New password (validation)
                                └─ Confirm password

┌────────────────┐
│ 2FA Card       │ ──click──> TwoFactorDialog (Dialog)
└────────────────┘              ├─ If disabled: Show QR code
                                ├─ Enter 6-digit code
                                └─ Enable/Disable 2FA

┌────────────────┐
│ Notifications  │ ──click──> NotificationsPopup (Sheet)
│ Card           │              ├─ 4 toggle switches
└────────────────┘              ├─ - Bookings
                                ├─ - Cancellations
                                ├─ - Reminders
                                ├─ - Marketing
                                └─ [Save] [Cancel]

┌────────────────┐
│ Privacy Card   │ ──click──> PrivacyPopup (Sheet)
└────────────────┘              ├─ Preferences:
                                │   ├─ Language (Deutsch, English)
                                │   ├─ Timezone (Europe/Berlin, ...)
                                │   └─ Date format (DD.MM.YYYY, ...)
                                ├─ Data Export:
                                │   └─ [Export] button (downloads JSON)
                                ├─ Legal Links:
                                │   ├─ Datenschutzerklärung
                                │   └─ Nutzungsbedingungen
                                └─ [Save] [Cancel]

┌────────────────┐
│ Danger Zone    │ ──click──> DangerZonePopup (AlertDialog)
│ Card           │              ├─ Step 1: Warning Dialog
└────────────────┘              │   ├─ List of consequences
                                │   ├─ Checkbox: "I understand"
                                │   └─ [Cancel] [Weiter]
                                └─ Step 2: Confirmation Dialog
                                    ├─ Type studio name
                                    ├─ 30-day grace period info
                                    └─ [Zurück] [Cancel] [Delete]
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Client (Browser)                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ User interaction (click card)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Component (Client Component)                                 │
│ - Opens popup/dialog                                         │
│ - Shows current data                                         │
│ - Handles form submission                                    │
└─────────────────────────────────────────────────────────────┘
         │
         │ Form submit (FormData)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Action (account.ts)                                   │
│ 1. Validate input with Zod schema                            │
│ 2. Check authentication                                      │
│ 3. Perform business logic                                    │
│ 4. Update database (Prisma)                                  │
│ 5. Revalidate path                                           │
│ 6. Return result                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ Result<T, E>
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Database (PostgreSQL via Prisma)                             │
│ - User table                                                 │
│ - Studio table                                               │
│ - (Future: VerificationCode table)                           │
└─────────────────────────────────────────────────────────────┘
         │
         │ Updated data
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ UI Update                                                    │
│ - Show toast notification                                    │
│ - Close popup                                                │
│ - Refresh page data (revalidatePath)                         │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Local State (useState)
```typescript
// Dialog/Popup open states
const [emailDialogOpen, setEmailDialogOpen] = useState(false);
const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
const [notificationsPopupOpen, setNotificationsPopupOpen] = useState(false);
const [privacyPopupOpen, setPrivacyPopupOpen] = useState(false);
const [dangerZonePopupOpen, setDangerZonePopupOpen] = useState(false);

// Form states (within each popup)
const [settings, setSettings] = useState<NotificationSettings>(...);
const [preferences, setPreferences] = useState<UserPreferences>(...);
const [isLoading, setIsLoading] = useState(false);
```

### Server State (Props)
```typescript
// Passed from parent page (Server Component)
interface AccountSettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  studio: {
    id: string;
    name: string;
  } | null;
  locale: string;
}
```

### Form State Management Pattern
```typescript
// 1. Initialize from props
const [settings, setSettings] = useState(initialSettings);

// 2. Reset on popup open
useEffect(() => {
  if (open) {
    setSettings(initialSettings);
  }
}, [open, initialSettings]);

// 3. Update locally
const handleToggle = (key: string) => {
  setSettings(prev => ({ ...prev, [key]: !prev[key] }));
};

// 4. Submit to server
const handleSave = async () => {
  const result = await updateSettings(settings);
  // Handle result
};
```

## File Structure

```
app/[locale]/business/settings/account/
├── page.tsx (Server Component)
│   ├── Fetches user data
│   ├── Fetches studio data
│   └── Renders AccountSettingsClient
│
└── _components/
    ├── AccountSettingsClient.tsx (Client Component)
    │   ├── 6 cards
    │   └── Dialog/Popup orchestration
    │
    ├── EmailChangeDialog.tsx ✅ (reused)
    ├── PasswordChangeDialog.tsx ✅ (reused)
    ├── TwoFactorDialog.tsx ✅ (reused)
    │
    ├── NotificationsPopup.tsx 🆕 (Sheet)
    ├── PrivacyPopup.tsx 🆕 (Sheet)
    └── DangerZonePopup.tsx 🆕 (AlertDialog)

app/[locale]/business/actions/
└── account.ts (Server Actions)
    ├── requestEmailChange()
    ├── verifyEmailChange()
    ├── changePassword()
    ├── enable2FA()
    ├── verify2FA()
    ├── disable2FA()
    ├── updateNotificationSettings()
    ├── updatePreferences()
    ├── exportUserData()
    ├── scheduleStudioDeletion()
    └── cancelStudioDeletion()

lib/schemas/
└── account.schema.ts (Zod Schemas)
    ├── emailChangeSchema
    ├── emailVerificationSchema
    ├── passwordChangeSchema
    ├── twoFactorVerifySchema
    ├── preferencesSchema
    ├── notificationSettingsSchema
    └── studioDeletionSchema
```

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│ page.tsx (Server Component)                                  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ const user = await getUserFromSession();              │    │
│ │ const studio = await getStudioByUserId(user.id);     │    │
│ │                                                       │    │
│ │ return <AccountSettingsClient                        │    │
│ │   user={user}                                        │    │
│ │   studio={studio}                                    │    │
│ │   locale={locale}                                    │    │
│ │ />                                                   │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Props
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ AccountSettingsClient.tsx (Client Component)                 │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Cards render with user data                          │    │
│ │ onClick handlers set dialog/popup state              │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Dialogs/Popups controlled by local state             │    │
│ │ - open={dialogOpen}                                  │    │
│ │ - onOpenChange={setDialogOpen}                       │    │
│ │ - initialData={...}                                  │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ User action
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Popup/Dialog Component                                       │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Local state for form fields                          │    │
│ │ Form validation                                      │    │
│ │ Submit → Server Action                               │    │
│ │ Handle result → Toast + Close                        │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
Mobile (< 768px)
┌───────────────┐
│ Header        │ ← Fixed with blur
├───────────────┤
│ Card 1        │ ← Single column
├───────────────┤
│ Card 2        │
├───────────────┤
│ Card 3        │
├───────────────┤
│ Card 4        │
├───────────────┤
│ Card 5        │
├───────────────┤
│ Danger Zone   │ ← Full width
├───────────────┤
│ Bottom Pad    │ ← pb-24 for nav bar
└───────────────┘

Desktop (≥ 768px)
┌────────────────────────────────┐
│ Header                         │ ← Fixed with blur
├────────────────┬───────────────┤
│ Card 1         │ Card 2        │ ← Two columns
├────────────────┼───────────────┤
│ Card 3         │ Card 4        │
├────────────────┼───────────────┤
│ Card 5         │ (empty)       │
├────────────────┴───────────────┤
│ Danger Zone (Full Width)       │ ← md:col-span-2
└────────────────────────────────┘
```

## Security Considerations

### Authentication
- All server actions check authentication via `auth()` from NextAuth
- User must be logged in to access page
- Session validated on every action

### Authorization
- Email change: Can only change own email
- Password change: Must provide current password
- Studio deletion: Must own studio to delete
- 2FA: Only affects own account

### Input Validation
- All inputs validated with Zod schemas (server-side)
- Client-side validation provides immediate feedback
- Never trust client-side validation alone

### CSRF Protection
- Server Actions use Next.js built-in CSRF protection
- No manual token management needed

### Rate Limiting
- TODO: Implement rate limiting for:
  - Email change requests (max 3/hour)
  - Password change attempts (max 5/hour)
  - 2FA verification (max 5 attempts)
  - Data export (max 10/day)

---

**Pattern**: Massava Card-Based + Companion Popup Architecture
**Last Updated**: 2025-11-11
