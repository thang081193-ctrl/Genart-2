import { FeatureFocus, LayoutConfig, ConceptSpec, Concept, GeneratorInput, AIStrategy } from '../types';
import { LAYOUTS, TOPICS } from '../constants';
import { generateBatchStrategies } from './geminiService';

// --- 1. THE "BRAIN": CONSTANTS & HELPERS FOR EXPERT REASONING ---

type MarketProfile = {
  style: string;
  palette: string;
  uiIntensity: string;
  complexity: string; // 'minimal' vs 'busy'
};

function analyzeMarketProfile(tier: string): MarketProfile {
  // Guard against undefined tier
  const t = (tier || "Tier 1").toLowerCase();
  
  if (t.includes('tier 1') || t.includes('us') || t.includes('uk') || t.includes('eu')) {
    return {
      style: "clean_premium",
      palette: "neutral_pastel",
      uiIntensity: "subtle", 
      complexity: "minimal"
    };
  } else if (t.includes('emerging') || t.includes('asia') || t.includes('brazil') || t.includes('latam')) {
    return {
      style: "high_impact",
      palette: "vivid_contrast",
      uiIntensity: "high", 
      complexity: "information_dense"
    };
  } else {
    return {
      style: "balanced_modern",
      palette: "brand_colors",
      uiIntensity: "medium",
      complexity: "standard"
    };
  }
}

// Fallback logic if AI fails (The old synchronous generator)
function getFallbackStrategy(feature: FeatureFocus, angleInput: string, marketProfile: MarketProfile) {
    const angle = (angleInput || "").toLowerCase();
    
    // Default Professional
    let mood = "professional_studio";
    let lighting = "soft_studio_light";
    let headline = `Best ${feature} App`;
    let subheadline = "Try it now";
    let background = "clean_abstract_gradient"; // CHANGED: Neutral default

    // CORE LOGIC: Restore/Enhance = Family/Wedding/Memory by default
    const isRestoreOrEnhance = feature === FeatureFocus.RESTORE || feature === FeatureFocus.ENHANCE;
    const isWedding = (isRestoreOrEnhance && angle.includes('wedding')) || angle.includes('marriage');
    const isMemories = isRestoreOrEnhance || angle.includes('memory') || angle.includes('emotion');

    if (isWedding) {
        mood = "romantic_dreamy_soft";
        lighting = "ethereal_glow";
        background = "blurred_luxury_venue_lights"; // CHANGED: No more floral arch. Generic luxury bokeh.
        headline = "Perfect Your Wedding Day";
        subheadline = "Save every precious moment";
    } else if (isMemories) {
        mood = "nostalgic_warm_sentimental";
        lighting = "golden_hour_sunlight";
        background = "blurred_outdoor_nature"; // CHANGED: Natural outdoor instead of specific decor
        headline = "Bring Memories Back";
        subheadline = "Restore your family history";
    } else if (angle.includes('fast') || angle.includes('instant')) {
        mood = "energetic_dynamic";
        lighting = "bright_high_key";
        headline = "Restore in 1 Second";
    }

    return { headline, subheadline, mood, lighting, background, rationale: "Fallback Logic" };
}

// --- 2. SPEC GENERATION ---

