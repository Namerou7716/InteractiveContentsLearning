declare module '*/lib/collisions.js' {
  export class Collisions {
    constructor();
    results: any[];
    createCircle(x: number, y: number, radius: number): any;
    createPolygon(x: number, y: number, points: number[][]): any;
    update(): void;
  }
}