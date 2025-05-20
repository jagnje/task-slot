import { GameObjects } from 'phaser';

export default class Sprite extends GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: string) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
    }
}