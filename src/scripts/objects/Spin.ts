import Sprite from '../classes/Sprite'
import Config from '../../config'

export default class Spin {
    scene: Phaser.Scene;
    spin: Sprite;

    constructor(scene: Phaser.Scene, action: () => void) {
        this.scene = scene;
        this.addSpin();
        this.spin.on('pointerdown', action, this);
    }

    addSpin() {
        this.spin = new Sprite(this.scene, Config.scale.width - 330, Config.scale.height - 70, 'spinButton', '', true);
        this.spin.on('pointerup', () => this.spin.setScale(1));
        this.spin.on('pointerdown', () => this.spin.setScale(1.03), this);
    }
}