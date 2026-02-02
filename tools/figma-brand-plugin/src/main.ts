import { createColorStyles } from './colors'
import { createTextStyles } from './textStyles'
import { buildWordmark } from './wordmark'
import { buildNioMark } from './nioMark'
import { buildSocialAssets } from './social'
import { buildAppIcon } from './appIcon'
import { buildFavicons } from './favicon'
import { buildBadge } from './badge'
import { buildEmailSig } from './email'
import { buildBrandGuide } from './brandGuide'

async function buildStyles() {
  createColorStyles()
  await createTextStyles()
  figma.notify('✓ Color & text styles created')
}

async function buildLogos() {
  await buildWordmark()
  await buildNioMark()
  await buildBadge()
}

async function buildSocial() {
  await buildSocialAssets()
}

async function buildIcons() {
  await buildAppIcon()
  await buildFavicons()
  await buildEmailSig()
}

async function buildGuide() {
  await buildBrandGuide()
}

async function buildAll() {
  figma.notify('Building Niotebook brand system…')
  await buildStyles()
  await buildLogos()
  await buildSocial()
  await buildIcons()
  await buildGuide()
  figma.notify('✓ Brand system complete!')
}

// ---------------------------------------------------------------------------
// Command router
// ---------------------------------------------------------------------------

figma.on('run', async ({ command }: RunEvent) => {
  try {
    switch (command) {
      case 'buildAll':    await buildAll();    break
      case 'buildStyles': await buildStyles(); break
      case 'buildLogos':  await buildLogos();  break
      case 'buildSocial': await buildSocial(); break
      case 'buildIcons':  await buildIcons();  break
      case 'buildGuide':  await buildGuide();  break
      default:
        figma.notify(`Unknown command: ${command}`, { error: true })
    }
  } catch (err) {
    figma.notify(`Error: ${(err as Error).message}`, { error: true })
    console.error(err)
  } finally {
    figma.closePlugin()
  }
})
