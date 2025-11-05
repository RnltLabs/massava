# Studio Owner Guide

Welcome to Massava! This guide will help you get started with managing your studio, bookings, services, and availability through the Business Portal.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Bookings](#managing-bookings)
4. [Calendar View](#calendar-view)
5. [Services Management](#services-management)
6. [Studio Settings](#studio-settings)
7. [Opening Hours](#opening-hours)
8. [Help & Support](#help--support)

---

## Getting Started

### Creating Your Account

1. Visit [massava.com/auth/signup](https://massava.com/auth/signup)
2. Fill in your details:
   - Name
   - Email address
   - Password (minimum 8 characters)
3. Select **"Studio Owner"** as your account type
4. Click **"Sign Up"**
5. Verify your email address (check your inbox)

### Studio Onboarding Wizard

After signing up, you'll be guided through a simple onboarding process:

#### Step 1: Studio Information

Provide basic information about your studio:

- **Studio Name** (required): The name customers will see
- **Description**: Tell customers what makes your studio special
- **Category**: Select your primary business type (e.g., Tattoo, Piercing, Art)

**Tips**:
- Choose a memorable, professional name
- Keep descriptions concise but informative (2-3 sentences)
- Highlight your specialties or unique offerings

#### Step 2: Location & Contact

Set up your studio's location and contact information:

- **Full Address** (required): Street, city, postal code
- **Phone Number** (required): Primary contact number
- **Email**: Studio contact email (defaults to your account email)
- **Website**: Your studio website (optional)

**Tips**:
- Use your complete business address for better search results
- Double-check phone number formatting
- Keep contact information up-to-date

#### Step 3: Services

Add at least one service to start accepting bookings:

- **Service Name** (required): e.g., "Custom Tattoo Session"
- **Description**: Details about the service
- **Duration** (required): How long the service takes (in minutes)
- **Price** (required): Cost in your local currency

**Tips**:
- Start with 2-3 core services
- Use clear, descriptive names
- Include what's included in the price (consultation, aftercare, etc.)

#### Step 4: Opening Hours

Set your weekly schedule:

- Select days you're open
- Set opening and closing times for each day
- Different hours for different days

**Tips**:
- Be realistic about your availability
- Consider buffer time between appointments
- You can always adjust hours later

### First Steps After Onboarding

Once you've completed onboarding:

1. **Review Your Profile**: Visit Settings to add more details
2. **Add More Services**: If you offer multiple services
3. **Check Your Calendar**: Ensure availability looks correct
4. **Test Booking Flow**: Make a test booking (as a customer) to see the experience

---

## Dashboard Overview

The Business Portal dashboard (`/business`) is your command center.

### Statistics Cards

**Today's Bookings**
- Number of appointments scheduled for today
- Click to see today's calendar view

**Pending Bookings**
- Bookings awaiting your confirmation
- Requires action (confirm or decline)

**This Month's Revenue**
- Total confirmed booking value for the current month
- Updates in real-time as bookings are confirmed

**Total Services**
- Number of active services you offer
- Click to manage services

### Recent Bookings Widget

Shows your 5 most recent bookings with:
- Customer name
- Service booked
- Date and time
- Current status (badge color-coded)
- Quick action button (View Details)

**Status Colors**:
- Yellow: Pending (needs action)
- Green: Confirmed
- Red: Declined
- Gray: Cancelled
- Blue: Completed

### Quick Actions

- **View All Bookings**: Go to full booking list
- **View Calendar**: See your schedule
- **Add Service**: Create a new service offering
- **Studio Settings**: Update your studio information

---

## Managing Bookings

Access the bookings page at `/business/bookings`.

### Booking List View

Your bookings are displayed in a searchable, filterable table with:

**Columns**:
- **Customer**: Name and email
- **Service**: What was booked
- **Date & Time**: When the appointment is scheduled
- **Status**: Current booking state
- **Actions**: Quick action menu

### Filtering Bookings

**By Status**:
- All Bookings (default)
- Pending (requires action)
- Confirmed
- Declined
- Cancelled
- Completed

**By Date Range**:
- Today
- This Week
- This Month
- Custom Date Range

**By Search**:
- Search by customer name, email, or service name
- Results update as you type

### Viewing Booking Details

Click any booking row or the "View Details" button to see:

**Customer Information**:
- Full name
- Email address
- Phone number (if provided)
- Customer notes/requests

**Booking Details**:
- Service name and description
- Duration
- Price
- Date and time
- Time slot details

**Status History**:
- When booking was created
- Status changes (pending → confirmed)
- Who made changes

### Confirming a Booking

1. Click on a pending booking
2. Review the details
3. Click **"Confirm Booking"** button
4. Customer receives automatic confirmation email

**What Happens**:
- Status changes to "Confirmed"
- Time slot marked as unavailable
- Calendar updated
- Customer notified via email

### Declining a Booking

1. Click on a pending booking
2. Click **"Decline Booking"** button
3. Optionally provide a reason
4. Confirm decline action

**What Happens**:
- Status changes to "Declined"
- Time slot becomes available again
- Customer notified with your reason

**When to Decline**:
- You're unavailable at that time
- Service requires consultation first
- Request doesn't match your offerings

### Cancelling a Booking

For confirmed bookings that need to be cancelled:

1. Open the booking details
2. Click **"Cancel Booking"** button
3. Provide cancellation reason
4. Confirm cancellation

**What Happens**:
- Status changes to "Cancelled"
- Time slot becomes available
- Customer notified via email
- Refund process initiated (if applicable)

### Marking as Completed

After an appointment is finished:

1. Open the booking details
2. Click **"Mark as Completed"** button
3. Optionally add notes

**Benefits**:
- Clean up your active bookings list
- Track completed appointments
- Build service history

---

## Calendar View

Access your calendar at `/business/calendar`.

### View Options

**Day View**:
- Hour-by-hour schedule for selected day
- See all appointments and available slots
- Best for daily planning

**Week View**:
- 7-day overview
- See patterns in your schedule
- Identify busy and slow periods

**Month View**:
- Bird's-eye view of the entire month
- See booking density
- Plan ahead for busy periods

### Navigation

**Change Dates**:
- Click date in header to open date picker
- Use arrow buttons to go forward/backward
- Click "Today" to return to current date

**Quick Jump**:
- Click any date in mini calendar (sidebar)
- Type date in search (YYYY-MM-DD format)

### Calendar Events

**Color Coding**:
- Green: Confirmed appointments
- Yellow: Pending bookings
- Red: Blocked time/unavailable
- Blue: Completed (past appointments)

**Event Details**:
- Hover over event to see quick preview
- Click event to open full booking details

### Availability

**Available Time Slots**:
- Shown as white/empty blocks
- Based on your opening hours
- Automatically calculated from service duration

**Unavailable Times**:
- Booked appointments
- Outside opening hours
- Blocked time (future feature)

### Tips for Calendar Management

- Review your week every Monday
- Check pending bookings daily
- Plan breaks between appointments
- Update opening hours for holidays

---

## Services Management

Access services at `/business/services`.

### Service List

View all your services with:
- Service name and description
- Duration and price
- Status (Active/Inactive)
- Number of bookings
- Quick actions (Edit/Delete)

### Adding a New Service

1. Click **"Add Service"** button
2. Fill in the service form:
   - **Name** (required): Clear, descriptive name
   - **Description**: What the service includes
   - **Duration** (required): Minutes (e.g., 60, 90, 120)
   - **Price** (required): Amount in your currency
   - **Category**: Type of service (optional)
3. Click **"Create Service"**

**Example Services**:

```
Name: Custom Tattoo Session (Small)
Description: Up to 2x2 inches, includes consultation and aftercare kit
Duration: 60 minutes
Price: $150

Name: Consultation
Description: Free 15-minute consultation to discuss your design ideas
Duration: 15 minutes
Price: $0 (Free)
```

### Editing a Service

1. Click **"Edit"** on the service you want to update
2. Modify any fields
3. Click **"Save Changes"**

**What Can Be Changed**:
- Name, description, duration, price
- Category and other metadata

**What Cannot Be Changed**:
- Service ID (internal)
- Past bookings (historical data preserved)

### Deleting a Service

1. Click **"Delete"** on the service
2. Confirm deletion

**Important**:
- Cannot delete services with active bookings
- Completed bookings remain in history
- Action cannot be undone

**When to Delete**:
- Service no longer offered
- Duplicates or test entries
- Outdated offerings

### Service Best Practices

**Pricing Strategy**:
- Research competitor pricing
- Consider your experience level
- Factor in materials/overhead
- Offer package deals (future feature)

**Duration Accuracy**:
- Include setup and cleanup time
- Add buffer for complex services
- Consider consultation time
- Account for breaks

**Clear Descriptions**:
- What's included
- What's not included
- Prerequisites (e.g., "Consultation required first")
- Aftercare information

---

## Studio Settings

Access settings at `/business/settings`.

### Profile Settings

Edit your studio's public profile:

**Basic Information**:
- Studio name
- Description (shown to customers)
- Category/type

**Branding**:
- Logo upload (recommended: 400x400px)
- Cover photo (recommended: 1200x400px)
- Brand colors (future feature)

**Social Media**:
- Instagram handle
- Facebook page
- Portfolio link

**Tips**:
- Use high-quality images
- Keep description under 500 characters
- Update regularly with new work

### Location Settings

Update your address and contact information:

- Full address (street, city, postal code)
- Phone number
- Email
- Website URL

**Map Preview**:
- See how your location appears to customers
- Ensure pin is in correct location
- Update if you move locations

### Contact Preferences

Set how customers can reach you:

- Allow phone bookings: Yes/No
- Allow email inquiries: Yes/No
- Preferred contact method
- Response time expectations

### Booking Settings

Configure booking behavior:

**Advance Notice**:
- Minimum hours before booking (e.g., 24 hours)
- Prevents last-minute bookings

**Booking Window**:
- How far in advance customers can book (e.g., 3 months)
- Prevents overbooking

**Confirmation**:
- Auto-confirm bookings: Yes/No
- Require manual approval for all bookings

**Cancellation Policy**:
- Cancellation window (e.g., 48 hours)
- Late cancellation fee (future feature)

---

## Opening Hours

Manage your studio's weekly schedule at `/business/settings/opening-hours`.

### Setting Regular Hours

For each day of the week:

1. Toggle **"Open"** switch
2. Set **Opening Time** (e.g., 09:00)
3. Set **Closing Time** (e.g., 18:00)
4. Click **"Save Changes"**

**Example Schedule**:
```
Monday: 10:00 AM - 6:00 PM
Tuesday: 10:00 AM - 6:00 PM
Wednesday: 10:00 AM - 6:00 PM
Thursday: 10:00 AM - 8:00 PM (late night)
Friday: 10:00 AM - 8:00 PM
Saturday: 12:00 PM - 5:00 PM
Sunday: Closed
```

### Split Shifts (Future Feature)

For lunch breaks or split schedules:

1. Add second time range for same day
2. Set morning shift (e.g., 9:00 AM - 12:00 PM)
3. Set afternoon shift (e.g., 1:00 PM - 6:00 PM)

### Special Hours

**Holidays**:
- Mark specific dates as closed
- Set custom hours for holidays
- Notify customers of changes

**Temporary Closures**:
- Vacations
- Training/conferences
- Renovation periods

### How Opening Hours Affect Bookings

**Available Time Slots**:
- Automatically generated based on opening hours
- Service duration considered
- No overlapping appointments

**Example**:
```
Opening Hours: 10:00 AM - 6:00 PM
Service Duration: 60 minutes

Available Slots:
- 10:00 AM - 11:00 AM
- 11:00 AM - 12:00 PM
- 12:00 PM - 1:00 PM
- 1:00 PM - 2:00 PM
- 2:00 PM - 3:00 PM
- 3:00 PM - 4:00 PM
- 4:00 PM - 5:00 PM
(Last slot ends at 5:00 PM, within closing time)
```

### Tips for Setting Hours

- Be consistent week-to-week
- Allow buffer time at start/end of day
- Consider peak customer demand times
- Update for seasonal changes
- Communicate changes to regular customers

---

## Help & Support

### Frequently Asked Questions

#### Getting Started

**Q: How long does onboarding take?**
A: About 5-10 minutes. You can save and continue later if needed.

**Q: Can I change my studio name later?**
A: Yes, in Studio Settings > Profile at any time.

**Q: Do customers see my personal email?**
A: No, only your studio contact email is visible to customers.

#### Bookings

**Q: What happens if I don't confirm a booking?**
A: Pending bookings expire after 24 hours and are automatically declined.

**Q: Can customers book immediately or do I approve all bookings?**
A: You can choose in Settings > Booking Settings. Default is manual approval.

**Q: How do customers receive confirmations?**
A: Automatic emails are sent when you confirm bookings.

**Q: Can I reschedule a booking?**
A: Currently, you need to decline and ask customer to rebook. Rescheduling feature coming soon.

#### Services

**Q: How many services can I offer?**
A: Unlimited. Most studios start with 3-5 core services.

**Q: Can I offer free consultations?**
A: Yes, set price to $0.

**Q: Do I need to add all services at once?**
A: No, start with your most popular services and add more over time.

#### Calendar

**Q: Can customers see my full calendar?**
A: No, they only see available time slots, not booked appointments.

**Q: What if I need to block time for personal reasons?**
A: Use opening hours to mark yourself as closed, or block specific times (future feature).

**Q: Can I sync with Google Calendar?**
A: Not yet, but calendar sync is planned for a future update.

#### Payment

**Q: How do I get paid for bookings?**
A: Payment processing integration coming soon. Currently, handle payments directly with customers.

**Q: What if a customer doesn't show up?**
A: Mark as "No Show" (future feature) and set no-show policies in Settings.

**Q: Can I offer discounts?**
A: Discount codes and promotions are planned for a future update.

### Common Issues & Troubleshooting

#### "Cannot Access Business Portal"

**Symptoms**: Redirected to signin when visiting `/business`

**Solutions**:
1. Verify you're signed in
2. Check your account role (must be Studio Owner)
3. Clear browser cookies and sign in again
4. Contact support if issue persists

#### "No Bookings Showing"

**Symptoms**: Booking list is empty when you expect bookings

**Solutions**:
1. Check filter settings (may be filtered to specific status)
2. Verify date range (may be filtered to past dates)
3. Ensure services are active
4. Check if customers have actually booked

#### "Time Slots Not Available"

**Symptoms**: Customers report no available times

**Solutions**:
1. Verify opening hours are set
2. Check if dates are too far in future (booking window)
3. Ensure services have correct duration
4. Look for existing bookings blocking times

#### "Changes Not Saving"

**Symptoms**: Form submissions don't persist

**Solutions**:
1. Check for validation errors (red text)
2. Ensure required fields are filled
3. Check internet connection
4. Try refreshing page and saving again
5. Clear browser cache

### Getting Help

#### Email Support

Email us at [support@massava.com](mailto:support@massava.com)

**Include**:
- Your studio name
- Account email
- Screenshot of issue (if applicable)
- Steps to reproduce problem

**Response Time**: Within 24 hours (weekdays)

#### Live Chat (Future)

Real-time help coming soon at `/business/support`

#### Community Forum (Future)

Connect with other studio owners:
- Share best practices
- Get advice
- Feature requests
- Success stories

### Feature Requests

Have an idea to improve the Business Portal?

**Submit Requests**:
1. Email [features@massava.com](mailto:features@massava.com)
2. Include:
   - Feature description
   - Problem it solves
   - How you'd use it

**Popular Upcoming Features**:
- Staff management and assignments
- Calendar sync (Google/Apple)
- Payment processing integration
- Customer reviews and ratings
- Advanced analytics and reporting
- Mobile app (iOS/Android)
- SMS notifications
- Multi-studio management

### Training Resources

#### Video Tutorials (Coming Soon)

- Getting Started Guide (5 minutes)
- Managing Your First Booking (3 minutes)
- Setting Up Services (4 minutes)
- Calendar Navigation (3 minutes)

#### Webinars (Coming Soon)

Monthly webinars covering:
- Best practices for studio management
- Growing your booking volume
- Customer communication tips
- Marketing your studio

### Status Updates

Check system status: [status.massava.com](https://status.massava.com)

- Uptime monitoring
- Scheduled maintenance
- Incident reports

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search (future) |
| `Ctrl/Cmd + B` | Go to bookings |
| `Ctrl/Cmd + C` | Go to calendar |
| `Ctrl/Cmd + S` | Save form |
| `Esc` | Close dialog |

### Mobile App

**Access on Phone**:
- Visit `massava.com/business` in mobile browser
- Fully responsive design
- Add to home screen for quick access

**Native Apps** (coming soon):
- iOS App Store
- Google Play Store

### Security Best Practices

- Use strong, unique password
- Enable two-factor authentication (future)
- Don't share account credentials
- Sign out on shared devices
- Review account activity regularly

### Tips for Success

1. **Check bookings daily**: Respond quickly to pending requests
2. **Keep services updated**: Add seasonal offerings
3. **Update opening hours**: Mark holidays in advance
4. **Communicate clearly**: Set expectations with customers
5. **Build your profile**: Add photos, complete bio
6. **Track patterns**: Note busy days to optimize schedule
7. **Respond promptly**: Quick confirmations improve customer experience

---

## Getting More From Massava

### Optimize Your Profile

- **Professional Photos**: High-quality images of your work
- **Complete Bio**: Tell your story and highlight expertise
- **Portfolio**: Showcase your best work
- **Reviews**: Encourage satisfied customers to leave feedback (future)

### Marketing Your Studio

- **Share Your Booking Link**: `massava.com/studio/[your-studio-id]`
- **Social Media**: Post your Massava profile link
- **Email Signature**: Include booking link
- **Business Cards**: Add QR code to profile

### Growing Your Business

- **Competitive Pricing**: Research and adjust regularly
- **Service Variety**: Offer different price points
- **Flexibility**: Consider extended hours
- **Customer Experience**: Make booking easy and clear

---

**Need More Help?**

Contact us anytime:
- Email: [support@massava.com](mailto:support@massava.com)
- Phone: +1 (555) 123-4567
- Hours: Monday-Friday, 9 AM - 6 PM EST

**Last Updated**: 2025-11-04
**Version**: 1.0.0
