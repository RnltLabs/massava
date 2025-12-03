# Notification Icons

Place the following icons in this directory:

1. `notification-icon.png` - 192x192 pixels, used as the main notification icon
2. `badge-icon.png` - 72x72 pixels, monochrome, used as the badge/status bar icon

These icons should match Massava's branding (purple/indigo theme).

## Specifications

### notification-icon.png
- **Size**: 192x192 pixels
- **Format**: PNG with transparency
- **Purpose**: Main icon displayed in push notifications
- **Design**: Should contain the Massava logo or brand icon
- **Colors**: Use brand colors (purple/indigo)

### badge-icon.png
- **Size**: 72x72 pixels
- **Format**: PNG, monochrome (white icon on transparent background)
- **Purpose**: Small icon displayed in the notification tray/status bar
- **Design**: Simplified version of the logo that works at small sizes
- **Colors**: White foreground, transparent background (system will add background)

## Generation Instructions

You can generate these icons from the Massava logo using the following tools:
- Online: [RealFaviconGenerator](https://realfavicongenerator.net/)
- CLI: `npm install -g pwa-asset-generator` then `pwa-asset-generator logo.svg public/icons`
- Design tool: Figma, Sketch, or Adobe Illustrator

## Fallback

If icons are not provided, the service worker will still work but notifications will use browser default icons.
