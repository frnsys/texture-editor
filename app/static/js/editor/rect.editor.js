// Editor for adjusting a rectangular selection;
// i.e. for selecting a seamless texture source

import point from './point.js';
import ActionStack from './action_stack.js';
import InteractCanvas from './interact.js';
import {transform, adjustedClipPos} from './transform.js';

// See https://en.wikipedia.org/wiki/Heron's_formula
function triangleArea(d1, d2, d3) {
	var s = (d1 + d2 + d3) / 2;
	return Math.sqrt(s * (s - d1) * (s - d2) * (s - d3));
}

function makeRect(size, theta, edgeSize, fadeSize) {
  let [w, h] = size;

  // Create a separate canvas to draw onto,
  // which we then can rotate
  let rectCanvas = document.createElement('canvas');
  rectCanvas.width = w;
  rectCanvas.height = h;
  let rectCtx = rectCanvas.getContext("2d");

  // Show edge sizes
  // We blend the right and bottom edge
  rectCtx.beginPath();
  rectCtx.fillStyle = '#5EBA7D22'
  rectCtx.rect(w - edgeSize, 0, edgeSize, h);
  rectCtx.rect(0, h - edgeSize, w, edgeSize);
  rectCtx.fill();
  rectCtx.closePath();

  // Show fade sizes
  rectCtx.beginPath();
  rectCtx.fillStyle = '#5EBA7D22'
  rectCtx.rect(w - edgeSize, 0, fadeSize, h);
  rectCtx.rect(0, h - edgeSize, w, fadeSize);
  rectCtx.fill();
  rectCtx.closePath();

  rectCtx.beginPath();
  rectCtx.lineWidth = 8;
  rectCtx.strokeStyle = '#11bf70';
  rectCtx.rect(0, 0, w, h);
  rectCtx.stroke();
  rectCtx.closePath();

  // Create the transformed canvas and draw the rect onto it
  const {canvas, ctx, pos} = transform(size, theta);
  ctx.drawImage(rectCanvas, pos[0], pos[1]);

  // Return the transformed canvas
  return canvas;
}

class RectEditorCanvas extends InteractCanvas {
  constructor(stage) {
    super(stage);

    this.rect = {
      pos: [0, 0],
      size: [200, 200],
      rot: 0,
    }
    this.edgeSize = 200;
    this._fadeSize = 1.0;

    // Undo/Redo
    this.actionStack = new ActionStack({
      'MoveRect': {
        undo: (action) => {
          this.rect.pos[0] -= action.delta.x;
          this.rect.pos[1] -= action.delta.y;
        },
        redo: (action) => {
          this.rect.pos[0] += action.delta.x;
          this.rect.pos[1] += action.delta.y;
        }
      },
      'RotateRect': {
        undo: (action) => {
          this.rect.rot -= action.delta;
        },
        redo: (action) => {
          this.rect.rot += action.delta;
        }
      },
      'ScaleRect': {
        undo: (action) => {
          this.rect.size[0] /= action.delta;
          this.rect.size[1] /= action.delta;
        },
        redo: (action) => {
          this.rect.size[0] *= action.delta;
          this.rect.size[1] *= action.delta;
        }
      },
      'ResizeRect': {
        undo: (action) => {
          if (action.dir == 'width') {
            this.rect.size[0] -= action.delta;
            this.rect.pos[0] += action.delta/2;
          } else {
            this.rect.size[1] -= action.delta;
            this.rect.pos[1] += action.delta/2;
          }
        },
        redo: (action) => {
          if (action.dir == 'width') {
            this.rect.size[0] += action.delta;
            this.rect.pos[0] -= action.delta/2;
          } else {
            this.rect.size[1] += action.delta;
            this.rect.pos[1] -= action.delta/2;
          }
        }
      }
    }, () => {
      this.render();
    });

    // Ctrl+drag is rotate
    // Alt+drag is scale
    this.altKey = false;
    this.ctrlKey = false;
    this.shiftKey = false;
    document.body.addEventListener('keydown', (ev) => {
      if (ev.altKey) this.altKey = true;
      if (ev.ctrlKey) this.ctrlKey = true;
      if (ev.shiftKey) this.shiftKey = true;
    });
    document.body.addEventListener('keyup', (ev) => {
      if (!ev.ctrlKey) this.ctrlKey = false;
      if (!ev.altKey) this.altKey = false;
      if (!ev.shiftKey) this.shiftKey = false;
    });

    this.rectSelected = false;
    this.el.addEventListener('mousedown', (ev) => {
      let point = this.mouseToCtxPoint(ev);
      this.rectSelected = this.inRect(point);
    });
    // Listen on document body in case the cursor
    // is dragged out of the canvas area.
    document.body.addEventListener('mouseup', () => {
      this.rectSelected = false;
    });
  }

