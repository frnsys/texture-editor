import point from './point.js';
import InteractCanvas from './interact.js';

// Radius in which we consider a
// polygon point to be clicked/selected
const POINT_DETECTION_RADIUS = 10;

// Radius in which we consider a
// polygon edge to be clicked/selected
const EDGE_DETECTION_RADIUS = 5;

class EditorCanvas extends InteractCanvas {
  constructor(stage) {
    super(stage);

    // Clipping polygon points
    this.points = [];

    // Currently selected point
    this.selectedPoint = null;

    // Undo/Redo
    this.undoStack = [];
    this.redoStack = [];

    this.el.addEventListener('mousedown', (ev) => {
      // Try selecting a point
      let point = this.mouseToCtxPoint(ev);
      let closest = this.closestPoint(point);
      this.selectedPoint = closest;
    });

    document.body.addEventListener('keyup', this.handleKey.bind(this));
  }

  onDrag(delta) {
    // Move the selected point
    // We don't want to re-assign the point,
    // because it's referenced elsewhere,
    // so we just modify its values.
    if (this.selectedPoint) {
      this.selectedPoint.x += delta.x;
      this.selectedPoint.y += delta.y;
      return false;
    } else {
      return true;
    }
  }

  // Handle a click, i.e. add a point
  handleClick(ev) {
    let point = this.mouseToCtxPoint(ev);

    // Ignore if just selecting a point
    if (this.closestPoint(point)) {
      this.render();
      return;
    }

    var closest = this.closestEdge(point);
    if (closest) {
      this.points.splice(closest, 0, point);
      this.selectedPoint = point;
      this.pushUndo({
        type: 'AddPoint',
        idx: closest,
        point,
      });
    } else {
      this.points.push(point);
      this.pushUndo({
        type: 'AddPoint',
        point,
      });
      this.selectedPoint = point;
    }
    this.render();
  }

  // Find the closest polygon point to the provided target point
  closestPoint(target) {
    return this.points.find((pt) => point.dist(target, pt) <= POINT_DETECTION_RADIUS/this.scale);
  };

  // Find the closest polygon edge to the provided target point.
  // Returns the index of of where to insert into `this.points`
  closestEdge(target) {
    let idx = this.points.findIndex((pt, i) => {
      if (i == this.points.length - 1) {
        return false;
      } else {
        let nextPt = this.points[i+1];

        // First check that the target is roughly
        // w/in this edge's bounding box.
        let lo_x = Math.min(nextPt.x, pt.x);
        let hi_x = Math.max(nextPt.x, pt.x);
        let lo_y = Math.min(nextPt.y, pt.y);
        let hi_y = Math.max(nextPt.y, pt.y);
        if ((lo_x <= target.x && target.x <= hi_x)
          || (lo_y <= target.y && target.y <= hi_y)) {
          // If so, then get the target's distance to the edge
          let m1 = (nextPt.y - pt.y)/(nextPt.x - pt.x);
          let m2 = -1/m1;
          let x = (m1*pt.x-m2*target.x+target.y-pt.y) / (m1-m2)
          let y = m2*(x-target.x)+target.y
          return point.dist(target, {x, y}) <= EDGE_DETECTION_RADIUS/this.scale;
        } else {
          return false;
        }
      }
    });

    // Adjust index to be the
    // proper position in `this.points`
    if (idx >= 0) {
      return idx + 1;
    } else {
      return null;
    }
  };

  // Add an action to the undo stack.
  // This resets the redo stack.
  pushUndo(action) {
    this.redoStack = [];
    this.undoStack.push(action);
  }

  // Handle key input
  handleKey(ev) {
    // Redo (Ctrl+Shift+Z)
    if (ev.ctrlKey && ev.key == 'Z') {
      let lastAction = this.redoStack.pop();
      if (!lastAction) return;
      switch (lastAction.type) {
        case 'AddPoint': {
          if (lastAction.idx) {
            this.points.splice(lastAction.idx, 0, lastAction.point);
          } else {
            this.points.push(lastAction.point);
          }
          this.undoStack.push(lastAction);
          break;
        }
        case 'DelPoint': {
          this.points.splice(lastAction.idx, 1);
          this.undoStack.push(lastAction);
          break;
        }
      }
      this.render();

    // Undo (Ctrl+Z)
    } else if (ev.ctrlKey && ev.key == 'z') {
      let lastAction = this.undoStack.pop();
      if (!lastAction) return;
      switch (lastAction.type) {
        case 'AddPoint': {
          this.points = this.points.filter((pt) => pt != lastAction.point);
          this.redoStack.push(lastAction);
          break;
        }
        case 'DelPoint': {
          this.points.splice(lastAction.idx, 0, lastAction.point);
          this.redoStack.push(lastAction);
          break;
        }
      }
      this.render();

    // Delete selected point
    } else if (ev.key == 'x' && this.selectedPoint) {
      let idx = this.points.indexOf(this.selectedPoint);
      this.points.splice(idx, 1);
      this.pushUndo({
        type: 'DelPoint',
        idx,
        point: this.selectedPoint
      });
      this.selectedPoint = null;
      this.render();
    }
  }

  // Re-assign points to this canvas and reset its state.
  resetPoints(points) {
    this.points = points;
    this.undoStack = [];
    this.redoStack = [];
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
    this.render();
  }

  render() {
    super.render();

    if (this.image) {
      this.ctx.drawImage(this.image, 0, 0);
    }

    // Render the clipping polygon
    if (this.points.length > 0) {
      // Draw lines
      this.ctx.beginPath();
      this.ctx.lineWidth = 1/this.scale;
      this.ctx.strokeStyle = '#11bf70';
      this.points.forEach(({x, y}, i) => {
        this.ctx.moveTo(x, y);
        let next = this.points[i+1];
        if (next) {
          this.ctx.lineTo(next.x, next.y);
        }
      });
      this.ctx.stroke();
      this.ctx.closePath();

      // Draw closing/joining line
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.moveTo(this.points[this.points.length-1].x, this.points[this.points.length-1].y);
      this.ctx.lineTo(this.points[0].x, this.points[0].y);
      this.ctx.stroke();
      this.ctx.closePath();

      // Draw points
      this.ctx.fillStyle = '#FBE320';
      this.points.forEach((point) => {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2/this.scale, 0, Math.PI * 2);
        if (point == this.selectedPoint) {
          this.ctx.lineWidth = 5/this.scale;
          this.ctx.strokeStyle = '#963ff2';
          this.ctx.stroke();
        }
        this.ctx.fill();
        this.ctx.closePath();
      });
    }
  }
}

export default EditorCanvas;
