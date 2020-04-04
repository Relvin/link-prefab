/*********************************
 * 创建者   ：Relvin
 * 时间     ：2019年9月11号16:52:10
 * 
 * ******************************/

const {ccclass, property} = cc._decorator;

@ccclass
export default class ComIcon extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