function buildSpecFromStrategy({
  featureFocus,
  layout,
  marketTier,
  insight,
  angle,
  aspectRatio, // Passed in
  strategy
}: {
    featureFocus: FeatureFocus;
    layout: LayoutConfig;
    marketTier: string;
    insight: string;
    angle: string;
    aspectRatio: string;
    strategy: AIStrategy; // Now using the AI generated strategy
}): ConceptSpec {
  const hasPhoneUI = layout.hasPhoneUI;
  const marketProfile = analyzeMarketProfile(marketTier);

  // Determine specific layout logic based on AI description if possible, or fallback to layout defaults
  const ltype = layout.type || "";
  let flowVisual = "arrow_simple";
  if (ltype.includes("split")) flowVisual = "split_line_glow";
  if (ltype.includes("slider")) flowVisual = "interactive_slider";
  if (featureFocus === FeatureFocus.AI_ART) flowVisual = "magic_particles";
  if (featureFocus === FeatureFocus.THREE_D) flowVisual = "3d_morphing_effect";
  if (featureFocus === FeatureFocus.POLAROID) flowVisual = "developing_film_effect";
  
  // LOGIC FIX: We prioritize the AI Strategy's mood.
  // We only default to Market Profile if Strategy is vague.
  
  // SAFEGUARD: Ensure visual_mood exists
  const strategyMood = strategy.visual_mood || "balanced";
  
  let finalPalette = strategyMood.includes('neon') ? "neon_cyberpunk" : marketProfile.palette;
  let finalMood = strategyMood;
  let finalBackground = strategy.background;

  // Ensure background isn't empty/generic if strategy failed
  if (!finalBackground || finalBackground === "string") {
      finalBackground = "cinematic_neutral_blur";
  }

  // Small tweak: If Cartoon/Art and market is Emerging, push vivid colors if strategy didn't specify
  if ((featureFocus === FeatureFocus.CARTOON || featureFocus === FeatureFocus.AI_ART) && marketProfile.style === 'high_impact') {
      if (!finalMood.includes('neon') && !finalMood.includes('soft')) {
         finalMood = "vibrant_high_energy";
         finalPalette = "vivid_pop_colors";
      }
  }
  
  // --- STRICT BRANDING & TEXT LAYOUT ---
  // Per 6-Step Framework: Header (Headline) -> Body (70%) -> Footer (Branding)
  const isRestoreOrEnhance = featureFocus === FeatureFocus.RESTORE || featureFocus === FeatureFocus.ENHANCE;
  
  let logoPosition = "bottom_right"; // Default fallback
  let badgePosition = "bottom_left"; // Default fallback
  let headlinePosition = "top_center";
  let includeLogo = true;

  if (isRestoreOrEnhance) {
      // STRICT RULES FOR RESTORE FRAMEWORK
      logoPosition = "bottom_right";
      badgePosition = "bottom_left";
      headlinePosition = "top_center";
      includeLogo = true; // Always on
  } else {
      // Variable logic for other features
      logoPosition = hasPhoneUI ? "top_right" : "bottom_right";
      badgePosition = "bottom_center";
  }

  // --- SPECIAL COPYWRITING FOR PRIORITY LAYOUTS ---
  let finalHeadline = strategy.headline || `Best ${featureFocus} App`;
  let finalSubheadline = strategy.subheadline || "Try it now";

  // CARTOON Priority Override
  if (layout.id === "cartoon_burst_multi_panel" || layout.id === "cartoon_flow_transformation") {
      finalHeadline = "TRANSFORM YOURSELF";
      finalSubheadline = "Anime & comic styles from any selfie";
      finalPalette = "neon_cyberpunk";
      finalMood = "high_energy_comic_burst";
  }

  // ALL-IN-ONE Functional Headlines Override
  if (featureFocus === FeatureFocus.ALL_IN_ONE) {
      if (layout.id === "allinone_digital_scrapbook") {
          finalHeadline = "Birthday Joy, Christmas Vibe";
          finalSubheadline = "AESTHETIC MOODBOARDS";
      } else if (layout.id === "allinone_life_story_card") {
          finalHeadline = "Relive Your Perfect Walk";
          finalSubheadline = "CURATE YOUR LIFE STORY";
      } else if (layout.id === "allinone_travel_moodboard") {
          finalHeadline = "From Gallery to Goals";
          finalSubheadline = "INSTA-READY TRAVEL COLLAGES";
      } else if (layout.id === "allinone_perfect_hero") {
          finalHeadline = "The Perfect Hero Shot";
          finalSubheadline = "TURN MESSY PICS INTO ART";
      } else if (layout.id === "allinone_cinematic_reel") {
          finalHeadline = "Your Life, Cinematic";
          finalSubheadline = "CREATE VIRAL REELS INSTANTLY";
      }
  }

  // Safe layout type check
  const splitRatio = (ltype.includes("split_50_50")) ? "50_50" : null;

  return {
    meta: {
      app_name: "Artify Gen",
      feature_focus: featureFocus,
      layout_id: layout.id,
      market_tier: marketTier,
      topic: strategy.topic || "Creative Concept",
      insight,
      angle
    },
    mobile_ui: {
      use_phone_frame: hasPhoneUI,
      phone_type: hasPhoneUI ? "generic_android" : null,
      ui_mockup_position: "center"
    },
    branding: {
      include_app_logo: includeLogo,
      logo_position: logoPosition,
      include_google_play_badge: true,
      badge_position: badgePosition
    },
    layout: {
      layout_type: layout.type,
      split_ratio: splitRatio,
      before_section: strategy.before_description || layout.beforeStyle,
      flow_visual: {
        style: flowVisual,
        intensity: marketProfile.uiIntensity
      },
      after_section: strategy.after_description || layout.afterStyle
    },
    visual: {
      background_style: finalBackground,
      color_palette: finalPalette,
      lighting: strategy.lighting || "studio",
      mood: finalMood
    },
    personas: [`Subject: ${strategy.topic || "User"}`],
    text_overlay: {
      headline: finalHeadline,
      subheadline: finalSubheadline,
      style: marketProfile.style === 'clean_premium' ? "minimal_sans_serif" : "bold_impact_font",
      placement: headlinePosition
    },
    camera_settings: {
      shot_type: hasPhoneUI ? "product_shot_medium" : "macro_detail",
      depth_of_field: marketProfile.style === 'clean_premium' ? "shallow_bokeh" : "deep_focus",
      aspect_ratio: aspectRatio // Included here
    },
    // Add specific style groups if available
    cartoonStyleGroup: strategy.cartoonStyleGroup,
    aiArtStyleGroup: strategy.aiArtStyleGroup
  };
}

