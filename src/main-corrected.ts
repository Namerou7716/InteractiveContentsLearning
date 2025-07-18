// src/main-corrected.ts
import * as THREE from 'three';
import { BoxShape } from './shapes/BoxShape';
import { CylinderShape } from './shapes/CylinderShape';
import { TriangularPrismShape } from './shapes/TriangularPrismShape';
import { HybridCollisionSystem } from './collision/HybridCollisionSystem';
import { OBB } from './collision/OBB';

class CorrectedCollisionDemoApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private hybridCollisionSystem: HybridCollisionSystem;

  // 3D形状
  private shapes: { [key: string]: BoxShape | CylinderShape | TriangularPrismShape } = {};
  private selectedObject: string | null = null;

  // 制御
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private keys: { [key: string]: boolean } = {};

  // アニメーション
  private clock: THREE.Clock;
  private animationId: number | null = null;

  // パフォーマンス監視
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;

  // デバッグ
  private showDebugOBB: boolean = false;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.hybridCollisionSystem = new HybridCollisionSystem();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

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
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);

    // カメラの設定
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // シーンの設定
    this.scene.background = new THREE.Color(0x222222);
    this.scene.fog = new THREE.Fog(0x222222, 30, 100);

    // 照明の設定
    this.setupLighting();

    // 地面の作成
    this.createGround();

    // 3D形状の作成
    this.createShapes();

    // UIの作成
    this.createUI();

    // デバッグ情報の表示
    this.createDebugInfo();
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
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // ポイントライト
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x999999,
      shininess: 100
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // グリッドヘルパー
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x444444);
    this.scene.add(gridHelper);
  }

  private createShapes(): void {
    // 直方体の作成
    const box = new BoxShape(2, 2, 2, 0x00ff00);
    box.setPosition(-4, 1, 0);
    this.scene.add(box.getMesh());
    this.shapes['box'] = box;
    this.hybridCollisionSystem.addObject('box', box.getMesh(), 'box');

    // 円柱の作成
    const cylinder = new CylinderShape(1, 1, 3, 32, 0xff0000);
    cylinder.setPosition(0, 1.5, 0);
    this.scene.add(cylinder.getMesh());
    this.shapes['cylinder'] = cylinder;
    this.hybridCollisionSystem.addObject('cylinder', cylinder.getMesh(), 'cylinder');

    // 三角柱の作成
    const triangularPrism = new TriangularPrismShape(2, 3, 2, 0x0000ff);
    triangularPrism.setPosition(4, 1.5, 0);
    this.scene.add(triangularPrism.getMesh());
    this.shapes['triangularPrism'] = triangularPrism;
    this.hybridCollisionSystem.addObject('triangularPrism', triangularPrism.getMesh(), 'triangular');

    // 追加のテスト形状
    this.createTestShapes();
  }

  private createTestShapes(): void {
    // 回転した直方体
    const rotatedBox = new BoxShape(1.5, 1, 3, 0xffff00);
    rotatedBox.setPosition(-8, 1, 0);
    rotatedBox.setRotation(0, Math.PI / 4, Math.PI / 6);
    this.scene.add(rotatedBox.getMesh());
    this.shapes['rotated_box'] = rotatedBox;
    this.hybridCollisionSystem.addObject('rotated_box', rotatedBox.getMesh(), 'box');

    // 回転した円柱
    const rotatedCylinder = new CylinderShape(0.5, 0.5, 2, 16, 0xff00ff);
    rotatedCylinder.setPosition(8, 1, 0);
    rotatedCylinder.setRotation(Math.PI / 3, 0, Math.PI / 4);
    this.scene.add(rotatedCylinder.getMesh());
    this.shapes['rotated_cylinder'] = rotatedCylinder;
    this.hybridCollisionSystem.addObject('rotated_cylinder', rotatedCylinder.getMesh(), 'cylinder');

    // 小さな直方体群
    for (let i = 0; i < 3; i++) {
      const smallBox = new BoxShape(0.5, 0.5, 0.5, 0x00ffff);
      smallBox.setPosition(-8 + i * 2, 0.25, -5);
      smallBox.setRotation(0, i * Math.PI / 3, 0);
      this.scene.add(smallBox.getMesh());
      this.shapes[`small_box_${i}`] = smallBox;
      this.hybridCollisionSystem.addObject(`small_box_${i}`, smallBox.getMesh(), 'box');
    }
  }

  private createUI(): void {
    const ui = document.createElement('div');
    ui.innerHTML = `
      <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: 'Courier New', monospace; font-size: 12px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 5px; border: 1px solid #00ff00;">
        <h3 style="margin: 0 0 10px 0; color: #00ff00;">🎯 Three.js + True 3D OBB Collision System</h3>
        <div style="margin-bottom: 10px;">
          <strong style="color: #ffff00;">📋 操作方法:</strong><br>
          🖱️ <strong>Click</strong>: オブジェクト選択<br>
          ⌨️ <strong>WASD</strong>: 水平移動<br>
          ⌨️ <strong>QE</strong>: 垂直移動<br>
          ⌨️ <strong>R</strong>: Y軸回転<br>
          ⌨️ <strong>T</strong>: X軸回転<br>
          ⌨️ <strong>Space</strong>: ランダム形状追加<br>
          ⌨️ <strong>C</strong>: カメラリセット<br>
          ⌨️ <strong>V</strong>: ワイヤーフレーム切替<br>
          ⌨️ <strong>B</strong>: OBBデバッグ表示切替<br>
          ⌨️ <strong>G</strong>: 衝突解決実行
        </div>
        <div id="collision-info" style="margin-top: 10px; color: #ffff00; font-weight: bold; border-top: 1px solid #333; padding-top: 10px;"></div>
        <div id="object-info" style="margin-top: 10px; color: #00ffff; font-size: 11px;"></div>
      </div>
    `;
    document.body.appendChild(ui);
  }

  private createDebugInfo(): void {
    const debugInfo = document.createElement('div');
    debugInfo.id = 'debug-info';
    debugInfo.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #00ff00;
      min-width: 250px;
    `;
    document.body.appendChild(debugInfo);
  }

  private setupEventListeners(): void {
    // マウスクリックでオブジェクト選択
    document.addEventListener('click', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // レイキャスティングによる選択
      const raycastHit = this.hybridCollisionSystem.raycast(this.raycaster.ray, 100);
      
      if (raycastHit) {
        // 前の選択を解除
        if (this.selectedObject) {
          this.shapes[this.selectedObject].setSelected(false);
        }

        // 新しいオブジェクトを選択
        this.selectedObject = raycastHit.object.id;
        this.shapes[this.selectedObject].setSelected(true);
      } else {
        // 選択解除
        if (this.selectedObject) {
          this.shapes[this.selectedObject].setSelected(false);
          this.selectedObject = null;
        }
      }
    });

    // キーボードイベント
    document.addEventListener('keydown', (event) => {
      this.keys[event.key.toLowerCase()] = true;
      
      switch (event.key.toLowerCase()) {
        case ' ':
          this.addRandomShape();
          break;
        case 'c':
          this.resetCamera();
          break;
        case 'v':
          this.toggleWireframe();
          break;
        case 'b':
          this.toggleDebugOBB();
          break;
        case 'g':
          this.resolveAllCollisions();
          break;
        case 'x':
          this.removeSelectedObject();
          break;
        case 'z':
          this.resetScene();
          break;
        case 'h':
          this.showHelp();
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });

    // マウスホイールでカメラズーム
    document.addEventListener('wheel', (event) => {
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      this.camera.position.multiplyScalar(1 + direction * zoomSpeed);
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
    const randomColor = Math.floor(Math.random() * 0xffffff);

    switch (type) {
      case 'box':
        shape = new BoxShape(
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 1.5,
          randomColor
        );
        break;
      case 'cylinder':
        shape = new CylinderShape(
          0.3 + Math.random() * 0.7,
          0.3 + Math.random() * 0.7,
          0.5 + Math.random() * 2,
          16 + Math.floor(Math.random() * 16),
          randomColor
        );
        break;
      default:
        shape = new TriangularPrismShape(
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 2,
          0.5 + Math.random() * 1.5,
          randomColor
        );
        break;
    }

    shape.setPosition(x, y, z);
    shape.setRotation(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    this.scene.add(shape.getMesh());
    this.shapes[id] = shape;
    this.hybridCollisionSystem.addObject(id, shape.getMesh(), type as any);
  }

  private removeSelectedObject(): void {
    if (this.selectedObject) {
      const shape = this.shapes[this.selectedObject];
      this.scene.remove(shape.getMesh());
      this.hybridCollisionSystem.removeObject(this.selectedObject);
      shape.dispose();
      delete this.shapes[this.selectedObject];
      this.selectedObject = null;
    }
  }

  private resetCamera(): void {
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);
  }

  private toggleWireframe(): void {
    Object.values(this.shapes).forEach(shape => {
      shape.toggleWireframe();
    });
  }

  private toggleDebugOBB(): void {
    this.showDebugOBB = !this.showDebugOBB;
    this.hybridCollisionSystem.toggleDebugOBB(this.scene);
  }

  private resolveAllCollisions(): void {
    const collisions = this.hybridCollisionSystem.checkCollisions();
    
    collisions.forEach(collision => {
      this.hybridCollisionSystem.resolveCollision(collision, 0.5);
    });
  }

  private resetScene(): void {
    // 初期形状以外を削除
    const initialShapes = ['box', 'cylinder', 'triangularPrism', 'rotated_box', 'rotated_cylinder'];
    Object.keys(this.shapes).forEach(key => {
      if (!initialShapes.includes(key) && !key.startsWith('small_box_')) {
        const shape = this.shapes[key];
        this.scene.remove(shape.getMesh());
        this.hybridCollisionSystem.removeObject(key);
        shape.dispose();
        delete this.shapes[key];
      }
    });

    // 初期形状を初期位置に戻す
    this.shapes['box'].setPosition(-4, 1, 0);
    this.shapes['cylinder'].setPosition(0, 1.5, 0);
    this.shapes['triangularPrism'].setPosition(4, 1.5, 0);

    this.selectedObject = null;
    this.resetCamera();
  }

  private showHelp(): void {
    const helpText = `
🎯 Three.js + True 3D OBB Collision System

📋 操作方法:
• Click: オブジェクト選択
• WASD: 水平移動
• QE: 垂直移動  
• R: Y軸回転
• T: X軸回転
• Space: ランダム形状追加
• C: カメラリセット
• V: ワイヤーフレーム切替
• B: OBBデバッグ表示切替
• G: 衝突解決実行
• X: 選択オブジェクト削除
• Z: シーンリセット
• H: ヘルプ表示

🔧 技術情報:
• 真の3D OBB衝突判定
• 分離軸定理（SAT）による精密判定
• akashic-extension/collision-js による高速粗判定
• リアルタイム衝突解決
    `;
    
    alert(helpText);
  }

  private updateSelectedObject(): void {
    if (!this.selectedObject) return;

    const shape = this.shapes[this.selectedObject];
    const mesh = shape.getMesh();
    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;

    if (this.keys['w']) mesh.position.z -= moveSpeed;
    if (this.keys['s']) mesh.position.z += moveSpeed;
    if (this.keys['a']) mesh.position.x -= moveSpeed;
    if (this.keys['d']) mesh.position.x += moveSpeed;
    if (this.keys['q']) mesh.position.y += moveSpeed;
    if (this.keys['e']) mesh.position.y -= moveSpeed;

    if (this.keys['r']) mesh.rotation.y += rotateSpeed;
    if (this.keys['t']) mesh.rotation.x += rotateSpeed;

    // 地面より下に落ちないようにする
    if (mesh.position.y < 0.5) {
      mesh.position.y = 0.5;
    }
  }

  private updateFPS(): void {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  private updateUI(): void {
    const collisionInfo = document.getElementById('collision-info');
    const objectInfo = document.getElementById('object-info');
    const debugInfo = document.getElementById('debug-info');

    if (collisionInfo && objectInfo && debugInfo) {
      // 衝突情報
      const collisions = this.hybridCollisionSystem.checkCollisions();
      const stats = this.hybridCollisionSystem.getStats();
      
      if (collisions.length > 0) {
        collisionInfo.innerHTML = `
          🚨 <strong>衝突検知: ${collisions.length} 件</strong><br>
          📊 精密判定効率: ${(stats.performanceRatio * 100).toFixed(1)}%<br>
          🔍 粗判定: ${stats.roughCollisionCount} → 精密判定: ${stats.preciseCollisionCount}
        `;
      } else {
        collisionInfo.innerHTML = `
          ✅ <strong>衝突なし</strong><br>
          📊 判定効率: ${(stats.performanceRatio * 100).toFixed(1)}%
        `;
      }

      // オブジェクト情報
      const objectCount = Object.keys(this.shapes).length;
      const selectedInfo = this.selectedObject ? 
        `選択中: ${this.selectedObject} (${this.shapes[this.selectedObject].getMesh().userData.shapeType})` : 
        '選択なし';
      objectInfo.innerHTML = `
        オブジェクト数: ${objectCount}<br>
        ${selectedInfo}<br>
        OBBデバッグ: ${this.showDebugOBB ? 'ON' : 'OFF'}
      `;

      // デバッグ情報
      debugInfo.innerHTML = `
        <strong style="color: #00ff00;">⚡ パフォーマンス:</strong><br>
        FPS: <strong>${this.fps}</strong><br>
        オブジェクト数: <strong>${stats.objectCount}</strong><br>
        粗判定数: <strong>${stats.roughCollisionCount}</strong><br>
        精密判定数: <strong>${stats.preciseCollisionCount}</strong><br>
        判定効率: <strong>${(stats.performanceRatio * 100).toFixed(1)}%</strong><br>
        <br>
        <strong style="color: #00ff00;">📐 カメラ:</strong><br>
        Position: (${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})<br>
        <br>
        <strong style="color: #00ff00;">🎮 高度な操作:</strong><br>
        G: 衝突解決<br>
        B: OBBデバッグ<br>
        H: ヘルプ表示
      `;
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // 選択されたオブジェクトの更新
    this.updateSelectedObject();

    // 衝突判定
    const collisions = this.hybridCollisionSystem.checkCollisions();
    
    // 全オブジェクトの衝突状態をリセット
    Object.keys(this.shapes).forEach(key => {
      if (key !== this.selectedObject) {
        this.shapes[key].setCollisionState(false);
      }
    });

    // 衝突したオブジェクトの視覚的フィードバック
    collisions.forEach(collision => {
      const shape1 = this.shapes[collision.object1.id];
      const shape2 = this.shapes[collision.object2.id];
      
      if (shape1) shape1.setCollisionState(true);
      if (shape2) shape2.setCollisionState(true);
    });

    // アニメーション更新
    Object.values(this.shapes).forEach(shape => {
      shape.update(deltaTime);
    });

    // FPS更新
    this.updateFPS();

    // UI更新
    this.updateUI();

    // レンダリング
    this.renderer.render(this.scene, this.camera);
  }

  // アプリケーションの終了
  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // 全形状の破棄
    Object.values(this.shapes).forEach(shape => {
      shape.dispose();
    });

    // システムのリセット
    this.hybridCollisionSystem.reset();

    // レンダラーの破棄
    this.renderer.dispose();
  }
}

// アプリケーションの起動
const app = new CorrectedCollisionDemoApp();

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
  app.dispose();
});