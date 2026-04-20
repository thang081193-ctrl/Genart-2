import { FeatureFocus, LayoutConfig, CartoonStyleGroup, AiArtStyleGroup } from './types';

// UI CONFIGURATION FOR FEATURES
export const FEATURE_META: Record<FeatureFocus, { label: string; color: string; iconKey: string }> = {
    [FeatureFocus.RESTORE]: { label: 'Restore', color: 'amber', iconKey: 'history' },
    [FeatureFocus.ENHANCE]: { label: 'Enhance', color: 'cyan', iconKey: 'wand' },
    [FeatureFocus.AI_ART]: { label: 'AI Art', color: 'purple', iconKey: 'palette' },
    [FeatureFocus.THREE_D]: { label: '3D Vibe', color: 'emerald', iconKey: 'cube' },
    [FeatureFocus.CARTOON]: { label: 'Cartoon', color: 'pink', iconKey: 'smile' },
    [FeatureFocus.POLAROID]: { label: 'Polaroid', color: 'teal', iconKey: 'camera' },
    [FeatureFocus.ALL_IN_ONE]: { label: 'All-In-One', color: 'rose', iconKey: 'grid' },
};

// --- RESTORE & ENHANCE CATEGORIES ---
export const RESTORE_ENHANCE_CATEGORIES = [
  {
    id: "family",
    title: "FAMILY MEMORIES",
    subjects: ["parents when young", "old grandparents", "baby from the past", "family at Tet/Holidays", "scanned old album photo"],
    tone: "Warm, Nostalgic",
    headlines: [
      "Bring your family memories back to life",
      "Make old family photos clear again",
      "See your loved ones clearly again",
      "Let your family moments live again",
      "Keep precious family memories alive"
    ]
  },
  {
    id: "wedding",
    title: "WEDDING MEMORIES",
    subjects: ["film wedding photo", "blurry wedding ceremony", "vintage couple photo", "yellowed engagement/anniversary photo"],
    tone: "Romantic, Sentimental",
    headlines: [
      "Bring your wedding memories back to life",
      "Let your love look alive again",
      "Make your wedding moments beautiful again",
      "Restore the magic of your special day",
      "Your love deserves to be seen clearly"
    ]
  },
  {
    id: "childhood",
    title: "BABY & CHILDHOOD MEMORIES",
    subjects: ["me as a child (scanned)", "child when little", "kindergarten/school photo", "blurry baby photo"],
    tone: "Soft, Tender, Nostalgic",
    headlines: [
      "Bring your childhood memories back to life",
      "Make baby photos clear again",
      "Let your childhood moments shine again",
      "See those little moments clearly again",
      "Your childhood deserves to be remembered clearly"
    ]
  },
  {
    id: "travel",
    title: "TRAVEL & HOLIDAY MEMORIES",
    subjects: ["blurry selfie at beach", "couple hiking in mountains (unclear)", "night travel portrait", "festival street photo"],
    tone: "Uplifting, Nostalgic Joy",
    headlines: [
      "Bring your travel memories back to life",
      "Make your favorite trips clear again",
      "Let your travel moments shine again",
      "Revive the memories from your journeys",
      "See your best moments clearly again"
    ]
  },
  {
    id: "pet",
    title: "PET MEMORIES",
    subjects: ["close-up puppy face (blurry)", "old dog photo (faded)", "kitten playing (motion blur)", "sleeping pet (grainy)"],
    tone: "Emotional, Heartfelt",
    headlines: [
      "Bring your pet memories back to life",
      "See your furry friends clearly again",
      "Make old pet photos look alive again",
      "Restore the moments you shared",
      "Because every pet memory matters"
    ]
  }
];

