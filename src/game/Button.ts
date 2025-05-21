import { GameObjects } from 'phaser'

export default class Button extends GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    scale: number,
    frame?: string,
    action?: () => void
  ) {
    super(scene, x, y, texture, frame)
    this.setInteractive({ cursor: "pointer" })
    this.initializeScale(scale)
    if (action) {
      this.on('pointerdown', action, this)
    }
    scene.add.existing(this)
  }

  initializeScale(scale: number) {
    this.setScale(scale)
    this.on('pointerup', () => this.setScale(scale))
    this.on('pointerdown', () => this.setScale(scale * 1.04), this)
  }
}
