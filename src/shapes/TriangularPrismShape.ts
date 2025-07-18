// src/shapes/TriangularPrismShape.ts
import * as THREE from 'three';

export class TriangularPrismShape {
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;
  private originalColor: number;
  private vertices: THREE.Vector3[];

  constructor(width: number, height: number, depth: number, color: number = 0x0000ff) {
    this.originalColor = color;
    
    // 三角柱の頂点を作成
    this.vertices = this.createTriangularPrismVertices(width, height, depth);
    
    // BufferGeometryの作成
    this.geometry = this.createTriangularPrismGeometry(width, height, depth);
    
    // マテリアルの設定
    this.material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100,
      specular: 0x1188ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide // 両面描画
    });
    
    // メッシュの作成
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 影の設定
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // カスタムプロパティ
    this.mesh.userData = {
      shapeType: 'triangularPrism',
      dimensions: { width, height, depth },
      originalColor: color
    };
  }

  // 三角柱の頂点を作成
  private createTriangularPrismVertices(width: number, height: number, depth: number): THREE.Vector3[] {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    return [
      // 上面の三角形
      new THREE.Vector3(0, halfHeight, halfDepth),           // 前面の頂点
      new THREE.Vector3(-halfWidth, halfHeight, -halfDepth), // 左後面の頂点
      new THREE.Vector3(halfWidth, halfHeight, -halfDepth),  // 右後面の頂点
      
      // 下面の三角形
      new THREE.Vector3(0, -halfHeight, halfDepth),          // 前面の頂点
      new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth), // 左後面の頂点
      new THREE.Vector3(halfWidth, -halfHeight, -halfDepth)   // 右後面の頂点
    ];
  }

  // 三角柱のジオメトリを作成
  private createTriangularPrismGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    
    // 頂点データ
    const vertices = new Float32Array([
      // 上面の三角形 (0, 1, 2)
      0, halfHeight, halfDepth,
      -halfWidth, halfHeight, -halfDepth,
      halfWidth, halfHeight, -halfDepth,
      
      // 下面の三角形 (3, 4, 5)
      0, -halfHeight, halfDepth,
      -halfWidth, -halfHeight, -halfDepth,
      halfWidth, -halfHeight, -halfDepth,
      
      // 側面1 (前面三角形)
      0, halfHeight, halfDepth,
      -halfWidth, halfHeight, -halfDepth,
      -halfWidth, -halfHeight, -halfDepth,
      0, -halfHeight, halfDepth,
      
      // 側面2 (左面)
      -halfWidth, halfHeight, -halfDepth,
      halfWidth, halfHeight, -halfDepth,
      halfWidth, -halfHeight, -halfDepth,
      -halfWidth, -halfHeight, -halfDepth,
      
      // 側面3 (右面)
      halfWidth, halfHeight, -halfDepth,
      0, halfHeight, halfDepth,
      0, -halfHeight, halfDepth,
      halfWidth, -halfHeight, -halfDepth
    ]);
    
    // インデックスデータ
    const indices = new Uint16Array([
      // 上面 (時計回り)
      0, 2, 1,
      
      // 下面 (反時計回り)
      3, 4, 5,
      
      // 側面1 (前面)
      6, 7, 8,
      6, 8, 9,
      
      // 側面2 (底面)
      10, 11, 12,
      10, 12, 13,
      
      // 側面3 (右面)
      14, 15, 16,
      14, 16, 17
    ]);
    
    // UV座標
    const uvs = new Float32Array([
      // 上面
      0.5, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      
      // 下面
      0.5, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      
      // 側面1
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      
      // 側面2
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      
      // 側面3
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  // 位置の設定
  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  // 位置の取得
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  // 回転の設定
  setRotation(x: number, y: number, z: number): void {
    this.mesh.rotation.set(x, y, z);
  }

  // 回転の取得
  getRotation(): THREE.Euler {
    return this.mesh.rotation.clone();
  }

  // スケールの設定
  setScale(x: number, y: number, z: number): void {
    this.mesh.scale.set(x, y, z);
  }

  // メッシュの取得
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  // サイズの取得
  getSize(): THREE.Vector3 {
    const boundingBox = new THREE.Box3().setFromObject(this.mesh);
    return boundingBox.getSize(new THREE.Vector3());
  }

  // 境界ボックスの取得
  getBoundingBox(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }

  // 頂点の取得
  getVertices(): THREE.Vector3[] {
    return this.vertices.map(v => v.clone());
  }

  // 寸法の取得
  getDimensions(): { width: number; height: number; depth: number } {
    return this.mesh.userData.dimensions;
  }

  // 衝突時の視覚的フィードバック
  setCollisionState(isColliding: boolean): void {
    if (isColliding) {
      this.material.color.setHex(0xff0000);
      this.material.emissive.setHex(0x440000);
      this.material.opacity = 1.0;
    } else {
      this.material.color.setHex(this.originalColor);
      this.material.emissive.setHex(0x000000);
      this.material.opacity = 0.8;
    }
  }

  // 選択状態の設定
  setSelected(isSelected: boolean): void {
    if (isSelected) {
      this.material.emissive.setHex(0x444444);
      this.material.wireframe = true;
    } else {
      this.material.emissive.setHex(0x000000);
      this.material.wireframe = false;
    }
  }

  // 色の変更
  setColor(color: number): void {
    this.originalColor = color;
    this.material.color.setHex(color);
    this.mesh.userData.originalColor = color;
  }

  // 透明度の設定
  setOpacity(opacity: number): void {
    this.material.opacity = opacity;
    this.material.transparent = opacity < 1.0;
  }

  // アニメーション用の更新
  update(deltaTime: number): void {
    // 基本クラスでは何もしない
    // 派生クラスでオーバーライドして使用
  }

  // ワイヤーフレーム表示の切り替え
  toggleWireframe(): void {
    this.material.wireframe = !this.material.wireframe;
  }

  // 中心点の取得
  getCenter(): THREE.Vector3 {
    const boundingBox = new THREE.Box3().setFromObject(this.mesh);
    return boundingBox.getCenter(new THREE.Vector3());
  }

  // 体積の計算（三角柱の体積）
  getVolume(): number {
    const dims = this.getDimensions();
    const triangleArea = (dims.width * dims.depth) / 2;
    return triangleArea * dims.height;
  }

  // 表面積の計算
  getSurfaceArea(): number {
    const dims = this.getDimensions();
    const triangleArea = (dims.width * dims.depth) / 2;
    const side1 = dims.width * dims.height;
    const side2 = dims.depth * dims.height;
    const side3 = Math.sqrt(dims.width * dims.width + dims.depth * dims.depth) * dims.height;
    
    return 2 * triangleArea + side1 + side2 + side3;
  }

  // 点が三角柱内にあるかチェック（簡易版）
  containsPoint(point: THREE.Vector3): boolean {
    const boundingBox = this.getBoundingBox();
    return boundingBox.containsPoint(point);
  }

  // より正確な三角柱内判定
  containsPointPrecise(point: THREE.Vector3): boolean {
    const localPoint = point.clone().sub(this.mesh.position);
    const dims = this.getDimensions();
    const halfHeight = dims.height / 2;
    
    // Y軸方向の範囲チェック
    if (Math.abs(localPoint.y) > halfHeight) {
      return false;
    }
    
    // 三角形の内部判定（簡略化）
    const halfWidth = dims.width / 2;
    const halfDepth = dims.depth / 2;
    
    // 三角形の頂点
    const v1 = new THREE.Vector2(0, halfDepth);
    const v2 = new THREE.Vector2(-halfWidth, -halfDepth);
    const v3 = new THREE.Vector2(halfWidth, -halfDepth);
    
    const p = new THREE.Vector2(localPoint.x, localPoint.z);
    
    return this.pointInTriangle(p, v1, v2, v3);
  }

  // 点が三角形内にあるかチェック
  private pointInTriangle(p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2): boolean {
    const v0 = c.clone().sub(a);
    const v1 = b.clone().sub(a);
    const v2 = p.clone().sub(a);
    
    const dot00 = v0.dot(v0);
    const dot01 = v0.dot(v1);
    const dot02 = v0.dot(v2);
    const dot11 = v1.dot(v1);
    const dot12 = v1.dot(v2);
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    return (u >= 0) && (v >= 0) && (u + v < 1);
  }

  // 他の三角柱との距離
  distanceTo(other: TriangularPrismShape): number {
    return this.getCenter().distanceTo(other.getCenter());
  }

  // 回転アニメーション
  rotateY(angle: number): void {
    this.mesh.rotation.y += angle;
  }

  // 拡大縮小アニメーション
  pulse(time: number, amplitude: number = 0.1): void {
    const scale = 1 + Math.sin(time) * amplitude;
    this.mesh.scale.set(scale, 1, scale);
  }

  // JSON形式でのデータ出力
  toJSON(): any {
    return {
      type: 'TriangularPrismShape',
      position: this.mesh.position.toArray(),
      rotation: this.mesh.rotation.toArray(),
      scale: this.mesh.scale.toArray(),
      dimensions: this.mesh.userData.dimensions,
      color: this.originalColor
    };
  }

  // JSONからの復元
  static fromJSON(data: any): TriangularPrismShape {
    const prism = new TriangularPrismShape(
      data.dimensions.width,
      data.dimensions.height,
      data.dimensions.depth,
      data.color
    );
    
    prism.setPosition(data.position[0], data.position[1], data.position[2]);
    prism.setRotation(data.rotation[0], data.rotation[1], data.rotation[2]);
    prism.setScale(data.scale[0], data.scale[1], data.scale[2]);
    
    return prism;
  }

  // リソースの破棄
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}