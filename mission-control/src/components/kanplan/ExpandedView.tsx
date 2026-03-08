/**
 * Expanded View Component
 *
 * Detailed KanPlan view with:
 * - Back-Burner, In Queue (inactive buckets)
 * - ACTIVE header with Research, Development, Diagnostics, Testing, Review
 */

'use client';

import { cn } from '@/lib/utils';
import { Bucket, SubcategoryColumn } from './Bucket';
import {
  INACTIVE_BUCKETS,
  ACTIVE_BUCKETS,
  type KanPlanFeature,
  type SubcategoryConfig,
} from '@/store/kanplanStore';

interface ExpandedViewProps {
  features: KanPlanFeature[];
  onFeatureClick?: (feature: KanPlanFeature) => void;
}

function filterByStatuses(features: KanPlanFeature[], statuses: string[]): KanPlanFeature[] {
  return features.filter((f) => statuses.includes(f.status));
}

function ActiveBucket({
  config,
  features,
  onFeatureClick,
}: {
  config: typeof ACTIVE_BUCKETS[0];
  features: KanPlanFeature[];
  onFeatureClick?: (feature: KanPlanFeature) => void;
}) {
  const bucketFeatures = filterByStatuses(features, config.statuses);

  return (
    <div className="flex flex-col bg-gray-900/50 rounded-xl border border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            {config.icon && <span>{config.icon}</span>}
            <span>{config.label}</span>
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {bucketFeatures.length}
          </span>
        </div>
      </div>

      {/* Content - with or without subcategories */}
      <div className="flex-1 p-3">
        {config.subcategories ? (
          <div className="flex gap-4 overflow-x-auto">
            {config.subcategories.map((sub) => (
              <SubcategoryColumn
                key={sub.id}
                label={sub.label}
                features={filterByStatuses(features, sub.statuses)}
                onFeatureClick={onFeatureClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {bucketFeatures.map((feature) => (
              <div
                key={feature.id}
                onClick={() => onFeatureClick?.(feature)}
                className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-100 text-sm">{feature.title}</div>
                {feature.description && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {feature.description}
                  </div>
                )}
              </div>
            ))}
            {bucketFeatures.length === 0 && (
              <div className="text-center py-4 text-gray-600 text-xs">No items</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ExpandedView({ features, onFeatureClick }: ExpandedViewProps) {
  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Inactive Buckets Row */}
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        {INACTIVE_BUCKETS.map((bucket) => {
          const bucketFeatures = filterByStatuses(features, bucket.statuses);
          return (
            <Bucket
              key={bucket.id}
              config={bucket}
              features={bucketFeatures}
              onFeatureClick={onFeatureClick}
              compact
            />
          );
        })}
      </div>

      {/* ACTIVE Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Active Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
          <h2 className="text-lg font-bold text-gray-100 tracking-wide px-4">A C T I V E</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        {/* Active Buckets Grid */}
        <div className="flex-1 grid grid-cols-5 gap-3">
          {ACTIVE_BUCKETS.map((bucket) => (
            <ActiveBucket
              key={bucket.id}
              config={bucket}
              features={features}
              onFeatureClick={onFeatureClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
