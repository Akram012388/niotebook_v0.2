# Platform Export Presets

Export specifications for each distribution channel.

## Master Format

Always render master at highest quality first:
- **Resolution**: 4K (3840x2160) or 2K (1920x1080)
- **Frame rate**: 60fps
- **Codec**: ProRes 422 HQ or H.264 high quality
- **Color**: sRGB

## Platform Specifications

### Landing Page Hero

Primary format for website hero sections.

```tsx
export const LandingPageConfig = {
  width: 1920,
  height: 1080,
  fps: 60,
  durationInFrames: 30 * 60, // 30 seconds
};
```

**Export settings:**
- Format: MP4 (H.264) or WebM (VP9)
- Bitrate: 8-12 Mbps
- Audio: Optional (most heroes muted)
- File size target: <15MB for fast loading
- Loop: Seamless (required)

### Twitter/X

Square or landscape for feed visibility.

```tsx
export const TwitterConfig = {
  width: 1200,
  height: 1200, // Square
  // OR
  width: 1920,
  height: 1080, // Landscape
  fps: 30, // Twitter compresses 60fps
  durationInFrames: 30 * 30,
};
```

**Export settings:**
- Format: MP4 (H.264)
- Max file: 512MB (but aim <15MB for quality retention)
- Max duration: 2:20 (we use 30s)
- Audio: Include subtle SFX (many watch with sound)

### LinkedIn

Professional context, landscape preferred.

```tsx
export const LinkedInConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 30 * 30,
};
```

**Export settings:**
- Format: MP4
- Max file: 5GB (aim <50MB)
- Aspect: 16:9, 1:1, or 4:5
- Audio: Include (LinkedIn autoplay muted, but users unmute)

### Product Hunt

Polished showcase format for launch.

```tsx
export const ProductHuntConfig = {
  width: 1270,
  height: 760, // Recommended
  fps: 30,
  durationInFrames: 30 * 30,
};
```

**Export settings:**
- Format: MP4 or GIF
- GIF: Max 3MB (for thumbnail)
- Video: High quality, clean compression
- Audio: Optional (many view silently in feed)

**Gallery images** (static frames):
- 1270x760px
- PNG or JPG
- Extract key moments as stills

### Instagram Reels / TikTok / Stories

Vertical format for mobile-first platforms.

```tsx
export const VerticalConfig = {
  width: 1080,
  height: 1920, // 9:16
  fps: 30,
  durationInFrames: 30 * 30,
};
```

**Export settings:**
- Format: MP4
- Bitrate: 3-5 Mbps
- Audio: Required (these platforms are sound-on)

**Adaptation notes:**
- May need to re-compose for vertical (not just crop)
- Center key UI elements
- Consider split-screen showing before/after

### YouTube

For channel content and embeds.

```tsx
export const YouTubeConfig = {
  width: 1920,
  height: 1080,
  fps: 60, // YouTube preserves 60fps
  durationInFrames: 30 * 60,
};
```

**Export settings:**
- Format: MP4 (H.264) or MOV (ProRes)
- Bitrate: 12-20 Mbps
- Audio: 320kbps AAC

## Batch Export Script

Generate all formats from master:

```bash
# From Remotion project root
npx remotion render src/index.ts MainVideo out/master.mp4 --codec=h264

# Resize for each platform
ffmpeg -i out/master.mp4 -vf "scale=1200:1200:force_original_aspect_ratio=decrease,pad=1200:1200:(ow-iw)/2:(oh-ih)/2" out/twitter-square.mp4
ffmpeg -i out/master.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" out/vertical.mp4
```

## Loop Verification

Before delivery, verify seamless loop:
1. Play video on loop for 30+ seconds
2. Watch the loop point specifically
3. Check no audio pop/click at loop
4. Verify no visual jump or flash
