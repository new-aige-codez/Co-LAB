/**
 * KanPlan Page
 *
 * Visual task board with simplified and expanded views
 */

'use client';

import { KanPlanView } from '@/components/kanplan';

export default function KanPlanPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-48px)]">
        <KanPlanView />
      </div>
    </main>
  );
}
