# Three.js + TypeScript + collision.js を使ったインタラクティブコンテンツの作成

このチュートリアルでは、Three.js、TypeScript、そしてシンプルな衝突判定ライブラリである `collision.js` を使用して、マウスで操作できるプレイヤーと、衝突すると転がる障害物があるインタラクティブな3D空間を作成します。

## はじめに

### 作成するコンテンツの概要

マウスで操作する青い球体（プレイヤー）が、赤い球体（障害物）に衝突すると、障害物が物理的に押し出されて転がるデモンストレーションです。衝突判定と応答の基本的な概念を視覚的に理解できます。

### 学習目標

*   Three.jsの基本的なシーン構築とオブジェクト操作を復習する。
*   `collision.js`ライブラリをプロジェクトに導入し、基本的な使い方を理解する。
*   3D空間における2D衝突判定の考え方を学ぶ（XZ平面での判定）。
*   衝突検出後のオブジェクトの位置補正（めり込み防止）と、衝突応答（障害物の移動）を実装する。
*   TypeScript環境でのThree.jsと外部ライブラリの連携方法を学ぶ。

## 前提知識

このチュートリアルを進めるにあたり、以下の知識があることを前提とします。

*   **TypeScript**: 変数、関数、クラス、インターフェースなどの基本的な文法。
*   **Three.js**: シーン、カメラ、レンダラー、ジオメトリ、マテリアル、メッシュ、光源などの基本的なAPI。
*   **JavaScript**: ES Modulesの基本的な概念。

## Step 1. 環境構築

まず、プロジェクトのディレクトリを作成し、必要なファイルを準備します。

```bash
# プロジェクトディレクトリに移動
cd D:\develop\Web\WebGL

# npmプロジェクトを初期化
npm init -y

# 必要なライブラリをインストール
npm install three vite typescript @types/three --save-dev
```

### `tsconfig.json`の作成

TypeScriptの設定ファイルを作成します。プロジェクトのルートに `tsconfig.json` を以下の内容で作成してください。

```json
{
  "compilerOptions": {
    // コンパイル対象: 最新のES機能を使用
    "target": "ESNext",
    // クラスフィールドの定義方法を最新の仕様に合わせる
    "useDefineForClassFields": true,
    // モジュールシステム: ES Modules（import/export）を使用
    "module": "ESNext",
    // 使用可能なライブラリ: 最新ES機能とブラウザDOM API
    "lib": ["ESNext", "DOM"],
    // モジュール解決方式: Node.js方式（node_modulesから探索）
    "moduleResolution": "Node",
    // 厳密な型チェックを有効化（推奨）
    "strict": true,
    // デバッグ用のソースマップを生成
    "sourceMap": true,
    // JSONファイルのインポートを許可
    "resolveJsonModule": true,
    // CommonJSとESモジュールの相互運用を有効化
    "esModuleInterop": true,
    // JavaScriptファイルを出力しない（Viteが処理するため）
    "noEmit": true,
    // 使用されていないローカル変数をエラーとして検出
    "noUnusedLocals": true,
    // 使用されていないパラメータをエラーとして検出
    "noUnusedParameters": true,
    // 関数の一部のパスで戻り値がない場合をエラーとして検出
    "noImplicitReturns": true
  },
  // TypeScriptでコンパイルする対象ディレクトリ
  "include": ["src"]
}
```

### `vite.config.ts`の作成

Viteの設定ファイルを作成します。プロジェクトのルートに `vite.config.ts` を以下の内容で作成してください。

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### `package.json`の`scripts`の更新