// --- CARTOON STYLE CATEGORIES ---
export const CARTOON_STYLE_CATEGORIES: { id: CartoonStyleGroup; title: string; subjects: string[]; style_desc: string }[] = [
  {
    id: "Anime",
    title: "ANIME STYLE",
    subjects: ["school uniform portrait", "emotional girl looking at sky", "boy with headphones city background"],
    style_desc: "Japanese Anime (Ghibli/Shinkai), soft lighting, large expressive eyes, detailed background"
  },
  {
    id: "Chibi",
    title: "CHIBI STYLE",
    subjects: ["full body cute pose", "sitting on a giant chair", "holding a giant bubble tea"],
    style_desc: "Chibi Style, big head small body, super cute, kawaii, simple shading"
  },
  {
    id: "Comic",
    title: "COMIC STYLE",
    subjects: ["action pose", "shouting with speech bubble", "dynamic angle selfie"],
    style_desc: "American Comic Book, bold black outlines, half-tone dot patterns, vibrant primary colors"
  },
  {
    id: "Hero",
    title: "HERO STYLE",
    subjects: ["standing heroically on rooftop", "arms crossed confident look", "looking into horizon"],
    style_desc: "Superhero Comic Cover art, dramatic lighting, muscular definition, epic atmosphere"
  },
  {
    id: "3D",
    title: "3D CARTOON",
    subjects: ["friendly waving pose", "surprised expression", "holding a pet"],
    style_desc: "Pixar/Disney Style 3D, rounded features, soft clay-like rendering, warm lighting"
  }
];

// --- AI ART STYLE CATEGORIES ---
export const AI_ART_STYLE_CATEGORIES: { id: AiArtStyleGroup; title: string; subjects: string[]; style_desc: string }[] = [
  {
    id: "OilPainting",
    title: "OIL PAINTING",
    subjects: ["classic portrait", "woman in garden", "man in suit vintage"],
    style_desc: "Classic Oil Painting, visible brush strokes, rich texture, renaissance lighting"
  },
  {
    id: "Watercolor",
    title: "WATERCOLOR",
    subjects: ["dreamy profile face", "dancer in motion", "couple under umbrella"],
    style_desc: "Soft Watercolor, artistic splashes, pastel colors, paper texture, dreamy vibe"
  },
  {
    id: "Cyberpunk",
    title: "CYBERPUNK",
    subjects: ["person with neon glasses", "hoodie in rain", "futuristic armor"],
    style_desc: "Cyberpunk 2077 style, neon lights, high contrast, futuristic tech elements, chromatic aberration"
  },
  {
    id: "Fantasy",
    title: "FANTASY RPG",
    subjects: ["elf ears portrait", "holding a glowing staff", "forest ranger outfit"],
    style_desc: "Fantasy RPG Character art, ethereal glow, magical particles, detailed costume"
  },
  {
    id: "Sketch",
    title: "PENCIL SKETCH",
    subjects: ["rough face study", "architectural background", "messy hair portrait"],
    style_desc: "Graphite Pencil Sketch, rough lines, cross-hatching, monochromatic artistic look"
  }
];

