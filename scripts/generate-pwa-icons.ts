/**
 * PWA Icon Generator for Massava
 * Generates all required icon sizes for PWA and iOS
 *
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

// Massava brand colors
const SAGE_GREEN = '#9fbb9f';
const CREAM_BG = '#FAF8F5';

// Icon sizes needed for PWA
const ICON_SIZES = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// Create a simple "M" logo SVG with Massava styling
function createLogoSVG(size: number, maskable = false): string {
  const padding = maskable ? size * 0.2 : size * 0.1;
  const innerSize = size - (padding * 2);
  const letterSize = innerSize * 0.6;
  const strokeWidth = Math.max(2, size * 0.08);

  // For maskable icons, we need a larger safe zone
  const bgColor = maskable ? SAGE_GREEN : CREAM_BG;
  const letterColor = maskable ? CREAM_BG : SAGE_GREEN;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.18}"/>

      <!-- Decorative circle -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${innerSize * 0.38}" fill="none" stroke="${letterColor}" stroke-width="${strokeWidth * 0.5}" opacity="0.3"/>

      <!-- Letter M stylized as massage hands -->
      <g transform="translate(${size / 2}, ${size / 2})">
        <text
          x="0"
          y="${letterSize * 0.35}"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="${letterSize}"
          font-weight="600"
          fill="${letterColor}"
          text-anchor="middle"
          letter-spacing="-${letterSize * 0.05}"
        >M</text>
      </g>

      <!-- Small accent dots representing wellness -->
      <circle cx="${size * 0.25}" cy="${size * 0.78}" r="${size * 0.025}" fill="${letterColor}" opacity="0.6"/>
      <circle cx="${size * 0.5}" cy="${size * 0.82}" r="${size * 0.02}" fill="${letterColor}" opacity="0.4"/>
      <circle cx="${size * 0.75}" cy="${size * 0.78}" r="${size * 0.025}" fill="${letterColor}" opacity="0.6"/>
    </svg>
  `.trim();
}

async function generateIcon(size: number, filename: string, maskable = false): Promise<void> {
  const svg = createLogoSVG(size, maskable);
  const outputPath = path.join(ICONS_DIR, filename);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

async function main(): Promise<void> {
  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  console.log('🎨 Generating PWA icons for Massava...\n');

  // Generate standard icons
  for (const size of ICON_SIZES) {
    await generateIcon(size, `icon-${size}x${size}.png`);
  }

  // Generate Apple Touch Icon (180x180)
  await generateIcon(180, 'apple-touch-icon.png');

  // Generate maskable icons (with safe zone)
  await generateIcon(512, 'maskable-icon-512x512.png', true);
  await generateIcon(192, 'maskable-icon-192x192.png', true);

  // Generate favicon
  await generateIcon(32, 'favicon-32x32.png');
  await generateIcon(16, 'favicon-16x16.png');

  console.log('\n✅ All PWA icons generated successfully!');
  console.log(`📁 Icons saved to: ${ICONS_DIR}`);
}

main().catch(console.error);
