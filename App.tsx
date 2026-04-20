import React, { useState, useEffect } from 'react';
import { FeatureFocus, Concept, GeneratorInput } from './types';
import { generateConceptsForLayout } from './services/logic';
import { checkApiConnection } from './services/geminiService';
import { LAYOUTS, FEATURE_META } from './constants';
import ConceptCard from './components/ConceptCard';
import LayoutSelector from './components/LayoutSelector';
import { 
    SparklesIcon, RefreshIcon, BrainIcon, LoaderIcon, UploadIcon, TrashIcon,
    HistoryIcon, WandIcon, PaletteIcon, CubeIcon, SmileIcon, CameraIcon, GridIcon
} from './components/Icons';

const App: React.FC = () => {
  // State
  const [featureFocus, setFeatureFocus] = useState<FeatureFocus>(FeatureFocus.RESTORE);
  const [layoutId, setLayoutId] = useState<string>("mixed_all");
  const [marketTier, setMarketTier] = useState<string>("Tier 1 (US/UK/EU)");
  const [insight, setInsight] = useState<string>("");
  const [angle, setAngle] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1"); // New State for Aspect Ratio
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  
  // Brand Assets
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [googlePlayBadge, setGooglePlayBadge] = useState<string | null>(null);

  // Thinking State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // API Key & Health State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiHealth, setApiHealth] = useState<{status: 'idle' | 'checking' | 'ok' | 'quota' | 'error', latency?: number}>({ status: 'idle' });

  // When feature changes, default to Mixed All for variety
  useEffect(() => {
    setLayoutId("mixed_all");
  }, [featureFocus]);

  // Check API Key on mount and listen for revocation events
  useEffect(() => {
    const checkKey = async () => {
        const win = window as any;
        if (win.aistudio && win.aistudio.hasSelectedApiKey) {
            const has = await win.aistudio.hasSelectedApiKey();
            setHasApiKey(has);
            if (has) handleCheckHealth(); // Check health on initial load if key exists
        } else if (process.env.API_KEY) {
            // Fallback check if env is somehow already populated
            setHasApiKey(true);
            handleCheckHealth();
        }
    };
    checkKey();

    // Listen for key revocation from service layer (e.g. 404/403 errors)
    const handleRevoke = (event: Event) => {
        console.warn("API Key revoked or invalid.");
        setHasApiKey(false);
        setApiHealth({ status: 'error' });
        
        const customEvent = event as CustomEvent;
        const reason = customEvent.detail?.reason;

        if (reason === 'PERMISSION_DENIED') {
             alert("ELIGIBILITY CHECK FAILED (403)\n\nYour API Key is connected, BUT it does not have permission to use the model.\n\nREQUIRED: You must select an API Key from a Google Cloud Project with BILLING ENABLED (Paid Tier).\n\nPlease click 'Select API Key' and switch to a valid paid key.");
        } else if (reason === 'NOT_FOUND') {
             alert("MODEL NOT FOUND (404)\n\nThe model is not available for your current API Key type.\n\nPlease select a supported paid key.");
        } else {
             alert("API Key session expired or invalid. Please select a valid API Key.");
        }
    };
    window.addEventListener('gemini-api-key-revoked', handleRevoke);
    return () => window.removeEventListener('gemini-api-key-revoked', handleRevoke);
  }, []);

  const handleSelectKey = async () => {
      const win = window as any;
      if (win.aistudio && win.aistudio.openSelectKey) {
          await win.aistudio.openSelectKey();
          // FIXED: Race condition handling - assume success immediately to proceed
          setHasApiKey(true);
          setApiHealth({ status: 'idle' }); // Reset health status on new key
          setTimeout(handleCheckHealth, 500); // Check health shortly after
      } else {
          alert("API Key selection is not available in this environment.");
      }
  };

  const handleCheckHealth = async () => {
      setApiHealth({ status: 'checking' });
      const result = await checkApiConnection();
      setApiHealth({ status: result.status, latency: result.latency });
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
        alert("Please select an API Key first (Top Right Button)");
        handleSelectKey();
        return;
    }

    try {
      setIsAnalyzing(true);
      setConcepts([]); // Clear previous
      
      const input: GeneratorInput = {
        featureFocus,
        layoutId,
        marketTier,
        insight,
        angle,
        aspectRatio // Pass selected ratio
      };

      // Removed artificial setTimeouts to maximize speed
      const result = await generateConceptsForLayout(input);
      
      setConcepts(result.concepts);
      setGeneratedCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
      // alert is handled by the event listener if it was a key error, otherwise:
      if (!(e as any).message?.includes('PERMISSION_DENIED') && !(e as any).message?.includes('Requested entity was not found')) {
         // Generic error only if not already handled
         // alert("Error generating concepts. Please check API Key or network.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateConcept = (updated: Concept) => {
    setConcepts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'google') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'app') setAppLogo(reader.result as string);
        else setGooglePlayBadge(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to get icon for feature button
  const getFeatureIcon = (iconKey: string, className: string) => {
      switch(iconKey) {
          case 'history': return <HistoryIcon className={className} />;
          case 'wand': return <WandIcon className={className} />;
          case 'palette': return <PaletteIcon className={className} />;
          case 'cube': return <CubeIcon className={className} />;
          case 'smile': return <SmileIcon className={className} />;
          case 'camera': return <CameraIcon className={className} />;
          case 'grid': return <GridIcon className={className} />;
          default: return <SparklesIcon className={className} />;
      }
  };

  // Render Status Badge
  const renderStatusBadge = () => {
      if (!hasApiKey) {
          return (
            <button 
                onClick={handleSelectKey}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-600 transition-all hover:border-brand-500 group shadow-lg"
            >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white">🔑 Select API Key</span>
            </button>
          );
      }

      switch (apiHealth.status) {
          case 'checking':
              return (
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
                    <LoaderIcon className="w-3 h-3 text-slate-400 animate-spin" />
                    <span className="text-xs font-medium text-slate-400">Checking...</span>
                </div>
              );
          case 'quota':
              return (
                <button onClick={handleCheckHealth} className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1.5 rounded-full border border-yellow-700/50 hover:bg-yellow-900/50 transition-colors cursor-pointer" title="Click to re-check">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-bold text-yellow-400">Rate Limited</span>
                </button>
              );
          case 'error':
            return (
                <button onClick={handleCheckHealth} className="flex items-center gap-2 bg-red-900/30 px-3 py-1.5 rounded-full border border-red-700/50 hover:bg-red-900/50 transition-colors cursor-pointer" title="Connection Error - Click to retry">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-bold text-red-400">System Error</span>
                </button>
            );
          case 'ok':
            return (
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Model</span>
                        <span className="text-xs font-bold text-brand-400">Gemini 3 Pro Image (Nano Banana Pro)</span>
                    </div>
                    <button onClick={handleCheckHealth} className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-green-900/50 shadow-sm hover:bg-slate-800 transition-colors cursor-pointer" title={`System Operational ${apiHealth.latency ? `(${apiHealth.latency}ms)` : ''}`}>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-xs font-medium text-green-400">System Healthy</span>
                    </button>
                </div>
            );
          default: // idle or initial 'ok' from logic
             return (
                <button onClick={handleCheckHealth} className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-green-900/50 shadow-sm hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-xs font-medium text-green-400">Connected</span>
                </button>
             );
      }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      
      {/* Sidebar Controls */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 z-10">
          <div className="flex items-center gap-2 text-brand-500 mb-1">
            <SparklesIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-white">Artify Gen</h1>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold ml-8">Workflow Engine</p>
        </div>

        <div className="p-6 space-y-8 flex-grow">
          
          {/* Brand Assets Section */}
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                Brand Assets
                <span className="bg-slate-800 text-slate-500 text-[10px] px-1.5 rounded">Auto-Overlay</span>
             </label>
             
             {/* App Logo Upload */}
             <div className="space-y-2">
                {appLogo ? (
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded-md border border-slate-700">
                        <div className="flex items-center gap-2">
                            <img src={appLogo} alt="Logo" className="w-8 h-8 rounded object-contain bg-black/20" />
                            <span className="text-xs text-slate-300">App Logo Set</span>
                        </div>
                        <button onClick={() => setAppLogo(null)} className="text-slate-500 hover:text-red-400">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'app')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-slate-700 rounded-md text-xs text-slate-400 group-hover:border-brand-500 group-hover:text-brand-400 transition-colors bg-slate-800/50">
                            <UploadIcon className="w-4 h-4" />
                            <span>Upload App Icon</span>
                        </div>
                    </div>
                )}
             </div>

             {/* Google Play Badge Upload */}
             <div className="space-y-2">
                {googlePlayBadge ? (
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded-md border border-slate-700">
                         <div className="flex items-center gap-2">
                            <img src={googlePlayBadge} alt="Badge" className="w-16 h-6 object-contain" />
                        </div>
                        <button onClick={() => setGooglePlayBadge(null)} className="text-slate-500 hover:text-red-400">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'google')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-slate-700 rounded-md text-xs text-slate-400 group-hover:border-brand-500 group-hover:text-brand-400 transition-colors bg-slate-800/50">
                            <UploadIcon className="w-4 h-4" />
                            <span>Upload Store Badge</span>
                        </div>
                    </div>
                )}
             </div>
          </div>

          <div className="h-px bg-slate-800 my-4" />

          {/* Feature Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Feature Focus</label>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(FeatureFocus).map((f) => {
                    const meta = FEATURE_META[f] || FEATURE_META.restore;
                    const isSelected = featureFocus === f;
                    
                    // Dynamic Tailwind Classes based on Color
                    const activeClass = `bg-gradient-to-br from-${meta.color}-600 to-${meta.color}-800 border-${meta.color}-500 text-white shadow-lg shadow-${meta.color}-900/40`;
                    const inactiveClass = `bg-slate-800 border-slate-700 text-slate-400 hover:border-${meta.color}-500/50 hover:text-${meta.color}-400`;

                    return (
                        <button
                            key={f}
                            onClick={() => setFeatureFocus(f)}
                            className={`
                                relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 group overflow-hidden
                                ${isSelected ? activeClass : inactiveClass}
                            `}
                        >
                            <div className={`
                                p-2 rounded-full transition-colors
                                ${isSelected ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'}
                            `}>
                                {getFeatureIcon(meta.iconKey, "w-4 h-4")}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{meta.label}</span>
                            
                            {/* Subtle Glow Effect on Hover for Inactive */}
                            {!isSelected && (
                                <div className={`absolute inset-0 bg-${meta.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>
                            )}
                        </button>
                    );
                })}
            </div>
          </div>

          {/* Layout Selection */}
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Visual Layout</label>
             <LayoutSelector 
                selectedFeature={featureFocus}
                selectedLayoutId={layoutId}
                onSelect={setLayoutId}
             />
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Aspect Ratio</label>
             <div className="grid grid-cols-3 gap-2">
                {['1:1', '9:16', '16:9', '4:3', '3:4'].map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`
                            text-xs font-bold py-2 rounded-lg border transition-all duration-200
                            ${aspectRatio === ratio 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'
                            }
                        `}
                    >
                        {ratio}
                    </button>
                ))}
             </div>
          </div>

          {/* Other Inputs */}
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Market Tier</label>
                <select 
                    value={marketTier}
                    onChange={(e) => setMarketTier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                    <option>Tier 1 (US/UK/EU)</option>
                    <option>Global (General)</option>
                    <option>Emerging Markets</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Creative Angle (Optional)</label>
                <input 
                    type="text"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    placeholder="e.g. Emotional, Fast, Professional"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-600"
                />
             </div>
          </div>
        </div>

        {/* Generate Button Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10">
            <button
                onClick={handleGenerate}
                disabled={isAnalyzing}
                className={`
                    w-full font-bold py-3 px-4 rounded-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                    ${isAnalyzing 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-indigo-900/30'
                    }
                `}
            >
                {isAnalyzing ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                    <BrainIcon className={`w-4 h-4 ${generatedCount > 0 ? 'animate-pulse' : ''}`} />
                )}
                {isAnalyzing ? "Processing..." : "Generate with AI"}
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 relative">
        <header className="px-8 py-6 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white">Generated Concepts</h2>
                <p className="text-slate-400 text-sm">
                    {concepts.length > 0 
                        ? `Showing ${concepts.length} concepts for ${featureFocus.replace('_', ' ')}`
                        : 'Select options and click Generate to start'}
                </p>
            </div>
            
            {/* API Status Badge */}
            <div>
                {renderStatusBadge()}
            </div>
        </header>

        {/* Thinking Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="bg-slate-900 p-8 rounded-2xl border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)] flex flex-col items-center max-w-md text-center">
                    <BrainIcon className="w-16 h-16 text-indigo-400 animate-pulse mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Generating Concepts...</h3>
                    <p className="text-indigo-300 font-mono text-sm mb-6 min-h-[1.5em]">Crafting visual strategies</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[loading_1s_ease-in-out_infinite] w-1/3"></div>
                    </div>
                </div>
            </div>
        )}

        <div className="px-8 pb-12">
            {!isAnalyzing && concepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                    <SparklesIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready to create magic</p>
                    <p className="text-sm">Configure your workflow on the left to begin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {concepts.map((concept) => (
                        <ConceptCard 
                            key={concept.id} 
                            concept={concept} 
                            appLogo={appLogo}
                            googlePlayBadge={googlePlayBadge}
                            onUpdate={handleUpdateConcept}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;