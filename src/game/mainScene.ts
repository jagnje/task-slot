import config, { DEFAULT_WIDTH, slotConfig } from '../config'
import Button from './Button'
import { GameObjects, Scene } from 'phaser'
import {
  convertColorToString,
  numberWithCommas,
  calculateRatio,
  getScreenSymbols,
  calculateWinAmountAndLines
} from './functions'
import { paytable, lines } from './common'
import { Reel, Line } from './types'
export default class MainScene extends Scene {
  // dimensions
  width = config.scale.width
  height = config.scale.height
  centerSlotY = this.height / 2 - slotConfig.symbolSize / 2
  isMobilePortrait = slotConfig.isMobile && slotConfig.orientation === 'portrait'
  centerSlotX = this.isMobilePortrait ? this.width / 2 : this.width / 3

  // ui elements
  topContainer: GameObjects.Container
  bottomContainer: GameObjects.Container
  betWinContainer: GameObjects.Container
  bet: GameObjects.Text
  betValue: GameObjects.Text
  message: GameObjects.Text
  winValue: GameObjects.Text
  balanceValue: GameObjects.Text

  // lines
  linesContainer: GameObjects.Container
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
  smallScale = 0.6
  smallerScale = 0.5
  smallestScale = 0.35

  // variables
  linesPosition = 0
  coinsPosition = 0
  balance = slotConfig.initialBalance
  isAutospinEnabled = false
  topContainerHeight: number
  winAmount = 0
  winningLines: number[]
  outerWidth = slotConfig.reelWidth * slotConfig.reelsLength + slotConfig.frameWidth
  outerHeight = slotConfig.symbolSize * slotConfig.reelsLength
  isSpinning = false
  isSpinningReel = false

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

    this.add.image(this.width / 2, this.height / 2, 'bg')    

    // frame variables
    const yOffset = (slotConfig.reelsLength * slotConfig.symbolSize) / 2 + slotConfig.frameWidth / 2
    const xOffset = (slotConfig.reelsLength * slotConfig.reelWidth) / 2

    // frame
    this.add.rectangle(
      this.centerSlotX,
      this.centerSlotY - yOffset,
      this.outerWidth,
      slotConfig.frameWidth,
      slotConfig.neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX,
      this.centerSlotY + yOffset,
      this.outerWidth,
      slotConfig.frameWidth,
      slotConfig.neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX - xOffset,
      this.centerSlotY,
      slotConfig.frameWidth,
      this.outerHeight,
      slotConfig.neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX + xOffset,
      this.centerSlotY,
      slotConfig.frameWidth,
      this.outerHeight,
      slotConfig.neonYellowColor
    )

    // frame inner
    this.add.rectangle(
      this.centerSlotX - slotConfig.reelWidth / 2,
      this.centerSlotY,
      slotConfig.frameWidthNarrow,
      this.outerHeight,
      slotConfig.neonYellowColor
    )
    this.add.rectangle(
      this.centerSlotX + slotConfig.reelWidth / 2,
      this.centerSlotY,
      slotConfig.frameWidthNarrow,
      this.outerHeight,
      slotConfig.neonYellowColor
    )

    // reels backgrounds
    for (let i = 0; i < slotConfig.reelsLength; i++) {
      this.add.rectangle(
        this.centerSlotX + (i - 1) * slotConfig.reelWidth,
        this.centerSlotY,
        slotConfig.reelWidth - slotConfig.frameWidthNarrow,
        slotConfig.symbolSize * slotConfig.visibleSymbolsLength,
        slotConfig.violetColor
      )
    }

    this.topContainerHeight = this.centerSlotY - yOffset - slotConfig.frameWidth / 2
    const bottomContainerHeight = this.height - this.topContainerHeight - this.outerHeight - slotConfig.frameWidth * 6

    // top container
    this.topContainer = new GameObjects.Container(
      this,
      this.centerSlotX,
      this.topContainerHeight / 2 - slotConfig.frameWidth / 2
    )

