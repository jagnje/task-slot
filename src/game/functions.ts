import { Reel } from './types'
import { paytable, lines, reelsSymbols } from './common'

export function convertColorToString(color: number) {
  const r = Math.floor(color / (256 * 256))
  color = color - r * 256 * 256
  const g = Math.floor(color / 256)
  const b = color - g * 256
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function numberWithCommas(x: number): string {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function calculateRatio(x: number, y: number) {
  return Math.pow(x/y,0.6)
}

export function getScreenSymbols(reel: number, newPosition: number, reelSymbolsLength: number): number[] {
  const prevPosition = newPosition === 0 ? reelSymbolsLength - 1 : newPosition - 1
  const nextPosition = newPosition === reelSymbolsLength - 1 ? 0 : newPosition + 1
  const reelSymbolPrev = reelsSymbols[reel][prevPosition]
  const reelSymbol = reelsSymbols[reel][newPosition]
  const reelSymbolNext = reelsSymbols[reel][nextPosition]
  return [reelSymbolPrev, reelSymbol, reelSymbolNext]
}

function getLineSymbols(reel: Reel[], lineSymbols: number[]): number[] {
  const symbols = new Array(lineSymbols.length)
  for (let i = 0; i < lineSymbols.length; i++) {
    symbols[i] = reel[i].currentScreenSymbol[lineSymbols[i]]
  }
  return symbols
}

export function calculateWinAmountAndLines(reel: Reel[], linesValue: number, coinsValue: number): {winningLines: number[], winAmount: number} {
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