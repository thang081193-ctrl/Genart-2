

import React, { useState } from 'react';
import { Concept } from '../types';
import { generateMarketingCopy, generateConceptImage } from '../services/geminiService';
import { compositeOverlays } from '../services/imageProcessing';
import { 
    CopyIcon, CodeIcon, SmartphoneIcon, LayersIcon, CheckIcon, BotIcon, ImageIcon, 
    DownloadIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, EyeOffIcon, FileTextIcon, WandIcon 
} from './Icons';
import { FEATURE_META } from '../constants';

interface ConceptCardProps {
  concept: Concept;
  appLogo: string | null;
  googlePlayBadge: string | null;
  onUpdate: (updatedConcept: Concept) => void;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, appLogo, googlePlayBadge, onUpdate }) => {
  const [showJson, setShowJson] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Local state for the custom guidance text box
  const [customGuidance, setCustomGuidance] = useState(concept.customGuidance || "");

  const featureMeta = FEATURE_META[concept.featureFocus] || FEATURE_META.restore;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(concept.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCopy = async () => {
    onUpdate({ ...concept, isGeneratingCopy: true });
    const copy = await generateMarketingCopy(concept.jsonSpec);
    onUpdate({ ...concept, aiCopy: copy, isGeneratingCopy: false });
  };

  const handleGenerateImage = async () => {
    onUpdate({ ...concept, isGeneratingImage: true, customGuidance: customGuidance });
    
    // 1. Generate Raw Image from Gemini (PASSING CUSTOM GUIDANCE)
    const rawImage = await generateConceptImage(concept.jsonSpec, customGuidance);
    
    if (rawImage) {
        // 2. Composite Logos AND Text Labels (Based on Layout ID)
        // Even if no logo is uploaded, we run this to add the Text Labels
        try {
            const finalImage = await compositeOverlays(rawImage, {
                appLogoBase64: appLogo,
                googlePlayBadgeBase64: googlePlayBadge,
                layoutId: concept.layoutId, // Pass this to enable Before/After text
                headline: concept.jsonSpec.text_overlay.headline, // Pass Headline
                subheadline: concept.jsonSpec.text_overlay.subheadline // Pass Subheadline
            });
            onUpdate({ ...concept, imageUrl: finalImage, isGeneratingImage: false, customGuidance: customGuidance });
        } catch (e) {
            console.error("Compositing failed", e);
            // Fallback to raw image if compositing fails
            onUpdate({ ...concept, imageUrl: rawImage, isGeneratingImage: false, customGuidance: customGuidance });
        }
    } else {
        onUpdate({ ...concept, isGeneratingImage: false, customGuidance: customGuidance }); // Failed
    }
  };

  const handleDownloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!concept.imageUrl) return;
    const link = document.createElement('a');
    link.href = concept.imageUrl;
    link.download = `${concept.featureFocus}_${concept.layoutId}_${concept.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${isCollapsed ? 'h-auto' : 'h-full'}`}>
      
      {/* Header */}
      <div 
        className="p-4 border-b border-slate-700 flex justify-between items-start bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-${featureMeta.color}-200 bg-${featureMeta.color}-900/50 border border-${featureMeta.color}-500/30`}>
                    {featureMeta.label}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400">Concept #{concept.id}</span>
            </div>
          <h3 className="font-semibold text-slate-100 text-lg capitalize">{concept.topic}</h3>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
           {concept.jsonSpec.mobile_ui.use_phone_frame ? (
               <SmartphoneIcon className="w-5 h-5 text-indigo-400" />
           ) : (
               <LayersIcon className="w-5 h-5 text-emerald-400" />
           )}
           <button className="text-slate-500 hover:text-white transition-colors">
              {isCollapsed ? <ChevronDownIcon className="w-5 h-5"/> : <ChevronUpIcon className="w-5 h-5"/>}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'p-4 flex-grow space-y-4 opacity-100'}`}>
        
        {/* Generated Image Section */}
        {concept.imageUrl ? (
            <div className="rounded-lg overflow-hidden border border-slate-700 bg-black relative group animate-in fade-in duration-500">
                <img src={concept.imageUrl} alt={concept.topic} className="w-full h-auto object-cover" />
                
                {/* Download Button Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleDownloadImage}
                        className="p-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-md hover:bg-black border border-slate-700 shadow-lg transition-all active:scale-95"
                        title="Download Image"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2 pointer-events-none">
                    <span className="text-xs text-white/80 font-medium">Generated with Gemini</span>
                </div>
            </div>
        ) : (
            <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 gap-2">
                 <ImageIcon className="w-8 h-8 opacity-20" />
                 <span className="text-xs">Image not generated yet</span>
            </div>
        )}

        {/* AI Copy Section */}
        {concept.aiCopy && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <BotIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Marketing Copy</span>
                </div>
                <p className="text-sm text-indigo-100 italic">
                    "{concept.aiCopy}"
                </p>
            </div>
        )}

        {/* CUSTOM REFINEMENT INPUT - NEW ADDITION */}
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
                <WandIcon className="w-3 h-3" />
                <label className="text-[10px] uppercase font-bold tracking-wider">Custom Refinement</label>
            </div>
            <textarea 
                value={customGuidance}
                onChange={(e) => {
                    setCustomGuidance(e.target.value);
                    // We also update the concept state so it persists if we close/open
                    onUpdate({...concept, customGuidance: e.target.value});
                }}
                placeholder="E.g. 'Move the Before label lower', 'Make the sky bluer', 'Fix the distorted face'..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[50px] resize-y"
            />
        </div>

        {/* Actions Bar - Primary */}
        <div className="grid grid-cols-2 gap-3 pt-2">
            <button
                onClick={handleGenerateImage}
                disabled={concept.isGeneratingImage}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all
                    ${concept.isGeneratingImage 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg'
                    }
                `}
            >
                 <ImageIcon className={`w-4 h-4 ${concept.isGeneratingImage ? 'animate-pulse' : ''}`} />
                 {concept.isGeneratingImage ? 'Compositing...' : (concept.imageUrl ? (customGuidance ? 'Regenerate with Edits' : 'Regenerate Image') : 'Generate Image')}
            </button>

            <button
                onClick={handleGenerateCopy}
                disabled={concept.isGeneratingCopy}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all
                    ${concept.isGeneratingCopy 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                        : 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
                    }
                `}
            >
                 <BotIcon className={`w-4 h-4 ${concept.isGeneratingCopy ? 'animate-pulse' : ''}`} />
                 {concept.isGeneratingCopy ? 'Writing...' : 'Write Ad Copy'}
            </button>
        </div>
        
        {/* Hidden / Toggleable Sections */}
        <div className="space-y-3 pt-2">
            
            {/* Prompt Toggle Section */}
            {showPrompt && (
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-700/50 group relative animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Image Prompt</span>
                        <button 
                            onClick={handleCopyPrompt}
                            className="flex items-center gap-1.5 text-[10px] text-brand-400 hover:text-brand-300"
                        >
                            {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                        {concept.prompt}
                        {/* Show if custom guidance is being appended */}
                        {customGuidance && (
                            <span className="block mt-2 text-indigo-400 border-t border-slate-800 pt-2">
                                + CUSTOM USER FEEDBACK: "{customGuidance}"
                            </span>
                        )}
                    </p>
                </div>
            )}

             {/* JSON Spec Viewer */}
            {showJson && (
                <div className="bg-black rounded-lg p-3 border border-slate-800 overflow-x-auto animate-in slide-in-from-top-2 duration-200">
                    <pre className="text-[10px] text-green-400 font-mono leading-tight">
                        {JSON.stringify(concept.jsonSpec, null, 2)}
                    </pre>
                </div>
            )}
        </div>

      </div>

       {/* Clean Toolbar Footer */}
       {!isCollapsed && (
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500">Layout: <span className="text-slate-300">{concept.layoutId}</span></span>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPrompt(!showPrompt)}
                        className={`flex items-center gap-1.5 transition-colors ${showPrompt ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="View Prompt"
                    >
                        {showPrompt ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                        <span className="font-medium">Prompt</span>
                    </button>
                    
                    <div className="w-px h-3 bg-slate-700"></div>

                    <button
                        onClick={() => setShowJson(!showJson)}
                        className={`flex items-center gap-1.5 transition-colors ${showJson ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                         title="View Technical Spec"
                    >
                        <CodeIcon className="w-3.5 h-3.5" />
                        <span className="font-medium">Spec</span>
                    </button>
                </div>
            </div>
       )}
    </div>
  );
};

export default ConceptCard;