`package.json`の`scripts`セクションを以下のように更新し、Viteコマンドを使えるようにします。

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
```

## Step 2. Three.jsの基本設定

Three.jsのシーンを表示するためのHTMLファイルと、基本的な3Dシーンを構築するTypeScriptファイルを作成します。

### `index.html`の作成

プロジェクトのルートに `index.html` を以下の内容で作成してください。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Three.js Collision Demo</title>
    <style>
      body {
        margin: 0;
        overflow: hidden;
      }
      canvas {
        display: block;
      }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `src/main.ts`の初期設定

`src`ディレクトリを作成し、その中に `main.ts` を以下の内容で作成してください。ここでは、シーン、カメラ、レンダラー、光源、地面、そしていくつかの初期オブジェクト（球と箱）を設定します。

```typescript
import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 15); // カメラの位置を調整
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf0f0f0);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Animation Loop (placeholder for now)
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

ここまでで、`npm run dev`を実行すると、灰色の地面が表示されるはずです。

## Step 3. `collision.js`の導入と準備

`collision.js`はnpmで公開されているものもありますが、今回はシンプルで学習に適した[Calebsor/collisions](https://github.com/Calebsor/collisions)のコードを直接プロジェクトに組み込みます。

### `src/lib`ディレクトリの作成

`src`ディレクトリの中に `lib` という名前の新しいディレクトリを作成します。

```bash
mkdir src\lib
```

### `collisions.js`の作成と修正

`src/lib/collisions.js` を以下の内容で作成してください。これは、元の`collisions.js`のコードをESモジュールとしてエクスポートできるように修正し、さらに衝突結果を`results`プロパティに格納するように改造したものです。

```javascript
// Source: https://github.com/Calebsor/collisions
// This is a simple 2D collision detection library, modified for this tutorial.

class Collisions {
  constructor() {
    this._last_result = null;
    this._potentials = [];
    this._system = [];
    this.results = []; // 衝突結果を格納する配列
  }

  createCircle(x, y, radius) {
    const body = {
      x: x,
      y: y,
      radius: radius,
      type: 'circle',
      // collidesとpotentialsはThree.jsのオブジェクトとは直接関係ないので削除
    };
    this._system.push(body);
    return body;
  }

  createPolygon(x, y, points) {
    const body = {
      x: x,
      y: y,
      points: points,
      type: 'polygon',
      // collidesとpotentialsはThree.jsのオブジェクトとは直接関係ないので削除
    };
    this._system.push(body);
    return body;
  }

  update() {
    this.results = []; // 毎フレーム衝突結果をリセット
    const bodies = this._system;
    const length = bodies.length;

    // すべてのボディペアに対して衝突判定を行う
    for (let i = 0; i < length; i++) {
      const body1 = bodies[i];
      for (let j = i + 1; j < length; j++) {
        const body2 = bodies[j];
        this.check(body1, body2); // 衝突があればresultsに結果が追加される
      }
    }
  }

  check(body, target) {
    if (body.type === 'circle' && target.type === 'circle') {
      return this.checkCircleCircle(body, target);
    }
    // ポリゴンとの衝突判定は今回は使用しないため、簡略化
    if (body.type === 'polygon' && target.type === 'polygon') {
      return false;
    }
    if (body.type === 'circle' && target.type === 'polygon') {
      return false;
    }
    if (body.type === 'polygon' && target.type === 'circle') {
      return false;
    }
    return false;
  }

  checkCircleCircle(body, target) {
    const difference_x = target.x - body.x;
    const difference_y = target.y - body.y;
    const distance = Math.sqrt(difference_x * difference_x + difference_y * difference_y);
    const total_radius = body.radius + target.radius;

    if (distance < total_radius) {
      const overlap = total_radius - distance;
      // 衝突のめり込みベクトルを計算
      const overlap_x = (difference_x / distance) * overlap;
      const overlap_y = (difference_y / distance) * overlap;

      const result = {
        collided: true,
        body: body,
        target: target,
        overlap: overlap,
        overlap_v: { x: overlap_x, y: overlap_y }, // めり込みベクトル
      };
      this._last_result = result;
      this.results.push(result); // 衝突結果をresults配列に追加
      return result;
    }
    return false;
  }

  // ポリゴン関連のチェックは今回は使用しない
  checkPolygonPolygon(body, target) {
    return false;
  }

  checkCirclePolygon(circle, polygon) {
    return false;
  }
}

export { Collisions }; // ESモジュールとしてエクスポート
```

### `src/lib/collisions.d.ts`の作成

`collisions.js`の型定義ファイルを作成します。`src/lib/collisions.d.ts` を以下の内容で作成してください。

```typescript
declare module '*/lib/collisions.js' {
  export class Collisions {
    constructor();
    results: any[]; // 新しく追加したresultsプロパティの型定義
    createCircle(x: number, y: number, radius: number): any;
    createPolygon(x: number, y: number, points: number[][]): any;
    update(): void;
  }
}
```

## Step 4. オブジェクトと衝突ボディの関連付け

`main.ts`を更新し、Three.jsのオブジェクトと`collision.js`の衝突ボディを関連付けます。

```typescript
import * as THREE from 'three';
import { Collisions } from './lib/collisions.js'; // collision.jsをインポート

// ... (既存のシーン、カメラ、レンダラー、光源、地面のコード) ...

// Collision System
const collisionSystem = new Collisions();

// Player (青い球)
const playerGeometry = new THREE.SphereGeometry(1, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
scene.add(player);
// プレイヤーの衝突ボディを作成し、Three.jsオブジェクトに関連付ける
const playerCollider = collisionSystem.createCircle(player.position.x, player.position.z, 1);
(player as any).collider = playerCollider; // Three.jsオブジェクトにcolliderプロパティを追加

// Obstacles (赤い球)
const obstacles: THREE.Mesh[] = []; // 障害物オブジェクトを格納する配列
const obstaclePositions = [
  new THREE.Vector3(-5, 1, 0),
  new THREE.Vector3(5, 1, 0),
  new THREE.Vector3(0, 1, -5),
  new THREE.Vector3(0, 1, 5),
];

const obstacleGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

for (const pos of obstaclePositions) {
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  obstacle.position.copy(pos);
  (obstacle as any).velocity = new THREE.Vector3(); // 障害物の速度を保持するプロパティ
  scene.add(obstacle);
  obstacles.push(obstacle);
  // 障害物の衝突ボディを作成し、Three.jsオブジェクトに関連付ける
  const collider = collisionSystem.createCircle(pos.x, pos.z, 1.5);
  (obstacle as any).collider = collider;
}

// ... (アニメーションループとリサイズイベントのコード) ...
```

## Step 5. マウス操作の実装

マウスの動きを検知し、3D空間上のXZ平面にレイキャスティングして、プレイヤーの目標位置を決定します。

`main.ts`の既存のコードに以下のマウスインタラクションのコードを追加します。

```typescript
// ... (既存のオブジェクト作成コード) ...

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Y=1の平面（地面の高さ）にレイを飛ばす
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);
const targetPosition = new THREE.Vector3(); // マウスが指す3D空間上の目標位置

window.addEventListener('mousemove', (event) => {
  // マウス座標を正規化デバイス座標系に変換 (-1から1の範囲)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // レイキャスターを更新
  raycaster.setFromCamera(mouse, camera);
  // レイと平面の交点を計算し、targetPositionに格納
  raycaster.ray.intersectPlane(plane, targetPosition);
});

// ... (アニメーションループとリサイズイベントのコード) ...
```

## Step 6. 衝突判定と解決ロジック

アニメーションループ内で、プレイヤーの移動、衝突判定、そして衝突応答（位置補正と障害物の移動）を実装します。

`main.ts`の`animate`関数を以下の内容で更新してください。

```typescript
// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // プレイヤーをマウスの目標位置に移動
  player.position.x = targetPosition.x;
  player.position.z = targetPosition.z;
  // プレイヤーの衝突ボディの位置も更新
  playerCollider.x = player.position.x;
  playerCollider.y = player.position.z;

  // 障害物の速度を適用し、減衰させる
  for (const obstacle of obstacles) {
    obstacle.position.x += (obstacle as any).velocity.x;
    obstacle.position.z += (obstacle as any).velocity.z;
    // 障害物の衝突ボディの位置も更新
    (obstacle as any).collider.x = obstacle.position.x;
    (obstacle as any).collider.y = obstacle.position.z;

    // 速度を減衰させる (摩擦のような効果)
    (obstacle as any).velocity.multiplyScalar(0.95);
  }

  // 衝突システムを更新し、衝突を検出
  collisionSystem.update();

  // 検出されたすべての衝突結果を処理
  const results = collisionSystem.results;
  for (const result of results) {
    const body = result.body;
    const target = result.target;
    const overlap = result.overlap_v; // めり込みベクトル

    // プレイヤーが衝突の主体 (body) か客体 (target) かを判定
    const isPlayerBody = body === playerCollider;
    const isPlayerTarget = target === playerCollider;

    if (isPlayerBody || isPlayerTarget) {
      // 衝突に関与している障害物のThree.jsオブジェクトを取得
      const obstacleCollider = isPlayerBody ? target : body;
      const obstacle = obstacles.find(o => (o as any).collider === obstacleCollider);

      if (obstacle) {
        if (isPlayerBody) {
          // プレイヤーがbodyの場合: プレイヤーをめり込みベクトル分戻し、障害物を押し出す
          player.position.x -= overlap.x;
          player.position.z -= overlap.y;
          (obstacle as any).velocity.x += overlap.x * 0.1; // 障害物に速度を加える
          (obstacle as any).velocity.z += overlap.y * 0.1;
        } else {
          // プレイヤーがtargetの場合: プレイヤーをめり込みベクトル分進め、障害物を押し出す
          player.position.x += overlap.x;
          player.position.z += overlap.y;
          (obstacle as any).velocity.x -= overlap.x * 0.1; // 障害物に速度を加える
          (obstacle as any).velocity.z -= overlap.y * 0.1;
        }

        // プレイヤーの衝突ボディの位置を解決後に再度更新
        playerCollider.x = player.position.x;
        playerCollider.y = player.position.z;
      }
    }
  }

  renderer.render(scene, camera);
}
```

## おわりに

これで、Three.js、TypeScript、`collision.js`を使ったインタラクティブな衝突デモが完成しました。

### 学習のまとめ

*   Three.jsで基本的な3Dシーンを構築し、オブジェクトを配置する方法。
*   `collision.js`のようなシンプルな2D衝突判定ライブラリをプロジェクトに組み込む方法。
*   3Dオブジェクトと2D衝突ボディを関連付け、XZ平面で衝突判定を行う方法。
*   マウス入力から3D空間上の座標を計算し、オブジェクトを操作する方法。
*   衝突検出後、オブジェクトのめり込みを防ぐための位置補正と、衝突応答として障害物を動かす方法。

### さらなる発展へのヒント

*   **より複雑な形状の衝突**: 現在は球体同士の衝突に限定していますが、`collision.js`のポリゴン判定機能や、より高度な物理エンジン（例: Cannon.js, Rapier）を導入することで、箱やカスタム形状のオブジェクトとの衝突も扱えるようになります。
*   **衝突音やエフェクト**: 衝突時に音を鳴らしたり、パーティクルエフェクトを表示したりすることで、ユーザー体験を向上させることができます。
*   **衝突グループ**: 特定のオブジェクト同士だけが衝突するように、衝突グループを設定することができます。
*   **パフォーマンス最適化**: オブジェクトの数が増えると衝突判定の負荷が高まります。空間分割法（例: クアッドツリー、オクツリー）を導入することで、パフォーマンスを向上させることができます。
*   **物理エンジンの導入**: よりリアルな物理挙動（重力、摩擦、反発係数など）を求める場合は、Three.jsと連携できる物理エンジン（Cannon.js, Rapierなど）の導入を検討してください。

このチュートリアルが、あなたのThree.jsと衝突判定の学習の一助となれば幸いです。
