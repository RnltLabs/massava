# Manual Booking Flow - Visual Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       CALENDAR PAGE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  [Time slots with existing bookings and blocked times]    │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                              ┌────────────┐     │
│                                              │    FAB     │ ◄───┼─ Always visible
│                                              │  [  +  ]   │     │   Bottom-right
│                                              └────────────┘     │
│                                                    │             │
└────────────────────────────────────────────────────┼─────────────┘
                                                     ▼
                                           ┌─────────────────┐
                                           │  ACTION MENU    │
                                           │                 │
                                           │ Termin buchen   │◄── Tap this
                                           │ Zeit blockieren │
                                           └─────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BOOKING DIALOG OPENS                         │
│                   (Sheet on mobile / Dialog on desktop)         │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────── STEP 1: CUSTOMER ─────────────────────────┐
│                                                                  │
│                          👤                                      │
│                    Neuer Termin                                  │
│                Für welchen Kunden?                               │
│                                                                  │
│  Kunde auswählen                                                 │
│  ┌──────────────────────────────────────────────┐               │
│  │ [Kunde wählen... ▼]                          │               │
│  │                                               │               │
│  │  Max Müller (+43 123 456)                    │               │
│  │  Anna Schmidt (+43 987 654)                  │               │
│  │  ...                                          │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│                    ─── oder ───                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  [+ Neuen Kunden anlegen]                    │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │            [Weiter →]                        │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (if "Neuen Kunden anlegen")
┌────────────────── NEW CUSTOMER FORM ────────────────────────────┐
│                                                                  │
│                          👤                                      │
│                   Neuer Kunde                                    │
│                 Neue Kundendaten                                 │
│                                                                  │
│  Name *                                                          │
│  [Max Mustermann_________________________]                      │
│                                                                  │
│  Telefon (optional)                                              │
│  [+43 123 456 789________________________]                      │
│                                                                  │
│  E-Mail (optional)                                               │
│  [max@beispiel.de_________________________]                     │
│                                                                  │
│  [Doch bestehenden Kunden wählen]                                │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │            [Weiter →]                        │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────── STEP 2: SERVICE ──────────────────────────────┐
│                                                                  │
│                          ✨                                      │
│                 Welche Leistung?                                 │
│              Wähle den gewünschten Service                       │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ● Thai-Massage 60 Min              ◉         │ ◄── Selected  │
│  │   Entspannende Ganzkörpermassage             │               │
│  │   60 Min • €65,00                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ○ Öl-Massage 90 Min                ○         │               │
│  │   Intensive Tiefenentspannung                │               │
│  │   90 Min • €95,00                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ○ Fußreflexzonenmassage            ○         │               │
│  │   Druckpunktmassage der Füße                 │               │
│  │   45 Min • €50,00                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │            [Weiter →]                        │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────── STEP 3: DATE & TIME ──────────────────────────┐
│                                                                  │
│                          📅                                      │
│                       Wann?                                      │
│                Wähle Datum und Uhrzeit                           │
│                                                                  │
│  Datum *                                                         │
│  [2025-10-30________________________]  ◄── Date picker          │
│                                                                  │
│  Uhrzeit *                                                       │
│  ┌──────────────────────────────────────────────┐               │
│  │ [14:00 ▼]                                    │               │
│  │                                               │               │
│  │  08:00                                        │               │
│  │  08:15                                        │               │
│  │  ...                                          │               │
│  │  14:00  ◄── Selected                         │               │
│  │  14:15                                        │               │
│  │  ...                                          │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  Dauer: 60 Min                               │               │
│  │  Endet um: 15:00                             │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │            [Weiter →]                        │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────── STEP 4: REVIEW ───────────────────────────────┐
│                                                                  │
│                    Zusammenfassung                               │
│               Bitte überprüfe die Angaben                        │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ 👤  Kunde                                    │               │
│  │     Max Müller                               │               │
│  │     +43 123 456 789                          │               │
│  │     [Neuer Kunde]  ◄── Badge if new         │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ✨  Service                                  │               │
│  │     Thai-Massage (60 Min)                    │               │
│  │     60 Min • €65,00                          │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ 📅  Datum                                    │               │
│  │     Freitag, 30. Oktober 2025                │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ 🕐  Uhrzeit                                  │               │
│  │     14:00 - 15:00                            │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  📝 Notizen (optional)                                           │
│  ┌──────────────────────────────────────────────┐               │
│  │ [Besondere Wünsche...]                       │               │
│  │                                               │               │
│  └──────────────────────────────────────────────┘               │
│                                   0/500                          │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │          [Jetzt buchen →]                    │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (submitting to server)
┌────────────────── SERVER ACTION ────────────────────────────────┐
│                                                                  │
│  createManualBooking()                                           │
│   ├─ Authenticate user                                           │
│   ├─ Verify studio ownership                                     │
│   ├─ Validate input (Zod)                                        │
│   ├─ Create new customer if needed                               │
│   ├─ Check time conflicts                                        │
│   ├─ Create NewBooking (CONFIRMED status)                        │
│   ├─ Revalidate calendar                                         │
│   └─ Return success + booking ID                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────── STEP 5: SUCCESS ──────────────────────────────┐
│                                                                  │
│                         ✓                                        │
│                    [Animated]                                    │
│                                                                  │
│                  Termin gebucht!                                 │
│          Der Termin wurde erfolgreich erstellt                   │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │         Max Müller                           │               │
│  │    Fr, 30. Okt. 2025 um 14:00                │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │          [Zum Kalender]                      │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │       [Weiteren Termin anlegen]              │               │
│  └──────────────────────────────────────────────┘               │
│         │                                   │                    │
│         ▼ Close dialog                      ▼ Reset to Step 1   │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CALENDAR REFRESHED                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  08:00  ┌─────────────────┐                               │  │
│  │         │                 │                               │  │
│  │  ...    │                 │                               │  │
│  │         │                 │                               │  │
│  │  14:00  ├─────────────────┤  ◄── NEW BOOKING APPEARS!    │  │
│  │         │ Max Müller      │                               │  │
│  │         │ Thai-Massage    │                               │  │
│  │  15:00  └─────────────────┘                               │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Progress Indicator

