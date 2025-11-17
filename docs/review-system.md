# Review System Documentation

## Overview

The review system allows customers to rate and review studios after completing a confirmed booking. Studio owners can respond to reviews, and all reviews are displayed publicly on the studio's profile.

## Features

### Customer Features
- Rate studios with 1-5 stars
- Add optional text comment (max 2000 characters)
- View all reviews for a studio
- Review eligibility checks (confirmed, past bookings only)
- One review per booking

### Studio Owner Features
- View all reviews for their studios
- Respond to customer reviews
- Responses visible to all users

### Public Features
- View aggregated studio ratings (average + total count)
- Browse all reviews for a studio
- Sort reviews (newest, highest rated, lowest rated)
- Pagination support

## Database Schema

The `Review` model in Prisma:

```prisma
model Review {
  id           String    @id @default(cuid())
  studioId     String
  userId       String
  bookingId    String    @unique
  rating       Int       // 1-5
  comment      String?   // Optional, max 2000 chars
  isVisible    Boolean   @default(true)
  response     String?   // Studio owner response
  respondedAt  DateTime?
  respondedBy  String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  booking      NewBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  studio       Studio    @relation(fields: [studioId], references: [id], onDelete: Cascade)
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([studioId, isVisible])
  @@index([studioId, createdAt])
  @@index([rating])
}
```

## API Endpoints

### POST /api/reviews
Create a new review (requires authentication).

**Request Body:**
```json
{
  "bookingId": "cm1abc...",
  "rating": 5,
  "comment": "Great experience!" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1xyz...",
    "studioId": "cm1stu...",
    "userId": "cm1usr...",
    "bookingId": "cm1abc...",
    "rating": 5,
    "comment": "Great experience!",
    "createdAt": "2025-01-17T10:00:00.000Z"
  }
}
```

**Business Rules:**
- User must be authenticated
- Booking must belong to the user
- Booking must be CONFIRMED
- Booking date must be in the past
- User can only review once per booking
- After review creation:
  - Studio's `averageRating` is recalculated
  - Studio's `totalReviews` is updated
  - Booking's `reviewRequestSent` is set to true

### GET /api/reviews?studioId={id}
Get all reviews for a studio (public endpoint).

**Query Parameters:**
- `studioId` (required): Studio ID
- `limit` (optional): Results per page (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): `newest` | `highest` | `lowest` (default: `newest`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1xyz...",
      "rating": 5,
      "comment": "Great experience!",
      "createdAt": "2025-01-17T10:00:00.000Z",
      "response": "Thank you!",
      "respondedAt": "2025-01-17T11:00:00.000Z",
      "user": {
        "id": "cm1usr...",
        "name": "John Doe",
        "image": "https://..."
      }
    }
  ],
  "meta": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/reviews/eligible?bookingId={id}
Check if user can review a booking (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": true
  }
}
```

Or with reason:
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "reason": "Booking date must be in the past"
  }
}
```

### PATCH /api/reviews/{id}/response
Studio owner responds to a review (requires authentication + studio ownership).

**Request Body:**
```json
{
  "response": "Thank you for your feedback!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1xyz...",
    "response": "Thank you for your feedback!",
    "respondedAt": "2025-01-17T11:00:00.000Z",
    "respondedBy": "cm1own..."
  }
}
```

## React Components

### StarRating
Interactive star rating input/display component.

```tsx
import { StarRating } from '@/components/reviews/StarRating';

// Input mode
<StarRating
  value={rating}
  onChange={setRating}
  size={32}
/>

// Display mode
<StarRating
  value={4.5}
  readonly
  showValue
/>
```

### CompactStarRating
Compact version for cards/lists.

```tsx
import { CompactStarRating } from '@/components/reviews/StarRating';

<CompactStarRating
  rating={4.7}
  totalReviews={2081}
/>
```

### StudioRating
Aggregated studio rating display.

```tsx
import { StudioRating } from '@/components/reviews/StudioRating';

<StudioRating
  rating={4.7}
  totalReviews={2081}
  variant="default"
  onClick={scrollToReviews}
/>
```

### ReviewCard
Display a single review.

```tsx
import { ReviewCard } from '@/components/reviews/ReviewCard';

<ReviewCard review={review} />
```

### ReviewsList
Paginated list of reviews with sorting.

```tsx
import { ReviewsList } from '@/components/reviews/ReviewsList';

<ReviewsList studioId={studio.id} />
```

### ReviewSubmitForm
Form to submit a new review.

