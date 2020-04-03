import LinkPrefab from "../link-prefab";
const {ccclass, executeInEditMode, property} = cc._decorator;

@ccclass
@executeInEditMode
export default class LinkSpriteHelp extends cc.Component {

    @property
    private _spriteFrame: cc.SpriteFrame = null;

    @property({type: cc.SpriteFrame, visible: true, displayName: "纹理图"})
    set spriteFrame(value: cc.SpriteFrame) {
        this._spriteFrame = value
        this._updateSpriteFrame()
    }

    get spriteFrame(): cc.SpriteFrame {
        return this._spriteFrame
    }

    start () {

    }

    onLoad() {
        this._updateSpriteFrame()
    }

    private _updateSpriteFrame() {
        let linkPrefab = this.node.getComponent(LinkPrefab)
        let sprite = linkPrefab.getPrefabComponect(cc.Sprite)
        if (sprite) {
            sprite.spriteFrame = this._spriteFrame
        }
    }
}
