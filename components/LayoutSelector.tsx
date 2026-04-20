import React from 'react';
import { LayoutConfig, FeatureFocus } from '../types';
import { LAYOUTS } from '../constants';
import { LayersIcon, SmartphoneIcon, SparklesIcon } from './Icons';

interface LayoutSelectorProps {
    selectedFeature: FeatureFocus;
    selectedLayoutId: string;
    onSelect: (id: string) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ selectedFeature, selectedLayoutId, onSelect }) => {
    const availableLayouts = Object.values(LAYOUTS).filter(l => l.feature === selectedFeature);

    if (availableLayouts.length === 0) {
        return <div className="text-slate-500 italic text-sm p-2">No layouts available for this feature.</div>
    }

    return (
        <div className="grid grid-cols-1 gap-2">
            {/* Mix / Random Option */}
            <button
                onClick={() => onSelect('mixed_all')}
                className={`
                    text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden flex items-center gap-3
                    ${selectedLayoutId === 'mixed_all' 
                        ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-750'
                    }
                `}
            >
                <div className={`p-2 rounded-full ${selectedLayoutId === 'mixed_all' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    <SparklesIcon className="w-4 h-4" />
                </div>
                <div>
                    <span className={`text-sm font-bold block ${selectedLayoutId === 'mixed_all' ? 'text-indigo-300' : 'text-slate-200'}`}>
                        Mix All Layouts
                    </span>
                    <span className="text-xs text-slate-500">
                        Randomly generate varied layouts
                    </span>
                </div>
            </button>

            {/* Individual Layouts */}
            {availableLayouts.map((layout) => (
                <button
                    key={layout.id}
                    onClick={() => onSelect(layout.id)}
                    className={`
                        text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden
                        ${selectedLayoutId === layout.id 
                            ? 'bg-brand-900/20 border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                            : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                        }
                    `}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${selectedLayoutId === layout.id ? 'text-brand-400' : 'text-slate-300'}`}>
                            {layout.id.replace(/_/g, ' ')}
                        </span>
                        {layout.hasPhoneUI ? (
                            <SmartphoneIcon className="w-4 h-4 text-slate-500" />
                        ) : (
                            <LayersIcon className="w-4 h-4 text-slate-500" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                        {layout.description}
                    </p>
                </button>
            ))}
        </div>
    );
};

export default LayoutSelector;