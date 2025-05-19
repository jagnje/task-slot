import Sprite from '../classes/Sprite'
import config from '../../config'
import Button from '../classes/Button'
import { GameObjects, Scene, Math } from 'phaser'
import { convertColorToString, numberWithCommas } from '../functions'
import { symbolsText, reelsSymbols } from '../common'
import { Reel, Symbol } from '../types'

const reelsDurationBase = 1600
const reelsDurationGap = 700
const symbolsLength = symbolsText.length
const reelsLength = 3
const visibleSymbols = 3
const symbolSize = 138
const reelsSymbolsLength = reelsSymbols[0].length
const whiteColor = 0xffffff
const neonYellowColor = 0xfffa00
const violetColor = 0x220044
const centerSlotY = 300
const centerSlotX = 1080 / 2
const reelWidth = 180
const rectangleWidth = 10
const rectangleWidthNarrow = 5
const initialBalance = 100000
const coinsOptions = [1, 2, 5, 10, 20, 50, 100]
const linesOptions = [1, 2, 3, 4, 5]
const autospinDelayMs = 1000;

function getScreenSymbols(reel: number, newPosition: number): number[] {
  const prevPosition = newPosition === 0 ? reelsSymbolsLength - 1 : newPosition - 1
  const nextPosition = newPosition === reelsSymbolsLength - 1 ? 0 : newPosition + 1
  const reelSymbolPrev = reelsSymbols[reel][prevPosition]
  const reelSymbol = reelsSymbols[reel][newPosition]
  const reelSymbolNext = reelsSymbols[reel][nextPosition]
  console.log(reel, symbolsText[reelSymbolPrev - 1], symbolsText[reelSymbol - 1], symbolsText[reelSymbolNext - 1])
  return [reelSymbolPrev, reelSymbol, reelSymbolNext]
}

