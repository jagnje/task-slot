import config from '../../config'
import Button from '../classes/Button'
import { GameObjects, Scene, Math } from 'phaser'
import { convertColorToString, numberWithCommas } from '../functions'
import { symbolsText, reelsSymbols, paytable, lines } from '../common'
import { Reel, Line } from '../types'

const reelsDurationBaseMs = 1600
const reelsDurationGapMs = 700
const symbolsLength = symbolsText.length
const reelsLength = 3
const visibleSymbolsLength = 3
const symbolSize = 138
const reelSymbolsLength = reelsSymbols[0].length
const whiteColor = 0xffffff
const neonYellowColor = 0xfffa00
const neonBlueColor = 0x057dff
const linesColorPalette = [0xff8800, 0xffcc00, 0xb6ff00, 0xffa5, 0x00ddff]
const neonGreenColor = 0x00ff2e
const violetColor = 0x220044
const reelWidth = 180
const lineWidth = 15
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
  const symbols = new Array(linesSymbols.length)
  for (let i = 0; i < linesSymbols.length; i++) {
    symbols[i] = reel[i].currentScreenSymbol[linesSymbols[i]]
  }
  return symbols
}

function linescalculateWin(reel: Reel[], linesValue: number, coinsValue: number): {winningLines: number[], winAmount: number} {
  const winningLines: number[] = []
  let winAmount = 0

  for (let i = 0; i < linesValue; i++) {
    const line = getLineSymbols(reel, lines[i])
    let leadingSymbolsInLine = 1
    const leadingSymbol = line[0]
    for (let j = 1; j < line.length; j++) {
      if (line[j] === leadingSymbol) {
        leadingSymbolsInLine = j + 1
      } else {
        break
      }
    }

    const lineWinAmount = paytable[leadingSymbol - 1][leadingSymbolsInLine - 1]
    if (lineWinAmount > 0) {
      winAmount += lineWinAmount
      winningLines.push(i)
    }
  }

  if (winAmount) {
    winAmount *= coinsValue
  }

  return {winAmount, winningLines}
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
  betWinContainer: GameObjects.Container
  bet: GameObjects.Text
  betValue: GameObjects.Text
  win: GameObjects.Text
  winValue: GameObjects.Text
  balanceValue: GameObjects.Text

  // lines
  lineContainer: GameObjects.Container
  lines: Line

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
  linesValue: GameObjects.Text
  // coins
  plusCoins: Button
  minusCoins: Button
  coinsValue: GameObjects.Text
  // reel
  reels: Reel[]
  // menu
  menuContainer: GameObjects.Container
  back: Button

  // scaling
  smallScale = 0.65
  smallestScale = this.smallScale / 2

  // variables
  linesPosition = 0
  coinsPosition = 0
  balance = initialBalance
  isAutospinEnabled = false
  topContainerHeight: number
  winAmount = 0
  winningLines: number[]
  outerWidth = reelWidth * reelsLength + frameWidth
  outerHeight = symbolSize * reelsLength

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    this.load.atlas('symbolsAtlas', 'assets/img/fruits.png', 'assets/img/fruits.json')
    this.load.image('backButton', 'assets/img/back.png')
    this.load.atlas('plusMinusAtlas', 'assets/img/plusminus.png', 'assets/img/plusminus.json')
    this.load.image('spinButton', 'assets/img/spin.png')
    this.load.image('maxbetButton', 'assets/img/maxbet.png')
    this.load.image('autospinButton', 'assets/img/autospin.png')
    this.load.image('infoButton', 'assets/img/info.png')
    this.load.image('stopButton', 'assets/img/stop.png')
    this.load.image('bg', 'assets/img/bg.webp')
    this.load.image('reel1', 'assets/img/r1.png')
    this.load.image('reel2', 'assets/img/r2.png')
    this.load.image('reel3', 'assets/img/r3.png')
    this.load.image('reel1blurred', 'assets/img/r1blurred.png')
    this.load.image('reel2blurred', 'assets/img/r2blurred.png')
    this.load.image('reel3blurred', 'assets/img/r3blurred.png')
  }

  create() {
    this.lines = {}

    this.add.image(this.centerSlotX, this.height / 2, 'bg')

    // frame variables
    const yOffset = (reelsLength * symbolSize) / 2 + frameWidth / 2
    const xOffset = (reelsLength * reelWidth) / 2

    // frame
    this.add.rectangle(this.centerSlotX, this.centerSlotY - yOffset, this.outerWidth, frameWidth, neonYellowColor)
    this.add.rectangle(this.centerSlotX, this.centerSlotY + yOffset, this.outerWidth, frameWidth, neonYellowColor)
    this.add.rectangle(this.centerSlotX - xOffset, this.centerSlotY, frameWidth, this.outerHeight, neonYellowColor)
    this.add.rectangle(this.centerSlotX + xOffset, this.centerSlotY, frameWidth, this.outerHeight, neonYellowColor)

    // frame inner
    this.add.rectangle(
      this.centerSlotX - reelWidth / 2,
      this.centerSlotY,
      frameWidthNarrow,
      this.outerHeight,
      neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX + reelWidth / 2,
      this.centerSlotY,
      frameWidthNarrow,
      this.outerHeight,
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

    this.topContainerHeight = this.centerSlotY - yOffset - frameWidth / 2
    const bottomContainerHeight = this.height - this.topContainerHeight - this.outerHeight - frameWidth * 6

    // top container
    this.topContainer = new GameObjects.Container(this, this.centerSlotX, this.topContainerHeight / 2 - frameWidth / 2)

    this.topContainer.add(
      this.add
        .text(-this.outerWidth / 2, 5, 'FRUIT SLOT', {
          color: convertColorToString(neonYellowColor),
          fontSize: '65px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0, 0.5)
    )

    this.topContainer.add(
      this.add
        .text(this.outerWidth / 2, -10, 'BALANCE', {
          color: convertColorToString(whiteColor),
          fontSize: '26px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(1, 0.5)
    )

    this.balanceValue = this.getBalanceValue()

    this.topContainer.add([this.balanceValue])

    this.add.existing(this.topContainer)

    this.spin = new Button(this, 0, 0, 'spinButton', 1, undefined, () => this.startSpin(this))

    this.betWinContainer = new GameObjects.Container(this, this.centerSlotX, this.height - bottomContainerHeight / 0.93)
    this.bet = this.add
      .text(-this.outerWidth / 2, 0, 'BET', {
        color: convertColorToString(neonYellowColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0, 0.5)

    this.betValue = this.getBetValue()
    this.betWinContainer.add([this.bet, this.betValue])
    this.add.existing(this.betWinContainer)

    this.bottomContainer = new GameObjects.Container(this, this.centerSlotX, this.height - bottomContainerHeight / 2)

    // buttons

    this.maxbet = new Button(
      this,
      this.spin.width * 0.85,
      -this.spin.height / 4,
      'maxbetButton',
      this.smallScale,
      undefined,
      () => this.setMaxBet()
    )

    this.autospin = new Button(
      this,
      this.spin.width * 0.85,
      this.spin.height / 4,
      'autospinButton',
      this.smallScale,
      undefined,
      () => this.setIsAutospinEnabled(true)
    )

    this.info = new Button(
      this,
      this.spin.width * 1.4,
      -this.spin.height / 4,
      'infoButton',
      this.smallScale,
      undefined,
      () => this.showMenu()
    )

    this.minusLines = new Button(
      this,
      -this.outerWidth / 2,
      this.bottomContainer.height / 2 - this.spin.height / 3.5,
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeLinesValue()
    ).setOrigin(0, 0)

    this.plusLines = new Button(
      this,
      -this.outerWidth / 2 + this.minusLines.width * this.smallestScale * 1.1,
      this.bottomContainer.height / 2 - this.spin.height / 3.5,
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeLinesValue(true)
    ).setOrigin(0, 0)

    const linesText = this.add
      .text(-this.outerWidth / 2, this.bottomContainer.height / 2 - this.spin.height / 2, 'LINES', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0, 0)

    this.minusCoins = new Button(
      this,
      -this.outerWidth / 2,
      -(this.bottomContainer.height / 2 - this.spin.height / 2),
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeCoinsValue()
    ).setOrigin(0, 1)

    this.plusCoins = new Button(
      this,
      -this.outerWidth / 2 + this.minusLines.width * this.smallestScale * 1.1,
      -(this.bottomContainer.height / 2 - this.spin.height / 2),
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeCoinsValue(true)
    ).setOrigin(0, 1)

    const coinsText = this.add
      .text(-this.outerWidth / 2, -(this.bottomContainer.height / 2 - this.spin.height / 4), 'COINS', {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0, 1)

    this.linesValue = this.getLinesValue()
    this.coinsValue = this.getCoinsValue()

    this.bottomContainer.add([
      this.spin,
      this.maxbet,
      this.autospin,
      this.info,
      linesText,
      this.plusLines,
      this.minusLines,
      this.linesValue,
      coinsText,
      this.plusCoins,
      this.minusCoins,
      this.coinsValue
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
        duration: reelsDurationBaseMs + i * reelsDurationGapMs,
        currentScreenSymbol: new Array(visibleSymbolsLength).fill(null)
      }
    }
    this.lineContainer = new GameObjects.Container(this, 0, 0)
    this.add.existing(this.lineContainer)
    this.lineContainer.depth = 1
    this.shuffle(true)
  }

  createMenu(): GameObjects.Container {
    const menuContainerHeight = this.height - this.topContainerHeight
    const menuContainer = new GameObjects.Container(this, this.centerSlotX, this.height - menuContainerHeight / 2)
    const rectangle = new GameObjects.Rectangle(this, 0, 0, this.width, menuContainerHeight, violetColor)

    this.back = new Button(
      this,
      this.width / 2 - (this.info.height / 2) * this.smallScale,
      -menuContainerHeight / 2 + (this.info.height / 2) * this.smallScale,
      'backButton',
      0.5,
      undefined,
      () => this.hideMenu()
    )
    const topRectangles = new Array(symbolsLength)
    const topRectanglesInner = new Array(symbolsLength)
    const bottomRectangles = new Array(symbolsLength)
    const bottomRectanglesInner = new Array(symbolsLength)
    const symbols = new Array(symbolsLength)
    const symbolsTextTopLeft = new Array(symbolsLength)
    const symbolsTextTopRight = new Array(symbolsLength)
    const symbolsTextBottomLeft = new Array(symbolsLength)
    const symbolsTextBottomRight = new Array(symbolsLength)

    const paytableText = this.add
      .text(0, -this.height / 2.6, 'PAY TABLE', {
        color: convertColorToString(neonBlueColor),
        fontSize: '50px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)

    const linesText = this.add
      .text(0, this.height / 10, 'LINES', {
        color: convertColorToString(neonBlueColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)

    const linesTextTop = new Array(symbolsLength)

    const linesRectangles: GameObjects.Rectangle[] = [] // new Array(symbolsLength * visibleSymbolsLength * reelsLength)
    const size = this.height / 21
    for (let i = 0; i < symbolsLength; i++) {
      for (let j = 0; j < reelsLength; j++) {
        const x = ((i - 2) * this.width) / 5 + (j - 1) * 40
        for (let k = 0; k < visibleSymbolsLength; k++) {
          const y = this.height / 3.9 + k * 40
          linesRectangles.push(
            new GameObjects.Rectangle(this, x, y, size, size, lines[i][j] === k ? linesColorPalette[i] : whiteColor)
          )
        }
      }

      linesTextTop[i] = this.add
        .text(((i - 2) * this.width) / 5, +this.height / 5, `Line ${i + 1}`, {
          color: convertColorToString(neonYellowColor),
          fontSize: '40px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      topRectangles[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        -this.height / 7,
        this.width / 6,
        this.height / 2.8,
        neonBlueColor
      )

      topRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        -this.height / 7,
        this.width / 6 - 10,
        this.height / 2.8 - 10,
        violetColor
      )

      symbols[i] = this.add.image(((i - 2) * this.width) / 5, -this.height / 4.5, 'symbolsAtlas', `s${i + 1}.png`)
      symbolsTextTopLeft[i] = this.add
        .text(((i - 2) * this.width) / 5 - this.width / 12 / 2, -this.height / 10, '3:', {
          color: convertColorToString(neonYellowColor),
          fontSize: '50px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextTopRight[i] = this.add
        .text(((i - 2) * this.width) / 5 + this.width / 16 / 2, -this.height / 10, paytable[i][2].toString(), {
          color: convertColorToString(whiteColor),
          fontSize: '50px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextBottomLeft[i] = this.add
        .text(((i - 2) * this.width) / 5 - this.width / 12 / 2, -this.height / 40, '2:', {
          color: convertColorToString(neonYellowColor),
          fontSize: '50px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextBottomRight[i] = this.add
        .text(((i - 2) * this.width) / 5 + this.width / 14 / 2, -this.height / 40, paytable[i][1].toString(), {
          color: convertColorToString(whiteColor),
          fontSize: '50px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      bottomRectangles[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        +this.height / 3.5,
        this.width / 6,
        this.height / 4,
        neonBlueColor
      )

      bottomRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        +this.height / 3.5,
        this.width / 6 - 10,
        this.height / 4 - 10,
        violetColor
      )
    }

    menuContainer.add([
      rectangle,
      this.back,
      ...topRectangles,
      ...topRectanglesInner,
      paytableText,
      linesText,
      ...bottomRectangles,
      ...bottomRectanglesInner,
      ...linesRectangles
    ])
    menuContainer.add([
      ...symbols,
      ...symbolsTextTopLeft,
      ...symbolsTextTopRight,
      ...symbolsTextBottomLeft,
      ...symbolsTextBottomRight,
      ...linesTextTop
    ])
    return menuContainer
  }

  drawLine(line: number) {
    const color = linesColorPalette[line]
    switch (line) {
      case 0:
        this.lines.rectangle1 = this.add
          .rectangle(this.centerSlotX, this.topContainerHeight + (symbolSize / 2) * 3.2, this.outerWidth, lineWidth, color)
          .setOrigin(0.5, 0)
        this.lineContainer.add(this.lines.rectangle1)
      break;

      case 1:
        this.lines.rectangle2 = this.add
          .rectangle(this.centerSlotX, this.topContainerHeight + (symbolSize / 2) * 1.2, this.outerWidth, lineWidth, color)
          .setOrigin(0.5, 0)
        this.lineContainer.add(this.lines.rectangle2)
      break;

      case 2:
        this.lines.rectangle3 = this.add
          .rectangle(this.centerSlotX, this.topContainerHeight + (symbolSize / 2) * 5.2, this.outerWidth, lineWidth, color)
          .setOrigin(0.5, 0)

        this.lineContainer.add(this.lines.rectangle3)
      break;

      case 3:
        this.lines.triangle41 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            0,
            0,
            this.outerWidth,
            this.outerHeight,
            this.outerWidth,
            this.outerHeight + lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.lines.triangle42 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            0,
            0,
            0,
            lineWidth,
            this.outerWidth,
            this.outerHeight + lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.lineContainer.add(this.lines.triangle41)
        this.lineContainer.add(this.lines.triangle42)
      break;

      case 4:
        this.lines.triangle51 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            this.outerWidth,
            0,
            0,
            this.outerHeight,
            0,
            this.outerHeight + lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.lines.triangle52 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            this.outerWidth,
            0,
            this.outerWidth,
            lineWidth,
            0,
            this.outerHeight + lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.lineContainer.add(this.lines.triangle51)
        this.lineContainer.add(this.lines.triangle52)
      break;
    }
  }

  removeAllLines() {
    if (this.lines.rectangle1) {
      this.lineContainer.remove(this.lines.rectangle1, true)
    }

    if (this.lines.rectangle2) {
      this.lineContainer.remove(this.lines.rectangle2, true)
    }

    if (this.lines.rectangle3) {
      this.lineContainer.remove(this.lines.rectangle3, true)
    }

    if (this.lines.triangle41) {
      this.lineContainer.remove(this.lines.triangle41, true)
    }

    if (this.lines.triangle42) {
      this.lineContainer.remove(this.lines.triangle42, true)
    }

    if (this.lines.triangle51) {
      this.lineContainer.remove(this.lines.triangle51, true)
    }

    if (this.lines.triangle52) {
      this.lineContainer.remove(this.lines.triangle52, true)
    }
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
      this.spin.width * 1.4,
      this.spin.height / 4,
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
    this.changeLinesValue(undefined, true)
    this.changeCoinsValue(undefined, true)
  }

  changeLinesValue(forward?: boolean, maxBet?: boolean) {
    this.linesPosition = maxBet
      ? linesOptions.length - 1
      : this.getNewPosition(this.linesPosition, linesOptions, forward)
    this.bottomContainer.remove(this.linesValue, true)
    this.linesValue = this.getLinesValue()
    this.bottomContainer.add(this.linesValue)
    this.changeBetValue()
  }

  changeCoinsValue(forward?: boolean, maxBet?: boolean) {
    this.coinsPosition = maxBet
      ? coinsOptions.length - 1
      : this.getNewPosition(this.coinsPosition, coinsOptions, forward)
    this.bottomContainer.remove(this.coinsValue, true)
    this.coinsValue = this.getCoinsValue()
    this.bottomContainer.add(this.coinsValue)
    this.changeBetValue()
  }

  changeBetValue() {
    this.betWinContainer.remove(this.betValue, true)
    this.betValue = this.getBetValue()
    this.betWinContainer.add(this.betValue)
  }

  getLinesValue(): GameObjects.Text {
    return this.add
      .text(-this.spin.width / 1.2, -this.spin.height / 3.5, linesOptions[this.linesPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '45px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  getCoinsValue(): GameObjects.Text {
    return this.add
      .text(-this.spin.width / 1.2, +this.spin.height / 4.2, coinsOptions[this.coinsPosition].toString(), {
        color: convertColorToString(whiteColor),
        fontSize: '45px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  calculateBet(): number {
    return linesOptions[this.linesPosition] * coinsOptions[this.coinsPosition]
  }

  getBetValue(): GameObjects.Text {
    return this.add
      .text(-this.spin.width / 1.2, 0, this.calculateBet().toString(), {
        color: convertColorToString(neonYellowColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  getWin() {
    return this.add
      .text(0, 0, `WIN!!!`, {
        color: convertColorToString(neonGreenColor),
        fontSize: '50px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  getWinValue(): GameObjects.Text {
    return this.add
      .text(this.outerWidth / 2, 0, `${numberWithCommas(this.winAmount)} $`, {
        color: convertColorToString(neonGreenColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(1, 0.5)
  }

  updateBalance(changeBalance: number) {
    this.balance += changeBalance
    this.topContainer.remove(this.balanceValue, true)
    this.balanceValue = this.getBalanceValue()
    this.topContainer.add(this.balanceValue)
  }

  getBalanceValue(): GameObjects.Text {
    return this.add
      .text(this.outerWidth / 2, 20, `${numberWithCommas(this.balance)}$`, {
        color: convertColorToString(whiteColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(1, 0.5)
  }

  startSpin(scene: Scene) {
    this.removeAllLines()
    this.updateBalance(-this.calculateBet())
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
            if (this.winAmount > 0) {
              this.winValue = this.getWinValue()
              this.updateBalance(this.winAmount)
              this.win = this.getWin()
              this.betWinContainer.add([this.win, this.winValue])
            }

            for (let j = 0; j < this.winningLines.length; j++) {
              this.drawLine(this.winningLines[j])
            }

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
      if (this.win) {
        this.betWinContainer.remove(this.win, true)
      }

      if (this.winValue) {
        this.betWinContainer.remove(this.winValue, true)
      }

      const {winAmount, winningLines} = linescalculateWin(
        this.reels,
        linesOptions[this.linesPosition],
        coinsOptions[this.coinsPosition]
      )

      this.winAmount = winAmount;
      this.winningLines = winningLines
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
