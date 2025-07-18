// src/shapes/CylinderShape.ts
import * as THREE from 'three';

export class CylinderShape {
  private geometry: THREE.CylinderGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;
  private originalColor: number;

  constructor(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number = 32,
    color: number = 0xff0000
  ) {
    this.originalColor = color;
    
    // 円柱ジオメトリの作成
    this.geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments
    );
    
    // マテリアルの設定
    this.material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100,
      specular: 0x1188ff,
      transparent: true,
      opacity: 0.8
    });
    
    // メッシュの作成
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 影の設定
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // カスタムプロパティ
    this.mesh.userData = {
      shapeType: 'cylinder',
      dimensions: { radiusTop, radiusBottom, height, radialSegments },
      originalColor: color
    };
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

  // 半径と高さの取得
  getDimensions(): { radiusTop: number; radiusBottom: number; height: number } {
    return {
      radiusTop: this.geometry.parameters.radiusTop,
      radiusBottom: this.geometry.parameters.radiusBottom,
      height: this.geometry.parameters.height
    };
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

  // 体積の計算
  getVolume(): number {
    const dims = this.getDimensions();
    const avgRadius = (dims.radiusTop + dims.radiusBottom) / 2;
    return Math.PI * avgRadius * avgRadius * dims.height;
  }

  // 表面積の計算
  getSurfaceArea(): number {
    const dims = this.getDimensions();
    const topArea = Math.PI * dims.radiusTop * dims.radiusTop;
    const bottomArea = Math.PI * dims.radiusBottom * dims.radiusBottom;
    const slantHeight = Math.sqrt(dims.height * dims.height + 
      (dims.radiusTop - dims.radiusBottom) * (dims.radiusTop - dims.radiusBottom));
    const sideArea = Math.PI * (dims.radiusTop + dims.radiusBottom) * slantHeight;
    
    return topArea + bottomArea + sideArea;
  }

  // 点が円柱内にあるかチェック（簡易版）
  containsPoint(point: THREE.Vector3): boolean {
    const boundingBox = this.getBoundingBox();
    return boundingBox.containsPoint(point);
  }

  // より正確な円柱内判定
  containsPointPrecise(point: THREE.Vector3): boolean {
    const localPoint = point.clone().sub(this.mesh.position);
    const dims = this.getDimensions();
    const halfHeight = dims.height / 2;
    
    // Y軸方向の範囲チェック
    if (Math.abs(localPoint.y) > halfHeight) {
      return false;
    }
    
    // 円柱の半径チェック（線形補間）
    const heightRatio = (localPoint.y + halfHeight) / dims.height;
    const radiusAtHeight = dims.radiusBottom + (dims.radiusTop - dims.radiusBottom) * heightRatio;
    const distanceFromAxis = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
    
    return distanceFromAxis <= radiusAtHeight;
  }

  // 他の円柱との距離
  distanceTo(other: CylinderShape): number {
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
      type: 'CylinderShape',
      position: this.mesh.position.toArray(),
      rotation: this.mesh.rotation.toArray(),
      scale: this.mesh.scale.toArray(),
      dimensions: this.mesh.userData.dimensions,
      color: this.originalColor
    };
  }

  // JSONからの復元
  static fromJSON(data: any): CylinderShape {
    const cylinder = new CylinderShape(
      data.dimensions.radiusTop,
      data.dimensions.radiusBottom,
      data.dimensions.height,
      data.dimensions.radialSegments,
      data.color
    );
    
    cylinder.setPosition(data.position[0], data.position[1], data.position[2]);
    cylinder.setRotation(data.rotation[0], data.rotation[1], data.rotation[2]);
    cylinder.setScale(data.scale[0], data.scale[1], data.scale[2]);
    
    return cylinder;
  }

  // リソースの破棄
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}