import { GoogleGenAI, Type } from "@google/genai";
import { ConceptSpec, AIStrategy, GeneratorInput, FeatureFocus } from "../types";
import { RESTORE_ENHANCE_CATEGORIES, CARTOON_STYLE_CATEGORIES, AI_ART_STYLE_CATEGORIES } from "../constants";

// NOTE: We do NOT initialize 'ai' globally here. 
// We initialize it inside each function to ensure it picks up the process.env.API_KEY 
// *after* the user has selected it via the UI dialog.

// --- GEN Z SLOT MACHINE ARRAYS ---
const GENZ_SUBJECTS = [
    "young girl with pink dyed hair tips", "cool guy with messy fluffy hair", "girl wearing oversized hoodie",
    "guy with silver chain necklace", "girl with beanie and round glasses", "androgynous person with septum piercing",
    "girl with space buns hairstyle", "guy with backward cap", "girl with messy bun and scrunchie",
    "trendy girl with headphones around neck"
];

const GENZ_LOCATIONS = [
    "in a neon-lit bedroom with LED strips", "at a bubble tea shop", "on a subway train",
    "in front of a bathroom mirror", "on a rooftop at sunset", "in a grocery store aisle",
    "at a concert crowd", "in a cozy cafe corner", "on a street at night with city lights",
    "in a messy dorm room"
];

const GENZ_ACTIONS = [
    "taking a mirror selfie", "drinking iced coffee", "doing a peace sign",
    "adjusting hair", "looking at phone", "laughing naturally",
    "winking at camera", "holding a snack", "posing with headphones on",
    "looking away candidly"
];

const ART_DIRECTIONS = [
    "Candid Snapshot (0.5x wide angle)", "Cinematic Portrait (Bokeh)", "Flash Photography (Direct)",
    "Soft Natural Light (Golden Hour)", "Neon Cyberpunk Glow", "Minimalist Clean",
    "Fish-eye Lens Effect", "Disposable Camera Vibe"
];

