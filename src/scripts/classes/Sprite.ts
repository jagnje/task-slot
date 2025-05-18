export default class Sprite extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: string, interactive?: boolean) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        if (interactive) {
            this.setInteractive();
        }
    }
}