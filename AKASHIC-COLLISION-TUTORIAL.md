# akashic-extension/collision-js 初学者向けガイド

このガイドでは、`akashic-extension/collision-js`を使って衝突判定システムを段階的に学習します。基本的な2D衝突判定から始めて、最終的に3D衝突判定システムを構築します。

## 目次

1. [このガイドについて](#このガイドについて)
2. [環境構築](#環境構築)
3. [専門用語の説明](#専門用語の説明)
4. [第1章: 衝突判定の基本概念](#第1章-衝突判定の基本概念)
5. [第2章: 2D衝突判定の実装](#第2章-2d衝突判定の実装)
6. [第3章: 3D空間の基本概念](#第3章-3d空間の基本概念)
7. [第4章: 3D衝突判定システム](#第4章-3d衝突判定システム)
8. [第5章: Three.jsとの統合](#第5章-threejsとの統合)
9. [練習問題](#練習問題)
10. [トラブルシューティング](#トラブルシューティング)
11. [まとめ](#まとめ)

## このガイドについて

### 対象読者
- JavaScript/TypeScriptの基本的な知識がある方
- プログラミング初心者でも理解できるよう丁寧に説明
- ゲーム開発や3Dプログラミングに興味がある方

### 学習の進め方
1. **段階的に学習**: 各章を順番に読み進めてください
2. **実際にコードを書く**: 説明だけでなく、必ず手を動かしてコードを書いてください
3. **理解度チェック**: 各章末の練習問題で理解度を確認してください
4. **困ったら戻る**: 分からなくなったら前の章に戻って復習してください

### 最終的な学習目標

このガイドを完了すると、以下のことができるようになります：

1. **基本的な衝突判定の理解**
   - 衝突判定の基本概念を理解する
   - AABB（軸平行境界ボックス）による衝突判定を実装できる

2. **2D衝突判定の実装**
   - 矩形同士の衝突判定を実装できる
   - 円形同士の衝突判定を実装できる

3. **3D衝突判定の基礎**
   - 3D空間での衝突判定の考え方を理解する
   - akashic-extension/collision-jsを使った実装ができる

4. **実践的なアプリケーション**
   - Three.jsと組み合わせた視覚的なデモを作成できる
   - 基本的なゲームやインタラクティブコンテンツに応用できる

## 環境構築

### 必要なパッケージ

```bash
# プロジェクトの初期化
npm init -y

# 必要なライブラリのインストール
npm install three vite typescript @types/three @akashic-extension/collision-js --save-dev

# TypeScript型定義
npm install @types/node --save-dev
```

### package.json設定

```json
{
  "name": "threejs-akashic-collision",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@types/three": "^0.156.0",
    "@types/node": "^20.0.0",
    "three": "^0.178.0",
    "@akashic-extension/collision-js": "^1.0.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.5"
  }
}
```

### TypeScript設定

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2017", "DOM"],
    "moduleResolution": "Node",
    "strict": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"]
}
```

## 専門用語の説明

衝突判定を学ぶ前に、重要な専門用語を理解しましょう。

### 基本的な用語

**衝突判定（Collision Detection）**
- 2つ以上のオブジェクトが接触または重なっているかを判定する技術
- ゲームやシミュレーションでは必須の技術

**境界ボックス（Bounding Box）**
- オブジェクトを囲む最小の矩形（2D）や直方体（3D）
- 複雑な形状を簡単な形で近似して、効率的に衝突判定を行う

**AABB（Axis-Aligned Bounding Box）**
- 軸平行境界ボックス
- 座標軸に平行な辺を持つ矩形や直方体
- 計算が簡単で高速

**OBB（Oriented Bounding Box）**
- 有向境界ボックス
- 任意の角度に回転できる矩形や直方体
- AABBより正確だが計算が複雑

### 座標系について

**2D座標系**
- X軸（横方向）とY軸（縦方向）で位置を表現
- 通常、左上が原点(0,0)

**3D座標系**
- X軸、Y軸、Z軸で位置を表現
- Z軸は奥行き方向を表す

## 第1章: 衝突判定の基本概念

### 1.1 衝突判定とは？

衝突判定は、2つのオブジェクトが接触しているかどうかを判定する技術です。

**身近な例:**
- ゲームでプレイヤーが敵に触れた時
- ボールが壁に当たった時
- マウスカーソルがボタンの上にある時

### 1.2 最も簡単な衝突判定：点と矩形

まず、最も基本的な「点が矩形の中にあるか」から始めましょう。

```typescript
// 点と矩形の衝突判定
function isPointInRect(
  pointX: number, 
  pointY: number, 
  rectX: number, 
  rectY: number, 
  rectWidth: number, 
  rectHeight: number
): boolean {
  return (
    pointX >= rectX &&                    // 点が矩形の左端より右にある
    pointX <= rectX + rectWidth &&        // 点が矩形の右端より左にある
    pointY >= rectY &&                    // 点が矩形の上端より下にある
    pointY <= rectY + rectHeight          // 点が矩形の下端より上にある
  );
}

// 使用例
const mouseX = 100;
const mouseY = 150;
const buttonX = 50;
const buttonY = 100;
const buttonWidth = 100;
const buttonHeight = 50;

if (isPointInRect(mouseX, mouseY, buttonX, buttonY, buttonWidth, buttonHeight)) {
  console.log("マウスがボタンの上にあります！");
}
```

### 1.3 矩形と矩形の衝突判定（AABB）

次に、2つの矩形が重なっているかを判定します。

```typescript
// 矩形と矩形の衝突判定
function isRectColliding(
  rect1X: number, rect1Y: number, rect1Width: number, rect1Height: number,
  rect2X: number, rect2Y: number, rect2Width: number, rect2Height: number
): boolean {
  return (
    rect1X < rect2X + rect2Width &&       // 矩形1の左端が矩形2の右端より左にある
    rect1X + rect1Width > rect2X &&       // 矩形1の右端が矩形2の左端より右にある
    rect1Y < rect2Y + rect2Height &&      // 矩形1の上端が矩形2の下端より上にある
    rect1Y + rect1Height > rect2Y         // 矩形1の下端が矩形2の上端より下にある
  );
}

// 使用例
const player = { x: 100, y: 100, width: 50, height: 50 };
const enemy = { x: 120, y: 120, width: 30, height: 30 };

if (isRectColliding(player.x, player.y, player.width, player.height,
                   enemy.x, enemy.y, enemy.width, enemy.height)) {
  console.log("プレイヤーと敵が衝突しました！");
}
```

### 1.4 なぜこの判定式が正しいのか？

衝突判定の式を理解するために、**衝突していない条件**から考えてみましょう。

2つの矩形が衝突していない場合：
1. 矩形1が矩形2の右側にある
2. 矩形1が矩形2の左側にある  
3. 矩形1が矩形2の下側にある
4. 矩形1が矩形2の上側にある

これらの条件を数式で表すと：
1. `rect1X >= rect2X + rect2Width`
2. `rect1X + rect1Width <= rect2X`
3. `rect1Y >= rect2Y + rect2Height`
4. `rect1Y + rect1Height <= rect2Y`

衝突している場合は、これらの条件がすべて**false**になります。
つまり、各条件の否定（NOT）を取って、AND条件でつなげば衝突判定になります。

### 練習問題 1

以下の矩形が衝突しているかどうか、手計算で確認してみましょう：

```typescript
// 矩形A: x=10, y=10, width=30, height=20
// 矩形B: x=25, y=15, width=20, height=15

// 答え: 衝突している（重なっている部分がある）
```

## 第2章: 2D衝突判定の実装

### 2.1 akashic-extension/collision-jsとは？

`akashic-extension/collision-js`は、効率的な衝突判定を行うためのライブラリです。

**主な特徴:**
- 高速なAABB衝突判定
- 簡単なAPI
- TypeScriptサポート

### 2.2 基本的な使い方

まず、シンプルな衝突判定システムを作ってみましょう。

```typescript
// src/collision/SimpleCollisionSystem.ts
import * as co from '@akashic-extension/collision-js';

// シンプルな衝突判定システム
export class SimpleCollisionSystem {
  private bodies: Map<string, co.AABB> = new Map();

  // 矩形オブジェクトの追加
  addRectangle(id: string, x: number, y: number, width: number, height: number): void {
    const aabb: co.AABB = {
      x: x,
      y: y,
      width: width,
      height: height
    };
    this.bodies.set(id, aabb);
  }

  // オブジェクトの位置を更新
  updatePosition(id: string, x: number, y: number): void {
    const body = this.bodies.get(id);
    if (body) {
      body.x = x;
      body.y = y;
    }
  }

  // 衝突判定を実行
  checkCollisions(): Array<{id1: string, id2: string}> {
    const collisions: Array<{id1: string, id2: string}> = [];
    const bodyIds = Array.from(this.bodies.keys());

    // 全てのペアをチェック
    for (let i = 0; i < bodyIds.length; i++) {
      for (let j = i + 1; j < bodyIds.length; j++) {
        const id1 = bodyIds[i];
        const id2 = bodyIds[j];
        const body1 = this.bodies.get(id1)!;
        const body2 = this.bodies.get(id2)!;

        // AABB衝突判定
        if (this.isAABBColliding(body1, body2)) {
          collisions.push({ id1, id2 });
        }
      }
    }

    return collisions;
  }

  // AABB衝突判定の実装
  private isAABBColliding(aabb1: co.AABB, aabb2: co.AABB): boolean {
    return (
      aabb1.x < aabb2.x + aabb2.width &&
      aabb1.x + aabb1.width > aabb2.x &&
      aabb1.y < aabb2.y + aabb2.height &&
      aabb1.y + aabb1.height > aabb2.y
    );
  }

  // オブジェクトの削除
  removeObject(id: string): void {
    this.bodies.delete(id);
  }

  // 指定したオブジェクトの情報を取得
  getObject(id: string): co.AABB | undefined {
    return this.bodies.get(id);
  }
}
```

### 2.3 実践的な使用例

簡単なゲームのような例を作ってみましょう。

```typescript
// src/examples/SimpleGame.ts
import { SimpleCollisionSystem } from '../collision/SimpleCollisionSystem';

export class SimpleGame {
  private collisionSystem: SimpleCollisionSystem;
  private player: { x: number, y: number, width: number, height: number };
  private enemies: Array<{ id: string, x: number, y: number, width: number, height: number }>;

  constructor() {
    this.collisionSystem = new SimpleCollisionSystem();
    
    // プレイヤーの初期化
    this.player = { x: 100, y: 100, width: 30, height: 30 };
    this.collisionSystem.addRectangle('player', this.player.x, this.player.y, this.player.width, this.player.height);
    
    // 敵の初期化
    this.enemies = [
      { id: 'enemy1', x: 200, y: 150, width: 25, height: 25 },
      { id: 'enemy2', x: 150, y: 200, width: 25, height: 25 }
    ];
    
    this.enemies.forEach(enemy => {
      this.collisionSystem.addRectangle(enemy.id, enemy.x, enemy.y, enemy.width, enemy.height);
    });
  }

  // プレイヤーの移動
  movePlayer(deltaX: number, deltaY: number): void {
    this.player.x += deltaX;
    this.player.y += deltaY;
    
    // 衝突判定システムの位置を更新
    this.collisionSystem.updatePosition('player', this.player.x, this.player.y);
  }

  // ゲームの更新
  update(): void {
    // 衝突判定を実行
    const collisions = this.collisionSystem.checkCollisions();
    
    // 衝突があった場合の処理
    collisions.forEach(collision => {
      if (collision.id1 === 'player' || collision.id2 === 'player') {
        console.log(`プレイヤーが${collision.id1 === 'player' ? collision.id2 : collision.id1}と衝突しました！`);
      }
    });
  }

  // プレイヤーの位置を取得
  getPlayerPosition(): { x: number, y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  // 敵の位置を取得
  getEnemyPositions(): Array<{ id: string, x: number, y: number }> {
    return this.enemies.map(enemy => ({ id: enemy.id, x: enemy.x, y: enemy.y }));
  }
}
```

### 2.4 HTML5 Canvasでの可視化

実際に動作を確認できるように、HTML5 Canvasで可視化してみましょう。

```typescript
// src/examples/CanvasDemo.ts
import { SimpleCollisionSystem } from '../collision/SimpleCollisionSystem';

export class CanvasDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private collisionSystem: SimpleCollisionSystem;
  private objects: Array<{ id: string, x: number, y: number, width: number, height: number, color: string }>;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.collisionSystem = new SimpleCollisionSystem();
    this.objects = [];

    this.init();
    this.setupEventListeners();
    this.gameLoop();
  }

  private init(): void {
    // オブジェクトの作成
    this.addObject('player', 100, 100, 30, 30, 'blue');
    this.addObject('enemy1', 200, 150, 25, 25, 'red');
    this.addObject('enemy2', 150, 200, 25, 25, 'red');
  }

  private addObject(id: string, x: number, y: number, width: number, height: number, color: string): void {
    this.objects.push({ id, x, y, width, height, color });
    this.collisionSystem.addRectangle(id, x, y, width, height);
  }

  private setupEventListeners(): void {
    // キーボードでプレイヤーを移動
    document.addEventListener('keydown', (event) => {
      const player = this.objects.find(obj => obj.id === 'player');
      if (!player) return;

      const moveSpeed = 5;
      let deltaX = 0;
      let deltaY = 0;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          deltaY = -moveSpeed;
          break;
        case 'ArrowDown':
        case 's':
          deltaY = moveSpeed;
          break;
        case 'ArrowLeft':
        case 'a':
          deltaX = -moveSpeed;
          break;
        case 'ArrowRight':
        case 'd':
          deltaX = moveSpeed;
          break;
      }

      player.x += deltaX;
      player.y += deltaY;
      this.collisionSystem.updatePosition('player', player.x, player.y);
    });
  }

  private gameLoop(): void {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    // 衝突判定を実行
    const collisions = this.collisionSystem.checkCollisions();
    
    // 衝突したオブジェクトの色を変更
    this.objects.forEach(obj => {
      if (obj.id === 'player') {
        obj.color = 'blue'; // デフォルトの色にリセット
      } else {
        obj.color = 'red';  // デフォルトの色にリセット
      }
    });

    // 衝突があった場合の処理
    collisions.forEach(collision => {
      const obj1 = this.objects.find(obj => obj.id === collision.id1);
      const obj2 = this.objects.find(obj => obj.id === collision.id2);
      
      if (obj1) obj1.color = 'yellow'; // 衝突時の色
      if (obj2) obj2.color = 'yellow'; // 衝突時の色
    });
  }

  private render(): void {
    // 画面をクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // オブジェクトを描画
    this.objects.forEach(obj => {
      this.ctx.fillStyle = obj.color;
      this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });

    // 操作説明を表示
    this.ctx.fillStyle = 'black';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('W/A/S/D または矢印キーで移動', 10, 20);
    this.ctx.fillText('衝突すると黄色に変化', 10, 40);
  }
}
```

### 2.5 HTMLファイルの作成

```html
<!-- demo.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2D衝突判定デモ</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        canvas {
            border: 1px solid #ccc;
            display: block;
            margin: 20px auto;
        }
    </style>
</head>
<body>
    <h1>2D衝突判定デモ</h1>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script type="module">
        import { CanvasDemo } from './src/examples/CanvasDemo.js';
        new CanvasDemo('gameCanvas');
    </script>
</body>
</html>
```

### 練習問題 2

1. 上記のサンプルコードを実際に動かしてみましょう
2. 新しい敵を追加してみましょう
3. プレイヤーの移動速度を変更してみましょう
4. 衝突時に音を鳴らす機能を追加してみましょう

## 第3章: 3D空間の基本概念

### 3.1 2Dから3Dへの拡張

2D衝突判定を理解したところで、3D空間での衝突判定について学びましょう。

**2Dと3Dの違い:**
- 2D: X軸、Y軸の2つの座標
- 3D: X軸、Y軸、Z軸の3つの座標

**3D衝突判定の基本的な考え方:**
1. 2D衝突判定を3つの軸に拡張
2. 3つの軸すべてで重なりがある場合に衝突

### 3.2 3D AABB衝突判定

3D空間でのAABB衝突判定を実装してみましょう。

```typescript
// src/collision/3DCollisionSystem.ts

// 3D AABB（直方体）の定義
export interface AABB3D {
  x: number;  // X座標
  y: number;  // Y座標  
  z: number;  // Z座標
  width: number;   // X軸方向のサイズ
  height: number;  // Y軸方向のサイズ
  depth: number;   // Z軸方向のサイズ
}

export class Simple3DCollisionSystem {
  private bodies: Map<string, AABB3D> = new Map();

  // 3D直方体オブジェクトの追加
  addBox(id: string, x: number, y: number, z: number, width: number, height: number, depth: number): void {
    const aabb3d: AABB3D = {
      x, y, z,
      width, height, depth
    };
    this.bodies.set(id, aabb3d);
  }

  // オブジェクトの位置を更新
  updatePosition(id: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(id);
    if (body) {
      body.x = x;
      body.y = y;
      body.z = z;
    }
  }

  // 3D AABB衝突判定
  private isAABB3DColliding(aabb1: AABB3D, aabb2: AABB3D): boolean {
    return (
      // X軸での重なりチェック
      aabb1.x < aabb2.x + aabb2.width &&
      aabb1.x + aabb1.width > aabb2.x &&
      
      // Y軸での重なりチェック
      aabb1.y < aabb2.y + aabb2.height &&
      aabb1.y + aabb1.height > aabb2.y &&
      
      // Z軸での重なりチェック
      aabb1.z < aabb2.z + aabb2.depth &&
      aabb1.z + aabb1.depth > aabb2.z
    );
  }

  // 全ての衝突をチェック
  checkCollisions(): Array<{id1: string, id2: string}> {
    const collisions: Array<{id1: string, id2: string}> = [];
    const bodyIds = Array.from(this.bodies.keys());

    for (let i = 0; i < bodyIds.length; i++) {
      for (let j = i + 1; j < bodyIds.length; j++) {
        const id1 = bodyIds[i];
        const id2 = bodyIds[j];
        const body1 = this.bodies.get(id1)!;
        const body2 = this.bodies.get(id2)!;

        if (this.isAABB3DColliding(body1, body2)) {
          collisions.push({ id1, id2 });
        }
      }
    }

    return collisions;
  }

  // オブジェクトの削除
  removeObject(id: string): void {
    this.bodies.delete(id);
  }

  // オブジェクトの情報を取得
  getObject(id: string): AABB3D | undefined {
    return this.bodies.get(id);
  }
}
```

### 3.3 3D衝突判定の視覚的理解

3D衝突判定を理解するために、段階的に考えてみましょう。

```typescript
// src/examples/3DCollisionDemo.ts
export class 3DCollisionDemo {
  private collisionSystem: Simple3DCollisionSystem;

  constructor() {
    this.collisionSystem = new Simple3DCollisionSystem();
    this.setupDemo();
  }

  private setupDemo(): void {
    // 2つの直方体を作成
    this.collisionSystem.addBox('box1', 0, 0, 0, 10, 10, 10);
    this.collisionSystem.addBox('box2', 5, 5, 5, 10, 10, 10);

    // 衝突判定をテスト
    this.testCollisions();
  }

  private testCollisions(): void {
    console.log('=== 3D衝突判定テスト ===');
    
    // テストケース1: 重なっている場合
    console.log('テストケース1: 重なっている直方体');
    this.logCollisionResult();

    // テストケース2: 離れている場合
    console.log('\nテストケース2: 離れている直方体');
    this.collisionSystem.updatePosition('box2', 20, 20, 20);
    this.logCollisionResult();

    // テストケース3: 一部の軸でのみ重なっている場合
    console.log('\nテストケース3: X軸でのみ重なっている（衝突しない）');
    this.collisionSystem.updatePosition('box2', 5, 20, 20);
    this.logCollisionResult();

    // テストケース4: 2つの軸で重なっている場合
    console.log('\nテストケース4: X軸とY軸で重なっている（衝突しない）');
    this.collisionSystem.updatePosition('box2', 5, 5, 20);
    this.logCollisionResult();

    // テストケース5: 3つの軸全てで重なっている場合
    console.log('\nテストケース5: 全ての軸で重なっている（衝突する）');
    this.collisionSystem.updatePosition('box2', 5, 5, 5);
    this.logCollisionResult();
  }

  private logCollisionResult(): void {
    const collisions = this.collisionSystem.checkCollisions();
    const box1 = this.collisionSystem.getObject('box1')!;
    const box2 = this.collisionSystem.getObject('box2')!;

    console.log(`Box1位置: (${box1.x}, ${box1.y}, ${box1.z})`);
    console.log(`Box2位置: (${box2.x}, ${box2.y}, ${box2.z})`);
    console.log(`衝突結果: ${collisions.length > 0 ? '衝突あり' : '衝突なし'}`);
    
    if (collisions.length > 0) {
      console.log('衝突したオブジェクト:', collisions);
    }
  }
}
```

### 3.4 3D衝突判定の数学的理解

3D衝突判定がなぜ3つの軸すべてで重なりが必要なのかを理解しましょう。

**重要な概念:**
- **分離軸定理**: 2つの凸形状が分離している場合、必ず分離軸が存在する
- **AABB**: 各軸が分離軸の候補になる

**3D AABB衝突判定の条件:**
```
衝突 = X軸で重なり AND Y軸で重なり AND Z軸で重なり
```

**各軸での重なり判定:**
```typescript
// X軸での重なり
function isOverlappingX(aabb1: AABB3D, aabb2: AABB3D): boolean {
  return aabb1.x < aabb2.x + aabb2.width && 
         aabb1.x + aabb1.width > aabb2.x;
}

// Y軸での重なり
function isOverlappingY(aabb1: AABB3D, aabb2: AABB3D): boolean {
  return aabb1.y < aabb2.y + aabb2.height && 
         aabb1.y + aabb1.height > aabb2.y;
}

// Z軸での重なり
function isOverlappingZ(aabb1: AABB3D, aabb2: AABB3D): boolean {
  return aabb1.z < aabb2.z + aabb2.depth && 
         aabb1.z + aabb1.depth > aabb2.z;
}

// 3D衝突判定
function isColliding3D(aabb1: AABB3D, aabb2: AABB3D): boolean {
  return isOverlappingX(aabb1, aabb2) && 
         isOverlappingY(aabb1, aabb2) && 
         isOverlappingZ(aabb1, aabb2);
}
```

### 3.5 パフォーマンスの考慮

3D衝突判定では、計算量が重要になります。

**効率化のポイント:**
1. **早期終了**: 1つの軸で重なっていなければ、他の軸をチェックしない
2. **境界ボリューム階層**: 大量のオブジェクトがある場合の最適化
3. **空間分割**: 3D空間を分割して不要な判定を減らす

```typescript
// 早期終了を使った効率的な3D衝突判定
private isAABB3DCollidingOptimized(aabb1: AABB3D, aabb2: AABB3D): boolean {
  // X軸での重なりチェック（早期終了）
  if (!(aabb1.x < aabb2.x + aabb2.width && aabb1.x + aabb1.width > aabb2.x)) {
    return false;  // X軸で重なっていない = 衝突していない
  }
  
  // Y軸での重なりチェック（早期終了）
  if (!(aabb1.y < aabb2.y + aabb2.height && aabb1.y + aabb1.height > aabb2.y)) {
    return false;  // Y軸で重なっていない = 衝突していない
  }
  
  // Z軸での重なりチェック
  if (!(aabb1.z < aabb2.z + aabb2.depth && aabb1.z + aabb1.depth > aabb2.z)) {
    return false;  // Z軸で重なっていない = 衝突していない
  }
  
  return true;  // 全ての軸で重なっている = 衝突している
}
```

### 練習問題 3

1. 3D空間で3つの直方体を作成し、衝突判定をテストしてみましょう
2. 直方体の1つを動かして、衝突する瞬間とそうでない瞬間を観察してみましょう
3. 各軸での重なり判定を個別に実装し、動作を確認してみましょう

## 第4章: 3D衝突判定システム

### 4.1 akashic-extension/collision-jsと3D衝突判定の統合

これまで学んだ3D衝突判定を、`akashic-extension/collision-js`と統合してみましょう。

```typescript
// src/collision/AkashicIntegrated3D.ts
import * as co from '@akashic-extension/collision-js';
import { Simple3DCollisionSystem, AABB3D } from './Simple3DCollisionSystem';

export class AkashicIntegrated3D {
  private akashicSystem: Simple3DCollisionSystem;
  private objects: Map<string, {
    aabb3d: AABB3D;
    userData: any;
  }> = new Map();

  constructor() {
    this.akashicSystem = new Simple3DCollisionSystem();
  }

  // 3Dオブジェクトの追加
  addObject(
    id: string, 
    x: number, y: number, z: number, 
    width: number, height: number, depth: number, 
    userData?: any
  ): void {
    // 3D衝突判定システムに追加
    this.akashicSystem.addBox(id, x, y, z, width, height, depth);
    
    // オブジェクト情報を保存
    const aabb3d: AABB3D = { x, y, z, width, height, depth };
    this.objects.set(id, { aabb3d, userData });
  }

  // オブジェクトの移動
  moveObject(id: string, x: number, y: number, z: number): void {
    this.akashicSystem.updatePosition(id, x, y, z);
    
    const obj = this.objects.get(id);
    if (obj) {
      obj.aabb3d.x = x;
      obj.aabb3d.y = y;
      obj.aabb3d.z = z;
    }
  }

  // 衝突判定の実行
  checkCollisions(): Array<{
    id1: string;
    id2: string;
    object1: AABB3D;
    object2: AABB3D;
    userData1?: any;
    userData2?: any;
  }> {
    const akashicCollisions = this.akashicSystem.checkCollisions();
    
    return akashicCollisions.map(collision => {
      const obj1 = this.objects.get(collision.id1)!;
      const obj2 = this.objects.get(collision.id2)!;
      
      return {
        id1: collision.id1,
        id2: collision.id2,
        object1: obj1.aabb3d,
        object2: obj2.aabb3d,
        userData1: obj1.userData,
        userData2: obj2.userData
      };
    });
  }

  // オブジェクトの削除
  removeObject(id: string): void {
    this.akashicSystem.removeObject(id);
    this.objects.delete(id);
  }

  // オブジェクトの情報を取得
  getObject(id: string): AABB3D | undefined {
    return this.objects.get(id)?.aabb3d;
  }

  // 全てのオブジェクトIDを取得
  getAllObjectIds(): string[] {
    return Array.from(this.objects.keys());
  }
}
```

### 4.2 シンプルな3D形状クラス

Three.jsを使わず、基本的な3D形状を表現するクラスを作成しましょう。

```typescript
// src/shapes/SimpleShape3D.ts
import { AABB3D } from '../collision/Simple3DCollisionSystem';

export interface Shape3D {
  id: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  color: string;
  type: 'box' | 'cylinder' | 'sphere';
}

export class SimpleBox3D implements Shape3D {
  public id: string;
  public position: { x: number; y: number; z: number };
  public size: { width: number; height: number; depth: number };
  public color: string;
  public type: 'box' = 'box';

  constructor(id: string, x: number, y: number, z: number, width: number, height: number, depth: number, color: string = '#00ff00') {
    this.id = id;
    this.position = { x, y, z };
    this.size = { width, height, depth };
    this.color = color;
  }

  // 位置を更新
  setPosition(x: number, y: number, z: number): void {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
  }

  // AABB3Dに変換
  toAABB3D(): AABB3D {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      width: this.size.width,
      height: this.size.height,
      depth: this.size.depth
    };
  }

  // 衝突時の色変更
  setCollisionState(isColliding: boolean): void {
    this.color = isColliding ? '#ff0000' : '#00ff00';
  }
}
```

### 4.3 実践的な3Dデモアプリケーション

```typescript
// src/examples/Simple3DDemo.ts
import { AkashicIntegrated3D } from '../collision/AkashicIntegrated3D';
import { SimpleBox3D } from '../shapes/SimpleShape3D';

export class Simple3DDemo {
  private collisionSystem: AkashicIntegrated3D;
  private shapes: Map<string, SimpleBox3D> = new Map();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.collisionSystem = new AkashicIntegrated3D();

    this.init();
    this.setupEventListeners();
    this.gameLoop();
  }

  private init(): void {
    // 3Dオブジェクトの作成（2D投影で表示）
    this.createShape('player', 100, 100, 50, 30, 30, 30, '#0000ff');
    this.createShape('enemy1', 200, 150, 60, 25, 25, 25, '#ff0000');
    this.createShape('enemy2', 150, 200, 40, 35, 35, 35, '#ff0000');
    this.createShape('wall', 300, 100, 0, 20, 100, 50, '#888888');
  }

  private createShape(id: string, x: number, y: number, z: number, width: number, height: number, depth: number, color: string): void {
    const shape = new SimpleBox3D(id, x, y, z, width, height, depth, color);
    this.shapes.set(id, shape);
    
    // 衝突判定システムに追加
    this.collisionSystem.addObject(id, x, y, z, width, height, depth, { shape });
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (event) => {
      const player = this.shapes.get('player');
      if (!player) return;

      const moveSpeed = 5;
      let deltaX = 0;
      let deltaY = 0;
      let deltaZ = 0;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          deltaY = -moveSpeed;
          break;
        case 'ArrowDown':
        case 's':
          deltaY = moveSpeed;
          break;
        case 'ArrowLeft':
        case 'a':
          deltaX = -moveSpeed;
          break;
        case 'ArrowRight':
        case 'd':
          deltaX = moveSpeed;
          break;
        case 'q':
          deltaZ = -moveSpeed;
          break;
        case 'e':
          deltaZ = moveSpeed;
          break;
      }

      if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
        const newX = player.position.x + deltaX;
        const newY = player.position.y + deltaY;
        const newZ = player.position.z + deltaZ;
        
        player.setPosition(newX, newY, newZ);
        this.collisionSystem.moveObject('player', newX, newY, newZ);
      }
    });
  }

  private gameLoop(): void {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    // 衝突判定を実行
    const collisions = this.collisionSystem.checkCollisions();
    
    // 全オブジェクトの衝突状態をリセット
    this.shapes.forEach(shape => {
      shape.setCollisionState(false);
    });

    // 衝突したオブジェクトの状態を更新
    collisions.forEach(collision => {
      const shape1 = this.shapes.get(collision.id1);
      const shape2 = this.shapes.get(collision.id2);
      
      if (shape1) shape1.setCollisionState(true);
      if (shape2) shape2.setCollisionState(true);
    });
  }

  private render(): void {
    // 画面をクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 3D → 2D投影（簡易版）
    this.shapes.forEach(shape => {
      // 奥行きを考慮した簡単な投影
      const scale = 200 / (200 + shape.position.z);
      const projectedX = shape.position.x * scale;
      const projectedY = shape.position.y * scale;
      const projectedWidth = shape.size.width * scale;
      const projectedHeight = shape.size.height * scale;

      // 矩形を描画
      this.ctx.fillStyle = shape.color;
      this.ctx.fillRect(projectedX, projectedY, projectedWidth, projectedHeight);
      
      // 奥行き情報を表示
      this.ctx.fillStyle = 'black';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`z:${shape.position.z.toFixed(0)}`, projectedX, projectedY - 5);
    });

    // 操作説明を表示
    this.ctx.fillStyle = 'black';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('WASD: 移動, Q/E: 奥行き移動', 10, 20);
    this.ctx.fillText('赤色: 衝突中', 10, 40);

    // 衝突情報を表示
    const collisions = this.collisionSystem.checkCollisions();
    if (collisions.length > 0) {
      this.ctx.fillStyle = 'red';
      this.ctx.fillText(`衝突数: ${collisions.length}`, 10, 60);
    }
  }
}
```

### 4.4 簡単なHTMLファイル

```html
<!-- simple-3d-demo.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D衝突判定デモ（簡易版）</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        canvas {
            border: 2px solid #333;
            display: block;
            margin: 20px auto;
            background-color: white;
        }
        .info {
            text-align: center;
            margin: 20px;
        }
    </style>
</head>
<body>
    <div class="info">
        <h1>3D衝突判定デモ（簡易版）</h1>
        <p>WASDキーで移動、Q/Eキーで奥行き移動</p>
        <p>オブジェクトが衝突すると赤色に変化します</p>
    </div>
    <canvas id="demo3d" width="800" height="600"></canvas>
    <script type="module">
        import { Simple3DDemo } from './src/examples/Simple3DDemo.js';
        new Simple3DDemo('demo3d');
    </script>
</body>
</html>
```

### 練習問題 4

1. 上記のデモを実際に動かして、3D衝突判定の動作を確認してみましょう
2. 新しい3Dオブジェクトを追加してみましょう
3. オブジェクトのサイズを変更して、衝突判定の変化を観察してみましょう
4. 衝突時に何らかの効果（音、震動など）を追加してみましょう

## 第5章: Three.jsとの統合

このセクションでは、学習した衝突判定システムを実際のThree.jsアプリケーションと統合する方法を簡単に紹介します。

### 5.1 Three.jsの基本設定

```typescript
// src/three/ThreeJSIntegration.ts
import * as THREE from 'three';
import { AkashicIntegrated3D } from '../collision/AkashicIntegrated3D';

export class ThreeJSCollisionDemo {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private collisionSystem: AkashicIntegrated3D;
  private meshes: Map<string, THREE.Mesh> = new Map();

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.collisionSystem = new AkashicIntegrated3D();

    this.init();
    this.animate();
  }

  private init(): void {
    // 基本的なThree.jsの設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // カメラの位置を設定
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // 簡単な照明を追加
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // 3Dオブジェクトを作成
    this.createBoxes();
  }

  private createBoxes(): void {
    // 複数の立方体を作成
    this.createBox('box1', 0, 0, 0, 2, 2, 2, 0x00ff00);
    this.createBox('box2', 3, 0, 0, 2, 2, 2, 0xff0000);
    this.createBox('box3', 0, 3, 0, 2, 2, 2, 0x0000ff);
  }

  private createBox(id: string, x: number, y: number, z: number, width: number, height: number, depth: number, color: number): void {
    // Three.jsメッシュを作成
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.meshes.set(id, mesh);

    // 衝突判定システムに追加
    this.collisionSystem.addObject(id, x, y, z, width, height, depth, { mesh });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // 簡単なアニメーション
    const time = Date.now() * 0.001;
    const box1 = this.meshes.get('box1');
    if (box1) {
      box1.position.x = Math.sin(time) * 3;
      this.collisionSystem.moveObject('box1', box1.position.x, box1.position.y, box1.position.z);
    }

    // 衝突判定を実行
    const collisions = this.collisionSystem.checkCollisions();
    
    // 衝突結果に基づいて色を変更
    this.meshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshPhongMaterial;
      const isColliding = collisions.some(collision => 
        collision.id1 === id || collision.id2 === id
      );
      
      if (isColliding) {
        material.color.setHex(0xffffff); // 白色に変更
      } else {
        // 元の色に戻す（簡略化）
        material.color.setHex(0x00ff00); // 緑色
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
```

### 5.2 簡単な統合例

```html
<!-- threejs-integration.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js + collision-js 統合デモ</title>
    <style>
        body { margin: 0; overflow: hidden; }
    </style>
</head>
<body>
    <script type="module">
        import { ThreeJSCollisionDemo } from './src/three/ThreeJSIntegration.js';
        new ThreeJSCollisionDemo();
    </script>
</body>
</html>
```

## 練習問題

### 基本問題

**問題1: 2D衝突判定**
```typescript
// 以下の2つの矩形が衝突しているか判定してください
const rect1 = { x: 10, y: 10, width: 20, height: 15 };
const rect2 = { x: 25, y: 20, width: 15, height: 10 };
// 答え: 衝突している
```

**問題2: 3D衝突判定**
```typescript
// 以下の2つの直方体が衝突しているか判定してください
const box1 = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };
const box2 = { x: 5, y: 5, z: 5, width: 10, height: 10, depth: 10 };
// 答え: 衝突している
```

### 応用問題

**問題3: 複数オブジェクトの衝突判定**
3つの直方体がある場合、どのペアが衝突しているか全て見つけてください。

**問題4: 移動する物体の衝突判定**
時間と共に移動する物体の衝突を検出するシステムを作成してください。

### 実装課題

**課題1: 円形衝突判定**
2D円形同士の衝突判定を実装してください。

**課題2: 球体衝突判定**
3D球体同士の衝突判定を実装してください。

**課題3: 混合形状の衝突判定**
矩形と円形の衝突判定を実装してください。

## トラブルシューティング

### よくある問題と解決法

**問題1: 衝突判定が正しく動作しない**
- **原因**: 座標系の理解不足
- **解決法**: 各オブジェクトの位置とサイズを正確に確認する

**問題2: パフォーマンスが悪い**
- **原因**: 不要な衝突判定の実行
- **解決法**: 早期終了や空間分割を活用する

**問題3: 3D衝突判定で期待通りの結果が得られない**
- **原因**: 3つの軸すべてでの重なり判定ができていない
- **解決法**: 各軸での判定を個別に確認する

### デバッグのコツ

1. **ログ出力**: 衝突判定の結果をコンソールに出力
2. **可視化**: 境界ボックスを画面に表示
3. **段階的テスト**: 簡単なケースから順に確認

### パフォーマンス最適化

1. **早期終了**: 不要な計算を避ける
2. **空間分割**: 大量のオブジェクトがある場合
3. **更新頻度の調整**: 必要な場合のみ衝突判定を実行

## まとめ

### 学習した内容

このガイドで学習した内容をまとめます：

1. **衝突判定の基本概念**
   - 衝突判定の重要性と基本的な考え方
   - 点と矩形、矩形と矩形の衝突判定
   - 専門用語（AABB、OBB、境界ボックス）の理解

2. **2D衝突判定の実装**
   - akashic-extension/collision-jsの基本的な使用方法
   - 実践的なゲームデモの作成
   - HTML5 Canvasでの可視化

3. **3D空間の基本概念**
   - 2Dから3Dへの拡張
   - 3D AABB衝突判定の実装
   - 3つの軸での重なり判定の理解

4. **3D衝突判定システム**
   - akashic-extension/collision-jsとの統合
   - 効率的な衝突判定システムの構築
   - 実践的な3Dデモアプリケーション

5. **Three.jsとの統合**
   - 実際の3Dアプリケーションでの活用方法
   - 視覚的な3D衝突判定デモ

### 初学者から上級者への道のり

**初学者レベル（達成済み）:**
- 基本的な衝突判定の理解と実装
- 2D/3D空間での衝突判定
- 簡単なデモアプリケーションの作成

**中級者レベル（次のステップ）:**
- より複雑な形状の衝突判定（円形、球体、カプセル）
- 分離軸定理（SAT）の完全実装
- 空間分割による最適化

**上級者レベル（将来の目標）:**
- 連続衝突検知（CCD）
- 物理エンジンとの統合
- リアルタイムの大規模衝突判定システム

### 実践的な応用例

このガイドで学んだ技術は、以下のような場面で活用できます：

1. **ゲーム開発**
   - プレイヤーと敵の衝突判定
   - 弾丸と障害物の衝突判定
   - アイテム収集システム

2. **インタラクティブコンテンツ**
   - マウスカーソルとUI要素の判定
   - ドラッグ&ドロップシステム
   - 3D空間でのオブジェクト選択

3. **シミュレーション**
   - 物理シミュレーション
   - ロボティクス
   - 建築・工学分野での干渉チェック

### さらなる学習のために

**推奨する学習順序:**
1. より多くのコードを書いて理解を深める
2. 円形や球体の衝突判定を実装する
3. 分離軸定理について学ぶ
4. 物理エンジン（Cannon.js、Ammo.jsなど）を試す
5. 空間分割アルゴリズムを学ぶ

**参考リソース:**
- Three.js公式ドキュメント
- ゲーム物理学の教科書
- リアルタイム衝突判定に関する書籍
- オープンソースの物理エンジン

### 最後に

衝突判定は、インタラクティブコンテンツやゲーム開発において基礎的かつ重要な技術です。このガイドで学んだ基本的な概念を土台として、より高度な技術へと発展させていけるでしょう。

継続的な学習と実践を通じて、より効率的で正確な衝突判定システムを構築できるようになります。頑張って学習を続けてください！
