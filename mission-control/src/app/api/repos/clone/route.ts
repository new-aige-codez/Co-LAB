/**
 * Clone Repo API Route
 *
 * POST: Clone a new repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloneRepo, isValidGitUrl } from '@/lib/git';
import { z } from 'zod';

const cloneSchema = z.object({
  url: z.string().min(1),
  branch: z.string().optional(),
  depth: z.number().min(1).max(100).optional(),
});

// POST /api/repos/clone - Clone a repository
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = cloneSchema.parse(body);

    // Validate URL
    if (!isValidGitUrl(validated.url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid git URL format' },
        { status: 400 }
      );
    }

    // Clone the repo
    const result = await cloneRepo(validated.url, {
      branch: validated.branch,
      depth: validated.depth,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        repo: result.repo,
        context: result.context,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error cloning repo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clone repository' },
      { status: 500 }
    );
  }
}