export const TOPICS: Record<FeatureFocus, string[]> = {
  [FeatureFocus.RESTORE]: [
    "whole family eating dinner together (1990s)",
    "kids playing in the mud messy and happy (vintage)",
    "father teaching child to ride bike (sepia)",
    "grandma laughing naturally in garden (faded)",
    "chaotic family picnic with food everywhere (torn)",
    "emotional bride crying hugging father (1980s)",
    "friends piling into an old car for roadtrip",
    "candid moment of mother braiding daughter's hair",
    "grandparents dancing awkwardly at party",
    "baby sleeping on father's chest (grainy b&w)"
  ],
  [FeatureFocus.ENHANCE]: [
    "bridesmaids laughing uncontrollably (motion blur)",
    "groom crying at the altar (out of focus)",
    "kids running around at wedding reception (blurry)",
    "friends cheering with beer glasses (low light noise)",
    "couple kissing in the rain (blurry candid)",
    "blowing out birthday candles in dark room (grainy)",
    "baby taking first messy bite of food (soft focus)",
    "grandmother hugging grandchild tightly (unclear face)",
    "dog jumping on owner welcoming home (motion blur)",
    "chaotic group selfie with friends (pixelated)"
  ],
  [FeatureFocus.AI_ART]: [
    "oil painting portrait",
    "fantasy knight armor",
    "cyberpunk neon city",
    "watercolor dreamy portrait",
    "baroque royal style",
    "comic book hero",
    "pixel art avatar",
    "vaporwave aesthetics",
    "renaissance painting",
    "surreal double exposure art"
  ],
  [FeatureFocus.THREE_D]: [
    "cute chibi 3D doll",
    "realistic game character",
    "toy figurine for display",
    "collectible action figure",
    "mini plastic statue",
    "3D avatar for social media",
    "anime 3D idol",
    "stylized VR character",
    "toy on rotating stand",
    "bobblehead figure"
  ],
  [FeatureFocus.CARTOON]: [
    "school anime style",
    "webtoon romantic style",
    "comic half-tone look",
    "Disney-inspired cartoon",
    "chibi style",
    "retro manga",
    "modern flat illustration",
    "Sunday newspaper comic",
    "TV anime heroine",
    "cute sticker-like character"
  ],
  [FeatureFocus.POLAROID]: [
    "couple date snapshot",
    "best friends selfie",
    "birthday party memory",
    "graduation moment",
    "travel snapshot by the sea",
    "coffee shop meet-up",
    "family dinner photo",
    "festival or concert",
    "Christmas party",
    "summer picnic"
  ],
  [FeatureFocus.ALL_IN_ONE]: [
    "birthday joy with cake and friends",
    "christmas vibe family gathering",
    "romantic walk in the park wedding",
    "trip to Kyoto cherry blossoms",
    "beach vacation with friends",
    "weekend coffee date aesthetic",
    "summer roadtrip memories",
    "hiking adventure summit",
    "concert music festival night",
    "cozy rainy day at home"
  ]
};