// --- 3. PROMPT CONSTRUCTION ---

function buildPromptFromSpec(spec: ConceptSpec): string {
  const p = spec;
  const ratio = p.camera_settings.aspect_ratio || "1:1";
  
  return `
    **Role:** Expert Advertising Designer.
    **Task:** Create a high-converting ad visual for App Store / Facebook.
    
    **CONCEPT SPECIFICATIONS:**
    - **Layout Structure:** ${p.layout.layout_type} (${p.meta.layout_id}).
    - **Aspect Ratio:** ${ratio}.
    - **Market Style:** ${p.visual.color_palette} palette with a ${p.visual.mood} mood.
    - **Lighting:** ${p.visual.lighting}.
    - **Background:** ${p.visual.background_style} (STRICTLY FOLLOW THIS).
    ${p.cartoonStyleGroup ? `- **Target Style:** ${p.cartoonStyleGroup} Cartoon Style.` : ''}
    ${p.aiArtStyleGroup ? `- **Target Style:** ${p.aiArtStyleGroup} Art Style.` : ''}
    
    **CONTENT:**
    1. **Main Subject:** ${p.meta.topic}.
    2. **Before State:** ${p.layout.before_section}
    3. **After State:** ${p.layout.after_section}
    4. **Transformation:** ${p.layout.flow_visual.style}.
    
    **UI & TEXT:**
    ${p.mobile_ui.use_phone_frame ? "- Show a modern generic Android phone frame." : "- NO phone frame."}
    - Headline: "${p.text_overlay.headline}" (Legible, ${p.text_overlay.style}).
    - Subtext: "${p.text_overlay.subheadline}".
    - Badge: Google Play Store badge at ${p.branding.badge_position}.
    
    **EXECUTION GUIDELINES:**
    - Ensure "Before" vs "After" contrast is exaggerated.
    - Tier: ${p.meta.market_tier}.
    - High resolution, photorealistic render.
  `;
}

