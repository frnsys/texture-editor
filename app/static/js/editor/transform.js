import point from './point.js';

export function transform(size, theta) {
  const [w, h] = size;
  const bbox = [
    point.rotate({x: 0, y: 0}, theta),
    point.rotate({x: w, y: 0}, theta),
    point.rotate({x: w, y: h}, theta),
    point.rotate({x: 0, y: h}, theta),
  ];
  const xs = bbox.map((pt) => pt.x)
  const ys = bbox.map((pt) => pt.y)
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const canvasW = maxX - minX;
  const canvasH = maxY - minY;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  const pos = [canvas.width/2 - w/2, canvas.height/2 - h/2];

  // Debugging: show canvas
  // ctx.beginPath();
  // ctx.rect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = '#ffffff';
  // ctx.fill();
  // ctx.closePath();

  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(theta);
  ctx.translate(-canvas.width/2, -canvas.height/2);

  // Debugging: show full box
  // ctx.beginPath();
  // ctx.rect(pos[0], pos[1], w, h);
  // ctx.fillStyle = '#ff0000';
  // ctx.fill();
  // ctx.closePath();
  return {canvas, ctx, pos}
}

export function transformRect(size, theta, lineWidth=1) {
  let [w, h] = size;
  const {canvas, ctx, pos} = transform(size, theta);
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = '#11bf70';
  ctx.rect(pos[0], pos[1], w, h);
  ctx.stroke();
  ctx.closePath();
  return canvas;
}

// Rotate and scale an image
export function transformImage(img, size, theta) {
  let [w, h] = size;
  const {canvas, ctx, pos} = transform(size, theta);
  ctx.drawImage(img, pos[0], pos[1], w, h);
  return canvas;
}

// Calculate unrotated origin,
// then use that to determine the position
// of the rotated version, such that the center
// anchor position remains consistent.
export function adjustedClipPos(clip, newImg) {
  const [x, y] = clip.pos;
  const [w, h] = clip.size;
  const origin = {
    x: x + w/2,
    y: y + h/2,
  };
  return {
    x: origin.x - newImg.width/2,
    y: origin.y - newImg.height/2,
  }
}

