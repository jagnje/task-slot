import { GameObjects } from 'phaser'

export type Reel = {
  duration: number
  reel: GameObjects.TileSprite
}

export type Symbol = {
  text: string
  symbol: GameObjects.Image
}