/*********************************
 * 创建者   ：Relvin
 * 时间     ：2020年3月11号16:52:10
 * 
 * ******************************/

import LinkPrefab from "./link-prefab";
import ComIcon from "./com-icon";


const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property({type: LinkPrefab, visible:true, displayName: "icon1"})
    private _icon1: LinkPrefab = null;

    @property({type: LinkPrefab, visible:true, displayName: "icon2"})
    private _icon2: LinkPrefab = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        let icon1 = this._icon1.getPrefabComponect(ComIcon)
        if (icon1) {
            icon1.label.string = "道具图标1"
        }

        let icon2 = this._icon2.getPrefabComponect(ComIcon)
        if (icon2) {
            icon2.label.string = "道具图标2"
        }
    }

    // update (dt) {}
}
