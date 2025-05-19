import { WEBGL, Scale } from 'phaser'

import MainScene from './scripts/scenes/mainScene'

const DEFAULT_WIDTH = 1080
const DEFAULT_HEIGHT = 720

export default {
  type: WEBGL,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser-game',
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    backgroundColor: '#2d2d6d'
  },
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