```tsx
import { ReviewSubmitForm } from '@/components/reviews/ReviewSubmitForm';

<ReviewSubmitForm
  bookingId={booking.id}
  studioName={studio.name}
  onSuccess={() => router.refresh()}
/>
```

## Integration Points

### SearchResults Component
Updated to show studio ratings under studio name:

```tsx
<StudioRating
  rating={result.averageRating}
  totalReviews={result.totalReviews}
  variant="compact"
  onClick={() => handleViewStudio(result)}
/>
```

### StudioViewPopup Component
Updated to include:
1. Rating under studio name (clickable to scroll to reviews)
2. Reviews section at bottom with `ReviewsList` component

### Customer Bookings Page
Updated to show:
1. "Review" button on past confirmed bookings (if no review yet)
2. Review status indicator (if review already submitted)
3. Review dialog for submitting reviews

## Validation

All validation is handled via Zod schemas in `/lib/schemas/review.schema.ts`:

### createReviewSchema
```typescript
{
  bookingId: string (cuid),
  rating: number (1-5),
  comment?: string (max 2000 chars)
}
```

### createReviewResponseSchema
```typescript
{
  reviewId: string (cuid),
  response: string (1-1000 chars)
}
```

### reviewListQuerySchema
```typescript
{
  studioId: string (cuid),
  limit?: number (1-100, default 10),
  offset?: number (min 0, default 0),
  sortBy?: 'newest' | 'highest' | 'lowest' (default 'newest')
}
```

## Database Queries

All database operations are in `/lib/db/review.queries.ts`:

- `checkReviewEligibility(bookingId, userId)` - Check if user can review
- `createReview(data)` - Create review + update studio stats
- `getStudioReviews(params)` - Get paginated reviews
- `addReviewResponse(reviewId, response, respondedBy)` - Add studio response
- `getReviewById(reviewId)` - Get single review
- `checkStudioOwnership(reviewId, userId)` - Check if user owns studio

## Testing

### Unit Tests
Test validation schemas, database queries, and component logic.

```bash
npm run test:unit -- review
```

### Integration Tests
Test API endpoints with actual database.

```bash
npm run test:integration -- api/reviews
```

### E2E Tests
Test user flows (submit review, view reviews, etc).

```bash
npm run test:e2e -- reviews
```

## Security

### Authentication
- Review creation requires authenticated user
- Response creation requires studio owner authentication

### Authorization
- Users can only review their own bookings
- Studio owners can only respond to reviews for their studios

### Validation
- All inputs validated with Zod schemas
- Server-side validation on all API routes
- Client-side validation in forms

### Data Integrity
- One review per booking (unique constraint)
- Reviews cascade delete with bookings
- Transaction-based rating updates

## Performance

### Indexing
```sql
-- Key indexes
CREATE INDEX idx_reviews_studio_visible ON reviews(studioId, isVisible);
CREATE INDEX idx_reviews_studio_created ON reviews(studioId, createdAt);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### Caching
- Studio rating aggregates stored in `studios` table
- Recalculated on each review creation/update
- Consider adding Redis cache for high-traffic studios

### Pagination
- Default limit: 10 reviews
- Max limit: 100 reviews
- Offset-based pagination

## Future Enhancements

### Phase 2
- [ ] Review photos/videos
- [ ] Helpful/unhelpful voting
- [ ] Report inappropriate reviews
- [ ] Edit reviews (within 24 hours)
- [ ] Review reminders (email/push)

### Phase 3
- [ ] Review analytics for studios
- [ ] Sentiment analysis
- [ ] Review verification badges
- [ ] Featured reviews
- [ ] Review templates/prompts

## Troubleshooting

### Review not appearing
- Check `isVisible` flag in database
- Verify studio ID matches
- Check user is authenticated

### Cannot submit review
- Verify booking is CONFIRMED
- Check booking date is in past
- Ensure no review exists for booking
- Check user owns the booking

### Rating not updating
- Check transaction completed successfully
- Verify visible reviews count
- Recalculate manually if needed:
  ```sql
  UPDATE studios
  SET averageRating = (
    SELECT AVG(rating) FROM reviews WHERE studioId = 'xxx' AND isVisible = true
  ),
  totalReviews = (
    SELECT COUNT(*) FROM reviews WHERE studioId = 'xxx' AND isVisible = true
  )
  WHERE id = 'xxx';
  ```

## Contact

For questions or issues, contact the development team or create an issue in the repository.
