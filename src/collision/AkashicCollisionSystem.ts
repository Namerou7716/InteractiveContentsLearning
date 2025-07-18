// src/collision/AkashicCollisionSystem.ts
import * as co from '@akashic-extension/collision-js';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  id1: string;
  id2: string;
  body1: AABB;
  body2: AABB;
  overlap: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class AkashicCollisionSystem {
  private bodies: Map<string, AABB> = new Map();
  private collisionResults: CollisionResult[] = [];

  // AABBの作成
  createAABB(id: string, x: number, y: number, width: number, height: number): void {
    const aabb: AABB = {
      x: x,
      y: y,
      width: width,
      height: height
    };
    this.bodies.set(id, aabb);
  }

  // 衝突判定の実行
  checkCollisions(): CollisionResult[] {
    this.collisionResults = [];
    const bodyIds = Array.from(this.bodies.keys());

    for (let i = 0; i < bodyIds.length; i++) {
      for (let j = i + 1; j < bodyIds.length; j++) {
        const id1 = bodyIds[i];
        const id2 = bodyIds[j];
        const body1 = this.bodies.get(id1)!;
        const body2 = this.bodies.get(id2)!;

        // AABB vs AABB衝突判定
        const overlap = this.checkAABBCollision(body1, body2);
        if (overlap) {
          this.collisionResults.push({
            id1: id1,
            id2: id2,
            body1: body1,
            body2: body2,
            overlap: overlap
          });
        }
      }
    }

    return this.collisionResults;
  }

  // AABB衝突判定
  private checkAABBCollision(aabb1: AABB, aabb2: AABB): { x: number; y: number; width: number; height: number } | null {
    const overlapX = Math.max(0, Math.min(aabb1.x + aabb1.width, aabb2.x + aabb2.width) - Math.max(aabb1.x, aabb2.x));
    const overlapY = Math.max(0, Math.min(aabb1.y + aabb1.height, aabb2.y + aabb2.height) - Math.max(aabb1.y, aabb2.y));

    if (overlapX > 0 && overlapY > 0) {
      return {
        x: Math.max(aabb1.x, aabb2.x),
        y: Math.max(aabb1.y, aabb2.y),
        width: overlapX,
        height: overlapY
      };
    }

    return null;
  }

  // ボディの更新
  updateBody(id: string, x: number, y: number): void {
    const body = this.bodies.get(id);
    if (body) {
      body.x = x;
      body.y = y;
    }
  }

  // ボディのサイズ更新
  updateBodySize(id: string, width: number, height: number): void {
    const body = this.bodies.get(id);
    if (body) {
      body.width = width;
      body.height = height;
    }
  }

  // ボディの取得
  getBody(id: string): AABB | undefined {
    return this.bodies.get(id);
  }

  // ボディの削除
  removeBody(id: string): void {
    this.bodies.delete(id);
  }

  // 全ボディの取得
  getAllBodies(): Map<string, AABB> {
    return new Map(this.bodies);
  }

  // 統計情報の取得
  getStats(): { bodyCount: number; collisionCount: number } {
    return {
      bodyCount: this.bodies.size,
      collisionCount: this.collisionResults.length
    };
  }
}