/**
 * Features API Route
 *
 * GET: List all features
 * POST: Create a new feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { features } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

// Feature status type from schema
type FeatureStatus = typeof features.$inferSelect.status;
type FeaturePriority = typeof features.$inferSelect.priority;

// Validation schema for creating a feature
const createFeatureSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  projectId: z.string().min(1),
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
});

// GET /api/features - List all features
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    let query = db.select().from(features);

    // Apply filters
    const conditions = [];
    if (projectId) {
      conditions.push(eq(features.projectId, projectId));
    }
    if (status) {
      conditions.push(eq(features.status, status as FeatureStatus));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query.orderBy(desc(features.updatedAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

// POST /api/features - Create a new feature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createFeatureSchema.parse(body);

    // Get next feature number for the project
    const existingFeatures = await db
      .select({ number: features.number })
      .from(features)
      .where(eq(features.projectId, validated.projectId))
      .orderBy(desc(features.number))
      .limit(1);

    const nextNumber = existingFeatures.length > 0 ? existingFeatures[0].number + 1 : 1;

    const now = new Date();
    const [newFeature] = await db.insert(features).values({
      id: `feat_${Date.now()}`,
      projectId: validated.projectId,
      number: nextNumber,
      name: validated.name,
      description: validated.description || null,
      status: (validated.status || 'inbox') as FeatureStatus,
      priority: (validated.priority || 'medium') as FeaturePriority,
      assignedTo: validated.assignedTo || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newFeature,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}
