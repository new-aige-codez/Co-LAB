import { getFeaturesByStatus, type Feature } from '../data/featureData';
import { Lightbulb, ExternalLink } from 'lucide-react';

export default function ProposedFeaturesPage() {
    const features = getFeaturesByStatus('proposed');

    return (
        <div className="flex-1 overflow-y-auto bg-gray-950">
            <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3">
                <h1 className="text-base font-semibold text-gray-100">Proposed Features</h1>
                <p className="text-xs text-gray-500 mt-0.5">Research highlights and community proposals under evaluation</p>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
                {features.map(feature => (
                    <div
                        key={feature.id}
                        className="flex items-start gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb className="w-4.5 h-4.5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-100 group-hover:text-purple-300 transition-colors">
                                    {feature.title}
                                </span>
                                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                                    {feature.category}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{feature.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-purple-400/70">Source: {feature.source}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {features.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-12">
                        No proposed features at this time.
                    </div>
                )}
            </div>
        </div>
    );
}
