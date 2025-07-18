// src/shapes/BoxShape.ts
import * as THREE from 'three';

export class BoxShape {
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;
  private originalColor: number;

  constructor(width: number, height: number, depth: number, color: number = 0x00ff00) {
    this.originalColor = color;
    
    // 直方体ジオメトリの作成
    this.geometry = new THREE.BoxGeometry(width, height, depth);
    
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
      shapeType: 'box',
      dimensions: { width, height, depth },
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
    const size = this.getSize();
    return size.x * size.y * size.z;
  }

  // 表面積の計算
  getSurfaceArea(): number {
    const size = this.getSize();
    return 2 * (size.x * size.y + size.y * size.z + size.z * size.x);
  }

  // 点がボックス内にあるかチェック
  containsPoint(point: THREE.Vector3): boolean {
    const boundingBox = this.getBoundingBox();
    return boundingBox.containsPoint(point);
  }

  // 他のボックスとの距離
  distanceTo(other: BoxShape): number {
    return this.getCenter().distanceTo(other.getCenter());
  }

  // JSON形式でのデータ出力
  toJSON(): any {
    return {
      type: 'BoxShape',
      position: this.mesh.position.toArray(),
      rotation: this.mesh.rotation.toArray(),
      scale: this.mesh.scale.toArray(),
      dimensions: this.mesh.userData.dimensions,
      color: this.originalColor
    };
  }

  // JSONからの復元
  static fromJSON(data: any): BoxShape {
    const box = new BoxShape(
      data.dimensions.width,
      data.dimensions.height,
      data.dimensions.depth,
      data.color
    );
    
    box.setPosition(data.position[0], data.position[1], data.position[2]);
    box.setRotation(data.rotation[0], data.rotation[1], data.rotation[2]);
    box.setScale(data.scale[0], data.scale[1], data.scale[2]);
    
    return box;
  }

  // リソースの破棄
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}