import {
  loadLogoFont,
  buildLogoGroup,
  applyVariantColors,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  pngExport,
} from './utils'

interface PlatformSpec {
  name: string
  width: number
  height: number
  /** 'wordmark' or 'nio' */
  logo: 'wordmark' | 'nio'
  /** Fraction of frame width the logo should occupy */
  logoScale: number
  exportPath: string
}

const PLATFORMS: PlatformSpec[] = [
  { name: 'OG Image',    width: 1200, height: 630,  logo: 'wordmark', logoScale: 0.6,  exportPath: 'og-image' },
  { name: 'Profile Pic', width: 400,  height: 400,  logo: 'nio',      logoScale: 0.5,  exportPath: 'profile' },
  { name: 'Twitter',     width: 1500, height: 500,  logo: 'wordmark', logoScale: 0.4,  exportPath: 'twitter-banner' },
  { name: 'LinkedIn',    width: 1584, height: 396,  logo: 'wordmark', logoScale: 0.4,  exportPath: 'linkedin-banner' },
  { name: 'GitHub',      width: 1280, height: 640,  logo: 'wordmark', logoScale: 0.5,  exportPath: 'github-social' },
  { name: 'Discord',     width: 960,  height: 540,  logo: 'wordmark', logoScale: 0.5,  exportPath: 'discord-banner' },
  { name: 'YouTube',     width: 2560, height: 1440, logo: 'wordmark', logoScale: 0.35, exportPath: 'youtube-banner' },
  { name: 'Facebook',    width: 820,  height: 312,  logo: 'wordmark', logoScale: 0.5,  exportPath: 'facebook-cover' },
  { name: 'Instagram',   width: 1080, height: 1080, logo: 'nio',      logoScale: 0.4,  exportPath: 'instagram-post' },
  { name: 'TikTok',      width: 1080, height: 1920, logo: 'nio',      logoScale: 0.3,  exportPath: 'tiktok-cover' },
  { name: 'ProductHunt', width: 1270, height: 760,  logo: 'wordmark', logoScale: 0.5,  exportPath: 'producthunt-gallery' },
]

export async function buildSocialAssets() {
  await loadLogoFont()

  const page = getOrCreatePage('Social')
  figma.currentPage = page

  let offsetX = 0

  for (const spec of PLATFORMS) {
    const frame = figma.createFrame()
    frame.name = `Social/${spec.name}`
    frame.resize(spec.width, spec.height)
    frame.fills = [solidPaint(COLORS.black)]
    frame.x = offsetX
    frame.y = 0

    // Determine logo font size to hit target width
    const targetWidth = spec.width * spec.logoScale
    const label = spec.logo === 'wordmark' ? 'niotebook' : 'nio'
    // Rough: Orbitron Bold at fontSize N produces width ≈ N * 0.65 * label.length
    const estFontSize = targetWidth / (0.65 * label.length)
    const fontSize = Math.round(Math.max(estFontSize, 24))

    const { frame: logoFrame, text, bar } = buildLogoGroup(label, fontSize)
    applyVariantColors(text, bar, 'Dark')

    // Center in frame
    logoFrame.x = (spec.width - logoFrame.width) / 2
    logoFrame.y = (spec.height - logoFrame.height) / 2
    frame.appendChild(logoFrame)

    // Safe zone grid (inner 60%)
    frame.guides = [
      { axis: 'X', offset: spec.width * 0.2 },
      { axis: 'X', offset: spec.width * 0.8 },
      { axis: 'Y', offset: spec.height * 0.2 },
      { axis: 'Y', offset: spec.height * 0.8 },
    ]

    addExports(frame, [pngExport(1)])

    page.appendChild(frame)
    offsetX += spec.width + 100
  }

  figma.notify(`✓ ${PLATFORMS.length} social frames created`)
}
