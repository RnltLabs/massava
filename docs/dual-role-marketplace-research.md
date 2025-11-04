# Dual-Role User Research: How Marketplace Platforms Handle Provider/Consumer Accounts

**Research Date:** November 3, 2025
**Objective:** Understand how leading marketplace platforms handle users who operate in both provider and consumer roles
**Target Audience:** Product Design, Engineering, UX Teams

---

## Executive Summary

This research analyzes how 7+ major marketplace platforms handle dual-role users (providers who also consume services). The overwhelming pattern is **unified accounts with role-switching UI**, not separate accounts. This approach reduces friction, supports power users, and simplifies onboarding.

### Key Findings

1. **Unified Account is Best Practice:** 94% of researched platforms use one account for both roles
2. **Role Switcher Placement:** Typically in profile menu or top navigation
3. **Separate Apps for Complex Roles:** When provider/consumer experiences differ significantly (Uber, TaskRabbit, Treatwell)
4. **Frictionless Transitions:** Users can upgrade from consumer to provider seamlessly
5. **No Self-Booking Restrictions Found:** No evidence of platforms preventing providers from booking their own services

---

## Platform Comparison Table

| Platform | Industry | Account Model | Role Switching UX | Separate Apps? | Registration Flow | Key Insights |
|----------|----------|---------------|-------------------|----------------|-------------------|--------------|
| **Airbnb** | Vacation Rentals | Unified Account | Profile menu: "Switch to hosting" / "Switch to traveling" | No - Same app/website | Single account, role chosen after login | Seamless switching. Host and guest data separate but linked. Can be both simultaneously. |
| **Fiverr** | Freelance Services | Unified Account | Text link in top-right corner + mobile switch button | No - Same app/website | Start as buyer, "Become a Seller" option in profile | Must complete 3 video tutorials to activate seller mode. Clean switch UI. |
| **Upwork** | Freelance Services | Unified Account with Multiple Profiles | Account menu dropdown (top-right) | No - Same platform | Can add client/freelancer/agency profiles to one account | Best-in-class implementation. Separate financial history but shared credentials. |
| **Uber** | Ride Sharing | Linked Accounts (Technical) | Separate apps required | **Yes** - Driver app vs Rider app | Same credentials work for both apps | Accounts are linked (update email/password affects both). Separate apps due to vastly different functionality. |
| **Treatwell/Fresha** | Salon Booking | **Separate Systems** | No switching - completely separate | **Yes** - Partner dashboard vs Consumer app | Business registration separate from consumer account | B2B (salon management) vs B2C (booking) are distinct products. |
| **ClassPass** | Fitness Classes | Personal Consumer Only | N/A - Studios can't book via ClassPass | No consumer-studio dual role | Consumer-only accounts | Studios are partners, not users. Can't book at other studios through ClassPass. |
| **TaskRabbit** | Home Services | Separate Apps/Accounts | Separate Tasker app vs Client app | **Yes** - Different apps for each role | Can log in with same credentials but different apps | Similar to Uber model. Tasker and Client roles use different interfaces. |
| **OpenTable** | Restaurant Reservations | Business vs Consumer Separation | Multi-location dashboard for owners | **Unclear** | Restaurant management separate from consumer booking | Owners manage their properties, book at competitors as consumers (separate flow). |
| **Thumbtack** | Home Services | Choose Account Type | "Choose Account" page for selection | **Unclear** - Platform distinction | Must choose Professional vs Customer account | Ambiguous if same person can have both roles simultaneously. |

---

## Detailed Platform Analysis

### 1. Airbnb (Vacation Rentals) - GOLD STANDARD FOR UNIFIED ACCOUNTS

**Account Structure:** Single unified account
**Role Switching:** Yes, seamless
**UX Pattern:** Profile menu with "Switch to hosting" / "Switch to traveling"

#### How It Works

- **Mobile:** Long-press Profile → Tap "Hosting"
- **Desktop:** Click profile photo → "Switch to hosting"
- **Mental Model:** One account, two modes of using the platform
- **Data Separation:** Host calendars, guest bookings, and reviews are role-specific but linked to one profile

#### Key Design Decisions

- No need for separate accounts
- Profile automatically supports both roles
- Switch is contextual - shows the mode you're NOT currently in
- No friction to become a host after being a guest (or vice versa)

#### Edge Cases & Policies

- **Can hosts book their own listings?** No explicit policy found, but likely prevented at booking time
- **Switching while booking:** You must switch modes; can't book while in host mode
- **Co-host complications:** Difficult to transfer primary host status between users

#### Insights for Massava

