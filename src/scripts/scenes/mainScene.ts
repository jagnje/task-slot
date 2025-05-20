import config from '../../config'
import Button from '../classes/Button'
import { GameObjects, Scene, Math } from 'phaser'
import { convertColorToString, numberWithCommas } from '../functions'
import { symbolsText, reelsSymbols, paytable, lines} from '../common'
import { Reel } from '../types'

const reelsDurationBase = 1600
const reelsDurationGap = 700
const symbolsLength = symbolsText.length
const reelsLength = 3
const visibleSymbolsLength = 3
const symbolSize = 138
const reelSymbolsLength = reelsSymbols[0].length
const whiteColor = 0xffffff
const neonYellowColor = 0xfffa00
const neonBlueColor = 0x057dff
const linesColorPalette = [0xff8800, 0xffcc00, 0xb6ff00, 0xffa5, 0x00ddff]
// const neonGreenColor = 0x00ff2e
const violetColor = 0x220044
const reelWidth = 180
const frameWidth = 10
const frameWidthNarrow = 6
const initialBalance = 100000
const coinsOptions = [1, 2, 5, 10, 20, 50, 100]
const linesOptions = [1, 2, 3, 4, 5]
const autospinDelayBetweenSpinsMs = 1000

function getScreenSymbols(reel: number, newPosition: number): number[] {
  const prevPosition = newPosition === 0 ? reelSymbolsLength - 1 : newPosition - 1
  const nextPosition = newPosition === reelSymbolsLength - 1 ? 0 : newPosition + 1
  const reelSymbolPrev = reelsSymbols[reel][prevPosition]
  const reelSymbol = reelsSymbols[reel][newPosition]
  const reelSymbolNext = reelsSymbols[reel][nextPosition]
  return [reelSymbolPrev, reelSymbol, reelSymbolNext]
}

function getLineSymbols(reel: Reel[], linesSymbols: number[]): number[] {
  const symbols = new Array(linesSymbols.length);
  for (let i = 0; i < linesSymbols.length; i++) {
    symbols[i] = reel[i].currentScreenSymbol[linesSymbols[i]]
  }
  return symbols
}

function getWin(reel: Reel[], linesLength: number): number {
  let win = 0

  for (let i = 0; i < linesLength; i++) { 
    const line = getLineSymbols(reel, lines[i])
    let leadingSymbolsInLine = 1;
    const leadingSymbol = line[0]
    for (let j = 1; j < line.length; j++) {
      if (line[j] === leadingSymbol) {
        leadingSymbolsInLine = j + 1
      } else {
        break
      }
    }

    const lineWin = paytable[leadingSymbol - 1][leadingSymbolsInLine - 1]
    if (lineWin > 0) {
      win += lineWin
    }
  }

  return win
}

export default class MainScene extends Scene {
  // dimensions
  width = config.scale.width
  height = config.scale.height
  centerSlotY = this.height / 2 - symbolSize / 2
  centerSlotX = this.width / 2

  // ui elements
  topContainer: GameObjects.Container
  bottomContainer: GameObjects.Container

  // buttons
  spin: Button
  // right of spin
  info: Button
  maxbet: Button
  autospin: Button
  stop: Button
  // left of spin
  // lines
  plusLines: Button
  minusLines: Button
  linesText: GameObjects.Text
  // coins
  plusCoins: Button
  minusCoins: Button
  coinsText: GameObjects.Text
  // reel
  reels: Reel[]
  // menu
  menuContainer: GameObjects.Container
  back: Button

  // scaling
  spinScale = 1.3
  smallScale = this.spinScale / 2
  smallestScale = this.smallScale / 2

  // variables
  linesPosition: number = 0
  coinsPosition: number = 0
  balance: number = initialBalance
  isAutospinEnabled: boolean = false
  topContainerHeight: number

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
    this.add.image(this.centerSlotX, this.height / 2, 'bg')

    // frame variables
    const outerWidth = reelWidth * reelsLength + frameWidth
    const outerHeight = symbolSize * reelsLength
    const yOffset = (reelsLength * symbolSize) / 2 + frameWidth / 2
    const xOffset = (reelsLength * reelWidth) / 2

    // frame
    this.add.rectangle(this.centerSlotX, this.centerSlotY - yOffset, outerWidth, frameWidth, neonYellowColor)
    this.add.rectangle(this.centerSlotX, this.centerSlotY + yOffset, outerWidth, frameWidth, neonYellowColor)
    this.add.rectangle(this.centerSlotX - xOffset, this.centerSlotY, frameWidth, outerHeight, neonYellowColor)
    this.add.rectangle(this.centerSlotX + xOffset, this.centerSlotY, frameWidth, outerHeight, neonYellowColor)

