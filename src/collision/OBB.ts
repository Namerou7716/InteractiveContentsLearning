// src/collision/OBB.ts
import * as THREE from 'three';

export interface OBBData {
  center: THREE.Vector3;
  halfExtents: THREE.Vector3;
  orientation: THREE.Matrix3;
}

export interface OBBCollisionResult {
  isColliding: boolean;
  penetrationDepth: number;
  separatingAxis: THREE.Vector3;
  contactPoint: THREE.Vector3;
}

/**
 * 有向境界ボックス（Oriented Bounding Box）の実装
 * 分離軸定理（SAT）を使用した完全な3D衝突判定
 */
export class OBB {
  public center: THREE.Vector3;
  public halfExtents: THREE.Vector3;
  public orientation: THREE.Matrix3;

  constructor(center: THREE.Vector3, halfExtents: THREE.Vector3, orientation: THREE.Matrix3) {
    this.center = center.clone();
    this.halfExtents = halfExtents.clone();
    this.orientation = orientation.clone();
  }

  /**
   * Three.jsのメッシュからOBBを作成
   */
  static fromMesh(mesh: THREE.Mesh): OBB {
    const geometry = mesh.geometry;
    
    // 境界ボックスの計算
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const boundingBox = geometry.boundingBox!;
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const halfExtents = size.multiplyScalar(0.5);
    
    // メッシュの変換を適用
    const worldCenter = center.clone().applyMatrix4(mesh.matrixWorld);
    
    // 回転行列を取得
    const rotationMatrix = new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld);
    
    // スケールを適用
    const scale = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
    halfExtents.multiply(scale);
    
