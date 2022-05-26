// Editor for manipulating multiple clips;
// i.e. a pack.

import ActionStack from './action_stack.js';
import InteractCanvas from './interact.js';
import * as transform from './transform.js';

class ClipsEditorCanvas extends InteractCanvas {
  constructor(stage, clips) {
    super(stage);

    // Currently selected clip
    this.selectedClip = null;
    this.clips = clips;

    // Undo/Redo
    this.actionStack = new ActionStack({
      'MoveClip': {
        undo: (action) => {
          action.clip.pos[0] -= action.delta.x;
          action.clip.pos[1] -= action.delta.y;
        },
        redo: (action) => {
          action.clip.pos[0] += action.delta.x;
          action.clip.pos[1] += action.delta.y;
        }
      },
      'RotateClip': {
        undo: (action) => {
          action.clip.rot -= action.delta;
        },
        redo: (action) => {
          action.clip.rot += action.delta;
        }
      },
      'ScaleClip': {
        undo: (action) => {
          action.clip.size[0] /= action.delta;
          action.clip.size[1] /= action.delta;
        },
        redo: (action) => {
          action.clip.size[0] *= action.delta;
          action.clip.size[1] *= action.delta;
        }
      },
      'DeleteClip': {
        undo: (action) => {
          this.clips.splice(action.idx, 0, action.clip);
        },
        redo: (action) => {
          this.clips.splice(action.idx, 1);
        }
      },
      'ChangeClipLayer': {
        undo: (action) => {
          this.clips.splice(action.toIdx, 1);
          this.clips.splice(action.fromIdx, 0, action.clip);
        },
        redo: (action) => {
          this.clips.splice(action.fromIdx, 1);
          this.clips.splice(action.toIdx, 0, action.clip);
        }
      },

    }, () => {
      this.render();
    });

    // Ctrl+drag is rotate
    // Alt+drag is scale
    this.ctrlKey = false;
    this.altKey = false;
    document.body.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey) this.ctrlKey = true;
      if (ev.altKey) this.altKey = true;
    });
    document.body.addEventListener('keyup', (ev) => {
      if (!ev.ctrlKey) this.ctrlKey = false;
      if (!ev.altKey) this.altKey = false;

      if (this.selectedClip) {
        // Delete selected clip
        if (ev.key == 'x') {
          const idx = this.clips.indexOf(this.selectedClip);
          this.actionStack.exec('DeleteClip', {
            idx,
            clip: this.selectedClip
          });

          // Move a layer up/down
        } else if (ev.key == ']') {
          const idx = this.clips.indexOf(this.selectedClip);
          if (idx < this.clips.length - 1) {
            this.actionStack.exec('ChangeClipLayer', {
              clip: this.selectedClip,
              fromIdx: idx,
              toIdx: idx+1,
            });
          }
        } else if (ev.key == '[') {
          const idx = this.clips.indexOf(this.selectedClip);
          if (idx > 0) {
            this.actionStack.exec('ChangeClipLayer', {
              clip: this.selectedClip,
              fromIdx: idx,
              toIdx: idx-1,
            });
          }
        }
      }
    });
  }

  onDrag(delta) {
    if (this.selectedClip) {
      if (this.ctrlKey) {
        this.actionStack.exec('RotateClip', {
          clip: this.selectedClip,
          delta: delta.y/200,
        });
      } else if (this.altKey) {
        const d = 1 + delta.y/100;
        this.actionStack.exec('ScaleClip', {
          clip: this.selectedClip,
          delta: d
        });
      } else {
        this.actionStack.exec('MoveClip', {
          clip: this.selectedClip,
          delta,
        });
      }
      return false;
    } else {
      return true;
    }
  }

  closestClip(point) {
    for (const clip of this.clips) {
      let [x, y] = clip.pos;
      let [w, h] = clip.size;
      if (point.x >= x && point.x <= x + w
        && point.y >= y && point.y <= y + h) {
        return clip;
      }
    }
  }

  handleClick(ev) {
    let point = this.mouseToCtxPoint(ev);
    this.selectedClip = this.closestClip(point);
    this.render();
  }

  // Calculate the total size of the image.
  // (0,0) is always the top-left; so basically we look at the max x+w, and y+h
  // among the clips.
  size() {
    let maxX = 0;
    let maxY = 0;
    this.clips.forEach((clip) => {
      let x = clip.x + clip.w;
      if (x > maxX) maxX = x;
      let y = clip.y + clip.h;
      if (y > maxY) maxY = y;
    });
    return {width: maxX, height: maxY};
  }

  render() {
    super.render();

    this.clips.forEach((clip) => {
      const img = transform.transformImage(clip.image, clip.size, clip.rot);
      const adjustedPos = transform.adjustedClipPos(clip, img);
      this.ctx.drawImage(img, adjustedPos.x, adjustedPos.y);
    });

    // Draw box around selected clip
    if (this.selectedClip) {
      const clip = this.selectedClip;
      const rect = transform.transformRect(clip.size, clip.rot);
      const adjustedPos = transform.adjustedClipPos(clip, rect);
      this.ctx.drawImage(rect, adjustedPos.x, adjustedPos.y);
    }

    // Draw origin
    this.ctx.fillStyle = '#FBE320';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2/this.scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.closePath();
  }
}

export default ClipsEditorCanvas;