    // frame inner
    this.add.rectangle(
      this.centerSlotX - reelWidth / 2,
      this.centerSlotY,
      frameWidthNarrow,
      outerHeight,
      neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX + reelWidth / 2,
      this.centerSlotY,
      frameWidthNarrow,
      outerHeight,
      neonYellowColor
    )

    // reels backgrounds
    for (let i = 0; i < reelsLength; i++) {
      this.add.rectangle(
        this.centerSlotX + (i - 1) * reelWidth,
        this.centerSlotY,
        reelWidth - frameWidthNarrow,
        symbolSize * visibleSymbolsLength,
        violetColor
      )
    }

    /*
    this.containerTopLeft = new GameObjects.Container(this,280,25);
    this.addLemonsAndShow(this.containerTopLeft);

    this.containerTopRight = new GameObjects.Container(this,680,25);
    this.addLemonsAndShow(this.containerTopRight);
    */

    this.topContainerHeight = this.centerSlotY - yOffset - frameWidth / 2
    const bottomContainerHeight = this.height - this.topContainerHeight - outerHeight - frameWidth * 2

    // containers
  
    // top container
    this.topContainer = new GameObjects.Container(this, this.centerSlotX, this.topContainerHeight / 2 - frameWidth / 2)

    this.topContainer.add(
      this.add.text(-outerWidth / 2, 0, 'FRUIT SLOT', {
        color: convertColorToString(neonYellowColor),
        fontSize: '65px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0, 0.5)
    )

    this.topContainer.add(
      this.add
        .text(outerWidth / 2, -15, 'BALANCE', {
          color: convertColorToString(whiteColor),
          fontSize: '26px',
          fontFamily: 'PermanentMarker'
        })
        .setOrigin(1, 0.5)
    )

    this.topContainer.add(
      this.add
        .text(outerWidth / 2, 15, `${numberWithCommas(this.balance)} $`, {
          color: convertColorToString(whiteColor),
          fontSize: '26px',
          fontFamily: 'PermanentMarker'
        })
        .setOrigin(1, 0.5)
    )

    this.add.existing(this.topContainer)

    this.bottomContainer = new GameObjects.Container(this, this.centerSlotX, this.height - bottomContainerHeight / 2)

    // buttons

    this.spin = new Button(this, 0, 0, 'spinButton', this.spinScale, undefined, () => this.startSpin(this))

    this.maxbet = new Button(
      this,
      this.spin.width * this.spinScale * 0.85,
      (-this.spin.height * this.spinScale) / 4,
      'maxbetButton',
      this.smallScale,
      undefined,
      () => this.setMaxBet()
    )

    this.autospin = new Button(
      this,
      this.spin.width * this.spinScale * 0.85,
      (this.spin.height * this.spinScale) / 4,
      'autospinButton',
      this.smallScale,
      undefined,
      () => this.setIsAutospinEnabled(true)
    )

    this.info = new Button(
      this,
      this.spin.width * this.spinScale * 1.4,
      (-this.spin.height * this.spinScale) / 4,
      'infoButton',
      this.smallScale,
      undefined,
      () => this.showMenu()
    )
    const linesText = this.add
      .text(-outerWidth / 2, this.bottomContainer.height / 2 - (this.spin.height / 2) * this.spinScale, 'LINES', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0, 0)

    this.plusLines = new Button(
      this,
      -outerWidth / 2,
      this.bottomContainer.height / 2 - (this.spin.height / 3.5) * this.spinScale,
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeLines(true)
    ).setOrigin(0, 0)

    this.minusLines = new Button(
      this,
      -outerWidth / 2 + this.plusLines.width * this.smallestScale,
      this.bottomContainer.height / 2 - (this.spin.height / 3.5) * this.spinScale,
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeLines()
    ).setOrigin(0, 0)

    const coinsText = this.add
      .text(-outerWidth / 2, -(this.bottomContainer.height / 2 - (this.spin.height / 2) * this.spinScale), 'COINS', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0, 1)

    this.plusCoins = new Button(
      this,
      -outerWidth / 2,
      -(this.bottomContainer.height / 2 - (this.spin.height / 3.5) * this.spinScale),
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeCoins(true)
    ).setOrigin(0, 1)

    this.minusCoins = new Button(
      this,
      -outerWidth / 2 + this.plusLines.width * this.smallestScale,
      -(this.bottomContainer.height / 2 - (this.spin.height / 3.5) * this.spinScale),
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeCoins()
    ).setOrigin(0, 1)

    this.linesText = this.newLinesText()
    this.coinsText = this.newCoinsText()

    this.bottomContainer.add([
      this.spin,
      this.maxbet,
      this.autospin,
      this.info,
      linesText,
      this.plusLines,
      this.minusLines,
      this.linesText,
      coinsText,
      this.plusCoins,
      this.minusCoins,
      this.coinsText
    ])

    this.add.existing(this.bottomContainer)

    // reels
    this.reels = new Array(reelsLength)
    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i] = {
        reel: this.add.tileSprite(
          this.centerSlotX + (i - 1) * reelWidth,
          this.centerSlotY,
          symbolSize,
          symbolSize * visibleSymbolsLength,
          `reel${i + 1}`
        ),
        duration: reelsDurationBase + i * reelsDurationGap,
        currentScreenSymbol: new Array(visibleSymbolsLength).fill(null)
      }
    }
    this.shuffle(true)
  }

  createMenu(): GameObjects.Container {
    const menuContainerHeight = this.height - this.topContainerHeight
    const menuContainer = new GameObjects.Container(this, this.centerSlotX, this.height - menuContainerHeight / 2)
    const rectangle = new GameObjects.Rectangle(this, 0, 0, this.width, menuContainerHeight, violetColor)

    this.back = new Button(this, this.width/2 - this.info.height/2 * this.smallScale, -menuContainerHeight/2 + this.info.height/2 * this.smallScale, 'backButton', 0.5, undefined, () => this.hideMenu())
    const topRectangles = new Array(symbolsLength)
    const topRectanglesInner = new Array(symbolsLength)
    const bottomRectangles = new Array(symbolsLength)
    const bottomRectanglesInner = new Array(symbolsLength)
    const symbols = new Array(symbolsLength)
    const symbolsTextTopLeft = new Array(symbolsLength)
    const symbolsTextTopRight = new Array(symbolsLength)
    const symbolsTextBottomLeft = new Array(symbolsLength)
    const symbolsTextBottomRight = new Array(symbolsLength)

    const paytableText = this.add.text(0, -this.height/2.5, 'PAY TABLE', {
        color: convertColorToString(neonBlueColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

    const linesText = this.add.text(0, this.height/9, 'LINES', {
        color: convertColorToString(neonBlueColor),
        fontSize: '40px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

    const linesTextTop = new Array(symbolsLength)

    const linesRectangles: GameObjects.Rectangle[] = [] // new Array(symbolsLength * visibleSymbolsLength * reelsLength)
    const size = this.height / 21;
    for (let i = 0; i < symbolsLength; i++) {
      for (let j = 0; j < reelsLength; j++) {
        const x = (i - 2) * this.width / 5 + (j-1) * 40
        for (let k = 0; k < visibleSymbolsLength; k++) {
          const y = this.height/3.8 + k * 40
          linesRectangles.push(new GameObjects.Rectangle (this, x, y, size, size, lines[i][j] === k ? linesColorPalette[i] : whiteColor))
        }
      }

      linesTextTop[i] = this.add.text((i - 2) * this.width / 5, + this.height / 5, `Line ${i+1}`, {
        color: convertColorToString(neonYellowColor),
        fontSize: '40px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

      topRectangles[i] = new GameObjects.Rectangle(
        this,
        (i - 2) * this.width / 5,
        - this.height / 7,
        this.width / 6,
        this.height / 2.8,
        neonBlueColor
      )
      
      topRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        (i - 2) * this.width / 5,
        - this.height / 7,
        this.width / 6 - 10,
        this.height / 2.8 - 10,
        violetColor
      )

      symbols[i] = this.add.image((i - 2) * this.width / 5, - this.height / 4.5, 'symbolsAtlas', `s${i + 1}.png`)
      symbolsTextTopLeft[i] = this.add.text((i - 2) * this.width / 5 - (this.width / 12)/2, - this.height / 9, '3:', {
        color: convertColorToString(neonYellowColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

      symbolsTextTopRight[i] = this.add.text((i - 2) * this.width / 5 + (this.width / 14)/2, - this.height / 9, paytable[i][2].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

      symbolsTextBottomLeft[i] = this.add.text((i - 2) * this.width / 5 - (this.width / 12)/2, - this.height / 30, '2:', {
        color: convertColorToString(neonYellowColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

      symbolsTextBottomRight[i] = this.add.text((i - 2) * this.width / 5 + (this.width / 14)/2, - this.height / 30, paytable[i][1].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      }).setOrigin(0.5, 0.5)

      bottomRectangles[i] = new GameObjects.Rectangle(
        this,
        (i - 2) * this.width / 5,
        + this.height / 3.5,
        this.width / 6,
        this.height / 4,
        neonBlueColor
      )
      
      bottomRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        (i - 2) * this.width / 5,
        + this.height / 3.5,
        this.width / 6 - 10,
        this.height / 4 - 10,
        violetColor
      )
    }

    menuContainer.add([rectangle, this.back, ...topRectangles, ...topRectanglesInner, paytableText, linesText, ...bottomRectangles, ...bottomRectanglesInner, ...linesRectangles])
    menuContainer.add([...symbols, ...symbolsTextTopLeft, ...symbolsTextTopRight, ...symbolsTextBottomLeft, ...symbolsTextBottomRight, ...linesTextTop])
    return menuContainer
  }

  showMenu() {
    this.menuContainer = this.createMenu()
    this.add.existing(this.menuContainer)
  }

  hideMenu() {
    this.menuContainer.destroy()
  }

  getStopButton(): Button {
    return (this.info = new Button(
      this,
      this.spin.width * this.spinScale * 1.4,
      (this.spin.height * this.spinScale) / 4,
      'stopButton',
      this.smallScale,
      undefined,
      () => this.setIsAutospinEnabled(false)
    ))
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

  setIsAutospinEnabled(isAutospinEnabled: boolean) {
    this.isAutospinEnabled = isAutospinEnabled
    if (isAutospinEnabled) {
      this.startSpin(this)
      this.stop = this.getStopButton()
      this.bottomContainer.add(this.stop)
    } else {
      if (this.stop) {
        this.bottomContainer.remove(this.stop, true)
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
    this.bottomContainer.remove(this.linesText, true)
    this.linesText = this.newLinesText()
    this.bottomContainer.add(this.linesText)
  }

  changeCoins(forward?: boolean, maxBet?: boolean) {
    this.coinsPosition = maxBet
      ? coinsOptions.length - 1
      : this.getNewPosition(this.coinsPosition, coinsOptions, forward)
    this.bottomContainer.remove(this.coinsText, true)
    this.coinsText = this.newCoinsText()
    this.bottomContainer.add(this.coinsText)
  }

  newLinesText(): GameObjects.Text {
    return this.add
      .text(-this.spin.width, (-this.spin.width * this.spinScale) / 4, linesOptions[this.linesPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0.5, 0.5)
  }

  newCoinsText(): GameObjects.Text {
    return this.add
      .text(-this.spin.width, (+this.spin.width * this.spinScale) / 4, coinsOptions[this.coinsPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '50px',
        fontFamily: 'PermanentMarker'
      })
      .setOrigin(0.5, 0.5)
  }
  /*
  addLemonsAndShow(container: GameObjects.Container) {
    container.add(new Sprite(this, 0, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    container.add(new Sprite(this, 40, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    container.add(new Sprite(this, 80, 0, 'lemon', '', true).setOrigin(0, 0).setScale(0.3))
    this.add.existing(container)
  }
  */
  startSpin(scene: Scene) {
    this.blurReels()
    this.shuffle()
    for (let i = 0; i < reelsLength; i++) {
      scene.tweens.add({
        targets: [this.reels[i].reel],
        tilePositionY: `+=${(i + 1) * reelSymbolsLength * symbolSize}`,
        duration: this.reels[i].duration,
        onComplete: () => {
          const tilePositionY = this.reels[i].reel.tilePositionY
          this.reels[i].reel.destroy()
          this.reels[i].reel = this.add.tileSprite(
            this.centerSlotX + (i - 1) * reelWidth,
            this.centerSlotY,
            symbolSize,
            symbolSize * visibleSymbolsLength,
            `reel${i + 1}`
          )
          this.reels[i].reel.tilePositionY = tilePositionY

          if (i === reelsLength - 1) {
            if (this.isAutospinEnabled) {
              this.time.addEvent({
                delay: autospinDelayBetweenSpinsMs,
                callback: () => this.startSpin(this),
                callbackScope: this
              })
            }
          }
        }
      })
    }
  }

  shuffle(initialize?: boolean) {
    for (let i = 0; i < reelsLength; i++) {
      if (initialize) {
        this.reels[i].reel.tilePositionY = 0
      } else {
        const newReelPosition = Math.Between(0, reelSymbolsLength - 1)
        this.reels[i].reel.tilePositionY = (newReelPosition - 1) * symbolSize
        this.reels[i].currentScreenSymbol = getScreenSymbols(i, newReelPosition)
      }
    }
    if (!initialize) {
      const win = getWin(this.reels, linesOptions[this.linesPosition])
      console.log('bare win', win)
      if (win > 0) {
        console.log('calculated win', win * coinsOptions[this.coinsPosition])
      }
    }
  }

  blurReels() {
    for (let i = 0; i < reelsLength; i++) {
      this.reels[i].reel.destroy()
      this.reels[i].reel = this.add.tileSprite(
        this.centerSlotX + (i - 1) * reelWidth,
        this.centerSlotY,
        symbolSize,
        symbolSize * visibleSymbolsLength,
        `reel${i + 1}blurred`
      )
    }
  }
}