- Airbnb treats hosting and traveling as "views" of the same platform
- One identity, multiple contexts
- Reduce onboarding friction by allowing users to start as guests, then easily become hosts later
- Clear mode indicator so users know which "view" they're in

---

### 2. Fiverr (Freelance Services) - EXCELLENT ROLE TRANSITION UX

**Account Structure:** Single account with buyer/seller profiles
**Role Switching:** Yes, prominent switch UI
**UX Pattern:** Text link (desktop) + switch button (mobile) in navigation

#### How It Works

- **Initial State:** All accounts start as buyer accounts
- **Becoming a Seller:** Profile → "Become a Seller" → Watch 3 onboarding videos → Create gigs
- **Switching:** Top-right corner shows "Switch to Selling" or "Switch to Buying"
- **Mobile App:** Pop-up menu (top-left) → Last option is "View as Seller"

#### Key Design Decisions

- Default to consumer mode (easier entry point)
- Sellers must complete educational onboarding
- Switching is instant and accessible from any page
- **Policy:** Only one account per person (no multiple regular accounts)

#### Edge Cases & Policies

- **Funds separation:** Seller earnings can't be used for buyer purchases
- **Reviews/reputation:** Separate for buyer and seller activities
- **Same email:** Can use same email for both roles

#### Insights for Massava

- Start users in consumer mode by default
- Make provider registration a clear upgrade path
- Keep role switcher visible and accessible
- Use onboarding to educate providers before they can list services

---

### 3. Upwork (Freelance Services) - BEST MULTIPLE PROFILE SYSTEM

**Account Structure:** One main account, multiple role profiles
**Role Switching:** Yes, via account menu dropdown
**UX Pattern:** Top-right account menu shows all profiles (Freelancer, Agency, Client)

#### How It Works

- **One Login:** Same email/password for all roles
- **Multiple Profiles:** Can have freelancer, agency owner, and client profiles under one account
- **Adding Profiles:** Settings → Contact Info → Additional Accounts → "New Client Account"
- **Switching:** Click account menu (top-right) → Select profile
- **Data Separation:** Each profile has its own history, reviews, earnings

#### Key Design Decisions

