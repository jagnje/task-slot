import { GameObjects } from 'phaser'

export type Reel = {
  duration: number
  reel: GameObjects.TileSprite
  currentScreenSymbol: number[]
}

export type Line = {
    rectangle1?: GameObjects.Rectangle
    rectangle2?: GameObjects.Rectangle
    rectangle3?: GameObjects.Rectangle
    
    triangle41?: GameObjects.Triangle
    triangle42?: GameObjects.Triangle
    triangle51?: GameObjects.Triangle
    triangle52?: GameObjects.Triangle
}