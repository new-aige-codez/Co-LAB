/**
 * KanPlan View Component
 *
 * Main container that switches between Simplified and Expanded views
 */

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Maximize2, Minimize2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimplifiedView } from './SimplifiedView';
import { ExpandedView } from './ExpandedView';
import {
  useKanPlanStore,
  type KanPlanFeature,
} from '@/store/kanplanStore';

interface KanPlanViewProps {
  features?: KanPlanFeature[];
  onRefresh?: () => void;
  className?: string;
}

// Sample data for development
const SAMPLE_FEATURES: KanPlanFeature[] = [
  {
    id: 'feat_1',
    title: 'User Authentication Flow',
    description: 'Implement login, register, and password reset',
    status: 'developing',
    priority: 'high',
    projectId: null,
    assignedAgentId: 'coding-dev',
    estimatedMinutes: 240,
    actualMinutes: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['auth', 'security'],
  },
  {
    id: 'feat_2',
    title: 'Research: Best practices for WebSocket',
    description: 'Find optimal WebSocket library for Oracle Cloud',
    status: 'research',
    priority: 'medium',
    projectId: null,
    assignedAgentId: 'web-research',
    estimatedMinutes: 60,
    actualMinutes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['research', 'websocket'],
  },
  {
    id: 'feat_3',
    title: 'Fix: Memory leak in agent daemon',
    description: 'Daemon memory usage grows over time',
    status: 'failed',
    priority: 'critical',
    projectId: null,
    assignedAgentId: 'debugging',
    estimatedMinutes: 90,
    actualMinutes: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['bug', 'daemon'],
  },
  {
    id: 'feat_4',
    title: 'E2E Tests for KanPlan',
    description: 'Write Playwright tests for KanPlan component',
    status: 'testing',
    priority: 'medium',
    projectId: null,
    assignedAgentId: 'testing',
    estimatedMinutes: 120,
    actualMinutes: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['testing', 'e2e'],
  },
  {
    id: 'feat_5',
    title: 'PR Review: Feature flags system',
    description: 'Review and merge feature flags implementation',
    status: 'in_review',
    priority: 'high',
    projectId: null,
    assignedAgentId: 'coding-dev',
    estimatedMinutes: 30,
    actualMinutes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['review', 'feature-flags'],
  },
  {
    id: 'feat_6',
    title: 'Analytics Dashboard',
    description: 'Build dashboard for usage analytics',
    status: 'inbox',
    priority: 'low',
    projectId: null,
    assignedAgentId: null,
    estimatedMinutes: null,
    actualMinutes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['analytics', 'dashboard'],
  },
  {
    id: 'feat_7',
    title: 'Database Migration Tool',
    description: 'Completed migration from JSON to SQLite',
    status: 'done',
    priority: 'high',
    projectId: null,
    assignedAgentId: 'coding-dev',
    estimatedMinutes: 180,
    actualMinutes: 150,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    tags: ['database', 'migration'],
  },
  {
    id: 'feat_8',
    title: 'Documentation: API Endpoints',
    description: 'Write API documentation',
    status: 'paused',
    priority: 'low',
    projectId: null,
    assignedAgentId: 'researcher',
    estimatedMinutes: 120,
    actualMinutes: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    tags: ['docs', 'api'],
  },
];

export function KanPlanView({
  features: externalFeatures,
  onRefresh,
  className,
}: KanPlanViewProps) {
  const { viewMode, toggleViewMode } = useKanPlanStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<KanPlanFeature | null>(null);

  // Use external features or sample data
  const features = externalFeatures || SAMPLE_FEATURES;

  const handleRefresh = async () => {
    setIsLoading(true);
    await onRefresh?.();
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleFeatureClick = (feature: KanPlanFeature) => {
    setSelectedFeature(feature);
    // Could open a modal or navigate to feature detail
    console.log('Feature clicked:', feature);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">KanPlan</h1>
          <p className="text-sm text-gray-500 mt-1">
            {features.length} items total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-colors"
            title={viewMode === 'simplified' ? 'Expand view' : 'Collapse view'}
          >
            {viewMode === 'simplified' ? (
              <>
                <Maximize2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Expand</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Collapse</span>
              </>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'simplified' ? (
          <SimplifiedView features={features} onFeatureClick={handleFeatureClick} />
        ) : (
          <ExpandedView features={features} onFeatureClick={handleFeatureClick} />
        )}
      </div>
    </div>
  );
}