export const LAYOUTS: Record<string, LayoutConfig> = {
  // --- RESTORE (B&W/Sepia -> Color) - 3 CORE LAYOUTS ---
  
  // 1. SPLIT VIEW (Visual Story: Memories Coming Alive)
  restore_split_view: {
    id: "restore_split_view",
    feature: FeatureFocus.RESTORE,
    hasPhoneUI: false, // Clean look for ad
    type: "before_after_split_50_50",
    description: "Torn Paper Split. Left: Sepia/Ruined. Right: Restored/HD. Divider is a ripped paper edge.",
    beforeStyle: "RUINED PHOTO: heavy white scratches, torn paper edges, fungal spots, deep cracks, faded sepia monochrome",
    afterStyle: "RESTORED PHOTO: vibrant color, warm sunlight, high definition 8k, smooth skin, perfect details"
  },

  // 2. HAND HOLDING (Visual Story: Reliving the Special Day)
  restore_hand_holding: {
    id: "restore_hand_holding",
    feature: FeatureFocus.RESTORE,
    hasPhoneUI: false,
    type: "hand_holding_photo",
    description: "First-person POV holding an old B&W print against the real colorful restored background scene.",
    beforeStyle: "physical crumpled photo print held in hand, very old, torn corners, black and white, scratched surface",
    afterStyle: "the real world background, fully colored, same scene but alive, 4k resolution"
  },

  // 3. DUAL FRAMES (Visual Story: Framed Memories)
  restore_dual_frames: {
    id: "restore_dual_frames",
    feature: FeatureFocus.RESTORE,
    hasPhoneUI: false,
    type: "dual_photo_frames",
    description: "Two frames side-by-side on a wooden table. Left Frame: Old/Dusty. Right Frame: New/Shiny.",
    beforeStyle: "dusty old wooden frame, glass is cracked, photo inside is yellowed, water damaged and torn",
    afterStyle: "brand new modern frame, containing the fully restored vivid high-quality photo"
  },

  // --- ENHANCE (Blurry -> HD) - 3 CORE LAYOUTS ---

  // 1. SPLIT VIEW (Visual Story: Clarity Reveal)
  enhance_split_view: {
    id: "enhance_split_view",
    feature: FeatureFocus.ENHANCE,
    hasPhoneUI: true, // Phone context works well for Enhance
    type: "before_after_split_50_50",
    description: "50/50 Split. Left: Pixelated/Blurry. Right: 4K Ultra HD. High contrast.",
    beforeStyle: "extremely pixelated, low resolution, motion blur, heavy digital noise, jpeg artifacts",
    afterStyle: "crystal clear 8K resolution, sharp details, HDR lighting, perfect focus"
  },

  // 2. MAGNIFYING LENS (Visual Story: Detail Focus)
  enhance_magnifying_lens: {
    id: "enhance_magnifying_lens",
    feature: FeatureFocus.ENHANCE,
    hasPhoneUI: false,
    type: "magnifying_glass_zoom",
    description: "A magnifying loop hovering over a blurry photo, revealing perfect sharpness inside the circle.",
    beforeStyle: "blurry background photo",
    afterStyle: "inside the lens is hyper-sharp showing skin texture"
  },

  // 3. SLIDER INTERACTION (Visual Story: The Transformation Process)
  enhance_slider_interaction: {
    id: "enhance_slider_interaction",
    feature: FeatureFocus.ENHANCE,
    hasPhoneUI: true,
    type: "ui_slider_active",
    description: "Phone UI showing the slider being dragged. Left side of slider is blurry, Right is HD.",
    beforeStyle: "dull, flat, out of focus",
    afterStyle: "bright, vivid, perfectly focused"
  },

  // --- CARTOON & AI ART - PRIORITY LAYOUTS ---
  
  // LAYOUT A: Burst Multi-Panel
  cartoon_burst_multi_panel: {
    id: "cartoon_burst_multi_panel",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: false,
    type: "multi_panel_burst",
    description: "Left: Real Photo (45%). Center: Comic Energy Burst. Right: 2-3 Tilted Panels with Anime/Chibi/Western styles.",
    beforeStyle: "Real person portrait/selfie, clear face, occupying 45% left side, neon lighting",
    afterStyle: "Collage of 2-3 tilted panels showing the SAME person in distinct styles: Anime, Chibi, and Western, connected by a neon comic burst"
  },

  // LAYOUT B: Flow Transformation Stream
  cartoon_flow_transformation: {
    id: "cartoon_flow_transformation",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: false,
    type: "flow_stream_transformation",
    description: "Left: Real Neon Selfie. Center: Energy Stream. Right: 3 distinct Anime characters (Classic, Schoolgirl, Chibi) shrinking in size.",
    beforeStyle: "Real selfie with neon lighting, photorealistic, occupying left side",
    afterStyle: "A flowing purple/neon energy stream leading to 3 distinct anime characters of the same person on the right"
  },

  // --- AI ART (Standard) ---
  aiart_prompt_typing: {
    id: "aiart_prompt_typing",
    feature: FeatureFocus.AI_ART,
    hasPhoneUI: true,
    type: "text_to_image_ui",
    description: "Phone UI showing a text prompt being typed, and the image emerging above it.",
    beforeStyle: "UI text field saying 'Cyberpunk warrior'",
    afterStyle: "A stunning generated image exploding from the keyboard area"
  },
  aiart_phone_before_after: {
    id: "aiart_phone_before_after",
    feature: FeatureFocus.AI_ART,
    hasPhoneUI: true,
    type: "phone_before_after_style",
    description: "Split vertically: Real photo on top, AI transformed version on bottom.",
    beforeStyle: "normal selfie, photorealistic",
    afterStyle: "stylized AI art masterpiece (oil/digital) OF THE SAME PERSON"
  },
  aiart_sketch_reveal: {
    id: "aiart_sketch_reveal",
    feature: FeatureFocus.AI_ART,
    hasPhoneUI: false,
    type: "sketch_to_realism",
    description: "Half the image is a rough pencil sketch, blending into a fully rendered AI art piece.",
    beforeStyle: "black and white rough pencil lines",
    afterStyle: "incredibly detailed, glowing colorful render"
  },
  aiart_collage_styles: {
    id: "aiart_collage_styles",
    feature: FeatureFocus.AI_ART,
    hasPhoneUI: true,
    type: "multi_style_collage",
    description: "Phone in center surrounded by 4 different art style variations of the same person.",
    beforeStyle: "central photo thumbnail",
    afterStyle: "orbiting bubbles of different art styles (anime, van gogh, 3d, cyberpunk)"
  },

  // --- 3D ---
  threed_box_doll: {
    id: "threed_box_doll",
    feature: FeatureFocus.THREE_D,
    hasPhoneUI: true,
    type: "3d_doll_box",
    description: "The subject transformed into a toy inside a plastic collector's box.",
    beforeStyle: "small reference photo in corner",
    afterStyle: "glossy 3D character inside transparent packaging"
  },
  threed_clay_style: {
    id: "threed_clay_style",
    feature: FeatureFocus.THREE_D,
    hasPhoneUI: false,
    type: "claymation_texture",
    description: "A soft, stop-motion clay look. Very trendy and cute.",
    beforeStyle: "real photo",
    afterStyle: "soft, rounded, fingerprint-textured clay character"
  },
  threed_phone_timeline: {
    id: "threed_phone_timeline",
    feature: FeatureFocus.THREE_D,
    hasPhoneUI: true,
    type: "photo_to_3d_timeline",
    description: "Evolution bar: Photo -> Low Poly -> High Poly 3D.",
    beforeStyle: "standard portrait",
    afterStyle: "high-end Pixar-style 3D character"
  },
  threed_floating_island: {
    id: "threed_floating_island",
    feature: FeatureFocus.THREE_D,
    hasPhoneUI: false,
    type: "isometric_island",
    description: "The person placed on a cute 3D isometric floating island environment.",
    beforeStyle: "full body photo cutout",
    afterStyle: "miniature 3D world with the character in center"
  },

  // --- CARTOON (Standard) ---
  cartoon_half_tone_tear: {
    id: "cartoon_half_tone_tear",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: false,
    type: "paper_tear_reveal",
    description: "Real paper torn in the middle revealing a comic book world underneath.",
    beforeStyle: "real world photo surface, photorealistic",
    afterStyle: "vibrant comic book dot-pattern style inside the tear"
  },
  cartoon_phone_multi: {
    id: "cartoon_phone_multi",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: true,
    type: "cartoon_transformation_phone",
    description: "Center portrait with multiple anime variants radiating out.",
    beforeStyle: "real person center",
    afterStyle: "various anime/manga styles surrounding"
  },
  cartoon_split_android: {
    id: "cartoon_split_android",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: true,
    type: "before_after_split_50_50",
    description: "Classic split. Left real, Right Anime.",
    beforeStyle: "real selfie, photorealistic, raw camera capture",
    afterStyle: "studio ghibli or webtoon style character (SAME POSE)"
  },
  cartoon_cosplay_ui: {
    id: "cartoon_cosplay_ui",
    feature: FeatureFocus.CARTOON,
    hasPhoneUI: true,
    type: "game_character_select",
    description: "UI looking like a video game character selection screen.",
    beforeStyle: "user avatar thumbnail",
    afterStyle: "full body stylized RPG character with stats"
  },

  // --- POLAROID ---
  polaroid_clothesline: {
    id: "polaroid_clothesline",
    feature: FeatureFocus.POLAROID,
    hasPhoneUI: false,
    type: "hanging_photos",
    description: "Photos hanging on a string with wooden clips, warm fairy lights.",
    beforeStyle: "digital raw photo",
    afterStyle: "printed square photo hanging physically"
  },
  polaroid_stack_plain: {
    id: "polaroid_stack_plain",
    feature: FeatureFocus.POLAROID,
    hasPhoneUI: false,
    type: "polaroid_stack",
    description: "Messy pile of printed memories.",
    beforeStyle: "source image",
    afterStyle: "stack of 3-4 scattered polaroids"
  },
  polaroid_phone_mixed: {
    id: "polaroid_phone_mixed",
    feature: FeatureFocus.POLAROID,
    hasPhoneUI: true,
    type: "polaroid_plus_phone",
    description: "Digital phone screen dropping physical polaroids out of it.",
    beforeStyle: "screen image",
    afterStyle: "physical prints falling from the device"
  },
  polaroid_scrapbook: {
    id: "polaroid_scrapbook",
    feature: FeatureFocus.POLAROID,
    hasPhoneUI: false,
    type: "scrapbook_page",
    description: "A vintage scrapbook page with tape, stickers, and the photo.",
    beforeStyle: "plain photo",
    afterStyle: "taped photo on paper with handwritten date"
  },

  // --- ALL IN ONE (STORYTELLING SUITE) ---
  
  // 1. Digital Scrapbook (Birthday/Holiday Vibe)
  allinone_digital_scrapbook: {
    id: "allinone_digital_scrapbook",
    feature: FeatureFocus.ALL_IN_ONE,
    hasPhoneUI: false,
    type: "digital_scrapbook_split",
    description: "Concept: Digital Files -> Aesthetic Journal. Left: Tablet UI selecting photos. Right: Decorated Scrapbook page.",
    beforeStyle: "A tablet screen UI showing a 'File Selection' grid of messy, unedited photos (Birthday/Christmas theme).",
    afterStyle: "A beautiful, textured SCRAPBOOK PAGE. The selected photos are arranged artistically with washi tape, cute stickers, handwritten notes, and paper texture background. Cozy, aesthetic vibe."
  },

  // 2. Life Story Card (Wedding/Walk Vibe)
  allinone_life_story_card: {
    id: "allinone_life_story_card",
    feature: FeatureFocus.ALL_IN_ONE,
    hasPhoneUI: false, // Hand holding phone is part of scene
    type: "life_story_card_split",
    description: "Concept: Phone Pic -> Memory Card. Left: Hand holding phone with raw pic. Right: Designed Vertical Card.",
    beforeStyle: "First-person view of a hand holding a smartphone. The screen displays a raw, candid photo in the camera roll.",
    afterStyle: "A designed VERTICAL MEMORY CARD sitting on a textured surface (wood/linen). It features the same photo but framed elegantly with 'Our Day' typography, a date stamp, and sentimental graphics. Curated Life Story vibe."
  },

  // 3. Travel Moodboard (Original)
  allinone_travel_moodboard: {
    id: "allinone_travel_moodboard",
    feature: FeatureFocus.ALL_IN_ONE,
    hasPhoneUI: false,
    type: "travel_moodboard_collage",
    description: "Concept: Chaos to Art. Shows a messy phone gallery grid turning into a curated moodboard.",
    beforeStyle: "Smartphone Screen UI displaying the 'Camera Roll' or 'Gallery'. A MESSY GRID of random, unorganized photos, duplicates, bad lighting, and screenshots.",
    afterStyle: "A stunning, Instagram-ready TRAVEL MOODBOARD COLLAGE. The best photos from the gallery are arranged artistically, color-graded with a cohesive preset, and framed like a professional Influencer Story. Aesthetic stickers, clean layout, perfect vibes."
  },
  
  // 4. Perfect Hero Shot (Original)
  allinone_perfect_hero: {
    id: "allinone_perfect_hero",
    feature: FeatureFocus.ALL_IN_ONE,
    hasPhoneUI: true,
    type: "perfect_hero_shot",
    description: "Concept: The Hidden Gem. Finding the one good shot in a messy album and making it perfect.",
    beforeStyle: "Phone UI showing a list of many bad/dark photos, with one 'Raw' photo selected.",
    afterStyle: "The final result is a Viral-Worthy MASTERPIECE. 8K resolution, perfect lighting, distractions removed, professionally edited to look like a top-tier Travel Influencer post ready for Instagram."
  },
  
  // 5. Cinematic Reel (Original)
  allinone_cinematic_reel: {
    id: "allinone_cinematic_reel",
    feature: FeatureFocus.ALL_IN_ONE,
    hasPhoneUI: false,
    type: "cinematic_film_strip",
    description: "Concept: Random Snaps to Cinema. Unconnected photos becoming a story.",
    beforeStyle: "A scattering of random phone snapshots, disconnected and plain.",
    afterStyle: "A trendy VERTICAL FILM STRIP design ready for TikTok/Reels. The moments are sequenced into a beautiful narrative with cinematic color grading and storytelling flow."
  }
};