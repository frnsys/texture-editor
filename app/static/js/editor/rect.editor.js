// Editor for adjusting a rectangular selection;
// i.e. for selecting a seamless texture source

import ActionStack from './action_stack.js';
import InteractCanvas from './interact.js';
import {transform, adjustedClipPos} from './transform.js';

export function transformRect(size, theta, edgeSize, fadeSize) {
  let [w, h] = size;

  // TODO clean this up
  let fcanvas = document.createElement('canvas');
  fcanvas.width = w;
  fcanvas.height = h;
  let fctx = fcanvas.getContext("2d");

  // Show edge sizes
  // We blend the right and bottom edge
  fctx.beginPath();
  fctx.fillStyle = '#5EBA7D22'
  fctx.rect(w - edgeSize, 0, edgeSize, h);
  fctx.rect(0, h - edgeSize, w, edgeSize);
  fctx.fill();
  fctx.closePath();

  // Show fade sizes
  fctx.beginPath();
  fctx.fillStyle = '#5EBA7D22'
  fctx.rect(w - edgeSize, 0, fadeSize, h);
  fctx.rect(0, h - edgeSize, w, fadeSize);
  fctx.fill();
  fctx.closePath();

  fctx.beginPath();
  fctx.lineWidth = 8;
  fctx.strokeStyle = '#11bf70';
  fctx.rect(0, 0, w, h);
  fctx.stroke();
  fctx.closePath();

  const {canvas, ctx, pos} = transform(size, theta);

  ctx.drawImage(fcanvas, pos[0], pos[1]);

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
          } else {
            this.rect.size[1] -= action.delta;
          }
        },
        redo: (action) => {
          if (action.dir == 'width') {
            this.rect.size[0] += action.delta;
          } else {
            this.rect.size[1] += action.delta;
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
  }

  onDrag(delta) {
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
        delta: delta.y/1000,
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

    const rect = transformRect(this.rect.size, this.rect.rot, this.edgeSize, this.fadeSize);
    const adjustedPos = adjustedClipPos(this.rect, rect);
    this.ctx.drawImage(rect, adjustedPos.x, adjustedPos.y);
  }
}

export default RectEditorCanvas;
