/**
 * Simplified View Component
 *
 * 3-bucket KanPlan view: Up Next, Active, Complete
 */

'use client';

import { Bucket } from './Bucket';
import { SIMPLIFIED_BUCKETS, groupFeaturesByBucket, type KanPlanFeature } from '@/store/kanplanStore';

interface SimplifiedViewProps {
  features: KanPlanFeature[];
  onFeatureClick?: (feature: KanPlanFeature) => void;
}

export function SimplifiedView({ features, onFeatureClick }: SimplifiedViewProps) {
  const grouped = groupFeaturesByBucket(features, 'simplified');

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {SIMPLIFIED_BUCKETS.map((bucket) => (
        <Bucket
          key={bucket.id}
          config={bucket}
          features={grouped[bucket.id] || []}
          onFeatureClick={onFeatureClick}
        />
      ))}
    </div>
  );
}
