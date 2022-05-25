const point = {
  add(p1, p2) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
  },

  sub(p1, p2) {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
  },

  scale(p, scale) {
    return { x: p.x/scale, y: p.y/scale };
  },

  dist(p1, p2) {
    let pt = point.sub(p2, p1);
    return Math.sqrt(pt.x**2 + pt.y**2);
  },

  rotate(p, theta, origin={x:0 ,y:0}) {
    return {
      x: origin.x+(p.x-origin.x)*Math.cos(theta)-(p.y-origin.y)*Math.sin(theta),
      y: origin.y-(p.x-origin.x)*Math.sin(theta)+(p.y-origin.y)*Math.cos(theta)
    }
  }
}

export default point;
