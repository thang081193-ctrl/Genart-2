

export enum FeatureFocus {
  RESTORE = "restore",
  ENHANCE = "enhance",
  AI_ART = "ai_art",
  THREE_D = "three_d",
  CARTOON = "cartoon",
  POLAROID = "polaroid",
  ALL_IN_ONE = "all_in_one"
}

export interface LayoutConfig {
  id: string;
  feature: FeatureFocus;
  hasPhoneUI: boolean;
  type: string;
  description: string;
  beforeStyle: string;
  afterStyle: string;
}

export interface AIStrategy {
  topic: string;
  headline: string;
  subheadline: string;
  visual_mood: string;
  lighting: string;
  background: string;
  before_description: string;
  after_description: string;
  rationale?: string;
  // Optional style tracking
  cartoonStyleGroup?: CartoonStyleGroup;
  aiArtStyleGroup?: AiArtStyleGroup;
}

export type CartoonStyleGroup =
  | "Anime"
  | "Chibi"
  | "Comic"
  | "Hero"
  | "3D";

export type AiArtStyleGroup =
  | "OilPainting"
  | "Watercolor"
  | "Cyberpunk"
  | "Fantasy"
  | "Sketch";

export interface ConceptSpec {
  meta: {
    app_name: string;
    feature_focus: string;
    layout_id: string;
    market_tier: string;
    topic: string;
    insight: string;
    angle: string;
  };
  mobile_ui: {
    use_phone_frame: boolean;
    phone_type: string | null;
    ui_mockup_position: string;
  };
  branding: {
    include_app_logo: boolean;
    logo_position: string | null;
    include_google_play_badge: boolean;
    badge_position: string;
  };
  layout: {
    layout_type: string;
    split_ratio: string | null;
    before_section: string;
    flow_visual: {
      style: string;
      intensity: string;
    };
    after_section: string;
  };
  visual: {
    background_style: string;
    color_palette: string;
    lighting: string;
    mood: string;
  };
  personas: string[];
  text_overlay: {
    headline: string;
    subheadline: string;
    style: string;
    placement: string;
  };
  camera_settings: {
    shot_type: string;
    depth_of_field: string;
    aspect_ratio: string; // Added aspect ratio
  };
  // Style Groups
  cartoonStyleGroup?: CartoonStyleGroup;
  aiArtStyleGroup?: AiArtStyleGroup;
}

export interface Concept {
  id: number;
  name: string;
  featureFocus: FeatureFocus;
  layoutId: string;
  topic: string;
  jsonSpec: ConceptSpec;
  prompt: string;
  notes: string;
  // Extra fields for AI generated content
  aiCopy?: string;
  isGeneratingCopy?: boolean;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  rationale?: string; // Why this concept was chosen by AI
  userLogo?: string | null; // For image compositing
  customGuidance?: string; // User specific override prompt
}

export interface GeneratorInput {
  featureFocus: FeatureFocus;
  layoutId: string;
  marketTier: string;
  insight: string;
  angle: string;
  aspectRatio: string; // Added aspect ratio input
}