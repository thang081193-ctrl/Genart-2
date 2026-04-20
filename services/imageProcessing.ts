import { FEATURE_META } from '../constants';

/**
 * Client-side image processing service
 * Handles overlaying logos (App Logo, Google Play Badge) and Programmatic Text Labels.
 */

interface OverlayOptions {
    appLogoBase64: string | null;
    googlePlayBadgeBase64: string | null;
    layoutId?: string; // Used to determine context
    headline?: string;
    subheadline?: string;
}

// Helper to draw Headline and Subheadline at the top
const drawHeaderText = (
    ctx: CanvasRenderingContext2D,
    headline: string,
    subheadline: string,
    width: number,
    height: number
) => {
    ctx.save();

    // 1. Headline (Big, Bold, White with Shadow)
    const hFontSize = Math.floor(width * 0.08); // Responsive font size
    ctx.font = `bold ${hFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Shadow/Stroke for readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 15;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";

    const centerX = width / 2;
    const topY = height * 0.05; // 5% from top

    // Draw Headline
    ctx.strokeText(headline, centerX, topY);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(headline, centerX, topY);

    // 2. Subheadline (Smaller, colored or white, below headline)
    if (subheadline) {
        const sFontSize = Math.floor(width * 0.04);
        ctx.font = `bold ${sFontSize}px sans-serif`;
        
        const subY = topY + hFontSize + (height * 0.01);
        
        // Use brand color or yellow for subheadline to pop
        ctx.fillStyle = "#F59E0B"; // Amber color
        ctx.shadowBlur = 10;
        ctx.strokeText(subheadline.toUpperCase(), centerX, subY);
        ctx.fillText(subheadline.toUpperCase(), centerX, subY);
    }

    ctx.restore();
}

export const compositeOverlays = async (
    baseImageBase64: string,
    options: OverlayOptions
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const baseImg = new Image();

        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        baseImg.onload = async () => {
            // 1. Setup Canvas
            canvas.width = baseImg.width;
            canvas.height = baseImg.height;
            const W = canvas.width;
            const H = canvas.height;
            
            // Draw Background (AI Image)
            ctx.drawImage(baseImg, 0, 0);
            
            // --- DRAW HEADLINE & SUBHEADLINE (Marketing Text) ---
            // We keep this because AI struggles with specific long marketing copy placement
            if (options.headline) {
                drawHeaderText(ctx, options.headline, options.subheadline || "", W, H);
            }

            // --- NOTE: REMOVED "BEFORE/AFTER" PILL LABELS ---
            // We now rely on the AI to generate these naturally within the image 
            // to avoid "double labeling" and aesthetic conflicts.

            // Common shadow settings for logos
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;

            // 2. Draw App Logo
            if (options.appLogoBase64) {
                try {
                    const appLogoImg = await loadImage(options.appLogoBase64);
                    const totalArea = W * H;
                    const targetArea = totalArea * 0.015; 
                    const imgRatio = appLogoImg.width / appLogoImg.height;
                    const logoWidth = Math.sqrt(targetArea * imgRatio);
                    const logoHeight = logoWidth / imgRatio;
                    const padRight = W * 0.04;
                    const padBottom = H * 0.04;
                    const x = W - logoWidth - padRight;
                    const y = H - logoHeight - padBottom;
                    ctx.drawImage(appLogoImg, x, y, logoWidth, logoHeight);
                } catch (e) {
                    console.error("Failed to draw app logo", e);
                }
            }

            // 3. Draw Google Play Badge
            if (options.googlePlayBadgeBase64) {
                try {
                    const badgeImg = await loadImage(options.googlePlayBadgeBase64);
                    const badgeWidth = W * 0.22; 
                    const badgeAspectRatio = badgeImg.width / badgeImg.height;
                    const badgeHeight = badgeWidth / badgeAspectRatio;
                    const padLeft = W * 0.04; 
                    const padBottom = H * 0.04;
                    const x = padLeft;
                    const y = H - badgeHeight - padBottom;
                    ctx.drawImage(badgeImg, x, y, badgeWidth, badgeHeight);
                } catch (e) {
                    console.error("Failed to draw google badge", e);
                }
            }

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;

            // Export
            resolve(canvas.toDataURL('image/png'));
        };

        baseImg.onerror = (e) => reject(e);
        baseImg.src = baseImageBase64;
    });
};

// Helper to load image async
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
};