```
Step 1 (Customer):   ━━━━━━━━ ○ ○ ○
Step 2 (Service):    ━ ━━━━━━━━ ○ ○
Step 3 (Date/Time):  ━ ━ ━━━━━━━━ ○
Step 4 (Review):     ━ ━ ━ ━━━━━━━━
Step 5 (Success):    (no indicator)

Legend:
━━━━━━━━  Active step (wide dot)
━         Completed step (small dot)
○         Upcoming step (gray dot)
```

## Navigation Buttons

```
┌─────────────────────────────────────────────────┐
│  [←]  Progress Indicator (⚫ ○ ○ ○)      [×]   │  ◄── Header
├─────────────────────────────────────────────────┤
│                                                 │
│              Step Content                       │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Continue Button]                  │  ◄── Footer
└─────────────────────────────────────────────────┘

[←]  Back button (Steps 1-3 only)
[×]  Close button (all steps)
Progress Indicator (Steps 1-4 only)
```

## Responsive Behavior

### Mobile (< 768px)
```
┌─────────────────────────────────┐
│      Bottom Tab Navigation      │ ◄── z-100
├─────────────────────────────────┤
│                                 │
│                                 │
│          Calendar View          │
│                                 │
│                                 │
│                           ┌───┐ │
│                           │FAB│ │ ◄── z-40, bottom: 80px
│                           └───┘ │
└─────────────────────────────────┘

[Dialog opens as Sheet from bottom]
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │ ◄── Sheet, h-[90vh]
│  │   Booking Dialog          │  │     rounded-t-3xl
│  │   (Steps 1-5)             │  │
│  │                           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Desktop (≥ 768px)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Calendar View                      │
│                                                     │
│                                              ┌───┐  │
│                                              │FAB│  │ ◄── z-40
│                                              └───┘  │ bottom: 24px
└─────────────────────────────────────────────────────┘

[Dialog opens as centered modal]
┌─────────────────────────────────────────────────────┐
│                 [Backdrop Overlay]                  │
│                                                     │
│           ┌───────────────────────┐                 │
│           │                       │                 │
│           │  Booking Dialog       │                 │ ◄── max-w-[500px]
│           │  (Steps 1-5)          │                 │     centered
│           │                       │                 │
│           └───────────────────────┘                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Time Complexity

```
User Flow:
├─ FAB Click           → 0.1s  (instant)
├─ Dialog Open         → 0.3s  (animation)
├─ Step 1: Customer    → 2s    (select or 5s for new)
├─ Step 2: Service     → 2s    (tap card)
├─ Step 3: Date/Time   → 2s    (defaults + adjust)
├─ Step 4: Review      → 1s    (scan)
└─ Submit + Success    → 1s    (network + DB)

Total: ~8 seconds (existing customer)
Total: ~13 seconds (new customer)

✅ FASTER than traditional paper appointment book!
```

## State Transitions

```
Initial State:
{ currentStep: 0, formData: {}, isNewCustomer: false }

User selects existing customer:
→ { currentStep: 0, formData: { customerId: 'abc', customerName: 'Max' }, isNewCustomer: false }

User taps "Neuen Kunden anlegen":
→ { currentStep: 0, formData: {}, isNewCustomer: true }

User enters new customer data:
→ { currentStep: 0, formData: { newCustomer: { name: 'Anna', ... } }, isNewCustomer: true }

User taps "Weiter" (Step 1 → Step 2):
→ { currentStep: 1, formData: { ... }, errors: {} }

User selects service:
→ { currentStep: 1, formData: { ..., serviceId: 'xyz' } }

User taps "Weiter" (Step 2 → Step 3):
→ { currentStep: 2, formData: { ... } }

User picks date/time:
→ { currentStep: 2, formData: { ..., date: '2025-10-30', time: '14:00' } }

User taps "Weiter" (Step 3 → Step 4):
→ { currentStep: 3, formData: { ... } }

User taps "Jetzt buchen":
→ { currentStep: 3, isSubmitting: true }
   ↓ (server action)
→ { currentStep: 4, bookingId: '12345', isSubmitting: false }

User taps "Zum Kalender":
→ Dialog closes, state resets
   { currentStep: 0, formData: {}, ... }

User taps "Weiteren Termin anlegen":
→ State resets, dialog stays open at Step 1
   { currentStep: 0, formData: {}, ... }
```

---

**Note**: This flow diagram shows the complete user journey from calendar view to successful booking creation, including all UI states, transitions, and responsive behavior.
