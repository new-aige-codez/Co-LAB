/**
 * Bucket Component
 *
 * Displays a single KanPlan bucket with features
 */

'use client';

import { cn } from '@/lib/utils';
import { FeatureCard } from './FeatureCard';
import type { KanPlanFeature, BucketConfig } from '@/store/kanplanStore';

interface BucketProps {
  config: BucketConfig;
  features: KanPlanFeature[];
  onFeatureClick?: (feature: KanPlanFeature) => void;
  compact?: boolean;
  className?: string;
}

export function Bucket({
  config,
  features,
  onFeatureClick,
  compact = false,
  className,
}: BucketProps) {
  const count = features.length;

  return (
    <div
      className={cn(
        'flex flex-col bg-gray-950 rounded-xl border border-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            {config.icon && <span>{config.icon}</span>}
            <span>{config.label}</span>
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 overflow-y-auto',
        compact ? 'p-2 space-y-2' : 'p-3 space-y-3'
      )}>
        {features.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-xs">
            No items
          </div>
        ) : (
          features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onClick={onFeatureClick}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SubcategoryColumnProps {
  label: string;
  features: KanPlanFeature[];
  onFeatureClick?: (feature: KanPlanFeature) => void;
}

export function SubcategoryColumn({
  label,
  features,
  onFeatureClick,
}: SubcategoryColumnProps) {
  return (
    <div className="flex flex-col min-w-[180px]">
      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
        <span className="ml-2 text-gray-600">({features.length})</span>
      </div>
      <div className="flex-1 space-y-2">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onClick={onFeatureClick}
            compact
          />
        ))}
      </div>
    </div>
  );
}
