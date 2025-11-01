# Studio Registration Flow with Services Step

## Updated Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Studio Registration Flow                      │
└─────────────────────────────────────────────────────────────────┘

Step 0: Welcome
   │
   ├─> Click "Los geht's"
   │
Step 1: Basic Info (Name, Description)
   │
   ├─> Fill name & description → Continue
   │
Step 2: Address (Street, City, Postal Code, Country)
   │
   ├─> Fill address → Continue
   │
Step 3: Contact (Phone, Email, Website)
   │
   ├─> Fill contact info → Continue
   │
Step 4: Opening Hours
   │
   ├─> Select same/different hours → Set times → Continue
   │   OR Skip
   │
Step 5: Capacity (1-10 treatment rooms)
   │
   ├─> Select capacity → Continue
   │
Step 6: Services (NEW!)                                    
   │                                                        
   ├─> Add services (1-3)                                 
   │   ├─ Service name (required)                         
   │   ├─ Description (optional)                          
   │   ├─ Duration (15-240 min)                           
   │   └─ Price (5-500€)                                  
   │                                                        
   ├─> Validate all services                              
   │                                                        
   ├─> Submit studio registration                         
   │   ├─ Creates studio in DB                            
   │   ├─ Links studio ownership                          
   │   └─ Returns studioId                                
   │                                                        
   ├─> Create each service                                
   │   └─ If fails, continue anyway (can add later)       
   │                                                        
   └─> Save services to context → Continue                
       OR Skip → Continue (no services)                   
   │
Step 7: Success
   │
   └─> Show success message
       ├─ With services: "Dein Studio ist jetzt live!"
       │                 "ist jetzt sichtbar für Buchungen"
       │  └─ CTAs: [Zum Dashboard]
       │
       └─ Without services: "Willkommen bei Massava!"
                           "wurde erfolgreich registriert"
          └─ CTAs: [Ersten Service hinzufügen] [Zum Dashboard]
```

## Service Creation Detail

```
┌────────────────────────────────────────────────────────────┐
│                   ServicesStep Component                    │
└────────────────────────────────────────────────────────────┘

Initial State:
  - 1 empty service form

User Actions:
  ┌─────────────────────────────────────────┐
  │ Add Service (up to 3)                   │
  │  ├─ Show new service form                │
  │  └─ Enable remove button                 │
  │                                           │
  │ Remove Service (if > 1)                  │
  │  ├─ Remove service form                  │
  │  └─ Clear field errors                   │
  │                                           │
  │ Fill Service Fields                      │
  │  ├─ Name (text input)                    │
  │  ├─ Description (textarea, optional)     │
  │  ├─ Duration (select dropdown)           │
  │  └─ Price (number input with € symbol)   │
  │                                           │
  │ Validation (real-time)                   │
  │  ├─ On blur/change                       │
  │  ├─ Inline errors (red border + text)    │
  │  └─ Clear errors when fixed              │
  └─────────────────────────────────────────┘

Submit Flow:
  ┌─────────────────────────────────────────┐
  │ Click "Studio erstellen"                │
  │   │                                       │
  │   ├─> Validate all services (Zod)        │
  │   │   ├─ Success: Continue               │
  │   │   └─ Failure: Show errors            │
  │   │                                       │
  │   ├─> Register studio (server action)    │
  │   │   ├─ Success: Get studioId           │
  │   │   └─ Failure: Show error banner      │
  │   │                                       │
  │   ├─> Create each service (loop)         │
  │   │   ├─ createService(studioId, data)   │
  │   │   └─ Track created count             │
  │   │                                       │
  │   └─> Navigate to Success step           │
  │                                           │
  │ OR Click "Später hinzufügen"             │
  │   │                                       │
  │   ├─> Skip validation                    │
  │   ├─> Register studio only               │
  │   └─> Navigate to Success (no services)  │
  └─────────────────────────────────────────┘
```

## Validation Rules

### Service Name
- ✅ Required
- ✅ Min 3 characters
- ✅ Max 100 characters
- ❌ Empty string

### Description
- ✅ Optional
- ✅ Max 500 characters

### Duration
- ✅ Required
- ✅ Min 15 minutes
- ✅ Max 240 minutes
- ✅ Preset options: [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240]

### Price
- ✅ Required
- ✅ Min 5€
- ✅ Max 500€
- ✅ Decimal places allowed (e.g., 49.99)

## Error Handling

### Field Errors
```
┌─────────────────────────────────────────┐
│ Service-Name *                          │
│ ┌─────────────────────────────────────┐ │
│ │ ab                                  │ │ ← Invalid (too short)
│ └─────────────────────────────────────┘ │
│ ⚠️ Service-Name muss mindestens 3        │
│   Zeichen lang sein                      │
└─────────────────────────────────────────┘
```

### General Errors
```
┌─────────────────────────────────────────┐
│ ⚠️ Ein unerwarteter Fehler ist           │
│   aufgetreten                            │
└─────────────────────────────────────────┘
```

## Mobile vs Desktop

### Mobile (< 768px)
- Bottom sheet UI
- Compact spacing (space-y-3)
- Touch-friendly buttons (min 44px)
- Single column layout

### Desktop (≥ 768px)
- Dialog UI (max-w-500px)
- Standard spacing (space-y-4)
- Hover effects
- Single column layout

## Accessibility

### Keyboard Navigation
- ✅ Tab through all form fields
- ✅ Enter to submit
- ✅ Escape to close dialog

### Screen Readers
- ✅ Proper labels for all inputs
- ✅ ARIA attributes for interactive elements
- ✅ Error announcements
- ✅ Loading state announcements

### Visual
- ✅ 4.5:1 color contrast ratio
- ✅ Focus indicators
- ✅ Clear error messages
- ✅ Large touch targets (44px min)

---

**Last Updated**: 2025-11-01
**Status**: Implemented