  // Detect click in rect, robust to rotations
  // https://joshuawoehlke.com/detecting-clicks-rotated-rectangles/
  inRect(clickPt) {
    let [x, y] = this.rect.pos;
    let [w, h] = this.rect.size;

    const center = {x: x+w/2, y:y+h/2};
    const verts = [
      {x, y},
      {x: x+w, y},
      {x: x+w, y: y+h},
      {x, y: y+h},
    ].map((pt) => {
      return point.rotate(pt, this.rect.rot, center);
    });

    const LT = verts[0];
    const RT = verts[1];
    const RB = verts[2];
    const LB = verts[3];

    const subTriAreas = [
      // Click, LT, RT
      triangleArea(
        point.dist(clickPt, LT),
        point.dist(LT, RT),
        point.dist(RT, clickPt)
      ),
      // clickPt, RT, RB
      triangleArea(
        point.dist(clickPt, RT),
        point.dist(RT, RB),
        point.dist(RB, clickPt)
      ),
      // clickPt, RB, LB
      triangleArea(
        point.dist(clickPt, RB),
        point.dist(RB, LB),
        point.dist(LB, clickPt)
      ),
      // clickPt, LB, LT
      triangleArea(
        point.dist(clickPt, LB),
        point.dist(LB, LT),
        point.dist(LT, clickPt)
      )
    ];

    const triArea = Math.round(subTriAreas.reduce(function(a,b) { return a + b; }, 0));

    const rectArea = Math.round(w * h);
    return triArea <= rectArea;
  }

  onDrag(delta) {
    if (this.rectSelected) {
      if (this.shiftKey && this.ctrlKey && this.altKey) {
        const d = 1 + delta.y/100;
        this.actionStack.exec('ScaleRect', {
          delta: d
        });
      } else if (this.ctrlKey && this.altKey) {
        this.actionStack.exec('ResizeRect', {
          dir: 'height',
          delta: delta.y,
        });
      } else if (this.ctrlKey) {
        this.actionStack.exec('RotateRect', {
          delta: delta.y/200,
        });
      } else if (this.altKey) {
        this.actionStack.exec('ResizeRect', {
          dir: 'width',
          delta: delta.x,
        });
      } else {
        this.actionStack.exec('MoveRect', {
          delta,
        });
      }
      return false;
    } else {
      return true;
    }
  }

  setEdgeSize(val) {
    this.edgeSize = val;
    this.render();
  }

  setFadeSize(val) {
    this._fadeSize = val;
    this.render();
  }

  set fadeSize(val) {
    this._fadeSize = val/this.edgeSize/0.25;
  }

  get fadeSize() {
    // Fade sizes larger than this will wipe out the entire edge
    return Math.round(this.edgeSize * this._fadeSize * 0.25);
  }

  setImage(img) {
    this.image = img;
    // Start image centered and scaled
    let zoom = Math.min(this.width/img.width, this.height/img.height);
    let scaledWidth = img.width * zoom;
    let scaledHeight = img.height * zoom;

    let delta = {
      x: (this.width/2 - scaledWidth/2)/zoom,
      y: (this.height/2 - scaledHeight/2)/zoom,
    };
    this.translate(delta);

    this.zoom(zoom);

    let size = [img.width/2, img.height/2];
    this.rect = {
      pos: [img.width/2-size[0]/2, img.height/2-size[1]/2],
      size,
      rot: 0,
    }

    this.render();
  }

  render() {
    super.render();

    if (this.image) {
      this.ctx.drawImage(this.image, 0, 0);
    }

    const rect = makeRect(this.rect.size, this.rect.rot, this.edgeSize, this.fadeSize);
    const adjustedPos = adjustedClipPos(this.rect, rect);
    this.ctx.drawImage(rect, adjustedPos.x, adjustedPos.y);
  }
}

export default RectEditorCanvas;