    if (this.isMobilePortrait) {
      this.topContainer.add(
        this.add.rectangle(0, 0, this.outerWidth, this.topContainerHeight + slotConfig.frameWidth, slotConfig.violetColor)
      )
    }
    this.topContainer.add(
      this.add
        .text(-this.outerWidth / 2 + 5, 5, 'FRUITS', {
          color: convertColorToString(slotConfig.neonYellowColor),
          fontSize: '65px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0, 0.5)
    )

    this.topContainer.add(
      this.add
        .text(this.outerWidth / 2 - 10, -10, 'BALANCE', {
          color: convertColorToString(slotConfig.whiteColor),
          fontSize: '26px',
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(1, 0.5)
    )

    this.balanceValue = this.getBalanceValue()

    this.topContainer.add([this.balanceValue])

    this.add.existing(this.topContainer)

    this.spin = new Button(this, 0, 0, 'spinButton', 1, undefined, () => this.startSpin())

    this.betWinContainer = new GameObjects.Container(this, this.centerSlotX, this.height - bottomContainerHeight / 0.92)
    this.bet = this.add
      .text(-this.outerWidth / 2, 0, 'BET', {
        color: convertColorToString(slotConfig.neonYellowColor),
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
      slotConfig.spinButtonSize * (this.isMobilePortrait ? 0.7 : 0.72),
      -slotConfig.spinButtonSize / 4,
      'maxbetButton',
      this.isMobilePortrait ? this.smallerScale : this.smallScale,
      undefined,
      () => this.setMaxBet()
    )

    this.autospin = new Button(
      this,
      slotConfig.spinButtonSize * (this.isMobilePortrait ? 0.7 : 0.72),
      slotConfig.spinButtonSize / 4,
      'autospinButton',
      this.isMobilePortrait ? this.smallerScale : this.smallScale,
      undefined,
      () => this.setIsAutospinEnabled(true)
    )

    this.info = new Button(
      this,
      slotConfig.spinButtonSize * (this.isMobilePortrait ? 1.1 : 1.22),
      -slotConfig.spinButtonSize / 4,
      'infoButton',
      this.isMobilePortrait ? this.smallerScale : this.smallScale,
      undefined,
      () => this.showMenu()
    )

    this.minusLines = new Button(
      this,
      -this.outerWidth / 2,
      this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 3.5,
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeLinesValue()
    ).setOrigin(0, 0)

    this.plusLines = new Button(
      this,
      -this.outerWidth / 2 + this.minusLines.width * this.smallestScale * 1.1,
      this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 3.5,
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeLinesValue(true)
    ).setOrigin(0, 0)

    const linesText = this.add
      .text(-this.outerWidth / 2, this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 2, 'LINES', {
        color: convertColorToString(slotConfig.whiteColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0, 0)

    this.minusCoins = new Button(
      this,
      -this.outerWidth / 2,
      -(this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 2),
      'plusMinusAtlas',
      this.smallestScale,
      'minus.png',
      () => this.changeCoinsValue()
    ).setOrigin(0, 1)

    this.plusCoins = new Button(
      this,
      -this.outerWidth / 2 + this.minusLines.width * this.smallestScale * 1.1,
      -(this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 2),
      'plusMinusAtlas',
      this.smallestScale,
      'plus.png',
      () => this.changeCoinsValue(true)
    ).setOrigin(0, 1)

    const coinsText = this.add
      .text(-this.outerWidth / 2, -(this.bottomContainer.height / 2 - slotConfig.spinButtonSize / 4), 'COINS', {
        color: convertColorToString(slotConfig.whiteColor),
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
    this.reels = new Array(slotConfig.reelsLength)
    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i] = {
        reel: this.add.tileSprite(
          this.centerSlotX + (i - 1) * slotConfig.reelWidth,
          this.centerSlotY,
          slotConfig.symbolSize,
          slotConfig.symbolSize * slotConfig.visibleSymbolsLength,
          `reel${i + 1}`
        ),
        duration: slotConfig.reelsDurationBaseMs + i * slotConfig.reelsDurationGapMs,
        currentScreenSymbol: new Array(slotConfig.visibleSymbolsLength).fill(null)
      }
    }
    this.linesContainer = new GameObjects.Container(this, 0, 0)

    if (!this.isMobilePortrait) {
      this.drawLineNumbers()
    }

    this.add.existing(this.linesContainer)
    this.linesContainer.depth = 1
    this.betWinContainer.depth = 1
    this.initializeReels()
  }

  update() {
    if (this.isSpinningReel) {
      this.spin.rotation += slotConfig.rotationSpeed
    } else {
      if (this.spin.rotation !== 0) {
        this.spin.rotation += slotConfig.rotationSpeed
        if (Math.abs(this.spin.rotation) < 0.2) {
          this.spin.rotation = 0
        }
      }
    }
  }
  createMenu(): GameObjects.Container {
    const menuContainerHeight = this.height - this.topContainerHeight
    const menuContainer = new GameObjects.Container(this, this.width / 2, this.height - menuContainerHeight / 2)
    const rectangle = new GameObjects.Rectangle(this, 0, 0, this.width, menuContainerHeight, slotConfig.violetColor)

    this.back = new Button(
      this,
      this.width / 2 - (this.info.height / 2) * this.smallScale,
      -menuContainerHeight / 2 + (this.info.height / 2) * this.smallScale,
      'backButton',
      0.5,
      undefined,
      () => this.hideMenu()
    )
    const topRectangles = new Array(slotConfig.symbolsLength)
    const topRectanglesInner = new Array(slotConfig.symbolsLength)
    const bottomRectangles = new Array(slotConfig.symbolsLength)
    const bottomRectanglesInner = new Array(slotConfig.symbolsLength)
    const symbols = new Array(slotConfig.symbolsLength)
    const symbolsTextTopLeft = new Array(slotConfig.symbolsLength)
    const symbolsTextTopRight = new Array(slotConfig.symbolsLength)
    const symbolsTextBottomLeft = new Array(slotConfig.symbolsLength)
    const symbolsTextBottomRight = new Array(slotConfig.symbolsLength)

    let innerWidth = window.innerWidth
    if (innerWidth > DEFAULT_WIDTH) {
      innerWidth = DEFAULT_WIDTH
    }

    const ratio = calculateRatio(innerWidth, DEFAULT_WIDTH)

    const paytableText = this.add
      .text(0, -this.height / 2.6, 'PAY TABLE', {
        color: convertColorToString(slotConfig.neonBlueColor),
        fontSize: '50px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)

    const linesText = this.add
      .text(0, this.height / 10, 'LINES', {
        color: convertColorToString(slotConfig.neonBlueColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)

    const linesTextTop = new Array(slotConfig.symbolsLength)

    const linesRectangles: GameObjects.Rectangle[] = []
    const size = (this.height / 21) * ratio
    for (let i = 0; i < slotConfig.symbolsLength; i++) {
      for (let j = 0; j < slotConfig.reelsLength; j++) {
        const x = ((i - 2) * this.width) / 5 + (j - 1) * 40 * ratio
        for (let k = 0; k < slotConfig.visibleSymbolsLength; k++) {
          const y = this.height / 3.9 + k * 40 * ratio
          linesRectangles.push(
            new GameObjects.Rectangle(
              this,
              x,
              y,
              size,
              size,
              lines[i][j] === k ? slotConfig.linesColorPalette[i] : slotConfig.whiteColor
            )
          )
        }
      }

      linesTextTop[i] = this.add
        .text(((i - 2) * this.width) / 5, +this.height / 5, `LINE ${i + 1}`, {
          color: convertColorToString(slotConfig.neonYellowColor),
          fontSize: `${ratio * 40}px`,
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      topRectangles[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        -this.height / 7,
        this.width / 5.3,
        this.height / 2.8,
        slotConfig.neonBlueColor
      )

      topRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        -this.height / 7,
        this.width / 5.3 - 10,
        this.height / 2.8 - 10,
        slotConfig.violetColor
      )

      symbols[i] = this.add
        .image(((i - 2) * this.width) / 5, -this.height / 4.5, 'symbolsAtlas', `s${i + 1}.png`)
        .setScale(ratio)
      symbolsTextTopLeft[i] = this.add
        .text(((i - 2) * this.width) / 5 - this.width / 10 / 2, -this.height / 10, '3:', {
          color: convertColorToString(slotConfig.neonYellowColor),
          fontSize: `${ratio * 50}px`,
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextTopRight[i] = this.add
        .text(((i - 2) * this.width) / 5 + this.width / 16 / 2, -this.height / 10, paytable[i][2].toString(), {
          color: convertColorToString(slotConfig.whiteColor),
          fontSize: `${ratio * 40}px`,
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextBottomLeft[i] = this.add
        .text(((i - 2) * this.width) / 5 - this.width / 10 / 2, -this.height / 40, '2:', {
          color: convertColorToString(slotConfig.neonYellowColor),
          fontSize: `${ratio * 50}px`,
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      symbolsTextBottomRight[i] = this.add
        .text(((i - 2) * this.width) / 5 + this.width / 14 / 2, -this.height / 40, paytable[i][1].toString(), {
          color: convertColorToString(slotConfig.whiteColor),
          fontSize: `${ratio * 40}px`,
          fontFamily: 'PlaypenSansDevaBold'
        })
        .setOrigin(0.5, 0.5)

      bottomRectangles[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        +this.height / 3.5,
        this.width / 5.3,
        this.height / 4,
        slotConfig.neonBlueColor
      )

      bottomRectanglesInner[i] = new GameObjects.Rectangle(
        this,
        ((i - 2) * this.width) / 5,
        +this.height / 3.5,
        this.width / 5.3 - 10,
        this.height / 4 - 10,
        slotConfig.violetColor
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
      ...linesRectangles,
      ...symbols,
      ...symbolsTextTopLeft,
      ...symbolsTextTopRight,
      ...symbolsTextBottomLeft,
      ...symbolsTextBottomRight,
      ...linesTextTop
    ])

    menuContainer.depth = 2
    return menuContainer
  }

  drawLineNumbers() {
    for (let i = 0; i < lines.length; i++) {
      let factor: number = 0
      switch(i) {
        case 0:
          factor = 3.2
        break;
        case 1:
          factor = 1.2
        break;
        case 2:
          factor = 5.2
        break;
        case 3:
          factor = -0.2
        break;
        case 4:
          factor = 6.2
        break;
      }
      this.linesContainer.add(
        this.add
          .rectangle(
            this.centerSlotX - this.outerWidth / 2 - 20,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * factor - 10,
            30,
            38,
            slotConfig.linesColorPalette[i],
            1
          )
          .setOrigin(0.5, 0)
      )

      this.linesContainer.add(
        this.add
          .rectangle(
            this.centerSlotX - this.outerWidth / 2 - 20,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * factor - 7,
            24,
            32,
            slotConfig.violetColor,
            1
          )
          .setOrigin(0.5, 0)
      )

      this.linesContainer.add(
        this.add
          .text(
            this.centerSlotX - this.outerWidth / 2 - 20,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * factor - 8,
            (i+1).toString(),
            {
              color: convertColorToString(slotConfig.linesColorPalette[i]),
              fontSize: '24px',
              fontFamily: 'PlaypenSansDevaBold'
            }
          )
          .setOrigin(0.5, 0)
      )
    }
  }

  drawLine(line: number) {
    const color = slotConfig.linesColorPalette[line]
    switch (line) {
      case 0:
        this.lines.rectangle1 = this.add
          .rectangle(
            this.centerSlotX,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * 3.2,
            this.outerWidth,
            slotConfig.lineWidth,
            color
          )
          .setOrigin(0.5, 0)
        this.linesContainer.add(this.lines.rectangle1)
        break

      case 1:
        this.lines.rectangle2 = this.add
          .rectangle(
            this.centerSlotX,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * 1.2,
            this.outerWidth,
            slotConfig.lineWidth,
            color
          )
          .setOrigin(0.5, 0)
        this.linesContainer.add(this.lines.rectangle2)
        break

      case 2:
        this.lines.rectangle3 = this.add
          .rectangle(
            this.centerSlotX,
            this.topContainerHeight + (slotConfig.symbolSize / 2) * 5.2,
            this.outerWidth,
            slotConfig.lineWidth,
            color
          )
          .setOrigin(0.5, 0)

        this.linesContainer.add(this.lines.rectangle3)
        break

      case 3:
        this.lines.triangle41 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            0,
            0,
            this.outerWidth,
            this.outerHeight + slotConfig.frameWidth / 2,
            this.outerWidth,
            this.outerHeight + slotConfig.frameWidth / 2 + slotConfig.lineWidth,
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
            slotConfig.lineWidth,
            this.outerWidth,
            this.outerHeight + slotConfig.frameWidth / 2 + slotConfig.lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.linesContainer.add(this.lines.triangle41)
        this.linesContainer.add(this.lines.triangle42)
        break

      case 4:
        this.lines.triangle51 = this.add
          .triangle(
            this.centerSlotX,
            this.centerSlotY,
            this.outerWidth,
            0,
            0,
            this.outerHeight + slotConfig.frameWidth / 2,
            0,
            this.outerHeight + slotConfig.frameWidth / 2 + slotConfig.lineWidth,
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
            slotConfig.lineWidth,
            0,
            this.outerHeight + slotConfig.frameWidth / 2 + slotConfig.lineWidth,
            color
          )
          .setOrigin(0.5, 0.5)

        this.linesContainer.add(this.lines.triangle51)
        this.linesContainer.add(this.lines.triangle52)
        break
    }
  }

  removeAllLines() {
    if (this.lines.rectangle1) {
      this.linesContainer.remove(this.lines.rectangle1, true)
    }

    if (this.lines.rectangle2) {
      this.linesContainer.remove(this.lines.rectangle2, true)
    }

    if (this.lines.rectangle3) {
      this.linesContainer.remove(this.lines.rectangle3, true)
    }

    if (this.lines.triangle41) {
      this.linesContainer.remove(this.lines.triangle41, true)
    }

    if (this.lines.triangle42) {
      this.linesContainer.remove(this.lines.triangle42, true)
    }

    if (this.lines.triangle51) {
      this.linesContainer.remove(this.lines.triangle51, true)
    }

    if (this.lines.triangle52) {
      this.linesContainer.remove(this.lines.triangle52, true)
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
      slotConfig.spinButtonSize * (this.isMobilePortrait ? 1.1 : 1.22),
      slotConfig.spinButtonSize / 4,
      'stopButton',
      this.isMobilePortrait ? this.smallerScale : this.smallScale,
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
      this.startSpin()
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
      ? slotConfig.linesOptions.length - 1
      : this.getNewPosition(this.linesPosition, slotConfig.linesOptions, forward)
    this.bottomContainer.remove(this.linesValue, true)
    this.linesValue = this.getLinesValue()
    this.bottomContainer.add(this.linesValue)
    this.changeBetValue()
  }

  changeCoinsValue(forward?: boolean, maxBet?: boolean) {
    this.coinsPosition = maxBet
      ? slotConfig.coinsOptions.length - 1
      : this.getNewPosition(this.coinsPosition, slotConfig.coinsOptions, forward)
    this.bottomContainer.remove(this.coinsValue, true)
    this.coinsValue = this.getCoinsValue()
    this.bottomContainer.add(this.coinsValue)
    this.changeBetValue()
  }

  changeBetValue() {
    this.betWinContainer.remove(this.betValue, true)
    this.betValue = this.getBetValue()
    this.betWinContainer.add(this.betValue)

    if (this.winValue) {
      this.betWinContainer.remove(this.winValue, true)
    }
    if (this.message) {
      this.betWinContainer.remove(this.message, true)
    }
  }

  getLinesValue(): GameObjects.Text {
    return this.add
      .text(
        -slotConfig.spinButtonSize / 1.65,
        -slotConfig.spinButtonSize / 3.5,
        slotConfig.linesOptions[this.linesPosition].toString(),
        {
          color: convertColorToString(slotConfig.whiteColor),
          fontSize: '30px',
          fontFamily: 'PlaypenSansDevaBold'
        }
      )
      .setOrigin(0.5, 0.5)
  }

  getCoinsValue(): GameObjects.Text {
    return this.add
      .text(
        -slotConfig.spinButtonSize / 1.65,
        +slotConfig.spinButtonSize / 4.2,
        slotConfig.coinsOptions[this.coinsPosition].toString(),
        {
          color: convertColorToString(slotConfig.whiteColor),
          fontSize: '30px',
          fontFamily: 'PlaypenSansDevaBold'
        }
      )
      .setOrigin(0.5, 0.5)
  }

  calculateBet(): number {
    return slotConfig.linesOptions[this.linesPosition] * slotConfig.coinsOptions[this.coinsPosition]
  }

  getBetValue(): GameObjects.Text {
    return this.add
      .text(-slotConfig.spinButtonSize / 1.65, 0, this.calculateBet().toString(), {
        color: convertColorToString(slotConfig.neonYellowColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  getMessageWin() {
    return this.add
      .text(0, 0, 'WIN!', {
        color: convertColorToString(slotConfig.neonGreenColor),
        fontSize: '40px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(0.5, 0.5)
  }

  getMessageLowBalance() {
    return this.add
      .text(this.outerWidth / 2, 0, this.balance === 0 ? 'OUT OF AVAILABLE FUNDS!' : 'BALANCE TOO LOW!', {
        color: convertColorToString(slotConfig.neonRedColor),
        fontSize: this.balance === 0 ? '24px' : '30px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(1, 0.5)
  }

  getWinValue(): GameObjects.Text {
    return this.add
      .text(this.outerWidth / 2, 0, `${numberWithCommas(this.winAmount)} $`, {
        color: convertColorToString(slotConfig.neonGreenColor),
        fontSize: '30px',
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
      .text(this.outerWidth / 2 - 10, 20, `${numberWithCommas(this.balance)} $`, {
        color: convertColorToString(slotConfig.whiteColor),
        fontSize: '26px',
        fontFamily: 'PlaypenSansDevaBold'
      })
      .setOrigin(1, 0.5)
  }

  startSpin() {
    if (!this.isSpinning) {
      this.isSpinning = true
      this.isSpinningReel = true
      this.removeAllLines()
      const bet = this.calculateBet()
      if (this.balance >= bet) {
        this.updateBalance(-bet)
        this.blurReels()
        this.shuffle()
        for (let i = 0; i < slotConfig.reelsLength; i++) {
          this.tweens.add({
            targets: [this.reels[i].reel],
            tilePositionY: `+=${(i + 1) * slotConfig.reelSymbolsLength * slotConfig.symbolSize}`,
            duration: this.reels[i].duration,
            onComplete: () => {
              const tilePositionY = this.reels[i].reel.tilePositionY
              this.reels[i].reel.destroy()
              this.reels[i].reel = this.add.tileSprite(
                this.centerSlotX + (i - 1) * slotConfig.reelWidth,
                this.centerSlotY,
                slotConfig.symbolSize,
                slotConfig.symbolSize * slotConfig.visibleSymbolsLength,
                `reel${i + 1}`
              )
              this.reels[i].reel.tilePositionY = tilePositionY

              if (i === slotConfig.reelsLength - 1) {
                this.isSpinningReel = false
                if (this.winAmount > 0) {
                  this.winValue = this.getWinValue()
                  this.updateBalance(this.winAmount)
                  this.message = this.getMessageWin()

                  this.tweens.addCounter({
                      from: 0,
                      to: 1,
                      duration: 500,
                      yoyo: true,
                      onUpdate: (tween) => {
                          this.message.setFontSize(40 + tween.getValue() * 64);
                      },
                      onComplete: () => {
                        this.isSpinning = false
                      },
                      repeat: 1
                  });                  
                  this.betWinContainer.add([this.message, this.winValue])

                  for (let j = 0; j < this.winningLines.length; j++) {
                    this.drawLine(this.winningLines[j])
                  }
                } else {
                  this.isSpinning = false
                }

                if (this.balance === 0) {
                  this.message = this.getMessageLowBalance()
                  this.betWinContainer.add(this.message)
                }
                
                if (this.isAutospinEnabled) {
                  this.time.addEvent({
                    delay: slotConfig.autospinDelayBetweenSpinsMs,
                    callback: () => this.startSpin(),
                    callbackScope: this
                  })
                }
              }
            }
          })
        }
      } else {
        this.message = this.getMessageLowBalance()
        if (this.winValue) {
          this.betWinContainer.remove(this.winValue, true)
        }
        this.betWinContainer.add(this.message)
      }
    }
  }

  initializeReels() {
    for (let i = 0; i < slotConfig.reelsLength; i++) {
      this.reels[i].reel.tilePositionY = 0
    }
  }

  shuffle() {
    for (let i = 0; i < slotConfig.reelsLength; i++) {
      const newReelPosition = Phaser.Math.Between(0, slotConfig.reelSymbolsLength - 1)
      this.reels[i].reel.tilePositionY = (newReelPosition - 1) * slotConfig.symbolSize
      this.reels[i].currentScreenSymbol = getScreenSymbols(i, newReelPosition, slotConfig.reelSymbolsLength)
    }

    if (this.message) {
      this.betWinContainer.remove(this.message, true)
    }

    if (this.winValue) {
      this.betWinContainer.remove(this.winValue, true)
    }

    const { winAmount, winningLines } = calculateWinAmountAndLines(
      this.reels,
      slotConfig.linesOptions[this.linesPosition],
      slotConfig.coinsOptions[this.coinsPosition]
    )

    this.winAmount = winAmount
    this.winningLines = winningLines
  }

  blurReels() {
    for (let i = 0; i < slotConfig.reelsLength; i++) {
      this.reels[i].reel.destroy()
      this.reels[i].reel = this.add.tileSprite(
        this.centerSlotX + (i - 1) * slotConfig.reelWidth,
        this.centerSlotY,
        slotConfig.symbolSize,
        slotConfig.symbolSize * slotConfig.visibleSymbolsLength,
        `reel${i + 1}blurred`
      )
    }
  }
}
