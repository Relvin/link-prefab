## 在creator中如何优雅的复用prefab（预制体）

## 前言

为什么需要这么一个功能？

因为我们项目开发使用的是单场景、多预制的开发模式。我们会把公用的东西做成预制，然后在需要用到的界面直接引用，而不是再创建或复制一个。后期策划有修改需求的时候，我们只要把预制修改就可以。不需要修改其他使用的地方。简单还不容易漏。

下面举例一个比较常用使用情景：

**道具图标**:里面包含图标样式、背景框、道具数量、品质数等信息，并且至少需要挂在一个脚本支持代码中动态设置这些属性。并且也是游戏内复用性最高的**组件**之一了，**背包**、**成就奖励信息**、**掉落界面**、**道具详情**等等。

那我们就可以只创建一个预制，然后在其他用到的地方直接复用，而不是在其他界面都创建一份。这样工作效率就高很多。如果突然有一天，策划要求图标上要加上阶数，等级等信息，我们只要修改引用的预制体就行。

![15858808566612](https://github.com/Relvin/link-prefab/blob/master/readme/15858808566612.png)![15858808566612](https://github.com/Relvin/link-prefab/blob/master/readme/15858809963833.png)

**（图片素材来源于网络）**

除了**道具图标**、**公用按钮**、**界面标题头**、**通用属性信息**等等，都可以做成一个通用预制，其他界面直接引用。

为什么不选择使用官方提供的复用方案？官方的方案只能在场景(*.fire)中引用，不可以在预制(.prefab)中相互使用。这与我们的设计不相符，所以就没办法使用。

**为了解决上面的复用问题，我们决定实现一套自己的解决方案** *（这也是Creator的强大之处，只要你有想法，就可以实现更多的可能。）*


### 一、功能设计
#### 1、需要实现的功能

* **在编辑器里所见即所得**

* **在层级树中不显示被引用的预制体结构**

* **被引用的预制体结构信息不要保存到当前界面中**

* **保护引用的预制体，禁止从外部修改**

  **功能解释：**

  ​		**在编辑器里所见即所得**：

  ​				为了能够在编辑器里即使看到和游戏内相同的显示效果，有助于我们在编辑器里设计UI

  ​		**在层级树中不显示被引用的预制体结构**：

  ​				不会撑大当前编辑有UI，使显示更清晰简洁。亦可防止我们误编辑引用的节点。

  ​        **被引用的预制体结构信息不要保存到当前界面中**

  ​				引用的预制体在运行时实时创建就行，不需要对节点信息进行保存，保证当前界面信息清洁无污染

  ​        **保护引用的预制体，禁止从外部修改**

  ​				保证预制体的只能在源文件修改，不可在外部修改，可以有效防止开发中的误操作

#### 2、实现方案

**实例化被引用的预制体**

这个问题比较好解决，我们创建一个脚本LinkPrefab.ts，添加**executeInEditMode**标记，添加一个`cc.Prefab`属性成员_prefab，脚本挂载到需要引用其它预制体的节点上。
onLoad中去实例化预制体节点并添加到当前节点上(其它关于位置，缩放，透明度等属性的控制可自行扩展)。

```typescript
const {ccclass, executeInEditMode, property} = cc._decorator;
@ccclass
@executeInEditMode
export default class LinkPrefab extends cc.Component {

    @property({type: cc.Prefab, visible: true, displayName: "预制体"})
    private _prefab: cc.Prefab = null
    
    onLoad() {
        let prefabNode = cc.instantiate(this._prefab);
        if(prefabNode){
            this.node.addChild(prefabNode)
        }
    }
}
```
如果需要实时更换被引用的预制体，可以通过set属性来触发新预制的实例化，我们修改一下写法：

```typescript
const {ccclass, executeInEditMode, property} = cc._decorator;
@ccclass
@executeInEditMode
export default class LinkPrefab extends cc.Component {

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
        this.node.removeAllChilren()
        let prefabNode = cc.instantiate(newValue);
        if(prefabNode){
            this.node.addChild(prefabNode)
        }
    }
    
    onLoad() {
        this._onPrefabChanged(null, this._prefab)
    }
}
```

![image-20200402162249956](https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402162249956.png)

从上图可以看到，预制被正常的显示出来了。但是被引用的预制体实例化后，会出现在层级树里（红框框出来的部分），会导致引用它的预制体或场景发生变更。这不是我们所期望的。

 **如何让引用预制体节点树不显示在层级树？** 

为了解决这个问题，确实花了不少时间，经过不断的尝试。最终找到了解决方案。灵感来自官方的**cc.RichText**。我们发现**RichText**是由多个**cc.Label**拼接而成，而这些Label并没有显示在编辑器的节点树里。然后我们通过翻阅官方的源代码。最终找到了一个`PrivateNode`的类，我们把**PrivateNode**加进来，确实让节点在树里隐身了。我们成功了，但是发现**PrivateNode**的节点始终显示以父类的左下角作为坐标原点，这一点和官方的坐标系不一致。官方也对设计做了解释。

```js
 /*
 * Cocos Creator 场景中的私有节点类。<br/>
 * 私有节点在编辑器中不可见，对用户透明。<br/>
 * 通常私有节点是被一些特殊的组件创建出来作为父节点的一部分而存在的，理论上来说，它们不是子节点，而是父节点的组成部分。<br/>
 * 私有节点有两个非常重要的特性：<br/>
 * 1. 它有着最小的渲染排序的 Z 轴深度，并且无法被更改，因为它们不能被显示在其他正常子节点之上。<br/>
 * 2. 它的定位也是特殊的，对于私有节点来说，父节点包围盒的左下角是它的局部坐标系原点，这个原点相当于父节点的位置减去它锚点的偏移。这样私有节点可以比较容易被控制在包围盒之中。<br/>
 * 目前在引擎中，RichText 和 TileMap 都有可能生成私有节点。*/
 
_updateLocalMatrix() {
        if (!this._localMatDirty) return;

        let parent = this.parent;
        if (parent) {
            // Position correction for transform calculation
            this._trs[0] = this._originPos.x - (parent._anchorPoint.x - 0.5) * parent._contentSize.width;
            this._trs[1] = this._originPos.y - (parent._anchorPoint.y - 0.5) * parent._contentSize.height;
        }

        this._super();
},
```

不能用**PrivateNode**，那我们就继续找，找**PrivateNode**与**cc.Node**有啥不同。我们找到了一个属性，经过测试，发现确实是这个属性在起作用。

![image-20200402142308217](https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402142308217.png)

我们深入研究了属性信息：

```js
var Destroyed = 1 << 0;
var RealDestroyed = 1 << 1;
var ToDestroy = 1 << 2;
var DontSave = 1 << 3;
var EditorOnly = 1 << 4;
var Dirty = 1 << 5;
var DontDestroy = 1 << 6;
var Destroying = 1 << 7;
var Deactivating = 1 << 8;
var LockedInEditor = 1 << 9;
//var HideInGame = 1 << 9;
var HideInHierarchy = 1 << 10;

var IsOnEnableCalled = 1 << 11;
var IsEditorOnEnableCalled = 1 << 12;
var IsPreloadStarted = 1 << 13;
var IsOnLoadCalled = 1 << 14;
var IsOnLoadStarted = 1 << 15;
var IsStartCalled = 1 << 16;

var IsRotationLocked = 1 << 17;
var IsScaleLocked = 1 << 18;
var IsAnchorLocked = 1 << 19;
var IsSizeLocked = 1 << 20;
var IsPositionLocked = 1 << 21;
```

找到了**DontSave**不保存、**LockedInEditor**编辑器中锁定（即不可点击，保证预制体不会在外部修改），我们完成了第一版， 代码修改如下

```typescript
private _onPrefabChanged(oldValue:cc.Prefab, newValue:cc.Prefab) {
        this._prefab = newValue
        if (newValue) {
            let prefabNode = cc.instantiate(newValue);
            if(prefabNode){
                // cc.Object["Flags"].DontSave          // 当前节点不会被保存到prefab文件里
                // cc.Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
                // cc.Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示
                prefabNode["_objFlags"] |= (cc.Object["Flags"].DontSave | cc.Object["Flags"].LockedInEditor | cc.Object["Flags"].HideInHierarchy);
                this.node.addChild(prefabNode, -1) // 添加到最底层
            }
        }
    }
```

下面就是最终的实现效果，第一张图是源文件设计有一个com-icon和一个label组成。

![20200403185043](https://github.com/Relvin/link-prefab/blob/master/readme/20200403185043.png)

下图为引用com-icon的显示效果。

icon1中存放的是我们引用com-icon.prefab,并且在右上角的层级管理器里不会显示com-icon中的实现细节。

![20200403184738](https://github.com/Relvin/link-prefab/blob/master/readme/20200403184738.png)

现在基本上需要实现的功能已经解决了，那我们在代码中如何使用? 最好是代码简洁，不影响访问效率。我们添加了一个直接获取节点组件的方法，这样用起来基本上就没差了

```typescript
public getPrefabComponect<T extends cc.Component>(type: {prototype: T}): T {
    let prefabNode = this._prefabNode
    return prefabNode ? prefabNode.getComponent(type) : null;
}

// 使用的地方
// ...
@property({type: LinkPrefab, visible:true, displayName: "icon2"})
private _icon2: LinkPrefab = null;
// ...
start () {
    let icon1 = this._icon1.getPrefabComponect(ComIcon)
    if (icon1) {
        icon1.label.string = "道具图标1"
    }
}
```



### 二、用法进阶

虽然我们实现了预制体在其他预制体中复用，但是目前来开还是比较简单，不够灵活，不能在编辑器里动态改变一些我们需要改变的信息。

这里抛砖引玉，给出一个很常见的使用范例：
    我们做了一个com-icon.prefab, 下面挂载一个cc.Sprite节点(其它节点忽略)，主要用来动态显示不同的icon图标。
    在一个界面中，需要显示4个com-icon.prefab的实例，并加载不同的icon图标。这里有两个办法：

a:在界面A中增加4个节点，调整好位置，分别挂载LinkPrefab组件，把com-icon.prefab拖到LinkPrefab的预制体属性上。
   在界面A的start中去给cc.Sprite节点赋值不同的spriteFrame

b:在界面B中增加4个节点，调整好位置，分别挂载LinkPrefab组件，把com-icon.prefab拖到LinkPrefab的预制体属性上。

在A的节点上挂载link-sprite-prefab(见下方代码)节点，把需要显示的贴图拖到link-sprite-prefab组件的纹理图属性上。 

![image-20200402164201469](https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402164201469.png)

 这里对四个中的三个icon挂在了link-sprite-help,并且设置了不同的纹理，这样我们既保证了统一性，又保证了显示的灵活性。

  <img src="https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402164405217.png" alt="image-20200402164405217" style="zoom:67%;" /><img src="https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402164308923.png" alt="image-20200402164308923" style="zoom:67%;" /><img src="https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402164240106.png" alt="image-20200402164240106" style="zoom:67%;" />



```typescript
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
```

以上两个办法：a是通过在代码中动态加载贴图并设置到对应的组件上(动态加载)。b是直接在编辑器中完成对不同节点的节图加载（静态加载）。
相比之下，b方法更优雅简洁。

总结：

​		上面的**LinkSpriteHelp**只是作为了开发扩展的引导性实例。大家可以根据自己的想法，开发更多的扩展脚本，以满足各自游戏中的开发需求。

### 三、其他问题（开发过程中的已知问题）

1、在编辑器里对当前引用的节点进行复制操作，会导致，引用的预制体创建多份（已解决）

​	解决办法：在创建前，判断当前节点的children中是否已存在预制体的实例节点。


2、由于官方在2.3.1版本以后，添加了在预制体中引用预制体的警告。没错就是它：

![image-20200402150854377](https://github.com/Relvin/link-prefab/blob/master/readme/image-20200402150854377.png)

相信你们大多数人已经遇到了，我们的这个写法是这个警告的主要受害群体，所以我的解决方案是把警告弹框忽略掉。将下面的代码放到项目的启动代码中，就可解决

```javascript
/// 屏蔽2.3.1版本prefab嵌套prefab的弹框问题
if (CC_EDITOR && !window["Editor"].isBuilder) {
    window["_Scene"].DetectConflict.beforeAddChild = function() {
        return false
    }
}
```

以上示例项目的源代码已经上传，大家可以直接下载下来https://github.com/Relvin/link-prefab



### 不要走开，后面有彩蛋<img src="https://github.com/Relvin/link-prefab/blob/master/readme/GIF-2020-4-3-11-24-59.gif" alt="GIF-2020-4-3-11-24-59" style="zoom:67%;" />



# 招贤纳士
