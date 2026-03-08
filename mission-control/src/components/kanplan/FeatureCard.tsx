/**
 * Feature Card Component
 *
 * Displays a single feature/job in the KanPlan
 */

'use client';

import { cn } from '@/lib/utils';
import { Clock, User, Tag, AlertTriangle } from 'lucide-react';
import type { KanPlanFeature } from '@/store/kanplanStore';

interface FeatureCardProps {
  feature: KanPlanFeature;
  onClick?: (feature: KanPlanFeature) => void;
  compact?: boolean;
}

const priorityColors = {
  critical: 'text-red-400 bg-red-900/20 border-red-800',
  high: 'text-orange-400 bg-orange-900/20 border-orange-800',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800',
  low: 'text-gray-400 bg-gray-800/50 border-gray-700',
};

export function FeatureCard({ feature, onClick, compact = false }: FeatureCardProps) {
  const isOverdue = feature.estimatedMinutes && feature.actualMinutes &&
    feature.actualMinutes > feature.estimatedMinutes;

  return (
    <div
      onClick={() => onClick?.(feature)}
      className={cn(
        'bg-gray-900 rounded-lg border border-gray-800 p-3 cursor-pointer',
        'hover:border-gray-700 hover:shadow-md transition-all',
        compact ? 'text-xs' : 'text-sm'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={cn(
          'font-medium text-gray-100 leading-tight',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {feature.title}
        </h4>
        {feature.priority === 'critical' && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      {feature.description && !compact && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {feature.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Time */}
        {(feature.estimatedMinutes || feature.actualMinutes) && (
          <div className={cn(
            'flex items-center gap-1',
            isOverdue && 'text-red-400'
          )}>
            <Clock className="w-3 h-3" />
            <span>
              {feature.actualMinutes || 0}/{feature.estimatedMinutes || '?'}m
            </span>
          </div>
        )}

        {/* Assignee */}
        {feature.assignedAgentId && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[60px]">{feature.assignedAgentId}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {feature.tags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-2">
          {feature.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
          {feature.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{feature.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Priority Badge */}
      <div className="mt-2">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full border',
          priorityColors[feature.priority]
        )}>
          {feature.priority}
        </span>
      </div>
    </div>
  );
}
