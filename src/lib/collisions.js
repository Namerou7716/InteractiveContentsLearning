// Source: https://github.com/Calebsor/collisions
// This is a simple 2D collision detection library, modified for this tutorial.

class Collisions {
  constructor() {
    this._last_result = null;
    this._potentials = [];
    this._system = [];
    this.results = [];
  }

  createCircle(x, y, radius) {
    const body = {
      x: x,
      y: y,
      radius: radius,
      type: 'circle',
      collides: (potential) => {
        const result = this.check(this, potential);
        if (result) {
          this.results.push(result);
        }
        return result;
      },
      potentials: () => {
        return this._potentials.filter(potential => potential !== this);
      }
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
      collides: (potential) => {
        const result = this.check(this, potential);
        if (result) {
          this.results.push(result);
        }
        return result;
      },
      potentials: () => {
        return this._potentials.filter(potential => potential !== this);
      }
    };
    this._system.push(body);
    return body;
  }

  update() {
    this.results = [];
    const bodies = this._system;
    const length = bodies.length;

    for (let i = 0; i < length; i++) {
      const body1 = bodies[i];
      for (let j = i + 1; j < length; j++) {
        const body2 = bodies[j];
        this.check(body1, body2);
      }
    }
  }

  check(body, target) {
    if (body.type === 'circle' && target.type === 'circle') {
      return this.checkCircleCircle(body, target);
    }
    if (body.type === 'polygon' && target.type === 'polygon') {
      return this.checkPolygonPolygon(body, target);
    }
    if (body.type === 'circle' && target.type === 'polygon') {
      return this.checkCirclePolygon(body, target);
    }
    if (body.type === 'polygon' && target.type === 'circle') {
      return this.checkCirclePolygon(target, body);
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
      const overlap_x = (difference_x / distance) * overlap;
      const overlap_y = (difference_y / distance) * overlap;

      const result = {
        collided: true,
        body: body,
        target: target,
        overlap: overlap,
        overlap_v: { x: overlap_x, y: overlap_y },
      };
      this._last_result = result;
      this.results.push(result);
      return result;
    }
    return false;
  }

  checkPolygonPolygon(body, target) {
    // This check is simplified and may not provide accurate collision response.
    // For this tutorial, we will focus on circle-to-circle collisions.
    return false;
  }

  checkCirclePolygon(circle, polygon) {
    // This check is simplified and may not provide accurate collision response.
    // For this tutorial, we will focus on circle-to-circle collisions.
    return false;
  }
}

export { Collisions };