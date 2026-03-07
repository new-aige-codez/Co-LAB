import { useState } from 'react';
import { getFeaturesByStatus, getCategoriesWithCounts, type Feature } from '../data/featureData';
import {
    ChevronDown,
    ChevronRight,
    Zap,
    ArrowUp,
    ArrowRight,
    ArrowDown,
} from 'lucide-react';

function PriorityChip({ priority }: { priority?: Feature['priority'] }) {
    if (!priority) return null;
    const cfg = {
        high: { label: 'High', cls: 'text-red-400 bg-red-900/30', Icon: ArrowUp },
        medium: { label: 'Med', cls: 'text-yellow-400 bg-yellow-900/30', Icon: ArrowRight },
        low: { label: 'Low', cls: 'text-gray-400 bg-gray-700/50', Icon: ArrowDown },
    };
    const { label, cls, Icon } = cfg[priority];
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

export default function UpcomingFeaturesPage() {
    const features = getFeaturesByStatus('upcoming');
    const categoryCounts = getCategoriesWithCounts('upcoming');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(categoryCounts.slice(0, 3).map(c => c.category))
    );
    const [search, setSearch] = useState('');

    function toggleCategory(cat: string) {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    }

    const filtered = search
        ? features.filter(f =>
            f.title.toLowerCase().includes(search.toLowerCase()) ||
            f.description.toLowerCase().includes(search.toLowerCase()) ||
            f.category.toLowerCase().includes(search.toLowerCase())
        )
        : features;

    const grouped = categoryCounts
        .map(cc => ({
            category: cc.category,
            features: filtered.filter(f => f.category === cc.category),
        }))
        .filter(g => g.features.length > 0);

    return (
        <div className="flex-1 overflow-y-auto bg-gray-950">
            <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-base font-semibold text-gray-100">Upcoming Features</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{features.length} features planned from OpenClaw roadmap</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search features…"
                    className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
                />

                {/* Category groups */}
                {grouped.map(group => {
                    const isExpanded = expandedCategories.has(group.category);
                    return (
                        <div key={group.category} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleCategory(group.category)}
                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                                        : <ChevronRight className="w-4 h-4 text-gray-500" />
                                    }
                                    <span className="text-sm font-semibold text-gray-100">{group.category}</span>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                    {group.features.length}
                                </span>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gray-800">
                                    {group.features.map(feature => (
                                        <div
                                            key={feature.id}
                                            className="flex items-start gap-3 px-5 py-3 border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/30 transition-colors"
                                        >
                                            <Zap className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-100">{feature.title}</span>
                                                    <PriorityChip priority={feature.priority} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.description}</p>
                                            </div>
                                            <span className="text-xs text-gray-600 flex-shrink-0">{feature.source}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-12">
                        No features match your search.
                    </div>
                )}
            </div>
        </div>
    );
}
