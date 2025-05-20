import { GameObjects } from 'phaser'

export type Reel = {
  duration: number
  reel: GameObjects.TileSprite
  currentScreenSymbol: number[]
}

export type Symbol = {
  text: string
  symbol: GameObjects.Image
}