export default class MainScene extends Scene {
  linesPosition: number
  coinsPosition: number
  info: Button
  spin: Button
  maxbet: Button
  autospin: Button
  stop: Button|null
  plusLines: Button
  minusLines: Button
  plusCoins: Button
  minusCoins: Button
  linesText: GameObjects.Text
  coinsText: GameObjects.Text
  balance: number
  reels: Reel[]
  symbols: Symbol[]
  currentScreenSymbols: number[][]
  autospinValue: boolean

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    this.load.atlas('symbolsAtlas', 'assets/img/fruits.png', 'assets/img/fruits.json')
    this.load.image('backButton', 'assets/img/back.png')
    this.load.image('lemon', 'assets/img/lemon.png')
    this.load.atlas('plusMinusAtlas', 'assets/img/plusminus.png', 'assets/img/plusminus.json')
    this.load.image('spinButton', 'assets/img/spin.png')
    this.load.image('maxbetButton', 'assets/img/maxbet.png')
    this.load.image('autospinButton', 'assets/img/autospin.png')
    this.load.image('infoButton', 'assets/img/info.png')
    this.load.image('stopButton', 'assets/img/stop.png')
    this.load.image('bg', 'assets/img/bg.png')
    this.load.image('reel1', 'assets/img/r1.png')
    this.load.image('reel2', 'assets/img/r2.png')
    this.load.image('reel3', 'assets/img/r3.png')
    this.load.image('reel1blurred', 'assets/img/r1blurred.png')
    this.load.image('reel2blurred', 'assets/img/r2blurred.png')
    this.load.image('reel3blurred', 'assets/img/r3blurred.png')
  }

  create() {
    // this.back = new Button(this, config.scale.width / 2 + 220, config.scale.height - 142, 'backButton', 0.6, undefined, () =>this.closeMenu())
    this.balance = initialBalance
    this.autospinValue = false
    this.linesPosition = 0
    this.coinsPosition = 0
    this.currentScreenSymbols = new Array(reelsLength)
    for (let i = 0; i < this.currentScreenSymbols.length; i++) {
      this.currentScreenSymbols[i] = new Array(visibleSymbols)
    }

    this.add.image(config.scale.width / 2, config.scale.height / 2, 'bg')
    this.add.rectangle(config.scale.width / 2, 95, 550, rectangleWidth, neonYellowColor)
    this.add.rectangle(config.scale.width / 2, 509, 550, rectangleWidth, neonYellowColor)
    this.add.rectangle(config.scale.width / 2 - 270, 302, rectangleWidth, 405, neonYellowColor)
    this.add.rectangle(config.scale.width / 2 + 270, 302, rectangleWidth, 405, neonYellowColor)

    this.add.rectangle(config.scale.width / 2 - 90, 302, rectangleWidthNarrow, 405, neonYellowColor)
    this.add.rectangle(config.scale.width / 2 + 90, 302, rectangleWidthNarrow, 405, neonYellowColor)

    this.add.rectangle(config.scale.width / 2, 300, 175, 400, violetColor)
    this.add.rectangle(config.scale.width / 2 - 179, 300, 173, 400, violetColor)
    this.add.rectangle(config.scale.width / 2 + 179, 300, 173, 400, violetColor)

    /*
    this.containerTopLeft = new GameObjects.Container(this,280,25);
    this.addLemonsAndShow(this.containerTopLeft);

    this.containerTopRight = new GameObjects.Container(this,680,25);
    this.addLemonsAndShow(this.containerTopRight);
    */

    this.add
      .text(265, 5, 'FRUIT SLOT', {
        color: convertColorToString(neonYellowColor),
        fontSize: '65px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0, 0)

    this.add
      .text(815, 14, 'BALANCE', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(1, 0)

    this.add
      .text(815, 42, `${numberWithCommas(this.balance)} $`, {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(1, 0)

    this.spin = new Button(this, config.scale.width / 2, config.scale.height - 100, 'spinButton', 1.3, undefined, () =>
      this.startSpin(this)
    )

    this.maxbet = new Button(
      this,
      config.scale.width / 2 + 140,
      config.scale.height - 142,
      'maxbetButton',
      0.6,
      undefined,
      () => this.setMaxBet()
    )
    this.autospin = new Button(
      this,
      config.scale.width / 2 + 140,
      config.scale.height - 59,
      'autospinButton',
      0.6,
      undefined,
      () => this.setAutospinValue(true)
    )

    this.info = new Button(this, config.scale.width / 2 + 220, config.scale.height - 142, 'infoButton', 0.6, undefined, () =>this.showMenu())

    this.add
      .text(267, config.scale.height - 183, 'LINES', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0, 0)

    this.plusLines = new Button(this, 282, config.scale.height - 127, 'plusMinusAtlas', 0.3, 'plus.png', () =>
      this.changeLines(true)
    )
    this.minusLines = new Button(this, 325, config.scale.height - 127, 'plusMinusAtlas', 0.3, 'minus.png', () =>
      this.changeLines()
    )
    this.linesText = this.newLinesText()

    this.add
      .text(267, config.scale.height - 96, 'COINS', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0, 0)

    this.plusCoins = new Button(this, 282, config.scale.height - 40, 'plusMinusAtlas', 0.3, 'plus.png', () =>
      this.changeCoins(true)
    )
    this.minusCoins = new Button(this, 325, config.scale.height - 40, 'plusMinusAtlas', 0.3, 'minus.png', () =>
      this.changeCoins()
    )

    this.coinsText = this.newCoinsText()

    this.symbols = []
    for (let i = 0; i < symbolsLength; i++) {
      this.symbols.push({
        symbol: new GameObjects.Image(
          this,
          config.scale.width - 200,
          config.scale.height - 70,
          'symbolsAtlas',
          `s${i + 1}.png`
        ),
        text: symbolsText[i]
      })
    }

    this.reels = []
    for (let i = 0; i < reelsLength; i++) {
      this.reels.push({
        reel: this.add.tileSprite(
          centerSlotX + (i - 1) * reelWidth,
          centerSlotY,
          symbolSize,
          symbolSize * visibleSymbols,
          `reel${i + 1}`
        ),
        duration: reelsDurationBase + i * reelsDurationGap
      })
    }

    this.shuffle(true)
  }

  showMenu() {

  }

  addStopButton(): Button {
    return new Button(this, config.scale.width / 2 + 220, config.scale.height - 59, 'stopButton', 0.6, undefined, () =>
      this.setAutospinValue(false)
    )
  }

  getNewPosition(position: number, options: number[], forward?: boolean) {
    let newPosition = position + (forward ? 1 : -1)
    if (newPosition === -1) {
      newPosition = options.length - 1
    } else if (newPosition === options.length) {
      newPosition = 0
    }
    return newPosition
  }

  setAutospinValue(autospinValue: boolean) {
    this.autospinValue = autospinValue
    if (autospinValue) {
      this.startSpin(this)
      this.stop = this.addStopButton()
    } else {
      if (this.stop) {
        this.stop.destroy()
      }
    }
  }

  setMaxBet() {
    this.changeLines(undefined, true)
    this.changeCoins(undefined, true)
  }

  changeLines(forward?: boolean, maxBet?: boolean) {
    this.linesPosition = maxBet
      ? linesOptions.length - 1
      : this.getNewPosition(this.linesPosition, linesOptions, forward)
    this.linesText.destroy()
    this.linesText = this.newLinesText()
  }

  changeCoins(forward?: boolean, maxBet?: boolean) {
    this.coinsPosition = maxBet
      ? coinsOptions.length - 1
      : this.getNewPosition(this.coinsPosition, coinsOptions, forward)
    this.coinsText.destroy()
    this.coinsText = this.newCoinsText()
  }

  newLinesText(): GameObjects.Text {
    return this.add
      .text(440, config.scale.height - 183, linesOptions[this.linesPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(1, 0)
  }

  newCoinsText(): GameObjects.Text {
    return this.add
      .text(440, config.scale.height - 96, coinsOptions[this.coinsPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(1, 0)
  }

  addLemonsAndShow(container: GameObjects.Container) {
    container.add(new Sprite(this, 0, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    container.add(new Sprite(this, 40, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    container.add(new Sprite(this, 80, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    this.add.existing(container)
  }

  startSpin(scene: Scene) {
    console.log('START SPIN')
    this.blurReels()
    this.shuffle()
    for (let i = 0; i < this.reels.length; i++) {
      scene.tweens.add({
        targets: [this.reels[i].reel],
        tilePositionY: `+=${(i + 1) * reelsSymbolsLength * symbolSize}`,
        duration: this.reels[i].duration,
        onComplete: () => {
          const tilePositionY = this.reels[i].reel.tilePositionY
          this.reels[i].reel.destroy()
          this.reels[i].reel = this.add.tileSprite(
            centerSlotX + (i - 1) * reelWidth,
            centerSlotY,
            symbolSize,
            symbolSize * visibleSymbols,
            `reel${i + 1}`
          )
          this.reels[i].reel.tilePositionY = tilePositionY

          if (i === this.reels.length - 1) {
            if (this.autospinValue) {
              this.time.addEvent({ delay: autospinDelayMs, callback: () => this.startSpin(this), callbackScope: this })
            }
          }
        }
      })
    }
  }

  shuffle(initialize?: boolean) {
    for (let i = 0; i < this.reels.length; i++) {
      const newReelPosition = initialize ? 0 : Math.Between(0, reelsSymbolsLength - 1)
      this.reels[i].reel.tilePositionY = (newReelPosition - 1) * symbolSize
      this.currentScreenSymbols[i] = getScreenSymbols(i, newReelPosition)
    }
    console.log(this.currentScreenSymbols)
  }

  blurReels() {
    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i].reel.destroy()
      this.reels[i].reel = this.add.tileSprite(
        centerSlotX + (i - 1) * reelWidth,
        centerSlotY,
        symbolSize,
        symbolSize * visibleSymbols,
        `reel${i + 1}blurred`
      )
    }
  }
}
