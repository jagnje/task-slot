import Sprite from '../classes/Sprite'
import Config from '../../config'

export default class Info {
    scene: Phaser.Scene;
    info: Sprite;

    constructor(scene: Phaser.Scene ) {
        this.scene = scene;
        this.addInfo();
    }

    addInfo() {
        this.info = new Sprite(this.scene, Config.scale.width - 70, Config.scale.height - 70, 'infoButton', '', true);
        this.info.on('pointerup', () => this.info.setScale(1));
        this.info.on('pointerdown', () => this.info.setScale(1.03), this);
    }
}