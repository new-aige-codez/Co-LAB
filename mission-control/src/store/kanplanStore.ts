/**
 * KanPlan Store
 *
 * Manages KanPlan view state (expanded/collapsed, filters)
 * Feature data comes from the database via API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeatureStatus } from './agentStore';

// ============================================================================
// Types
// ============================================================================

export interface KanPlanFeature {
  id: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  projectId: string | null;
  assignedAgentId: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  tags: string[];
}

export type KanPlanViewMode = 'simplified' | 'expanded';

interface KanPlanState {
  // View state
  viewMode: KanPlanViewMode;

  // Filters
  selectedProjectId: string | null;
  showCompleted: boolean;

  // Actions
  setViewMode: (mode: KanPlanViewMode) => void;
  toggleViewMode: () => void;
  setSelectedProject: (projectId: string | null) => void;
  setShowCompleted: (show: boolean) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useKanPlanStore = create<KanPlanState>()(
  persist(
    (set) => ({
      viewMode: 'simplified',
      selectedProjectId: null,
      showCompleted: true,

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'simplified' ? 'expanded' : 'simplified',
        })),

      setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),

      setShowCompleted: (show) => set({ showCompleted: show }),
    }),
    {
      name: 'colab-kanplan-store',
    }
  )
);

// ============================================================================
// Bucket Configuration
// ============================================================================

export interface BucketConfig {
  id: string;
  label: string;
  icon?: string;
  statuses: FeatureStatus[];
  subcategories?: SubcategoryConfig[];
}

export interface SubcategoryConfig {
  id: string;
  label: string;
  statuses: FeatureStatus[];
}

// Simplified View Buckets (3 buckets)
export const SIMPLIFIED_BUCKETS: BucketConfig[] = [
  {
    id: 'up_next',
    label: 'Up Next',
    statuses: ['inbox', 'awaiting_deep_research'],
  },
  {
    id: 'active',
    label: 'Active',
    statuses: ['research', 'deep_research_received', 'developing', 'failed', 'testing', 'in_review'],
  },
  {
    id: 'complete',
    label: 'Complete',
    statuses: ['done', 'approved', 'ready_for_review', 'completed'],
  },
];

// Expanded View - Inactive Buckets
export const INACTIVE_BUCKETS: BucketConfig[] = [
  {
    id: 'back_burner',
    label: 'Back-Burner',
    statuses: ['paused', 'deferred'],
  },
  {
    id: 'in_queue',
    label: 'In Queue',
    statuses: ['inbox', 'awaiting_deep_research'],
  },
];

// Expanded View - Active Buckets
export const ACTIVE_BUCKETS: BucketConfig[] = [
  {
    id: 'research',
    label: 'Research',
    icon: '🔬',
    statuses: ['research', 'awaiting_deep_research', 'deep_research_received'],
    subcategories: [
      { id: 'codebase', label: 'Codebase', statuses: ['research'] },
      { id: 'deep', label: 'Deep', statuses: ['awaiting_deep_research', 'deep_research_received'] },
    ],
  },
  {
    id: 'development',
    label: 'Development',
    icon: '⚡',
    statuses: ['developing'],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: '🐛',
    statuses: ['failed'],
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: '🧪',
    statuses: ['testing', 'in_review', 'completed'],
    subcategories: [
      { id: 'bot', label: 'Bot', statuses: ['in_review'] },
      { id: 'human', label: 'Human', statuses: ['completed'] },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    icon: '✅',
    statuses: ['approved', 'ready_for_review'],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getBucketForStatus(status: FeatureStatus, viewMode: KanPlanViewMode): string {
  if (viewMode === 'simplified') {
    for (const bucket of SIMPLIFIED_BUCKETS) {
      if (bucket.statuses.includes(status)) {
        return bucket.id;
      }
    }
    return 'up_next';
  }

  // Expanded view - check inactive first
  for (const bucket of INACTIVE_BUCKETS) {
    if (bucket.statuses.includes(status)) {
      return bucket.id;
    }
  }

  // Then check active
  for (const bucket of ACTIVE_BUCKETS) {
    if (bucket.statuses.includes(status)) {
      return bucket.id;
    }
  }

  return 'in_queue';
}

export function groupFeaturesByBucket(
  features: KanPlanFeature[],
  viewMode: KanPlanViewMode
): Record<string, KanPlanFeature[]> {
  const buckets =
    viewMode === 'simplified'
      ? SIMPLIFIED_BUCKETS
      : [...INACTIVE_BUCKETS, ...ACTIVE_BUCKETS];

  const grouped: Record<string, KanPlanFeature[]> = {};

  for (const bucket of buckets) {
    grouped[bucket.id] = features.filter((f) => bucket.statuses.includes(f.status));
  }

  return grouped;
}

// ============================================================================
// Hooks
// ============================================================================

export function useKanPlanViewMode(): KanPlanViewMode {
  return useKanPlanStore((state) => state.viewMode);
}

export function useKanPlanFilters() {
  return useKanPlanStore((state) => ({
    selectedProjectId: state.selectedProjectId,
    showCompleted: state.showCompleted,
  }));
}
