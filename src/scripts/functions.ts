import { Math } from 'phaser'

export function convertColorToString(color: number) {
  const r = Math.FloorTo(color / (256 * 256))
  color = color - r * 256 * 256
  const g = Math.FloorTo(color / 256)
  const b = color - g * 256
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function numberWithCommas(x: number): string {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}