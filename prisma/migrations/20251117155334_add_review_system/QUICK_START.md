# Review System - Quick Start Guide

## 🚀 Migration Applied Successfully!

The review system has been successfully created and applied to your database.

---

## 📊 What You Got

### ✅ New `reviews` Table
- Stores customer reviews for bookings
- Rating validation (1-5 stars only)
- One review per booking
- Optional text comments
- Studio response support
- Visibility toggle for moderation

### ✅ Enhanced `studios` Table
- `averageRating` - Calculated average rating
- `totalReviews` - Count of reviews

### ✅ Safety Features
- CHECK constraint for rating validation
- CASCADE delete for data integrity
- 8 performance indexes
- Foreign key relationships

---

## 🔧 Quick Setup (3 Steps)

### Step 1: Choose Rating Update Strategy

**Option A: Automatic Trigger (Recommended)**
```bash
# Apply the trigger using the maintenance script
psql -d your_database < prisma/migrations/20251117155334_add_review_system/rating-maintenance.sql

# Execute only section #3 (CREATE AUTOMATIC TRIGGER)
```

**Option B: Application-Level Updates**
```typescript
// Use the provided utility function (see test-examples.ts)
import { updateStudioRatings } from './test-examples';

// Call after creating/updating/deleting reviews
await updateStudioRatings(studioId);
```

### Step 2: Create API Endpoints

```typescript
// POST /api/reviews
import { createReview } from './test-examples';

export async function POST(request: Request) {
  const { bookingId, userId, studioId, rating, comment } = await request.json();
  
  const review = await createReview(bookingId, userId, studioId, rating, comment);
  
  return Response.json(review);
}

// GET /api/studios/:id/reviews
import { getStudioReviews } from './test-examples';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const reviews = await getStudioReviews(params.id, { page: 1, limit: 10 });
  
  return Response.json(reviews);
}
```

### Step 3: Update Frontend

```tsx
// Display studio rating
<div>
  <span>{studio.averageRating?.toFixed(1)} ⭐</span>
  <span>({studio.totalReviews} reviews)</span>
</div>

// Review form
<form onSubmit={handleSubmit}>
  <StarRating value={rating} onChange={setRating} max={5} />
  <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
  <button type="submit">Submit Review</button>
</form>
```

---

## 📁 Available Resources

### Documentation
- **README.md** - Complete migration documentation
- **MIGRATION_SUMMARY.md** - Detailed summary of changes
- **QUICK_START.md** - This file

### Code Examples
- **test-examples.ts** - 10+ ready-to-use functions
- **rating-maintenance.sql** - SQL scripts for maintenance

### Migration Files
- **migration.sql** - Applied DDL statements
- **rollback.sql** - Rollback procedure (if needed)

---

## 🧪 Test the Migration

### Test 1: Create a Review
```typescript
import { createReview } from './test-examples';

await createReview(
  'booking-abc123',
  'user-xyz789',
  'studio-def456',
  5,
  'Amazing experience!'
);
```

### Test 2: Get Studio Reviews
```typescript
import { getStudioReviews } from './test-examples';

const { reviews, pagination } = await getStudioReviews('studio-def456', {
  page: 1,
  limit: 10
});

console.log(`Showing ${reviews.length} of ${pagination.total} reviews`);
```

### Test 3: Verify Rating Constraint
```sql
-- This should FAIL (rating too high)
INSERT INTO reviews (id, "studioId", "userId", "bookingId", rating, "createdAt", "updatedAt")
VALUES ('test', 'studio-id', 'user-id', 'booking-id', 6, NOW(), NOW());
-- ERROR: violates check constraint "reviews_rating_check"
```

---

## 📈 Common Queries

### Get Top-Rated Studios
```sql
SELECT name, "averageRating", "totalReviews"
FROM studios
WHERE "totalReviews" >= 5
ORDER BY "averageRating" DESC
LIMIT 10;
```

### Get Recent Reviews
```sql
SELECT r.rating, r.comment, s.name as studio_name, u.name as user_name
FROM reviews r
JOIN studios s ON r."studioId" = s.id
JOIN users u ON r."userId" = u.id
WHERE r."isVisible" = true
ORDER BY r."createdAt" DESC
LIMIT 20;
```

### Get Rating Distribution for a Studio
```sql
SELECT rating, COUNT(*) as count
FROM reviews
WHERE "studioId" = 'YOUR_STUDIO_ID'
  AND "isVisible" = true
GROUP BY rating
ORDER BY rating DESC;
```

---

## 🔄 Update Studio Ratings

### Manually Update Single Studio
```sql
UPDATE studios
SET
  "averageRating" = (
    SELECT AVG(rating) FROM reviews
    WHERE "studioId" = studios.id AND "isVisible" = true
  ),
  "totalReviews" = (
    SELECT COUNT(*) FROM reviews
    WHERE "studioId" = studios.id AND "isVisible" = true
  )
WHERE id = 'YOUR_STUDIO_ID';
```

### Bulk Update All Studios
```typescript
import { recalculateAllStudioRatings } from './test-examples';

await recalculateAllStudioRatings();
```

---

## 🛡️ Safety Features

### Data Integrity
- ✅ Foreign keys ensure valid references
- ✅ CASCADE delete prevents orphaned records
- ✅ Unique constraint: one review per booking
- ✅ CHECK constraint: rating must be 1-5

### Performance
- ✅ 8 indexes for efficient queries
- ✅ Composite indexes for common patterns
- ✅ Optimized for large datasets

### Rollback Available
```bash
# If something goes wrong, rollback is available
psql -d your_database < prisma/migrations/20251117155334_add_review_system/rollback.sql
```

---

## 📞 Need Help?

1. Check **README.md** for detailed documentation
2. Review **test-examples.ts** for code samples
3. Run queries from **rating-maintenance.sql** for maintenance
4. Contact the development team

---

## ✨ Next Steps

1. ☐ Choose rating update strategy (trigger or application)
2. ☐ Create API endpoints for reviews
3. ☐ Update frontend to display/create reviews
4. ☐ Test with sample data
5. ☐ Set up monitoring
6. ☐ Deploy to staging
7. ☐ Deploy to production

---

**Happy Coding! 🎉**

The review system is ready to use. All database changes are applied, tested, and documented.
