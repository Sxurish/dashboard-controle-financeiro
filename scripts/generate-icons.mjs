/**
 * Generates Kaivo PWA icons in all required sizes.
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install --save-dev canvas (or use the pre-built script below)
 */
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

function drawIcon(size, maskable = true) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  const padding = maskable ? size * 0.1 : 0
  const innerSize = size - padding * 2

  // Background
  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, size, size)

  // Gradient
  const grad = ctx.createLinearGradient(padding, padding, padding + innerSize, padding + innerSize)
  grad.addColorStop(0, '#FF6B00')
  grad.addColorStop(0.5, '#E91E8C')
  grad.addColorStop(1, '#7B2FBE')

  // Draw rounded rect background for the icon shape
  const radius = size * 0.2
  ctx.beginPath()
  ctx.moveTo(padding + radius, padding)
  ctx.lineTo(padding + innerSize - radius, padding)
  ctx.quadraticCurveTo(padding + innerSize, padding, padding + innerSize, padding + radius)
  ctx.lineTo(padding + innerSize, padding + innerSize - radius)
  ctx.quadraticCurveTo(padding + innerSize, padding + innerSize, padding + innerSize - radius, padding + innerSize)
  ctx.lineTo(padding + radius, padding + innerSize)
  ctx.quadraticCurveTo(padding, padding + innerSize, padding, padding + innerSize - radius)
  ctx.lineTo(padding, padding + radius)
  ctx.quadraticCurveTo(padding, padding, padding + radius, padding)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Draw "K" letter
  ctx.fillStyle = '#FFFFFF'
  const fontSize = innerSize * 0.55
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('K', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

for (const size of SIZES) {
  const maskableBuffer = drawIcon(size, true)
  writeFileSync(join(OUT, `icon-${size}x${size}.png`), maskableBuffer)
  console.log(`Generated icon-${size}x${size}.png`)
}

// "any" icons (no extra padding)
for (const size of [192, 512]) {
  const anyBuffer = drawIcon(size, false)
  writeFileSync(join(OUT, `icon-${size}x${size}-any.png`), anyBuffer)
  console.log(`Generated icon-${size}x${size}-any.png`)
}

console.log('All icons generated in public/icons/')