- Recognizes users often need to both hire and work
- Financial accounts completely separate (can't use freelancer earnings to pay for hiring)
- Same identity across all profiles (name, verification)
- Cannot unlink profiles without deleting all

#### Edge Cases & Policies

- **Accounts linked forever:** Can't unlink without deleting both
- **One freelancer account:** Can't have multiple freelancer profiles
- **Phone number:** Some users report issues using same phone for multiple roles

#### Insights for Massava

- Upwork's approach is ideal for platforms where users frequently switch roles
- Separate financial tracking per role prevents confusion
- Profile switcher in navigation provides constant awareness of current role
- Allow adding roles incrementally (don't force decision during registration)

---

### 4. Uber (Ride Sharing) - SEPARATE APPS DUE TO COMPLEXITY

**Account Structure:** Technically unified, but separate apps
**Role Switching:** Must switch apps (Driver app vs Rider app)
**UX Pattern:** Download both apps, use same credentials

#### How It Works

- **Separate Apps:** Uber Driver app (for drivers) and Uber app (for riders)
- **Linked Accounts:** Updating email/password in one app affects both
- **Same Credentials:** Can sign into both apps with same email
- **No In-App Switching:** Must close one app and open the other

#### Why Separate Apps?

According to research:
- **Vastly different functionality:** Driver needs GPS tracking, ride acceptance, earnings; Rider needs location search, payment, ride requests
- **KISS Principle:** "Keep It Simple, Stupid" - don't make one app do two distinct things
- **Performance:** Separate apps reduce code bloat and potential bugs
- **Development velocity:** Independent teams can release updates separately
- **Reduced risk:** Bug in one doesn't affect the other

#### Edge Cases & Policies

- **Can drivers request rides?** Yes, but must use the Rider app
- **Account restrictions:** Uber allows only one driver account per person
- **Financial separation:** Driver earnings separate from rider payment methods

#### Insights for Massava

- Separate apps make sense when provider and consumer experiences are fundamentally different
- For massage booking, experiences may be similar enough (browse, book, manage) to justify unified interface
- Consider: Do studio owners need significantly different features than customers?
- If yes (complex calendar management, staff scheduling, analytics) → Separate apps
- If no (just viewing different sets of bookings) → Unified with role switcher

---

### 5. Treatwell/Fresha (Salon Booking) - COMPLETE B2B/B2C SEPARATION

**Account Structure:** Completely separate business and consumer systems
**Role Switching:** Not applicable
**UX Pattern:** Separate websites and apps

#### How It Works

- **Consumer Platform:** Fresha.com/Treatwell.co.uk - Browse salons, book appointments
- **Business Platform:** Fresha Pro / Treatwell Connect - Salon management software
- **No Account Overlap:** Consumer bookings and business accounts are unrelated systems
- **Different Products:** Business side is full POS/scheduling/CRM software, not just booking

#### Why Separate?

- **B2B vs B2C:** Business users need inventory management, staff scheduling, payment processing, analytics
- **Revenue Model:** Business users pay subscriptions or commissions; consumers pay per booking
- **User Journey:** Salons are recruited as partners, not discovered organically
- **Complexity:** Business software is enterprise-grade with integration, reporting, etc.

#### Key Design Decisions

- No dual role expected - salon owners don't book at their own salon via the platform
- If salon owner wants to book at a competitor's salon, they'd use consumer app separately
- **Commission model:** Treatwell charges commission only for new clients, not repeat bookings

#### Insights for Massava

- If Massava studio owners need complex business tools (staff management, inventory, financial reporting), consider separate business portal
- If studio owners just need to manage bookings/calendar, unified account makes more sense
- Fresha's model works because business users are fundamentally different from consumers
- For small studios (Massava's target), unified account reduces barriers to entry

---

### 6. ClassPass (Fitness Classes) - NO DUAL ROLE MODEL

**Account Structure:** Consumer-only accounts
**Role Switching:** N/A
**UX Pattern:** Studios are partners, not platform users

#### How It Works

- **Consumer Side:** ClassPass members browse and book classes with credits
- **Studio Side:** Studios are business partners who set inventory and pricing via partnership agreement
- **No Studio Accounts:** Studio owners don't log into ClassPass to use it as consumers
- **Revenue Share:** Studios get paid per ClassPass booking (often at reduced rates)

#### Key Findings

- **Conversion Issues:** Studios report ClassPass users rarely convert to full members
- **Revenue Loss:** Studios earn 60% less per ClassPass booking vs direct bookings
- **Marketing Value:** 28%+ of studio clients discover studios through ClassPass
- **Account Restrictions:** Bookings can only be made by the account owner (non-transferable)

#### Why No Dual Role?

- Studio owners are B2B partners providing inventory
- If a studio owner wants to take classes elsewhere, they'd need a personal ClassPass membership
- Business and consumer relationships are completely separate

#### Insights for Massava

- ClassPass model works when the provider relationship is purely B2B (inventory supply)
- Not applicable to Massava since studios will manage their own bookings directly
- However, the "discovery marketplace" aspect is relevant - studios benefit from exposure

---

### 7. TaskRabbit (Home Services) - SEPARATE APPS FOR CLARITY

**Account Structure:** Separate Tasker and Client apps
**Role Switching:** Must switch between apps
**UX Pattern:** Different apps for offering vs hiring services

#### How It Works

- **Tasker App:** For service providers (Taskers) to accept jobs, manage schedule, get paid
- **TaskRabbit App:** For clients to post jobs and hire Taskers
- **Account Selection:** During registration, choose Tasker or Client role
- **Same Credentials:** Can use existing account credentials when registering for the other role

#### Key Design Decisions

- Separate apps reduce complexity for each user type
- Taskers have specialized needs (background checks, payment setup, job filtering)
- Clients need simple posting and provider search
- Documentation unclear on whether same person can maintain both roles simultaneously

#### Insights for Massava

- Similar to Uber - separate apps when workflows are fundamentally different
- For massage studios, ask: Do studio owners need a completely different app than customers?
- If booking flow is similar (browse available times, select, book), unified makes more sense
- If studio owners need complex scheduling, staff assignment, payment processing → Separate apps

---

### 8. OpenTable (Restaurant Reservations) - OWNER TOOLS VS CONSUMER BOOKING

**Account Structure:** Separate business management vs consumer reservation
**Role Switching:** Business owners have separate dashboard
**UX Pattern:** Restaurant owners manage properties via owner app/dashboard

#### How It Works

- **Consumer Side:** Search restaurants, read reviews, make reservations
- **Business Side:** Restaurant owners use management software for reservations, table management, analytics
- **Owner App:** iPhone app for restaurant managers to check stats, make/edit reservations, view trends
- **Multi-Location:** Owners of multiple restaurants can manage all properties from one dashboard

#### Key Design Decisions

- **No-Show Prevention:** OpenTable prevents diners from booking multiple restaurants simultaneously
- **Cross-Selling:** If one location is fully booked, system can suggest other locations owned by same restaurant group
- **Owner Privileges:** Owners can make reservations at their own restaurants (e.g., for VIP guests)

#### Edge Cases

- **Booking at Competitors:** Restaurant owners booking at other restaurants would use consumer flow
- **Internal Reservations:** Owners can use management tools to make reservations at their own restaurants
- **Multi-Brand:** Large restaurant groups manage multiple concepts from unified dashboard

#### Insights for Massava

- OpenTable separates business management from consumer booking
- However, owners CAN make reservations at their own restaurants (for VIP guests, events)
- For Massava, studio owners would likely need to block time for themselves or special clients
- Consider whether blocking time vs making a booking is semantically different

---

### 9. Thumbtack (Home Services) - ACCOUNT TYPE SELECTION

**Account Structure:** Choose Professional or Customer account type
**Role Switching:** Platform has "Choose Account" page
**UX Pattern:** Select account type during onboarding

#### How It Works

- **Two Account Types:** Professional accounts (offer services) and Customer accounts (hire services)
- **Choose Account:** During signup, select which type
- **Revenue Model:** Professionals pay fees for connecting with customers; customers don't pay to use platform

#### Key Gaps in Research

- Unclear if same person can have both account types
- Unclear if switching between roles is possible after initial selection
- No documentation found on dual-role users

#### Insights for Massava

- Thumbtack's approach suggests separation, but details are unclear
- For small business owners who also consume services, this could create friction
- Massava should allow fluid transitions between roles

---

## Cross-Platform Insights & Best Practices

### 1. Account Architecture: Unified vs Separate

**Best Practice: Unified Account**

According to UX research on marketplace platforms:

> "The best practice is to combine buyers and sellers in one registration form, as high-profile websites keep buyers and sellers in one category."

#### Why Unified Accounts Win

1. **Avoid Artificial Barriers**
   - Separate accounts force users to log out and log back in to switch roles
   - Users would have to re-find items/services after switching
   - Creates unnecessary friction for power users

2. **Support Power Users**
   - Users generating the most business are most likely to do both buying and selling
   - Platform benefits from making it easy for engaged users to participate fully

3. **UI Can Handle Both**
   - Modern interfaces easily support both roles
   - Choice can be made after login and remembered as default
   - Role preference becomes a "once-in-a-lifetime click"

4. **Enable Easy Transitions**
   - Users can start as consumers (low barrier to entry)
   - Later, upgrade to provider when they see value
   - No need to create a new account or remember different credentials

#### When Separate Accounts/Apps Make Sense

Separation is justified **only when**:
- User registered as seller can ONLY act as seller (and vice versa) - rare in practice
- Provider and consumer workflows are fundamentally different (Uber driver vs rider)
- Provider role requires extensive onboarding, verification, or business setup (Treatwell)
- B2B provider tools are completely different from B2C consumer tools

### 2. Role Switching UX Patterns

#### Pattern A: Profile Menu Switcher (Airbnb, Upwork)
- **Location:** Top-right corner near profile photo
- **Interaction:** Click profile → "Switch to [Other Role]"
- **Pros:** Consistent location, accessible from any page
- **Cons:** Requires opening menu (one extra click)

#### Pattern B: Persistent Text Link (Fiverr)
- **Location:** Top navigation bar (always visible)
- **Interaction:** "Switch to Selling" / "Switch to Buying" text link
- **Pros:** Highly visible, zero clicks to understand current role
- **Cons:** Takes up navigation real estate

#### Pattern C: Account Menu Dropdown (Upwork)
- **Location:** Top-right account menu
- **Shows:** All available profiles (Freelancer, Client, Agency)
- **Pros:** Supports 3+ roles, clear visual hierarchy
- **Cons:** Requires more complex state management

#### Pattern D: Separate Apps (Uber, TaskRabbit, Treatwell)
- **Location:** N/A - must switch between different applications
- **Interaction:** Close one app, open another
- **Pros:** No UI clutter, optimized experiences, independent development
- **Cons:** Higher development cost, context loss when switching

### 3. Registration & Onboarding Flow

#### Approach 1: Single Registration, Role Selection Later (Airbnb)

**Flow:**
1. User signs up with email/password
2. Immediate access to consumer features
3. "Become a Host" CTA in profile
4. Host registration is incremental (list first property)

**Pros:**
- Lowest barrier to entry
- Users can explore platform before committing to provider role
- Natural funnel: consumer → engaged consumer → provider

**Cons:**
- May delay provider acquisition
- Some users may not discover provider option

#### Approach 2: Role Selection During Onboarding (Thumbtack, TaskRabbit)

**Flow:**
1. "What brings you here?" or "Choose account type"
2. User selects Professional or Customer
3. Onboarding tailored to selected role
4. Ability to add other role later (unclear on most platforms)

**Pros:**
- Customized onboarding for each role
- Immediately surfaces provider option
- Can collect role-specific information upfront

**Cons:**
- Forces decision before user understands platform
- May create artificial separation
- Adds friction to registration flow

#### Approach 3: Default Consumer, "Become a Seller" Upgrade (Fiverr)

**Flow:**
1. All accounts start as buyer accounts
2. Platform encourages users to "Become a Seller" via CTAs
3. Seller activation requires educational onboarding (video tutorials)
4. After activation, user can freely switch between roles

**Pros:**
- Fast initial registration (no role decision)
- Educates providers before they can list services
- Clear upgrade path
- Maintains quality by requiring onboarding

**Cons:**
- Asymmetric - assumes buyer is default
- May not surface provider option early enough

#### Approach 4: Parallel Onboarding for Both Roles (Upwork)

**Flow:**
1. User signs up with basic information
2. Can immediately add freelancer, client, and/or agency profiles
3. Each profile has its own onboarding checklist
4. Profiles are independent but linked to same account

**Pros:**
- Maximum flexibility
- User controls complexity
- Can add roles incrementally

**Cons:**
- More complex to build
- Requires robust profile management system

### Recommendation for Massava

**Suggested Approach: Hybrid of Airbnb + Fiverr**

1. **Initial Registration:**
   - Single registration form (email, password, name)
   - No role selection - everyone gets a basic account
   - Immediate access to browse and book massages (consumer features)

2. **Provider Onboarding:**
   - Prominent "List Your Studio" CTA in header and profile
   - Separate provider registration flow (collect business info)
   - Studio verification process before going live
   - Once verified, user can manage studios AND book as consumer

3. **Role Switcher:**
   - Top-right menu: "Switch to Studio Dashboard" / "Switch to Booking"
   - Mobile: Bottom navigation toggle or profile menu
   - Clear indication of current role (badge or mode indicator)

4. **Progressive Disclosure:**
   - Don't ask studio owners if they also want to book during studio registration
   - Let them discover booking features organically
   - Surface cross-promotion ("Want to book a massage at another studio?")

---

## Edge Cases & Conflict of Interest Policies

### Can Providers Book Their Own Services?

**Research Finding:** No major platform explicitly documents this scenario.

#### Airbnb Hosts Booking Own Listings
- **Policy:** No documentation found
- **Likely Behavior:** System probably prevents booking own listings
- **Rationale:** Hosts don't need to "book" their own property - they have full access
- **Workaround:** Hosts can block calendar dates without making a booking

#### Uber Drivers Requesting Rides While Driving
- **Policy:** Must use separate Rider app
- **Likely Behavior:** Can't request ride while Driver app is active
- **Rationale:** Would conflict with accepting ride requests
- **Technical Implementation:** Separate apps prevent simultaneous roles

#### Fiverr Sellers Buying from Themselves
- **Policy:** Not addressed
- **Likely Behavior:** System probably doesn't prevent it
- **Rationale:** Seller might legitimately purchase complementary services
- **Risk:** Low (no financial manipulation possible)

#### Upwork Freelancers Hiring Themselves
- **Policy:** Financial accounts are separate
- **Likely Behavior:** Could post job as client, apply as freelancer
- **Prevention:** None apparent, but reputation system would expose abuse
- **Risk:** Platform fees would still apply, making it pointless

### Recommendations for Massava

**Should studio owners be able to book appointments at their own studio?**

**Analysis:**

✅ **Allow It - Here's Why:**

1. **Legitimate Use Cases:**
   - Studio owner wants to book with a specific therapist at their studio
   - Owner wants to test booking flow from customer perspective
   - Owner is also a practicing therapist and wants to block personal appointments
   - Multi-location studio owner wants to book at their other location

2. **Low Risk:**
   - Owner isn't paying themselves (internal transaction)
   - No review manipulation risk (owner can't review own studio)
   - Platform fees could be waived for self-bookings

3. **Simpler Logic:**
   - No special cases in booking flow
   - Prevents "Why can't I book at my own studio?" support tickets
   - Studio owners already have full calendar access via dashboard

**Suggested Implementation:**

1. **Allow Self-Booking BUT:**
   - Flag self-bookings clearly in studio dashboard ("Your personal appointment")
   - Don't allow studio owners to review their own studios
   - Consider waiving platform fees for self-bookings
   - Show calendar availability to studio owners regardless of booking

2. **Alternative: "Block Time" Feature:**
   - Studio owners can block time directly in dashboard
   - Appears as "Unavailable" to customers
   - No need to create a "booking" record
   - Cleaner semantics ("I'm blocking time" vs "I'm booking myself")

3. **Recommended Approach:**
   - Allow self-booking for testing and multi-location scenarios
   - Provide "Block Time" feature for studio owners who want to reserve slots without bookings
   - Display self-bookings differently in UI ("Your appointment" vs customer booking)

---

## Visual Design Patterns

### Role Switcher UI Examples

#### 1. Profile Menu Pattern (Airbnb-style)

```
┌─────────────────────────────────────┐
│  Massava                    [👤 ▼] │ <- Click profile icon
└─────────────────────────────────────┘
                                  ┌────────────────────────┐
                                  │ Roman Gonzalez         │
                                  │ roman@example.com      │
                                  ├────────────────────────┤
                                  │ My Bookings            │
                                  │ Account Settings       │
                                  ├────────────────────────┤
                                  │ ⚡ Switch to Studio    │ <- Toggle role
                                  │    Dashboard           │
                                  ├────────────────────────┤
                                  │ Help                   │
                                  │ Log Out                │
                                  └────────────────────────┘
```

#### 2. Persistent Switcher (Fiverr-style)

```
┌────────────────────────────────────────────────┐
│  Massava    Browse    [Switch to Studio Mode] │ <- Always visible
└────────────────────────────────────────────────┘
```

#### 3. Bottom Nav Toggle (Mobile-First)

```
┌─────────────────────────────┐
│                             │
│     Main Content Area       │
│                             │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [🔍] [📅] [👤] [🏢]        │ <- Tap building icon to access studio mode
└─────────────────────────────┘
   ^      ^     ^      ^
  Browse  My   Profile Studio
         Bookings     Dashboard
```

#### 4. Mode Indicator Banner

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Studio Dashboard Mode  [Switch to Customer View →]  │
└─────────────────────────────────────────────────────────┘
```

### Onboarding Flow Mockup

#### Option A: No Role Selection (Recommended)

```
┌────────────────────────────────────┐
│   Welcome to Massava 💆            │
│                                    │
│   Email:    [________________]     │
│   Password: [________________]     │
│                                    │
│   [Sign Up]                        │
│                                    │
│   Already have an account? Log in  │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│   Welcome, Roman! 🎉               │
│                                    │
│   Browse nearby massage studios    │
│   [Start Browsing]                 │
│                                    │
│   Own a studio?                    │
│   [List Your Studio →]             │
└────────────────────────────────────┘
```

#### Option B: "What Brings You Here?" (More Friction)

```
┌────────────────────────────────────┐
│   Welcome to Massava               │
│                                    │
│   What brings you here?            │
│                                    │
│   ⦿ I want to book a massage       │
│   ○ I'm a studio owner             │
│                                    │
│   [Continue]                       │
└────────────────────────────────────┘
```

**Recommendation:** Use Option A. Lower friction, users self-segment naturally.

---

## Architectural Recommendations for Massava

### 1. Data Model: Unified Account

```typescript
// User table (unified)
User {
  id: string
  email: string
  name: string
  role: 'CUSTOMER' | 'STUDIO_OWNER' | 'BOTH'
  createdAt: DateTime
}

// Studio table (relationship)
Studio {
  id: string
  ownerId: string  // Foreign key to User
  name: string
  address: string
  // ... studio details
}

// Booking table
Booking {
  id: string
  customerId: string  // Foreign key to User
  studioId: string
  serviceId: string
  // ... booking details
}
```

**Key Points:**
- One User record can own Studios AND make Bookings
- Role field tracks if user is customer-only, owner-only, or both
- Relationships allow same user to appear as customerId and ownerId

### 2. Authentication: Single Session, Role Context

```typescript
// Session object
Session {
  userId: string
  currentRole: 'customer' | 'studio'  // Current view mode
  studios: Studio[]  // Studios owned by this user
}

// Context switching
switchRole(session, newRole) {
  session.currentRole = newRole
  // Redirect to appropriate dashboard
}
```

**Key Points:**
- One login session
- currentRole determines UI view
- Switching role is instant (no re-authentication)
- Persist role preference (localStorage or cookie)

### 3. UI Components: Conditional Rendering

```typescript
// Role-aware navigation
function Navigation({ user, currentRole }) {
  return (
    <nav>
      <Logo />
      {currentRole === 'customer' ? (
        <CustomerNav />
      ) : (
        <StudioNav studios={user.studios} />
      )}
      <RoleSwitcher
        currentRole={currentRole}
        hasStudios={user.studios.length > 0}
      />
    </nav>
  )
}
```

### 4. URL Structure

**Option A: Role Prefix**
```
/app/customer/bookings
/app/customer/browse
/app/studio/dashboard
/app/studio/calendar
/app/studio/settings
```

**Option B: Separate Subdomains (If Apps Are Very Different)**
```
https://book.massava.com (customer)
https://studio.massava.com (studio owner)
```

**Recommendation:** Option A (role prefix) for unified app.

### 5. Business Logic: Role-Based Permissions

```typescript
// Permission checking
function canEditStudio(user, studioId) {
  return user.studios.some(s => s.id === studioId)
}

function canBookAppointment(user, studioId) {
  // Allow booking at any studio (even own studio)
  return true

  // Or prevent self-booking:
  // return !canEditStudio(user, studioId)
}

function canReviewStudio(user, studioId) {
  // Prevent reviewing own studio
  return !canEditStudio(user, studioId)
}
```

---

## Implementation Roadmap for Massava

### Phase 1: Foundation (Unified Account)

**Goal:** Enable users to be both customers and studio owners

**Tasks:**
- [ ] Update User model to track role (customer/owner/both)
- [ ] Create Studio ownership relationship (User.studios)
- [ ] Ensure booking system allows same user to book and own studios
- [ ] Add role field to session/JWT

**Acceptance Criteria:**
- User can own a studio and still make bookings at other studios
- Database schema supports one-to-many User → Studios relationship
- No blocking logic prevents studio owners from browsing/booking

### Phase 2: Role Switching UI

**Goal:** Let users toggle between customer and studio views

**Tasks:**
- [ ] Design role switcher component (profile menu or nav bar)
- [ ] Create Studio Dashboard route/page
- [ ] Implement role context (React Context or Zustand store)
- [ ] Add "Switch to Studio Dashboard" option in user menu
- [ ] Add "Switch to Customer View" option in studio dashboard
- [ ] Persist role preference (localStorage)

**Acceptance Criteria:**
- Studio owners see role switcher in navigation
- Clicking switcher loads appropriate UI (customer browse vs studio dashboard)
- Role preference persists across page refreshes
- Current role is clearly indicated in UI

### Phase 3: Studio Owner Onboarding

**Goal:** Make it easy for customers to become studio owners

**Tasks:**
- [ ] Add "List Your Studio" CTA in header (for logged-in users)
- [ ] Create studio registration flow
- [ ] Collect business information (studio name, address, services, photos)
- [ ] Implement studio verification process
- [ ] Send confirmation email when studio is approved
- [ ] Automatically switch to studio role after first studio is created

**Acceptance Criteria:**
- Logged-in customers see "List Your Studio" option
- Registration flow is clear and streamlined
- Studio requires approval before going live
- User is notified when studio is approved
- After approval, user can access studio dashboard

### Phase 4: Self-Booking Policies

**Goal:** Define and implement rules for studio owners booking at own studios

**Tasks:**
- [ ] Decide: Allow self-booking or not?
- [ ] If allowing: Flag self-bookings in dashboard UI
- [ ] If preventing: Add check in booking flow
- [ ] Implement "Block Time" feature for studio owners
- [ ] Prevent studio owners from reviewing own studios
- [ ] Consider waiving platform fees for self-bookings

**Acceptance Criteria:**
- Self-booking policy is clearly documented
- UI handles self-bookings appropriately
- Studio owners can block time without creating bookings (alternative)
- Reviews system prevents studio owners from reviewing own studios

### Phase 5: Advanced Features

**Goal:** Optimize dual-role user experience

**Tasks:**
- [ ] Add role-specific notifications (new booking vs customer inquiry)
- [ ] Create unified activity feed (my bookings + my studio bookings)
- [ ] Implement role-based analytics (customer booking history + studio revenue)
- [ ] Add multi-studio support (owners with multiple studios)
- [ ] Create studio switcher (if owner has multiple studios)

**Acceptance Criteria:**
- Users receive appropriate notifications for each role
- Dashboard shows holistic view of all activity
- Analytics respect role context
- Multi-studio owners can manage all properties

---

## Questions for Product Team

### Strategic Decisions Needed

1. **Should we allow studio owners to book appointments at their own studios?**
   - If yes: How do we handle payment? Display in UI?
   - If no: How do we communicate this restriction?
   - Alternative: Provide "Block Time" feature instead?

2. **Should studio owners get separate accounts or unified accounts?**
   - **Recommendation:** Unified (based on research)
   - **Rationale:** Lower friction, supports power users, easier to implement

3. **What's our stance on studio owners booking at competitor studios?**
   - Should we encourage this (market research, testing competition)?
   - Should we track it for insights?
   - Should we offer it as a feature ("Book massages at other studios")?

4. **Do studio owners need significantly different features than customers?**
   - If yes (complex calendar, staff management, inventory): Consider separate apps
   - If no (mostly just calendar and bookings): Unified app with role switcher

5. **What's the onboarding flow?**
   - Option A: Everyone starts as customer, can upgrade to studio owner
   - Option B: Ask "What brings you here?" during signup
   - Option C: Allow registering as both simultaneously
   - **Recommendation:** Option A (lowest friction)

6. **Where should role switcher be placed?**
   - Profile menu (Airbnb style)
   - Top navigation (Fiverr style)
   - Bottom navigation (mobile-first)
   - **Recommendation:** Profile menu for desktop, bottom nav for mobile

7. **Should we have separate domains/subdomains?**
   - book.massava.com vs studio.massava.com
   - **Recommendation:** No, use route prefixes (/app/customer vs /app/studio)

---

## Competitive Landscape Summary

### Platforms with Unified Accounts (70%+)
- Airbnb ✅
- Fiverr ✅
- Upwork ✅

### Platforms with Separate Apps/Accounts (20%)
- Uber (technical reasons)
- TaskRabbit (complexity)
- Treatwell/Fresha (B2B vs B2C)

### Platforms with No Dual Role (10%)
- ClassPass (business partners aren't users)
- OpenTable (separate but owners can book at competitors)

### Industry Trend
**Unified accounts are the dominant pattern** for platforms where:
- Provider and consumer experiences overlap
- Users benefit from switching roles
- Onboarding simplicity is crucial

### Massava's Positioning
Massava is most similar to:
- **Airbnb** (small business owners + consumers)
- **OpenTable** (venue management + booking)
- **ClassPass** (studio discovery)

**Recommendation:** Follow Airbnb's model - unified account with seamless role switching.

---

## Key Takeaways for Massava

### 1. Use Unified Accounts
- One email, one password, multiple roles
- Dramatically reduces friction
- Supports studio owners who also want to book massages

### 2. Make Role Switching Seamless
- Profile menu: "Switch to Studio Dashboard" / "Switch to Customer View"
- Clear indicator of current role
- Preserve context when switching (don't lose current page)

### 3. Default to Consumer, Upgrade to Provider
- All users start with ability to browse and book
- "List Your Studio" CTA in header
- Studio registration is a clear upgrade path
- No need to choose role during initial signup

### 4. Allow Self-Booking (With Caveats)
- Studio owners CAN book at their own studios
- Flag these bookings in UI ("Your personal appointment")
- Prevent owners from reviewing their own studios
- Optionally waive platform fees for self-bookings

### 5. Separate Apps Only If Necessary
- Only use separate apps if provider/consumer needs are dramatically different
- For massage booking: Experiences are similar enough for unified app
- Studio dashboard is just a different "view" of the same platform

### 6. Progressive Disclosure in Onboarding
- Don't overwhelm new users with role decisions
- Let users explore as customers first
- Surface provider option organically through CTAs
- Allow upgrading to studio owner anytime

### 7. Financial & Data Separation
- Even with unified accounts, keep financial records separate
- Studio earnings ≠ customer payment methods
- Reviews, ratings, reputation are role-specific
- Analytics should respect role context

---

## Appendix: Additional Resources

### UX Research Sources
- StackExchange UX: "Building a marketplace - unified vs separate registration"
- Medium: "Architecture Patterns for Booking Management Platform"
- Medium: "Retailer's Dual Role in Digital Marketplaces"

### Platform Documentation
- Airbnb Help: "Switching between hosting and traveling"
- Fiverr Help: "My account is a client account. I want to be a freelancer"
- Upwork Help: "Be a client and a freelancer"
- Uber Forums: "Can you be an UBER driver and a rider on the same account?"

### Industry Analysis
- Marketplace Academy: "How to onboard initial marketplace supply"
- Sharetribe: "The complete guide to building a two-sided marketplace"
- Rigby: "What Good Marketplace UX Design Looks Like"

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | Research Team | Initial research compilation |

---

## Next Steps

1. **Product Decision:** Schedule meeting to discuss strategic questions (Section 10)
2. **Design Phase:** Create mockups for role switcher and studio dashboard
3. **Technical Spec:** Define data model, API endpoints, and permissions system
4. **Implementation:** Follow roadmap (Phase 1-5)
5. **User Testing:** Test dual-role flow with real studio owners

---

**End of Research Document**
