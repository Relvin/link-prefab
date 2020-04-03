
const {ccclass, executeInEditMode, property} = cc._decorator;

// // 屏蔽2.3.1版本prefab嵌套prefab的弹框问题
if (CC_EDITOR && !window["Editor"].isBuilder) {
    window["_Scene"].DetectConflict.beforeAddChild = function() {
        return false
    }
}


@ccclass
@executeInEditMode
export default class LinkPrefab extends cc.Component {

    private _prefabNode: cc.Node = null

    @property
    private _prefab: cc.Prefab = null

    @property({type: cc.Prefab, visible: true, displayName: "预制体"})
    set prefab(value: cc.Prefab) {
        this._onPrefabChanged(this._prefab, value)
    }

    get prefab(): cc.Prefab {
        return this._prefab
    }

    private _onPrefabChanged(oldValue:cc.Prefab, newValue:cc.Prefab) {
        if (this._prefabNode) {
            this._prefabNode.destroy();
            this._prefabNode = null;
        }
        this._prefab = newValue
        if (newValue) {
            let prefabNode = cc.instantiate(newValue);
            if(prefabNode){
                this._prefabNode = prefabNode;

                // cc.Object["Flags"].DontSave          // 当前节点不会被保存到prefab文件里
                // cc.Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
                // cc.Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示

                prefabNode["_objFlags"] |= (cc.Object["Flags"].DontSave | cc.Object["Flags"].LockedInEditor | cc.Object["Flags"].HideInHierarchy);
                prefabNode.x = 0
                prefabNode.y = 0
                this.node.addChild(prefabNode, -1) // 添加到最底层
                prefabNode.name = "prefabNode";
                this.node.setContentSize(prefabNode.getContentSize())
            }
        }
    }

    public getPefabNode(): cc.Node {
        this._initPrefab()      // 防止当前node被默认隐藏导致，prefabNode获取不到
        return this._prefabNode
    }

    public getPrefabComponect<T extends cc.Component>(type: {prototype: T}): T {
        let prefabNode = this._prefabNode
        return prefabNode ? prefabNode.getComponent(type) : null;
    }

    onLoad() {
        this._initPrefab()
    }

    private _initPrefab() {
        if (!this._prefab || this._prefabNode) {
            return
        }
        let instNode = this.node.getChildByName("prefabNode");      // 避免外部通过cc.instantiate(this.node),导致prefabNode被创建多份
        if (instNode) {
            this._prefabNode = instNode;
        }
        else {
            if (CC_EDITOR) {
                this._onPrefabChanged(null, this._prefab)
            }
            else {
                let prefabNode = cc.instantiate(this._prefab);
                if(prefabNode){
                    this._prefabNode = prefabNode;
                    this.node.addChild(prefabNode, -1) // 添加到最底层
                    prefabNode.name = "prefabNode";
                    prefabNode.x = 0
                    prefabNode.y = 0
                    this.node.setContentSize(prefabNode.getContentSize())
                }
            }
        }
    }
    // update (dt) {}
}