// --- UTILS: RETRY LOGIC ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    baseDelay: number = 2000
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            // PARSE ERROR: Handle both Error objects and raw JSON responses like { error: { code: ... } }
            const nestedError = error.error || {};
            const msg = (error.message || nestedError.message || JSON.stringify(error)).toString();
            const status = error.status || error.code || nestedError.code || nestedError.status;

            // Check for Rate Limit (429), Resource Exhausted
            const isRateLimit = status === 429 || 
                                status === 'RESOURCE_EXHAUSTED' || 
                                msg.includes('429') ||
                                msg.includes('quota') ||
                                msg.includes('RESOURCE_EXHAUSTED');
            
            // Check for Overloaded (503)
            const isOverloaded = status === 503 || msg.includes('overloaded') || msg.includes('UNAVAILABLE');

            // Check for 499 Cancelled (Client closed request or timeout)
            const isCancelled = status === 499 || status === 'CANCELLED' || msg.includes('cancelled') || msg.includes('CANCELLED');

            if ((isRateLimit || isOverloaded || isCancelled) && i < maxRetries - 1) {
                // SMART RETRY: Check if the error message tells us exactly how long to wait
                // Message format example: "Please retry in 26.30078568s."
                const retryMatch = msg.match(/retry in ([0-9.]+)s/);
                let delayTime = 0;

                if (retryMatch && retryMatch[1]) {
                    const requestedWait = parseFloat(retryMatch[1]);
                    // Add 1 second buffer to be safe
                    delayTime = Math.ceil(requestedWait * 1000) + 1000;
                    console.warn(`API Quota Exceeded. Waiting ${Math.round(delayTime/1000)}s as requested...`);
                } else {
                    // Exponential backoff + Jitter
                    const jitter = Math.random() * 1000;
                    delayTime = (baseDelay * Math.pow(2, i)) + jitter;
                    console.warn(`API Error (${status}). Retrying in ${Math.round(delayTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
                }
                
                await wait(delayTime);
                continue;
            }
            
            throw error;
        }
    }
    throw lastError;
}

// --- HELPER: ROBUST JSON PARSER & REPAIR ---
function tryParseAndRepairJson(text: string): AIStrategy[] {
    if (!text) return [];

    // 1. Clean markdown code blocks if present
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        // Attempt standard parse
        const result = JSON.parse(clean);
        return Array.isArray(result) ? result as AIStrategy[] : [];
    } catch (e) {
        console.warn("Standard JSON Parse failed. Attempting repair...");

        // 2. Handle Truncated JSON Array
        // If it starts with [ but doesn't end with ], it's likely cut off.
        if (clean.startsWith('[') && !clean.endsWith(']')) {
            // Find the last closing object brace '}'
            const lastObjEnd = clean.lastIndexOf('}');
            
            if (lastObjEnd !== -1) {
                // Slice everything after the last '}' and append ']'
                const repaired = clean.substring(0, lastObjEnd + 1) + ']';
                try {
                    const result = JSON.parse(repaired);
                    if (Array.isArray(result)) {
                        console.log("JSON Repaired successfully.");
                        return result as AIStrategy[];
                    }
                } catch (e2) {
                    console.warn("Repair attempt 1 failed.");
                }

                // Aggressive Repair: If the last object was also malformed, try the one before it
                const secondLastObjEnd = clean.lastIndexOf('}', lastObjEnd - 1);
                if (secondLastObjEnd !== -1) {
                    const repaired2 = clean.substring(0, secondLastObjEnd + 1) + ']';
                    try {
                        const result = JSON.parse(repaired2);
                        if (Array.isArray(result)) return result as AIStrategy[];
                    } catch (e3) {
                        console.warn("Repair attempt 2 failed.");
                    }
                }
            }
        }
        
        console.warn("JSON Repair Failed or no complete objects found. Returning empty list to trigger fallback.");
        return [];
    }
}

// --- HELPER: STRICT STYLE RULES ---
function getDistinctStyleRules(feature: string, layoutId: string): string {
    const f = feature.toLowerCase();
    const lid = layoutId.toLowerCase();
    
    // --- RESTORE & ENHANCE RULES (6-STEP FRAMEWORK) ---
    if (f.includes('restore') || f.includes('enhance')) {
        
        let visualStoryParams = "";
        
        // VISUAL STORY: SPLIT VIEW (With Torn Paper for Restore)
        if (lid.includes('split')) {
            const isRestore = f.includes('restore');
            const splitType = isRestore ? "RIPPED PAPER EDGE" : "SHARP VERTICAL LINE";
            
            // STRICT BEFORE DEFINITION
            const beforeDef = isRestore 
                ? "Sepia, Scratched, Torn, Faded, Real Old Photo Texture" 
                : "Pixelated, Low-Res, Motion Blur, Noise (Realistic Bad Photo)";

            visualStoryParams = `
            - **LAYOUT:** 50/50 Split Vertical with a **${splitType}**.
            - **CONTINUITY PROTOCOL:** This is ONE SINGLE PHOTO. You must NOT generate two different people.
            - **LEFT SIDE:** The LEFT half is the **${beforeDef}** version of the subject.
            - **RIGHT SIDE:** The RIGHT half is the **RESTORED (HD, Color, Smooth)** version of the EXACT SAME subject.
            - **ALIGNMENT:** The nose, eyes, mouth, and body lines must align PERFECTLY across the split line.
            `;
        } 
        // VISUAL STORY: HAND HOLDING (POV)
        else if (lid.includes('hand') || lid.includes('holding')) {
            visualStoryParams = `
            - **LAYOUT:** First Person POV.
            - **FOREGROUND:** A hand holding a physical **CRUMPLED and TORN** old photo print.
            - **PHOTO CONTENT:** The photo inside the print shows a person in Black & White/Sepia.
            - **BACKGROUND:** The REAL person (the same subject from the photo) standing in the background in full color and HD.
            - **POSE MATCH:** The pose in the photo and the background must be IDENTICAL. It creates a "Window to the Past" effect.
            `;
        }
        // VISUAL STORY: DUAL FRAMES
        else if (lid.includes('frame')) {
            visualStoryParams = `
            - **LAYOUT:** Two identical photo frames sitting side-by-side on a wooden table.
            - **LEFT FRAME:** Contains the subject in OLD condition (faded, sepia, scratch, water damaged).
            - **RIGHT FRAME:** Contains the EXACT SAME SUBJECT in NEW condition (vivid, restored, HD).
            - **POSE:** The subject must be in the EXACT same pose in both frames.
            `;
        }
        else {
             // Fallback for generic Enhance/Restore
             visualStoryParams = `
             - **LAYOUT:** Split comparison.
             - **SUBJECT:** ONE SUBJECT ONLY.
             - **LEFT:** Old/Blurry.
             - **RIGHT:** New/HD.
             - **ALIGNMENT:** Perfect symmetry.
             `;
        }

        return `
        **STRICT RESTORE/ENHANCE FRAMEWORK:**
        1. **PRINCIPLE:** "ONE SUBJECT – TWO STATES". 
        2. **VISUAL STORY:** ${visualStoryParams}
        3. **LIGHTING:** Golden Hour or Cinematic Bokeh to highlight the "After" state.
        4. **BACKGROUND:** If topic is Wedding -> Blurred Luxury Venue/Lights. If Family -> Blurred Nature/Home. (Keep it generic "Bokeh" style).
        `;
    }
    
    // --- CARTOON/ANIME & PRIORITY LAYOUTS ---
    if (f.includes('cartoon') || f.includes('anime')) {
         
         // SPECIAL PRIORITY LAYOUT: BURST MULTI-PANEL
         if (lid.includes('burst') || lid.includes('multi_panel')) {
             return `
             **STRICT LAYOUT: BURST MULTI-PANEL COLLAGE**
             - **COMPOSITION:** Left Side (40%) = Real Human. Center = Energy Burst. Right Side (60%) = Tilted Panels.
             - **LEFT:** Photorealistic portrait of the subject. Neon lighting.
             - **CENTER:** A comic book style "Zap" or "Burst" effect (lightning, zigzag lines).
             - **RIGHT:** A dynamic collage of 3 tilted panels. 
             - **RIGHT CONTENT:** Each panel shows the SAME SUBJECT but in a different style: 1. Anime Style, 2. Chibi Style, 3. Western Cartoon Style.
             - **BACKGROUND:** Dark Cyberpunk Neon / Halftone pattern.
             - **NO TEXT:** Do not generate any text or UI overlays.
             `;
         }
         
         // SPECIAL PRIORITY LAYOUT: FLOW STREAM
         if (lid.includes('flow') || lid.includes('stream')) {
             return `
             **STRICT LAYOUT: FLOW TRANSFORMATION STREAM**
             - **COMPOSITION:** Horizontal flow from Left to Right.
             - **LEFT:** Real human selfie/portrait (Neon lighting).
             - **MIDDLE:** A flowing, glowing energy stream (magical particles/halftone dots) moving right.
             - **RIGHT:** Three distinct characters emerging from the stream, getting smaller in perspective.
             - **RIGHT STYLES:** 1. Classic Anime (Large eyes), 2. Schoolgirl Anime, 3. Cute Chibi.
             - **CONTINUITY:** All 3 anime characters must clearly be the SAME person as the one on the left.
             - **BACKGROUND:** Nightclub Neon / Cyberpunk City Blur.
             `;
         }

         return `
        **STRICT CARTOON/ANIME RULES (STYLE TRANSFER):**
        - **BEFORE Section:** REAL PHOTOGRAPH. Realistic skin texture, natural lighting. NO DRAWING.
        - **AFTER Section:** Flat 2D Cartoon/Anime style (Ghibli/Webtoon) OR 3D Cartoon style (Pixar) depending on specific style request.
        - **CONTINUITY:** The pose, expression, and hair shape must be IDENTICAL between the real and cartoon versions.
        - **TRANSITION:** The transition must be sharp. Real Reality vs Drawn Reality.
        `;
    }
    
    if (f.includes('three_d') || f.includes('3d')) {
        return `
       **STRICT 3D RULES (DIMENSIONALITY):**
       - **BEFORE Section:** Flat 2D REAL PHOTO.
       - **AFTER Section:** High-fidelity 3D Render (Pixar/Clay style).
       - **CONTINUITY:** Same character, same pose, just different dimensionality.
       `;
   }

   if (f.includes('polaroid')) {
        return `
       **STRICT POLAROID RULES (PHYSICALITY):**
       - The image must look like a PHYSICAL OBJECT (Instant Print) lying on a surface or hanging.
       - It is NOT just a white border. It needs shadows and texture of paper.
       `;
   }
    
    if (f.includes('art') || f.includes('ai_art')) {
         return `
        **STRICT AI ART RULES:**
        - **BEFORE:** Normal, raw camera photo.
        - **AFTER:** Digital Art/Painting Masterpiece.
        - **CONTINUITY:** Maintain the exact composition and subject outline of the original.
        `;
    }

    if (f.includes('all_in_one') || f.includes('allinone')) {
        
        let allInOneSpecifics = "";
        
        if (lid.includes('scrapbook')) {
             allInOneSpecifics = `
             **LAYOUT: DIGITAL SCRAPBOOK SPLIT**
             - **LEFT SIDE:** A digital screen UI (Tablet/iPad) showing a file selection grid. Icons of folders or image thumbnails.
             - **RIGHT SIDE:** A highly textured SCRAPBOOK PAGE. 
             - **DETAILS:** Use physical elements like Washi Tape strips, cute stickers, handwritten scribbles/notes, and paper texture.
             - **TRANSITION:** A magical flow from the digital screen into the physical paper page.
             `;
        } else if (lid.includes('life_story') || lid.includes('card')) {
             allInOneSpecifics = `
             **LAYOUT: LIFE STORY CARD**
             - **LEFT SIDE:** A hand holding a smartphone. The phone screen displays a RAW photo.
             - **RIGHT SIDE:** A designed VERTICAL MEMORY CARD sitting on a table.
             - **DETAILS:** The card features the SAME photo but stylized with elegant typography ('Our Day', dates), borders, and sentimental graphics.
             - **BACKGROUND:** Soft, cozy, textured surface (wood or linen).
             `;
        } else {
             allInOneSpecifics = `
             **LAYOUT: MESSY GALLERY TO MASTERPIECE**
             - **BEFORE:** Smartphone UI showing a cluttered, unorganized Camera Roll.
             - **AFTER:** A Final Exported Design (Moodboard/Collage) ready for Instagram.
             `;
        }

        return `
        **STRICT ALL-IN-ONE RULES (MESSY DATA TO EMOTIONAL STORY):**
        - **CONCEPT:** Transform "Digital Clutter" into "Curated Memories".
        ${allInOneSpecifics}
        - **GOAL:** Show that the App organizes and beautifies life moments instantly.
        `;
   }
    
    return "";
}

// --- HEALTH CHECK ---
export async function checkApiConnection(): Promise<{ status: 'ok' | 'quota' | 'error', message?: string, latency?: number }> {
    if (!process.env.API_KEY) return { status: 'error', message: 'No API Key' };
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const start = Date.now();
    try {
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "ping",
            config: { maxOutputTokens: 1 }
        });
        const latency = Date.now() - start;
        return { status: 'ok', latency };
    } catch (error: any) {
        const nestedError = error.error || {};
        const msg = (error.message || nestedError.message || JSON.stringify(error)).toString();
        const status = error.status || error.code || nestedError.code || nestedError.status;

        if (status === 429 || msg.includes('429') || msg.includes('quota')) {
            return { status: 'quota', message: 'Rate Limit Exceeded' };
        }
        
        return { status: 'error', message: msg };
    }
}

// --- COPYWRITING ---
export async function generateMarketingCopy(spec: ConceptSpec): Promise<string> {
  // Always create a fresh instance to get the latest key
  if (!process.env.API_KEY) {
    return "Error: No API Key selected. Please click 'Select API Key' in the top right.";
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const model = "gemini-2.5-flash"; 
  const angle = spec.meta.angle || "General Appeal";

  // CORE LOGIC CHANGE: The copy tone is now dictated by the ANGLE, not the Feature.
  const prompt = `
    Role: Senior Copywriter.
    Context: Write an ad headline and short body text for an AI Photo App feature: "${spec.meta.feature_focus}".
    
    **CRITICAL DIRECTION - FOLLOW THE USER ANGLE:**
    The user has specified the Creative Angle: "${angle}".
    
    1. If Angle is **"Emotional/Nostalgic"**: Write about memories, love, timeless moments.
    2. If Angle is **"Professional/Business"**: Write about clarity, success, looking sharp.
    3. If Angle is **"Funny/Witty"**: Be humorous, make a joke about the bad quality photo.
    4. If Angle is **"Fast/Tech"**: Focus on speed, AI power, instant results.
    
    **DO NOT DEFAULT TO "WEDDING" OR "FAMILY" UNLESS THE ANGLE OR TOPIC SPECIFICALLY ASKS FOR IT.**
    
    Specs:
    - Topic: ${spec.meta.topic}
    - Insight: ${spec.meta.insight}
    
    Output Format:
    Headline: [Punchy, max 6 words]
    Body: [1 sentence, benefit driven]
    
    Return ONLY plain text.
  `;

  try {
    const response = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Copy Error:", error);
    return "Failed to generate copy. Rate limit or network error.";
  }
}

// --- IMAGE GENERATION ---
export async function generateConceptImage(spec: ConceptSpec, customGuidance?: string): Promise<string | null> {
    // Always create a fresh instance to get the latest key
    if (!process.env.API_KEY) {
        console.error("No API Key");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // INJECT STRICT RULES BASED ON FEATURE
    const distinctStyleRules = getDistinctStyleRules(spec.meta.feature_focus, spec.meta.layout_id);

    // EXTRACT ASPECT RATIO FROM SPEC OR DEFAULT TO 1:1
    const targetAspectRatio = spec.camera_settings.aspect_ratio || "1:1";

    // DYNAMIC BACKGROUND RULE
    // If the topic isn't explicitly about a wedding or ceremony, we FORBID wedding backgrounds.
    const isWeddingTopic = spec.meta.topic.toLowerCase().includes('wedding') || 
                           spec.meta.topic.toLowerCase().includes('bride') ||
                           spec.meta.topic.toLowerCase().includes('groom');
                           
    const negativePrompt = isWeddingTopic 
        ? "" 
        : "**NEGATIVE PROMPT/FORBIDDEN:** floral arch, wedding decorations, flowers in background, altar, wedding aisle. DO NOT USE THESE.";

    // DAMAGE BOOSTER (BEFORE STATE)
    const damageInstruction = (spec.meta.feature_focus === FeatureFocus.RESTORE) 
        ? "**CRITICAL BEFORE STATE (RUINED):** The 'Before' section MUST look GENUINELY RUINED. Add heavy white scratches, physical tears on the paper edges, deep creases, water stains, and severe fading. It needs to look like a piece of trash found in a dump that is about to be saved."
        : "";
    
    // QUALITY BOOSTER (AFTER STATE)
    const qualityInstruction = `
    **CRITICAL AFTER STATE (PERFECT):** 
    The 'After' section must be 8K resolution, sharp focus, vibrant colors, and smooth texture.
    - If subject is a **PERSON**: Skin must be smooth, eyes sharp, no blur.
    - If subject is a **PET**: Fur must be individually visible, eyes glistening, wet nose detail.
    - If subject is **TRAVEL/LANDSCAPE**: Every leaf, building, and cloud must be sharp. NO ATMOSPHERIC BLUR.
    `;

    // USER OVERRIDE INJECTION
    const userOverride = customGuidance ? `
    **USER FEEDBACK / CRITICAL REFINEMENT (PRIORITY 1):**
    The user has explicitly requested this correction. You MUST prioritize this over standard rules:
    "${customGuidance}"
    ` : "";

    // --- TEXT OVERLAY INSTRUCTION (NATIVE ADVERTISING STYLE) ---
    // Instead of forbidding text, we command it to match the vibe.
    let textStyle = "standard";
    if (spec.meta.feature_focus === FeatureFocus.RESTORE) textStyle = "Old Faded Rubber Stamp Ink (Grungy)";
    if (spec.meta.feature_focus === FeatureFocus.ENHANCE) textStyle = "Digital HUD or Sleek Modern Sans-Serif";
    if (spec.meta.feature_focus === FeatureFocus.CARTOON) textStyle = "Comic Book Bubble or Manga Text";
    if (spec.meta.feature_focus === FeatureFocus.AI_ART) textStyle = "Elegant Artistic Signature style";

    const textOverlayInstruction = `
    **INTEGRATED TEXT LABELS (MANDATORY):**
    - You MUST incorporate the text label "BEFORE" into the Left/Top 'Before' section.
    - You MUST incorporate the text label "AFTER" into the Right/Bottom 'After' section.
    - **STYLE MATCHING:** The text must NOT look like a flat UI overlay. It must be **${textStyle}** integrated into the scene.
    - **PLACEMENT:** Place labels where they are legible but do not obscure the face.
    - **SPELLING:** Ensure "BEFORE" and "AFTER" are spelled correctly.
    `;

    // --- GEN Z SLOT MACHINE LOGIC (OVERRIDE FOR CARTOON/ART) ---
    // Pre-roll a random Gen Z scenario to ensure variety and realistic "Before" states
    let beforePrompt = spec.layout.before_section;
    let afterPrompt = spec.layout.after_section;

    if (spec.meta.feature_focus === FeatureFocus.CARTOON || spec.meta.feature_focus === FeatureFocus.AI_ART) {
        const subject = GENZ_SUBJECTS[Math.floor(Math.random() * GENZ_SUBJECTS.length)];
        const location = GENZ_LOCATIONS[Math.floor(Math.random() * GENZ_LOCATIONS.length)];
        const action = GENZ_ACTIONS[Math.floor(Math.random() * GENZ_ACTIONS.length)];
        const artDir = ART_DIRECTIONS[Math.floor(Math.random() * ART_DIRECTIONS.length)];
        const seed = Math.floor(Math.random() * 1000000);

        // Override Before Prompt with Slot Machine Result
        beforePrompt = `
        **REAL PHOTO / GEN Z STYLE SNAPSHOT:**
        A ${subject} is ${action} ${location}.
        - **ART DIRECTION:** ${artDir}.
        - **VIBE:** Candid, natural, relatable, raw camera capture.
        - **LIGHTING:** Neon/Environmental lighting suitable for Gen Z aesthetic.
        - **SEED:** ${seed} (Ensure random variety).
        `;
        
        // Ensure continuity in After Prompt by referencing the generated subject
        afterPrompt = `
        ${spec.layout.after_section}.
        **CONTINUITY CHECK:**
        - The character in the art style MUST be the SAME person as defined in the 'Before' section: ${subject}.
        - MUST maintain the same pose: ${action}.
        - MUST keep key features (e.g. glasses, hair color, accessories) but translated into the art style.
        `;
    }

    // CORE CONTINUITY PROTOCOL
    // This is the "Brain" of the image generation logic.
    const prompt = `
    You are an expert Advertising Photographer and CGI Artist.
    
    **TASK:** Create a SINGLE coherent image demonstrating a "Before & After" effect for an app.
    
    ${userOverride}

    **CRITICAL CONTINUITY PROTOCOL (MUST FOLLOW):**
    - **SAME PHOTO RULE:** Imagine you have ONE SINGLE PHOTO. You are simply applying a "Bad Filter" to one half and a "Good Filter" to the other half.
    - **GEOMETRY LOCK:** The subject's nose, eyes, shoulders, and background elements MUST be in the exact same X,Y coordinates on both sides.
    - **NO SPLIT PERSONALITIES:** Do NOT generate two different people side-by-side. It must look like one person being revealed.
    - **BEFORE SIDE (RAW):** Must look like a RAW, UNFILTERED, REAL CAMERA PHOTO. No neon, no painting style, no fake effects (unless specifically asked).
    - **AFTER SIDE (PROCESSED):** Must look like the High-End Final Result (Restored, Cartoonized, or Enhanced).
    
    **CONTENT SPECIFICATION:**
    - **Topic:** ${spec.meta.topic} (Must match the User's Angle: ${spec.meta.angle}).
    - **Before State (Left/Top):** ${beforePrompt}
    - **After State (Right/Bottom):** ${afterPrompt}
    - **Background:** ${spec.visual.background_style}
    ${spec.cartoonStyleGroup ? `- **STYLE CONSTRAINT:** Apply STRICT ${spec.cartoonStyleGroup} style to the After section.` : ''}
    ${spec.aiArtStyleGroup ? `- **STYLE CONSTRAINT:** Apply STRICT ${spec.aiArtStyleGroup} style to the After section.` : ''}
    
    ${damageInstruction}
    ${qualityInstruction}
    ${textOverlayInstruction}

    **STRICT BACKGROUND RULE:**
    - The background MUST match the context of the Subject.
    - If Subject is a "Professional", background must be Office/City.
    - If Subject is "Casual", background must be Street/Park/Home.
    - ${negativePrompt}
    
    ${distinctStyleRules}

    **COMPOSITION:**
    - Shot Type: ${spec.camera_settings.shot_type}
    - **ASPECT RATIO:** ${targetAspectRatio} (Ensure composition fits this ratio).
    - **HEADER AREA:** Leave top 15% clear (clean background) for Headline text overlay.
    - **FOOTER AREA:** Leave bottom 20% ABSOLUTELY CLEAN. NO TEXT, NO LOGOS, NO ICONS GENERATED BY AI.
    - **CLEAN ZONES:** DO NOT place any text, icons, buttons, or watermarks in the bottom left or bottom right corners. These areas are reserved for the app UI.
    
    **NEGATIVE PROMPT:**
    NO WATERMARKS, NO SIGNATURES, NO FAKE UI BUTTONS, NO WEIRD GLYPHS IN CORNERS, NO SPLIT SCREEN BORDERS WITH TEXT, NO DIFFERENT PEOPLE.
    
    Render high fidelity, 8k resolution.
    `;

    try {
        // DIRECT CALL TO GEMINI 3 PRO IMAGE (NANO BANANA PRO)
        // Wrapped in Try/Catch to fallback to Flash if overloaded
        const response = await retryOperation(async () => {
            return await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview', 
                contents: {
                    parts: [
                        { text: prompt }
                    ]
                },
                config: {
                    imageConfig: {
                        aspectRatio: targetAspectRatio, // UPDATED: Dynamic Aspect Ratio
                        imageSize: "1K" // Supported only in Pro models
                    }
                }
            });
        }, 3, 2000); // Standard retry logic

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;

    } catch (error) {
        console.warn("Pro Model Failed or Overloaded. Attempting Fallback to Flash...", error);
        
        // FALLBACK: GEMINI 2.5 FLASH IMAGE (NANO BANANA)
        try {
             const response = await retryOperation(async () => {
                return await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image', // Fallback model
                    contents: { parts: [{ text: prompt }] },
                    // Flash model doesn't support imageSize/aspectRatio config reliably, so we rely on the Prompt
                });
            }, 2, 2000); // Fewer retries for fallback

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } catch (fallbackError) {
             console.error("Fallback Image Gen also failed:", fallbackError);
             return null;
        }
        return null;
    }
}

// --- STRATEGY BRAINSTORMING (THE BRAIN) ---
export async function generateBatchStrategies(input: GeneratorInput): Promise<AIStrategy[] | null> {
    // Always create a fresh instance to get the latest key
    if (!process.env.API_KEY) {
        console.error("No API Key");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    // --- CHECK FOR RESTORE/ENHANCE MODE ---
    const isRestoreOrEnhance = input.featureFocus === FeatureFocus.RESTORE || input.featureFocus === FeatureFocus.ENHANCE;
    const isCartoon = input.featureFocus === FeatureFocus.CARTOON;
    const isAiArt = input.featureFocus === FeatureFocus.AI_ART;

    let instructions = "";
    let count = 4;
    
    if (isRestoreOrEnhance) {
        count = 5; // We want exactly 5 categories for restore/enhance
        
        // Build a highly specific prompt string based on the predefined categories
        const categoryRequirements = RESTORE_ENHANCE_CATEGORIES.map((cat, index) => {
            return `
            CATEGORY ${index + 1}: ${cat.title} (${cat.id})
            - Tone: ${cat.tone}
            - Allowable Subjects: ${cat.subjects.join(", ")}
            - ALLOWABLE HEADLINES (Pick one): "${cat.headlines.join('", "')}"
            `;
        }).join("\n");

        instructions = `
        **MODE: RESTORE/ENHANCE MEMORY RECOVERY**
        
        **STRICT INSTRUCTION:** You MUST generate exactly 5 distinct concepts, one for each of the following defined categories.
        
        ${categoryRequirements}
        
        **USER OVERRIDE (ANGLE):**
        The user has provided the angle: "${input.angle}".
        - If the angle is generic (e.g. empty or "General"), stick STRICTLY to the categories above.
        - If the user provided a specific angle (e.g., "Funny" or "Scary"), you must ADAPT the categories above to match that angle (e.g., "Funny Family Memory", "Scary Wedding Photo"), but KEEP the 5 distinct categories (Family, Wedding, Child, Travel, Pet).
        `;

    } else if (isCartoon) {
        count = 5; // 5 Defined Styles
        const categoryRequirements = CARTOON_STYLE_CATEGORIES.map((cat, index) => {
            return `
            CATEGORY ${index + 1}: ${cat.title} (${cat.id})
            - Visual Style: ${cat.style_desc}
            - Suggested Subjects: ${cat.subjects.join(", ")}
            `;
        }).join("\n");

        instructions = `
        **MODE: CARTOON STYLE TRANSFER**
        **STRICT INSTRUCTION:** You MUST generate exactly 5 distinct concepts, one for each of the following styles.
        
        ${categoryRequirements}
        
        For each concept, set "cartoonStyleGroup" to the exact ID (e.g., "Anime", "Chibi").
        `;

    } else if (isAiArt) {
        count = 5; // 5 Defined Styles
        const categoryRequirements = AI_ART_STYLE_CATEGORIES.map((cat, index) => {
            return `
            CATEGORY ${index + 1}: ${cat.title} (${cat.id})
            - Visual Style: ${cat.style_desc}
            - Suggested Subjects: ${cat.subjects.join(", ")}
            `;
        }).join("\n");

        instructions = `
        **MODE: AI ART CREATION**
        **STRICT INSTRUCTION:** You MUST generate exactly 5 distinct concepts, one for each of the following styles.
        
        ${categoryRequirements}
        
        For each concept, set "aiArtStyleGroup" to the exact ID (e.g., "OilPainting", "Cyberpunk").
        `;

    } else {
        // --- STANDARD MODE (3D, POLAROID, ETC) ---
        count = 4;
        
        if (input.angle && input.angle.length > 2) {
            instructions = `
            **PRIORITY INSTRUCTION: FOLLOW THE USER'S ANGLE.**
            The user wants concepts with the angle: "${input.angle}".
            - If "Funny": Generate humorous situations.
            - If "Scary": Generate horror/dark concepts.
            - If "Professional": Generate LinkedIn/Corporate concepts.
            - IGNORE default assumptions. Stick to "${input.angle}".
            `;
        } else {
            instructions = "Focus on creative, viral, and trending visual styles. Diversify the subjects (People, Animals, Objects, Landscapes).";
        }
    }

    // UPDATED PROMPT: Requesting CONCISE details to prevent token limit truncation
    const prompt = `
    Role: Creative Strategist.
    Task: Brainstorm ${count} unique visual concepts for "${input.featureFocus}" feature.
    
    Context:
    - Market: ${input.marketTier}
    
    ${instructions}

    **CRITICAL FORBIDDEN RULE:**
    - DO NOT USE "Floral Arch" or "Wedding Decoration" as the background for every concept.
    - ONLY use floral/wedding backgrounds if the topic is specifically about a Wedding.
    - VARY THE LOCATIONS: Use City Streets, Cozy Living Rooms, Offices, Nature Landscapes, Beaches.

    **OUTPUT FORMATTING:**
    - STRICTLY JSON ONLY.
    - KEEP DESCRIPTIONS EXTREMELY CONCISE (Max 7 words per field).
    - DO NOT WRITE PARAGRAPHS.
    - DO NOT REPEAT THE SAME PHRASES.
    
    Output JSON array of objects:
    [
      {
        "topic": "Descriptive title (e.g. 'Blurred Dog running')",
        "headline": "Ad Headline matching the Category/Angle",
        "subheadline": "Benefit subtext",
        "visual_mood": "Visual vibe description",
        "lighting": "Lighting description",
        "background": "Background description (MUST BE SPECIFIC TO THE TOPIC)",
        "before_description": "Concise visual details (max 7 words)",
        "after_description": "Concise visual details (max 7 words)",
        "rationale": "Short reason (max 5 words)",
        "cartoonStyleGroup": "Only if Cartoon mode: Anime | Chibi | Comic | Hero | 3D",
        "aiArtStyleGroup": "Only if AI Art mode: OilPainting | Watercolor | Cyberpunk | Fantasy | Sketch"
      }
    ]
    `;

    try {
        const response = await retryOperation(async () => {
             return await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    // Optimized for Determinism and Conciseness
                    temperature: 0.5,
                    topK: 20,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topic: { type: Type.STRING },
                                headline: { type: Type.STRING },
                                subheadline: { type: Type.STRING },
                                visual_mood: { type: Type.STRING },
                                lighting: { type: Type.STRING },
                                background: { type: Type.STRING },
                                before_description: { type: Type.STRING },
                                after_description: { type: Type.STRING },
                                rationale: { type: Type.STRING },
                                cartoonStyleGroup: { type: Type.STRING },
                                aiArtStyleGroup: { type: Type.STRING }
                            }
                        }
                    }
                }
            });
        });

        // Use the robust parser
        return tryParseAndRepairJson(response.text);

    } catch (error) {
        console.error("Strategy Gen Error:", error);
        return null;
    }
}