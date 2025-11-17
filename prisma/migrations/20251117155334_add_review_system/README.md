# Migration: Add Review System

**Migration ID:** 20251117155334_add_review_system
**Date:** 2025-11-17
**Type:** Schema Addition
**Risk Level:** LOW (No data modification, only additions)

## Overview

This migration introduces a comprehensive review system for the Massava platform, allowing customers to leave reviews for studios after completing bookings.

## Changes Made

### 1. New `reviews` Table

Creates a new table to store customer reviews with the following fields:

- `id`: Unique identifier (TEXT, Primary Key)
- `studioId`: Reference to the studio being reviewed (Foreign Key → studios.id)
- `userId`: Reference to the user leaving the review (Foreign Key → users.id)
- `bookingId`: Reference to the completed booking (Foreign Key → new_bookings.id, UNIQUE)
- `rating`: Rating from 1-5 (INTEGER, with CHECK constraint)
- `comment`: Optional text review (TEXT, nullable)
- `isVisible`: Whether the review is publicly visible (BOOLEAN, default: true)
- `response`: Optional studio response (TEXT, nullable)
- `respondedAt`: Timestamp of studio response (TIMESTAMP, nullable)
- `respondedBy`: ID of user who responded (TEXT, nullable)
- `createdAt`: Review creation timestamp (TIMESTAMP, default: NOW)
- `updatedAt`: Last update timestamp (TIMESTAMP, auto-updated)

### 2. Studio Table Enhancements

Adds aggregation fields to the `studios` table:

- `averageRating`: Calculated average rating (DOUBLE PRECISION, nullable)
- `totalReviews`: Count of reviews (INTEGER, default: 0)

### 3. Constraints

- **Rating Validation**: `CHECK (rating >= 1 AND rating <= 5)`
- **One Review Per Booking**: Unique constraint on `bookingId`
- **Cascade Deletes**: Reviews are deleted when parent records (booking, studio, or user) are deleted

### 4. Performance Indexes

#### Single Column Indexes
- `reviews.studioId` - For studio-specific queries
- `reviews.userId` - For user review history
- `reviews.bookingId` - For booking-review lookup
- `reviews.rating` - For rating-based filtering

#### Composite Indexes
- `(studioId, isVisible)` - For fetching visible reviews by studio
- `(studioId, createdAt)` - For chronologically ordered studio reviews
- `studios.averageRating` - For sorting studios by rating

## Safety Features

### Zero-Downtime Deployment
- All new fields use defaults or are nullable
- No data modification required
- Backward compatible with existing code

### Data Integrity
- Foreign key constraints ensure referential integrity
- CASCADE deletes prevent orphaned records
- CHECK constraint ensures rating validity (1-5)

### Rollback Support
- Complete rollback script included (`rollback.sql`)
- All objects created by this migration can be cleanly removed
- No existing data is modified

## Applying the Migration

### Development
```bash
npx prisma migrate dev
```

### Production
```bash
# 1. Backup database first
pg_dump massava_production > backup_before_reviews_$(date +%Y%m%d).sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status
```

## Rollback Procedure

If you need to rollback this migration:

```bash
# Option 1: Use the rollback script
psql -d massava_production < prisma/migrations/20251117155334_add_review_system/rollback.sql

# Option 2: Use Prisma migrate resolve
npx prisma migrate resolve --rolled-back 20251117155334_add_review_system

# Then update your schema.prisma to remove Review model and studio rating fields
```

**WARNING:** Rollback will permanently delete all review data!

## Post-Migration Tasks

### 1. Implement Rating Aggregation Logic

You'll need to create application logic or database triggers to maintain `averageRating` and `totalReviews`:

```typescript
async function updateStudioRatings(studioId: string) {
  const stats = await prisma.review.aggregate({
    where: { studioId, isVisible: true },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.studio.update({
    where: { id: studioId },
    data: {
      averageRating: stats._avg.rating || null,
      totalReviews: stats._count,
    },
  });
}
```

### 2. Create Review API Endpoints

- `POST /api/studios/:studioId/reviews` - Create review (authenticated)
- `GET /api/studios/:studioId/reviews` - List reviews (public)
- `PATCH /api/reviews/:reviewId/response` - Add studio response (studio owner only)
- `PATCH /api/reviews/:reviewId/visibility` - Toggle visibility (admin only)

### 3. Update Booking Flow

- Send review request emails after booking completion
- Add review form in customer portal
- Validate that booking is completed before allowing review

### 4. Testing

```typescript
// Test rating constraint
describe('Review Rating Validation', () => {
  it('should accept ratings between 1-5', async () => {
    const review = await prisma.review.create({
      data: {
        studioId: 'studio-1',
        userId: 'user-1',
        bookingId: 'booking-1',
        rating: 5,
      },
    });
    expect(review.rating).toBe(5);
  });

  it('should reject ratings outside 1-5 range', async () => {
    await expect(
      prisma.review.create({
        data: {
          studioId: 'studio-1',
          userId: 'user-1',
          bookingId: 'booking-2',
          rating: 6, // Invalid
        },
      })
    ).rejects.toThrow();
  });
});
```

## Monitoring

After deployment, monitor:

1. **Query Performance**: Check slow query logs for review-related queries
2. **Index Usage**: Verify indexes are being utilized
   ```sql
   SELECT * FROM pg_stat_user_indexes WHERE relname = 'reviews';
   ```
3. **Data Growth**: Monitor reviews table size
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('reviews'));
   ```

## Schema Diagram

```
┌─────────────────┐
│     studios     │
│─────────────────│
│ id (PK)         │
│ name            │
│ averageRating ← │ (New)
│ totalReviews  ← │ (New)
└─────────────────┘
         ↑
         │
         │ studioId (FK)
         │
┌─────────────────┐       ┌─────────────────┐
│     reviews     │       │   new_bookings  │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ studioId (FK)   │       │ customerId      │
│ userId (FK)     │       │ status          │
│ bookingId (FK) ─┼──────→│ preferredDate   │
│ rating [1-5]    │       └─────────────────┘
│ comment         │               ↑
│ isVisible       │               │
│ response        │               │ customerId (FK)
│ respondedAt     │               │
│ respondedBy     │       ┌─────────────────┐
│ createdAt       │       │      users      │
│ updatedAt       │       │─────────────────│
└─────────────────┘       │ id (PK)         │
         │                │ email           │
         │                │ name            │
         └────────────────┴─────────────────┘
                  userId (FK)
```

## Support

For issues or questions about this migration:
1. Check migration status: `npx prisma migrate status`
2. Review migration logs
3. Contact the development team

---

**Author:** Migration Tool
**Reviewed By:** [Pending]
**Applied To Production:** [Pending]
