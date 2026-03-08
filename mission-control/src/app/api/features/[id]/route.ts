/**
 * Feature by ID API Route
 *
 * GET: Get a single feature
 * PATCH: Update a feature
 * DELETE: Delete a feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { features } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Feature status type from schema
type FeatureStatus = typeof features.$inferSelect.status;
type FeaturePriority = typeof features.$inferSelect.priority;

// Validation schema for updating a feature
const updateFeatureSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum([
    'inbox',
    'awaiting_deep_research',
    'research',
    'deep_research_received',
    'developing',
    'failed',
    'testing',
    'in_review',
    'completed',
    'approved',
    'ready_for_review',
    'done',
    'paused',
    'deferred',
  ]).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional().nullable(),
  researchContext: z.string().optional().nullable(),
  deepResearchResult: z.string().optional().nullable(),
  attemptCount: z.number().optional(),
  maxAttempts: z.number().optional(),
});

// GET /api/features/[id] - Get a single feature
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [feature] = await db
      .select()
      .from(features)
      .where(eq(features.id, id))
      .limit(1);

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}

// PATCH /api/features/[id] - Update a feature
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateFeatureSchema.parse(body);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.status !== undefined) {
      updateData.status = validated.status;
      // If status is 'done', set completedAt
      if (validated.status === 'done') {
        updateData.completedAt = new Date();
      }
    }
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.assignedTo !== undefined) updateData.assignedTo = validated.assignedTo;
    if (validated.researchContext !== undefined) updateData.researchContext = validated.researchContext;
    if (validated.deepResearchResult !== undefined) updateData.deepResearchResult = validated.deepResearchResult;
    if (validated.attemptCount !== undefined) updateData.attemptCount = validated.attemptCount;
    if (validated.maxAttempts !== undefined) updateData.maxAttempts = validated.maxAttempts;

    const [updatedFeature] = await db
      .update(features)
      .set(updateData)
      .where(eq(features.id, id))
      .returning();

    if (!updatedFeature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedFeature,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}

// DELETE /api/features/[id] - Delete a feature
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedFeature] = await db
      .delete(features)
      .where(eq(features.id, id))
      .returning();

    if (!deletedFeature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedFeature,
    });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feature' },
      { status: 500 }
    );
  }
}
