/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a new review
 */
export const createReviewSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment must be at most 2000 characters').optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Schema for studio owner response to a review
 */
export const createReviewResponseSchema = z.object({
  reviewId: z.string().cuid('Invalid review ID'),
  response: z.string().min(1, 'Response cannot be empty').max(1000, 'Response must be at most 1000 characters'),
});

export type CreateReviewResponseInput = z.infer<typeof createReviewResponseSchema>;

/**
 * Schema for review list query parameters
 */
export const reviewListQuerySchema = z.object({
  studioId: z.string().cuid('Invalid studio ID'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['newest', 'highest', 'lowest']).default('newest'),
});

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

/**
 * Schema for checking review eligibility
 */
export const checkEligibilitySchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
});

export type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>;
