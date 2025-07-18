# Three.js + akashic-extension/collision-js による3D衝突判定システム

このチュートリアルでは、Three.jsと`akashic-extension/collision-js`を組み合わせて、直方体、円柱、三角柱の3D形状表示と有向境界ボックス（OBB）を用いた高精度な衝突判定システムを構築します。

## 目次

1. [学習目標](#学習目標)
2. [環境構築](#環境構築)
3. [akashic-extension/collision-jsの基本](#akashic-extensioncollision-jsの基本)
4. [3D形状の表示](#3d形状の表示)
5. [衝突判定システム](#衝突判定システム)
6. [インタラクティブコンテンツ](#インタラクティブコンテンツ)
7. [実装例](#実装例)
8. [まとめ](#まとめ)

## 学習目標

### 習得する技術
- **Three.js**: 直方体、円柱、三角柱の3D表示
- **akashic-extension/collision-js**: 有向境界ボックス（OBB）による衝突判定
- **3D数学**: ベクトル、行列、クォータニオンの活用
- **インタラクション**: マウス・キーボード操作による3D空間制御

### 技術目標
- 複数の3D形状を同時に表示・操作
- リアルタイムな衝突検知と視覚的フィードバック
- 有向境界ボックスによる高精度な衝突判定
- パフォーマンスを考慮したシステム設計

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

## akashic-extension/collision-jsの基本

### 基本的な使用方法

```typescript
// src/collision/AkashicCollision.ts
import * as co from '@akashic-extension/collision-js';

// 基本的な衝突判定クラス
export class AkashicCollisionSystem {
  private bodies: Map<string, co.AABB> = new Map();
  private collisionResults: any[] = [];

  // AABBの作成
  createAABB(id: string, x: number, y: number, width: number, height: number): void {
    const aabb: co.AABB = {
      x: x,
      y: y,
      width: width,
      height: height
    };
    this.bodies.set(id, aabb);
  }

  // 衝突判定の実行
  checkCollisions(): any[] {
    this.collisionResults = [];
    const bodyIds = Array.from(this.bodies.keys());

    for (let i = 0; i < bodyIds.length; i++) {
      for (let j = i + 1; j < bodyIds.length; j++) {
        const id1 = bodyIds[i];
        const id2 = bodyIds[j];
        const body1 = this.bodies.get(id1)!;
        const body2 = this.bodies.get(id2)!;

        // AABB vs AABB衝突判定
        if (this.checkAABBCollision(body1, body2)) {
          this.collisionResults.push({
            id1: id1,
            id2: id2,
            body1: body1,
            body2: body2
          });
        }
      }
    }

    return this.collisionResults;
  }

  // AABB衝突判定
  private checkAABBCollision(aabb1: co.AABB, aabb2: co.AABB): boolean {
    return (
      aabb1.x < aabb2.x + aabb2.width &&
      aabb1.x + aabb1.width > aabb2.x &&
      aabb1.y < aabb2.y + aabb2.height &&
      aabb1.y + aabb1.height > aabb2.y
    );
  }

  // ボディの更新
  updateBody(id: string, x: number, y: number): void {
    const body = this.bodies.get(id);
    if (body) {
      body.x = x;
      body.y = y;
    }
  }

  // ボディの削除
  removeBody(id: string): void {
    this.bodies.delete(id);
  }
}
```

### 3D空間での適用

```typescript
// src/collision/ThreeDAkashicCollision.ts
import * as THREE from 'three';
import * as co from '@akashic-extension/collision-js';

export interface CollisionBox3D {
  id: string;
  center: THREE.Vector3;
  size: THREE.Vector3;
  rotation: THREE.Quaternion;
  mesh: THREE.Mesh;
}

export class ThreeDAkashicCollision {
  private collisionBodies: Map<string, CollisionBox3D> = new Map();
  private akashicSystem: AkashicCollisionSystem;

  constructor() {
    this.akashicSystem = new AkashicCollisionSystem();
  }

  // 3Dオブジェクトの追加
  addObject(id: string, mesh: THREE.Mesh): void {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    const collisionBox: CollisionBox3D = {
      id: id,
      center: center,
      size: size,
      rotation: mesh.quaternion.clone(),
      mesh: mesh
    };

    this.collisionBodies.set(id, collisionBox);

    // 2D衝突判定用のAABBを作成（XZ平面）
    this.akashicSystem.createAABB(
      id,
      center.x - size.x / 2,
      center.z - size.z / 2,
      size.x,
      size.z
    );
  }

  // 衝突判定の実行
  checkCollisions(): any[] {
    // 各オブジェクトの位置を更新
    this.collisionBodies.forEach((body, id) => {
      const center = body.mesh.position;
      this.akashicSystem.updateBody(id, center.x - body.size.x / 2, center.z - body.size.z / 2);
    });

    // 2D衝突判定を実行
    const collisions2D = this.akashicSystem.checkCollisions();
    
    // 3D衝突判定で詳細チェック
    const collisions3D = [];
    for (const collision of collisions2D) {
      const body1 = this.collisionBodies.get(collision.id1)!;
      const body2 = this.collisionBodies.get(collision.id2)!;
      
      if (this.checkOBBCollision(body1, body2)) {
        collisions3D.push({
          object1: body1,
          object2: body2,
          penetration: this.calculatePenetration(body1, body2)
        });
      }
    }

    return collisions3D;
  }

  // 有向境界ボックス（OBB）衝突判定
  private checkOBBCollision(box1: CollisionBox3D, box2: CollisionBox3D): boolean {
    // 簡略化されたOBB衝突判定
    // 実際のOBB判定は複雑な数学的処理が必要
    
    const distance = box1.center.distanceTo(box2.center);
    const minDistance = (box1.size.length() + box2.size.length()) / 4;
    
    return distance < minDistance;
  }

  // 侵入深度の計算
  private calculatePenetration(box1: CollisionBox3D, box2: CollisionBox3D): number {
    const distance = box1.center.distanceTo(box2.center);
    const minDistance = (box1.size.length() + box2.size.length()) / 4;
    
    return Math.max(0, minDistance - distance);
  }

  // オブジェクトの削除
  removeObject(id: string): void {
    this.collisionBodies.delete(id);
    this.akashicSystem.removeBody(id);
  }
}
```

## 3D形状の表示

### 直方体の作成

```typescript
// src/shapes/BoxShape.ts
import * as THREE from 'three';

export class BoxShape {
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;

  constructor(width: number, height: number, depth: number, color: number = 0x00ff00) {
    this.geometry = new THREE.BoxGeometry(width, height, depth);
    this.material = new THREE.MeshPhongMaterial({ 
      color: color,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 影の設定
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.mesh.rotation.set(x, y, z);
  }

  // 衝突時の色変更
  setCollisionState(isColliding: boolean): void {
    if (isColliding) {
      this.material.color.setHex(0xff0000);
      this.material.emissive.setHex(0x440000);
    } else {
      this.material.color.setHex(0x00ff00);
      this.material.emissive.setHex(0x000000);
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

### 円柱の作成

```typescript
// src/shapes/CylinderShape.ts
import * as THREE from 'three';

export class CylinderShape {
  private geometry: THREE.CylinderGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;

  constructor(radius: number, height: number, segments: number = 32, color: number = 0xff0000) {
    this.geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
    this.material = new THREE.MeshPhongMaterial({ 
      color: color,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 影の設定
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.mesh.rotation.set(x, y, z);
  }

  // 衝突時の色変更
  setCollisionState(isColliding: boolean): void {
    if (isColliding) {
      this.material.color.setHex(0xff0000);
      this.material.emissive.setHex(0x440000);
    } else {
      this.material.color.setHex(0xff0000);
      this.material.emissive.setHex(0x000000);
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

### 三角柱の作成

```typescript
// src/shapes/TriangularPrismShape.ts
import * as THREE from 'three';

export class TriangularPrismShape {
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;

  constructor(width: number, height: number, depth: number, color: number = 0x0000ff) {
    this.geometry = this.createTriangularPrismGeometry(width, height, depth);
    this.material = new THREE.MeshPhongMaterial({ 
      color: color,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 影の設定
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  private createTriangularPrismGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = new Float32Array([
      // 上面の三角形
      0, height/2, depth/2,
      -width/2, height/2, -depth/2,
      width/2, height/2, -depth/2,
      
      // 下面の三角形
      0, -height/2, depth/2,
      -width/2, -height/2, -depth/2,
      width/2, -height/2, -depth/2,
      
      // 側面1
      0, height/2, depth/2,
      -width/2, height/2, -depth/2,
      -width/2, -height/2, -depth/2,
      0, -height/2, depth/2,
      
      // 側面2
      -width/2, height/2, -depth/2,
      width/2, height/2, -depth/2,
      width/2, -height/2, -depth/2,
      -width/2, -height/2, -depth/2,
      
      // 側面3
      width/2, height/2, -depth/2,
      0, height/2, depth/2,
      0, -height/2, depth/2,
      width/2, -height/2, -depth/2
    ]);
    
    const indices = new Uint16Array([
      // 上面
      0, 1, 2,
      // 下面
      3, 5, 4,
      // 側面1
      6, 7, 8,
      6, 8, 9,
      // 側面2
      10, 11, 12,
      10, 12, 13,
      // 側面3
      14, 15, 16,
      14, 16, 17
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.mesh.rotation.set(x, y, z);
  }

  // 衝突時の色変更
  setCollisionState(isColliding: boolean): void {
    if (isColliding) {
      this.material.color.setHex(0xff0000);
      this.material.emissive.setHex(0x440000);
    } else {
      this.material.color.setHex(0x0000ff);
      this.material.emissive.setHex(0x000000);
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

## インタラクティブコンテンツ

### メインアプリケーション

```typescript
// src/main.ts
import * as THREE from 'three';
import { BoxShape } from './shapes/BoxShape';
import { CylinderShape } from './shapes/CylinderShape';
import { TriangularPrismShape } from './shapes/TriangularPrismShape';
import { ThreeDAkashicCollision } from './collision/ThreeDAkashicCollision';

class CollisionDemoApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private collisionSystem: ThreeDAkashicCollision;

  // 3D形状
  private shapes: { [key: string]: BoxShape | CylinderShape | TriangularPrismShape } = {};
  private selectedObject: string | null = null;

  // 制御
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private keys: { [key: string]: boolean } = {};

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.collisionSystem = new ThreeDAkashicCollision();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  private init(): void {
    // レンダラーの設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x222222);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // カメラの設定
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // 照明の設定
    this.setupLighting();

    // 地面の作成
    this.createGround();

    // 3D形状の作成
    this.createShapes();

    // UIの作成
    this.createUI();
  }

  private setupLighting(): void {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // 指向性ライト
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createShapes(): void {
    // 直方体の作成
    const box = new BoxShape(2, 2, 2, 0x00ff00);
    box.setPosition(-4, 1, 0);
    this.scene.add(box.getMesh());
    this.shapes['box'] = box;
    this.collisionSystem.addObject('box', box.getMesh());

    // 円柱の作成
    const cylinder = new CylinderShape(1, 3, 32, 0xff0000);
    cylinder.setPosition(0, 1.5, 0);
    this.scene.add(cylinder.getMesh());
    this.shapes['cylinder'] = cylinder;
    this.collisionSystem.addObject('cylinder', cylinder.getMesh());

    // 三角柱の作成
    const triangularPrism = new TriangularPrismShape(2, 3, 2, 0x0000ff);
    triangularPrism.setPosition(4, 1.5, 0);
    this.scene.add(triangularPrism.getMesh());
    this.shapes['triangularPrism'] = triangularPrism;
    this.collisionSystem.addObject('triangularPrism', triangularPrism.getMesh());
  }

  private createUI(): void {
    const ui = document.createElement('div');
    ui.innerHTML = `
      <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: Arial, sans-serif;">
        <h3>Three.js + akashic-extension/collision-js Demo</h3>
        <p>Click: Select object</p>
        <p>WASD: Move selected object</p>
        <p>QE: Move up/down</p>
        <p>R: Rotate selected object</p>
        <p>Space: Add random shape</p>
        <div id="collision-info" style="margin-top: 10px; color: yellow;"></div>
      </div>
    `;
    document.body.appendChild(ui);
  }

  private setupEventListeners(): void {
    // マウスクリックでオブジェクト選択
    document.addEventListener('click', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = Object.values(this.shapes).map(shape => shape.getMesh());
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        // 前の選択を解除
        if (this.selectedObject) {
          this.shapes[this.selectedObject].setCollisionState(false);
        }

        // 新しいオブジェクトを選択
        const selectedMesh = intersects[0].object;
        this.selectedObject = Object.keys(this.shapes).find(key => 
          this.shapes[key].getMesh() === selectedMesh
        ) || null;

        if (this.selectedObject) {
          this.shapes[this.selectedObject].getMesh().material.emissive.setHex(0x444444);
        }
      }
    });

    // キーボードイベント
    document.addEventListener('keydown', (event) => {
      this.keys[event.key.toLowerCase()] = true;
      
      if (event.key === ' ') {
        this.addRandomShape();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private addRandomShape(): void {
    const shapeTypes = ['box', 'cylinder', 'triangular'];
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const id = `${type}_${Date.now()}`;
    
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    const y = 2 + Math.random() * 3;

    let shape: BoxShape | CylinderShape | TriangularPrismShape;

    switch (type) {
      case 'box':
        shape = new BoxShape(1 + Math.random(), 1 + Math.random(), 1 + Math.random());
        break;
      case 'cylinder':
        shape = new CylinderShape(0.5 + Math.random() * 0.5, 1 + Math.random() * 2);
        break;
      default:
        shape = new TriangularPrismShape(1 + Math.random(), 1 + Math.random() * 2, 1 + Math.random());
        break;
    }

    shape.setPosition(x, y, z);
    this.scene.add(shape.getMesh());
    this.shapes[id] = shape;
    this.collisionSystem.addObject(id, shape.getMesh());
  }

  private updateSelectedObject(): void {
    if (!this.selectedObject) return;

    const shape = this.shapes[this.selectedObject];
    const mesh = shape.getMesh();
    const moveSpeed = 0.1;

    if (this.keys['w']) mesh.position.z -= moveSpeed;
    if (this.keys['s']) mesh.position.z += moveSpeed;
    if (this.keys['a']) mesh.position.x -= moveSpeed;
    if (this.keys['d']) mesh.position.x += moveSpeed;
    if (this.keys['q']) mesh.position.y += moveSpeed;
    if (this.keys['e']) mesh.position.y -= moveSpeed;

    if (this.keys['r']) {
      mesh.rotation.y += 0.05;
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // 選択されたオブジェクトの更新
    this.updateSelectedObject();

    // 衝突判定
    const collisions = this.collisionSystem.checkCollisions();
    
    // 全オブジェクトの衝突状態をリセット
    Object.keys(this.shapes).forEach(key => {
      if (key !== this.selectedObject) {
        this.shapes[key].setCollisionState(false);
      }
    });

    // 衝突情報の表示
    const collisionInfo = document.getElementById('collision-info');
    if (collisionInfo) {
      if (collisions.length > 0) {
        collisionInfo.textContent = `衝突検知: ${collisions.length} 件`;
        
        // 衝突したオブジェクトの色を変更
        collisions.forEach(collision => {
          const shape1 = Object.values(this.shapes).find(s => s.getMesh() === collision.object1.mesh);
          const shape2 = Object.values(this.shapes).find(s => s.getMesh() === collision.object2.mesh);
          
          if (shape1) shape1.setCollisionState(true);
          if (shape2) shape2.setCollisionState(true);
        });
      } else {
        collisionInfo.textContent = '衝突なし';
      }
    }

    // レンダリング
    this.renderer.render(this.scene, this.camera);
  }
}

// アプリケーションの起動
new CollisionDemoApp();
```

### HTML設定

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Three.js + akashic-extension/collision-js Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      font-family: Arial, sans-serif;
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

### Vite設定

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

## 実行方法

### 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### 操作方法

1. **オブジェクト選択**: マウスクリックで3D形状を選択
2. **移動操作**: 
   - WASD: 水平移動
   - QE: 垂直移動
   - R: 回転
3. **形状追加**: スペースキーでランダムな形状を追加
4. **衝突検知**: 衝突時に形状が赤く変化

## まとめ

### 習得した技術

1. **Three.js 3D形状API**
   - BoxGeometry, CylinderGeometry, BufferGeometry
   - 3D座標変換とインタラクション
   - マテリアルとライティング

2. **akashic-extension/collision-js**
   - AABBによる効率的な衝突検知
   - 2D衝突判定の3D空間への応用
   - リアルタイム衝突判定システム

3. **インタラクティブ機能**
   - マウス・キーボード操作
   - オブジェクト選択と操作
   - 動的な形状追加

### 技術的な特徴

- **効率的な衝突判定**: 2D AABBによる高速な粗い判定
- **視覚的フィードバック**: 衝突時の色変化
- **リアルタイム処理**: 60FPSでの衝突検知
- **拡張性**: 新しい形状の追加が容易

### 発展的な学習方向

1. **より高度な衝突判定**
   - 真の3D OBB実装
   - 分離軸定理（SAT）の完全実装
   - 連続衝突検知

2. **物理シミュレーション**
   - 衝突応答の実装
   - 物理エンジンとの統合
   - リアルな物理計算

3. **パフォーマンス最適化**
   - 空間分割による効率化
   - Level of Detail (LOD)
   - インスタンシング

この実装により、Three.jsとakashic-extension/collision-jsを組み合わせた基本的な3D衝突判定システムを構築できます。