import { getFeaturesByStatus } from '../data/featureData';
import { Trash2, RotateCcw } from 'lucide-react';

export default function RecycleBinPage() {
    const features = getFeaturesByStatus('recycled');

    return (
        <div className="flex-1 overflow-y-auto bg-gray-950">
            <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3">
                <h1 className="text-base font-semibold text-gray-100">Recycle Bin</h1>
                <p className="text-xs text-gray-500 mt-0.5">Features and code work that were omitted or deprioritized</p>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
                {features.map(feature => (
                    <div
                        key={feature.id}
                        className="flex items-start gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 opacity-75 hover:opacity-100 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Trash2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-300 line-through decoration-gray-600">
                                    {feature.title}
                                </span>
                                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                                    {feature.category}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                            {feature.recycleReason && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400/70 bg-red-900/10 px-2 py-1 rounded-md inline-flex">
                                    <span className="font-medium">Reason:</span> {feature.recycleReason}
                                </div>
                            )}
                        </div>
                        <button
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-orange-400 bg-gray-800 hover:bg-orange-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Restore to Upcoming"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                        </button>
                    </div>
                ))}

                {features.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-12">
                        Recycle bin is empty — nothing has been omitted.
                    </div>
                )}
            </div>
        </div>
    );
}
