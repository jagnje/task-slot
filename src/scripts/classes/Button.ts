import Sprite from '../classes/Sprite'

export default class Button {
  scene: Phaser.Scene
  sprite: Sprite

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    scale: number,
    frame?: string,
    action?: () => void
  ) {
    this.scene = scene
    this.add(x, y, key, scale, frame)
    if (action) {
      this.sprite.on('pointerdown', action, this)
    }
  }

  add(x: number, y: number, key: string, scale: number, frame?: string) {
    this.sprite = new Sprite(this.scene, x, y, key, frame || '', true).setScale(scale)
    this.sprite.on('pointerup', () => this.sprite.setScale(scale))
    this.sprite.on('pointerdown', () => this.sprite.setScale(scale * 1.04), this)
  }
  
  destroy() {
    this.sprite.destroy();
  }
}
