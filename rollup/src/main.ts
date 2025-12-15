import { Game, AUTO, Scene } from 'phaser'

class MainScene extends Scene {
  constructor() {
    super({ key: 'MainScene' })
  }

  preload(): void {
    this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png')
  }

  create(): void {
    const logo = this.add.image(400, 300, 'logo')
    this.tweens.add({
      targets: logo,
      y: 500,
      duration: 1500,
      ease: 'Bounce.easeOut',
      yoyo: true,
      repeat: -1
    })
  }
}

const config = {
  type: AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1d1d1d',
  scene: [MainScene]
}

new Game(config)