    return new OBB(worldCenter, halfExtents, rotationMatrix);
  }

  /**
   * OBBの3つの軸ベクトルを取得
   */
  getAxes(): THREE.Vector3[] {
    const axes: THREE.Vector3[] = [];
    
    // X軸
    axes.push(new THREE.Vector3(1, 0, 0).applyMatrix3(this.orientation));
    // Y軸
    axes.push(new THREE.Vector3(0, 1, 0).applyMatrix3(this.orientation));
    // Z軸
    axes.push(new THREE.Vector3(0, 0, 1).applyMatrix3(this.orientation));
    
    return axes;
  }

  /**
   * OBBの8つの頂点を取得
   */
  getVertices(): THREE.Vector3[] {
    const vertices: THREE.Vector3[] = [];
    const axes = this.getAxes();
    
    // 8つの頂点を生成
    for (let i = 0; i < 8; i++) {
      const vertex = this.center.clone();
      
      // ±X, ±Y, ±Z の組み合わせ
      const xSign = (i & 1) ? 1 : -1;
      const ySign = (i & 2) ? 1 : -1;
      const zSign = (i & 4) ? 1 : -1;
      
      vertex.add(axes[0].clone().multiplyScalar(xSign * this.halfExtents.x));
      vertex.add(axes[1].clone().multiplyScalar(ySign * this.halfExtents.y));
      vertex.add(axes[2].clone().multiplyScalar(zSign * this.halfExtents.z));
      
      vertices.push(vertex);
    }
    
    return vertices;
  }

  /**
   * OBBを指定された軸に投影
   */
  projectOnAxis(axis: THREE.Vector3): { min: number; max: number } {
    const axes = this.getAxes();
    const centerProjection = this.center.dot(axis);
    
    // 各軸の寄与を計算
    const extent = Math.abs(axes[0].dot(axis) * this.halfExtents.x) +
                   Math.abs(axes[1].dot(axis) * this.halfExtents.y) +
                   Math.abs(axes[2].dot(axis) * this.halfExtents.z);
    
    return {
      min: centerProjection - extent,
      max: centerProjection + extent
    };
  }

  /**
   * 分離軸定理（SAT）を使用したOBB vs OBB衝突判定
   */
  intersects(other: OBB): OBBCollisionResult {
    const axes1 = this.getAxes();
    const axes2 = other.getAxes();
    
    // 15の分離軸をテスト
    const allAxes: THREE.Vector3[] = [
      ...axes1,                                    // 3軸（第1のOBB）
      ...axes2,                                    // 3軸（第2のOBB）
      ...this.getCrossProductAxes(axes1, axes2)   // 9軸（外積）
    ];
    
    let minPenetration = Infinity;
    let separatingAxis: THREE.Vector3 | null = null;
    
    for (const axis of allAxes) {
      // 軸の長さが0の場合はスキップ
      if (axis.lengthSq() < 1e-6) continue;
      
      axis.normalize();
      
      const projection1 = this.projectOnAxis(axis);
      const projection2 = other.projectOnAxis(axis);
      
      // 重なりの計算
      const overlap = Math.min(projection1.max, projection2.max) - 
                      Math.max(projection1.min, projection2.min);
      
      if (overlap <= 0) {
        // 分離軸が見つかった - 衝突なし
        return {
          isColliding: false,
          penetrationDepth: 0,
          separatingAxis: axis,
          contactPoint: new THREE.Vector3()
        };
      }
      
      // 最小侵入深度を記録
      if (overlap < minPenetration) {
        minPenetration = overlap;
        separatingAxis = axis.clone();
      }
    }
    
    // 接触点の計算
    const contactPoint = this.calculateContactPoint(other, separatingAxis!);
    
    // 法線の方向を調整
    const centerDifference = other.center.clone().sub(this.center);
    if (separatingAxis!.dot(centerDifference) < 0) {
      separatingAxis!.negate();
    }
    
    return {
      isColliding: true,
      penetrationDepth: minPenetration,
      separatingAxis: separatingAxis!,
      contactPoint: contactPoint
    };
  }

  /**
   * 外積軸を生成（9軸）
   */
  private getCrossProductAxes(axes1: THREE.Vector3[], axes2: THREE.Vector3[]): THREE.Vector3[] {
    const crossAxes: THREE.Vector3[] = [];
    
    for (const axis1 of axes1) {
      for (const axis2 of axes2) {
        const cross = axis1.clone().cross(axis2);
        if (cross.lengthSq() > 1e-6) { // 平行でない場合のみ追加
          crossAxes.push(cross);
        }
      }
    }
    
    return crossAxes;
  }

  /**
   * 接触点の計算
   */
  private calculateContactPoint(other: OBB, separatingAxis: THREE.Vector3): THREE.Vector3 {
    // 簡略化した接触点計算
    // 実際の実装では、最も近い頂点やエッジを見つける必要がある
    
    const thisProjection = this.projectOnAxis(separatingAxis);
    const otherProjection = other.projectOnAxis(separatingAxis);
    
    let contactPoint: THREE.Vector3;
    
    if (thisProjection.max < otherProjection.max) {
      // thisが侵入している
      contactPoint = this.center.clone().add(
        separatingAxis.clone().multiplyScalar(thisProjection.max - this.center.dot(separatingAxis))
      );
    } else {
      // otherが侵入している
      contactPoint = other.center.clone().add(
        separatingAxis.clone().multiplyScalar(otherProjection.max - other.center.dot(separatingAxis))
      );
    }
    
    return contactPoint;
  }

  /**
   * OBBの更新
   */
  updateFromMesh(mesh: THREE.Mesh): void {
    const newOBB = OBB.fromMesh(mesh);
    this.center.copy(newOBB.center);
    this.halfExtents.copy(newOBB.halfExtents);
    this.orientation.copy(newOBB.orientation);
  }

  /**
   * 点がOBB内にあるかチェック
   */
  containsPoint(point: THREE.Vector3): boolean {
    // 点をOBBのローカル座標系に変換
    const localPoint = point.clone().sub(this.center);
    const axes = this.getAxes();
    
    // 各軸での投影をチェック
    for (let i = 0; i < 3; i++) {
      const projection = Math.abs(localPoint.dot(axes[i]));
      if (projection > this.halfExtents.getComponent(i)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * レイとOBBの交差判定
   */
  intersectsRay(ray: THREE.Ray): { distance: number; point: THREE.Vector3 } | null {
    const axes = this.getAxes();
    const rayToCenter = this.center.clone().sub(ray.origin);
    
    let tMin = -Infinity;
    let tMax = Infinity;
    
    for (let i = 0; i < 3; i++) {
      const axis = axes[i];
      const rayDotAxis = ray.direction.dot(axis);
      const centerDotAxis = rayToCenter.dot(axis);
      const halfExtent = this.halfExtents.getComponent(i);
      
      if (Math.abs(rayDotAxis) < 1e-6) {
        // レイが軸に平行
        if (Math.abs(centerDotAxis) > halfExtent) {
          return null; // 交差しない
        }
      } else {
        const t1 = (centerDotAxis - halfExtent) / rayDotAxis;
        const t2 = (centerDotAxis + halfExtent) / rayDotAxis;
        
        const tNear = Math.min(t1, t2);
        const tFar = Math.max(t1, t2);
        
        tMin = Math.max(tMin, tNear);
        tMax = Math.min(tMax, tFar);
        
        if (tMin > tMax) {
          return null; // 交差しない
        }
      }
    }
    
    const distance = tMin > 0 ? tMin : tMax;
    if (distance < 0) {
      return null; // 交差しない
    }
    
    const point = ray.origin.clone().add(ray.direction.clone().multiplyScalar(distance));
    return { distance, point };
  }

  /**
   * デバッグ用の描画ヘルパー
   */
  createDebugMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.halfExtents.x * 2,
      this.halfExtents.y * 2,
      this.halfExtents.z * 2
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.center);
    mesh.matrix.setFromMatrix3(this.orientation);
    mesh.matrix.setPosition(this.center);
    mesh.matrixAutoUpdate = false;
    
    return mesh;
  }

  /**
   * OBBの複製
   */
  clone(): OBB {
    return new OBB(
      this.center.clone(),
      this.halfExtents.clone(),
      this.orientation.clone()
    );
  }

  /**
   * OBBの文字列表現
   */
  toString(): string {
    return `OBB(center: ${this.center.toArray()}, halfExtents: ${this.halfExtents.toArray()})`;
  }
}