// --- 4. MAIN GENERATOR (ASYNC) ---

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function generateConceptsForLayout(input: GeneratorInput): Promise<{ input: GeneratorInput; concepts: Concept[] }> {
  const { featureFocus, layoutId, marketTier, insight, angle, aspectRatio } = input;
  
  // DETERMINE BATCH SIZE
  // Restore/Enhance = 5 categories (Family, Wedding...)
  // Cartoon/AI Art = 5 categories (Anime, Chibi...)
  // Others = 4
  const isRestoreOrEnhance = featureFocus === FeatureFocus.RESTORE || featureFocus === FeatureFocus.ENHANCE;
  const isCartoonOrArt = featureFocus === FeatureFocus.CARTOON || featureFocus === FeatureFocus.AI_ART;
  
  const TOTAL_CONCEPTS = (isRestoreOrEnhance || isCartoonOrArt) ? 5 : 4;
  
  // 1. Layout Selection Logic
  let selectedLayouts: LayoutConfig[] = [];
  const availableLayouts = Object.values(LAYOUTS).filter(l => l.feature === featureFocus);
  
  if (layoutId === 'mixed_all') {
    if (availableLayouts.length === 0) throw new Error(`No layouts for ${featureFocus}`);
    
    // --- "WINNING FORMULA" LOGIC ---
    // If Cartoon or AI Art, PRIORITY LAYOUTS MUST BE INCLUDED FIRST
    if (featureFocus === FeatureFocus.CARTOON || featureFocus === FeatureFocus.AI_ART) {
        // Priority: Burst & Flow
        const priorityLayouts = availableLayouts.filter(l => 
            l.id === 'cartoon_burst_multi_panel' || 
            l.id === 'cartoon_flow_transformation'
        );

        if (priorityLayouts.length > 0) {
            // Fill first slots with Priority layouts
            priorityLayouts.forEach(l => selectedLayouts.push(l));
        }

        // Add other hero layouts
        const heroLayouts = availableLayouts.filter(l => 
            !priorityLayouts.includes(l) &&
            (l.id.includes('split_android') || l.id.includes('phone_multi'))
        );
        
        for (const h of heroLayouts) {
            if (!selectedLayouts.includes(h)) {
                selectedLayouts.push(h);
            }
        }
    }

    // Fill the rest with remaining layouts
    for (const layout of availableLayouts) {
        if (!selectedLayouts.includes(layout)) {
             selectedLayouts.push(layout);
        }
    }

    // If still empty (edge case), fill with available
    if (selectedLayouts.length === 0) {
        selectedLayouts = [...availableLayouts];
    }

    // Shuffle and pick
    selectedLayouts = shuffleArray(selectedLayouts).slice(0, TOTAL_CONCEPTS);

  } else {
    // Specific Layout Selected
    const target = availableLayouts.find(l => l.id === layoutId);
    if (!target) throw new Error(`Layout ${layoutId} not found`);
    // Repeat the same layout for all generated concepts
    selectedLayouts = Array(TOTAL_CONCEPTS).fill(target);
  }

  // 2. Generate Strategies (The Creative Brain)
  const strategies = await generateBatchStrategies(input);
  
  // 3. Merge Strategies with Layouts
  const finalConcepts: Concept[] = [];
  
  // Generate concepts based on available slots
  for (let i = 0; i < TOTAL_CONCEPTS; i++) {
      const layout = selectedLayouts[i];
      // Use AI strategy if available, else fallback
      // SAFEGUARD: Ensure strategies exists and index is valid
      const strategy = (strategies && strategies.length > i && strategies[i]) 
          ? strategies[i] 
          : { ...getFallbackStrategy(featureFocus, angle, analyzeMarketProfile(marketTier)), topic: `Concept ${i+1}`, before_description: layout.beforeStyle, after_description: layout.afterStyle };

      const spec = buildSpecFromStrategy({
          featureFocus,
          layout,
          marketTier,
          insight,
          angle,
          aspectRatio, // Ensure passed here
          strategy: strategy as AIStrategy
      });

      finalConcepts.push({
          id: i + 1,
          name: strategy.topic || `Concept ${i + 1}`,
          featureFocus,
          layoutId: layout.id,
          topic: strategy.topic || "Generated Concept",
          jsonSpec: spec,
          prompt: buildPromptFromSpec(spec),
          notes: strategy.rationale || "AI Generated Strategy",
          rationale: strategy.rationale
      });
  }

  return { input, concepts: finalConcepts };
}