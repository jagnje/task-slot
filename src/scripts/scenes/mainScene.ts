import Sprite from '../classes/Sprite'
import config from '../../config'
import Spin from '../objects/Spin'
import Info from '../objects/Info'

const reelsSymbols: number[][] = [
  [1, 2, 5, 4, 3, 4, 5, 3, 2, 1, 4],
  [1, 4, 5, 3, 5, 3, 1, 2, 4, 2, 3],
  [4, 3, 5, 5, 3, 2, 1, 3, 4, 5, 3]
]

const symbolsText = ['orange', 'strawberry', 'banana', 'pear', 'watermelon']

function getFruit(i: number, j: number): number {
  const reelSymbol = reelsSymbols[i][j]
  const fruit = symbolsText[reelSymbol === symbolsText.length ? 0 : reelSymbol]
  // console.log('reel', i, 'position', j, 'symbol', reelSymbol, 'fruit', fruit, 'return', reelSymbol - 1)
  console.log(i, 'fruit', fruit)
  return reelSymbol - 1
}

const reelsDurationBase = 1600
const reelsDurationGap = 700
const symbolsLength = symbolsText.length
const reelsLength = 3
const visibleSymbols = 3
const symbolSize = 134
const reelsSymbolsLength = reelsSymbols[0].length

type Reel = {
  duration: number
  reel: Phaser.GameObjects.TileSprite
}

type Symbol = {
  text: string
  symbol: Phaser.GameObjects.Image
}

export default class MainScene extends Phaser.Scene {
  info: Info
  spin: Spin
  reels: Reel[]
  symbols: Symbol[]
  logo: Phaser.GameObjects.Image

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    this.load.image('lemon', 'assets/img/lemon.png')
    this.load.image('symbols', 'assets/img/fruits.png')
    this.load.atlas('symbolsAtlas', 'assets/img/fruits.png', 'assets/img/fruits.json')
    this.load.image('symbolsBlurred', 'assets/img/fruits_blurred.png')
    // this.load.atlas('plusminus', 'assets/img/plusminus.png', 'assets/img/plusminus.json')
    this.load.image('infoButton', 'assets/img/info.png')
    this.load.image('spinButton', 'assets/img/spin.png')
  }

  create() {
    this.logo = new Sprite(this, 0, 0, 'lemon', '', true).setOrigin(0,0).setScale(0.4)
    this.add
      .text(this.cameras.main.width - 15, 15, `Fruit Slot`, {
        color: '#000000',
        fontSize: '24px'
      })
      .setOrigin(1, 0)

    this.info = new Info(this)
    this.spin = new Spin(this, () => this.startSpin(this))

    this.symbols = []
    for (let i = 0; i < symbolsLength; i++) {
      this.symbols.push({
        symbol: new Phaser.GameObjects.Image(
          this,
          config.scale.width - 200,
          config.scale.height - 70,
          'symbolsAtlas',
          `s${i + 1}.png`
        ),
        text: symbolsText[i]
      })
    }
    // this.add.existing(this.symbols[4].symbol)

    this.reels = []
    for (let i = 0; i < reelsLength; i++) {
      this.reels.push({
        reel: this.add.tileSprite(
          config.scale.width / 2 + (i - 1) * 200,
          300,
          symbolSize,
          symbolSize * visibleSymbols,
          'symbols'
        ),
        duration: reelsDurationBase + i * reelsDurationGap
      })
    }

    this.shuffle(true)
  }

  startSpin(scene: Phaser.Scene) {
    this.blurReels()
    this.shuffle()

    for (let i = 0; i < this.reels.length; i++) {
      scene.tweens.add({
        targets: [this.reels[i].reel],
        tilePositionY: `+=${(i+2) * symbolsLength * symbolSize}`,
        duration: this.reels[i].duration,
        onComplete: () => {
          const tilePositionY = this.reels[i].reel.tilePositionY
          this.reels[i].reel.destroy()
          this.reels[i].reel = this.add.tileSprite(
            config.scale.width / 2 + (i - 1) * 200,
            300,
            symbolSize,
            symbolSize * visibleSymbols,
            'symbols'
          )
          this.reels[i].reel.tilePositionY = tilePositionY
        }
      })
    }
  }

  shuffle(initialize?: boolean) {
    for (let i = 0; i < this.reels.length; i++) {
      const randomValue = Phaser.Math.Between(0, reelsSymbolsLength - 1)
      const startValue = getFruit(i, randomValue)
      this.reels[i].reel.tilePositionY = startValue * symbolSize
    }
  }

  blurReels() {
    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i].reel.destroy()
      this.reels[i].reel = this.add.tileSprite(
        config.scale.width / 2 + (i - 1) * 200,
        300,
        symbolSize,
        symbolSize * visibleSymbols,
        'symbols'
      )
    }
  }
}
