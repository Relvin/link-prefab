/*********************************
 * 创建者   ：Relvin
 * 时间     ：2019年9月11号16:52:10
 * 
 * ******************************/

const {ccclass, property} = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    start () {
        // init logic
        this.label.string = this.text;
    }

    on_load_button_clicked() {
        let self = this
        cc.loader.loadRes("login-layer", cc.Prefab, (ret, prefab: cc.Prefab)=> {
            if (ret) {
                console.log(ret)
                return
            }
            let loginLayer = cc.instantiate(prefab)
            loginLayer.parent = this.node
        })
    }
}
