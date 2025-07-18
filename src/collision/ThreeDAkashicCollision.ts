// src/collision/ThreeDAkashicCollision.ts
import * as THREE from 'three';
import { AkashicCollisionSystem } from './AkashicCollisionSystem';

export interface CollisionBox3D {
  id: string;
  center: THREE.Vector3;
  size: THREE.Vector3;
  rotation: THREE.Quaternion;
  mesh: THREE.Mesh;
}

export interface Collision3DResult {
  object1: CollisionBox3D;
  object2: CollisionBox3D;
  penetration: number;
  normal: THREE.Vector3;
  contactPoint: THREE.Vector3;
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
  checkCollisions(): Collision3DResult[] {
    // 各オブジェクトの位置を更新
    this.collisionBodies.forEach((body, id) => {
      const center = body.mesh.position;
      const boundingBox = new THREE.Box3().setFromObject(body.mesh);
      const size = boundingBox.getSize(new THREE.Vector3());
      
      // 境界ボックスの更新
      body.center.copy(center);
      body.size.copy(size);
      body.rotation.copy(body.mesh.quaternion);

      // 2D衝突判定用のAABBを更新
      this.akashicSystem.updateBody(id, center.x - size.x / 2, center.z - size.z / 2);
      this.akashicSystem.updateBodySize(id, size.x, size.z);
    });

    // 2D衝突判定を実行
    const collisions2D = this.akashicSystem.checkCollisions();
    
    // 3D衝突判定で詳細チェック
    const collisions3D: Collision3DResult[] = [];
    for (const collision of collisions2D) {
      const body1 = this.collisionBodies.get(collision.id1)!;
      const body2 = this.collisionBodies.get(collision.id2)!;
      
      const collision3D = this.checkOBBCollision(body1, body2);
      if (collision3D) {
        collisions3D.push(collision3D);
      }
    }

    return collisions3D;
  }

  // 有向境界ボックス（OBB）衝突判定
  private checkOBBCollision(box1: CollisionBox3D, box2: CollisionBox3D): Collision3DResult | null {
    // 簡略化されたOBB衝突判定
    // 実際のOBB判定は分離軸定理（SAT）を使用する必要がある
    
    const center1 = box1.center;
    const center2 = box2.center;
    const distance = center1.distanceTo(center2);
    
    // 各軸での重なりをチェック
    const axes = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1)
    ];

    let minPenetration = Infinity;
    let separatingAxis: THREE.Vector3 | null = null;

    for (const axis of axes) {
      const projection1 = this.projectBoxOnAxis(box1, axis);
      const projection2 = this.projectBoxOnAxis(box2, axis);

      const overlap = Math.min(projection1.max, projection2.max) - Math.max(projection1.min, projection2.min);

      if (overlap <= 0) {
        // 分離軸が見つかった
        return null;
      }

      if (overlap < minPenetration) {
        minPenetration = overlap;
        separatingAxis = axis.clone();
      }
    }

    // 接触点の計算
    const contactPoint = center1.clone().add(center2).multiplyScalar(0.5);

    // 法線の方向を調整
    const centerDifference = center2.clone().sub(center1);
    if (separatingAxis && separatingAxis.dot(centerDifference) < 0) {
      separatingAxis.negate();
    }

    return {
      object1: box1,
      object2: box2,
      penetration: minPenetration,
      normal: separatingAxis || new THREE.Vector3(0, 1, 0),
      contactPoint: contactPoint
    };
  }

  // ボックスを軸に投影
  private projectBoxOnAxis(box: CollisionBox3D, axis: THREE.Vector3): { min: number; max: number } {
    const center = box.center;
    const halfExtents = box.size.clone().multiplyScalar(0.5);
    
    // 回転を考慮した投影（簡略化）
    const centerProjection = center.dot(axis);
    const extent = Math.abs(halfExtents.x * axis.x) + 
                   Math.abs(halfExtents.y * axis.y) + 
                   Math.abs(halfExtents.z * axis.z);

    return {
      min: centerProjection - extent,
      max: centerProjection + extent
    };
  }

  // 球vs球衝突判定（補助的機能）
  checkSphereCollision(
    sphere1: { center: THREE.Vector3; radius: number },
    sphere2: { center: THREE.Vector3; radius: number }
  ): { penetration: number; normal: THREE.Vector3; contactPoint: THREE.Vector3 } | null {
    const distance = sphere1.center.distanceTo(sphere2.center);
    const radiusSum = sphere1.radius + sphere2.radius;

    if (distance < radiusSum) {
      const penetration = radiusSum - distance;
      const normal = sphere2.center.clone().sub(sphere1.center).normalize();
      const contactPoint = sphere1.center.clone().add(
        normal.clone().multiplyScalar(sphere1.radius)
      );

      return { penetration, normal, contactPoint };
    }

    return null;
  }

  // 点がボックス内にあるかチェック
  isPointInBox(point: THREE.Vector3, box: CollisionBox3D): boolean {
    const localPoint = point.clone().sub(box.center);
    const halfExtents = box.size.clone().multiplyScalar(0.5);

    return Math.abs(localPoint.x) <= halfExtents.x &&
           Math.abs(localPoint.y) <= halfExtents.y &&
           Math.abs(localPoint.z) <= halfExtents.z;
  }

  // レイキャスティング
  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = Infinity): {
    object: CollisionBox3D;
    distance: number;
    point: THREE.Vector3;
  } | null {
    let closestHit: {
      object: CollisionBox3D;
      distance: number;
      point: THREE.Vector3;
    } | null = null;

    this.collisionBodies.forEach((box) => {
      const hit = this.rayBoxIntersection(origin, direction, box);
      if (hit && hit.distance <= maxDistance) {
        if (!closestHit || hit.distance < closestHit.distance) {
          closestHit = hit;
        }
      }
    });

    return closestHit;
  }

  // レイとボックスの交差判定
  private rayBoxIntersection(origin: THREE.Vector3, direction: THREE.Vector3, box: CollisionBox3D): {
    object: CollisionBox3D;
    distance: number;
    point: THREE.Vector3;
  } | null {
    const boxMin = box.center.clone().sub(box.size.clone().multiplyScalar(0.5));
    const boxMax = box.center.clone().add(box.size.clone().multiplyScalar(0.5));

    const invDir = new THREE.Vector3(1 / direction.x, 1 / direction.y, 1 / direction.z);

    const t1 = (boxMin.x - origin.x) * invDir.x;
    const t2 = (boxMax.x - origin.x) * invDir.x;
    const t3 = (boxMin.y - origin.y) * invDir.y;
    const t4 = (boxMax.y - origin.y) * invDir.y;
    const t5 = (boxMin.z - origin.z) * invDir.z;
    const t6 = (boxMax.z - origin.z) * invDir.z;

    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (tmax < 0 || tmin > tmax) {
      return null;
    }

    const distance = tmin > 0 ? tmin : tmax;
    const point = origin.clone().add(direction.clone().multiplyScalar(distance));

    return {
      object: box,
      distance: distance,
      point: point
    };
  }

  // オブジェクトの削除
  removeObject(id: string): void {
    this.collisionBodies.delete(id);
    this.akashicSystem.removeBody(id);
  }

  // 全オブジェクトの取得
  getAllObjects(): Map<string, CollisionBox3D> {
    return new Map(this.collisionBodies);
  }

  // 統計情報の取得
  getStats(): { objectCount: number; collisionCount: number } {
    const akashicStats = this.akashicSystem.getStats();
    return {
      objectCount: this.collisionBodies.size,
      collisionCount: akashicStats.collisionCount
    };
  }
}