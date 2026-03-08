/**
 * Repos API Route
 *
 * GET: List all cloned repositories
 */

import { NextResponse } from 'next/server';
import { listClonedRepos, getRepoStatus } from '@/lib/git';

// GET /api/repos - List all cloned repositories
export async function GET() {
  try {
    const repoNames = listClonedRepos();

    const repos = repoNames.map(name => {
      const status = getRepoStatus(name);
      return {
        name,
        ...status,
      };
    });

    return NextResponse.json({
      success: true,
      data: repos,
    });
  } catch (error) {
    console.error('Error listing repos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list repositories' },
      { status: 500 }
    );
  }
}
