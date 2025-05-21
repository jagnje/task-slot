import { WEBGL, Scale } from 'phaser'
import { symbolsText, reelsSymbols } from './scripts/common'
import MainScene from './scripts/scenes/mainScene'

export const DEFAULT_WIDTH = 1080
const DEFAULT_MOBILE_WIDTH = 550
const DEFAULT_HEIGHT = 720
const isMobile = window.innerWidth < 768
const isPortrait = window.matchMedia('(orientation: portrait)').matches

export default {
  type: WEBGL,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser-game',
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width: isMobile && isPortrait ? DEFAULT_MOBILE_WIDTH : DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}

export const slotConfig = {
  reelsDurationBaseMs: 1600,
  reelsDurationGapMs: 700,
  symbolsLength: symbolsText.length,
  reelsLength: 3,
  visibleSymbolsLength: 3,
  symbolSize: 138,
  reelSymbolsLength: reelsSymbols[0].length,
  whiteColor: 0xffffff,
  neonYellowColor: 0xfffa00,
  neonBlueColor: 0x057dff,
  linesColorPalette: [0xff8800, 0xffcc00, 0xb6ff00, 0xffa5, 0x00ddff],
  neonRedColor: 0xff1900,
  neonGreenColor: 0x00ff2e,
  violetColor: 0x220044,
  reelWidth: 180,
  lineWidth: 15,
  frameWidth: 10,
  frameWidthNarrow: 6,
  initialBalance: 100000,
  coinsOptions: [1, 2, 5, 10, 20, 50, 100],
  linesOptions: [1, 2, 3, 4, 5],
  autospinDelayBetweenSpinsMs: 1000
}
