import Canvas from './canvas.js';

// TODO
// - undo point
// - clear points
// - move point
// - insert point
// - delete point

const ZOOM_SENSITIVITY = 500;

function addPoints(p1, p2) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function diffPoints(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function scalePoint(p1, scale) {
  return { x: p1.x / scale, y: p1.y / scale };
}

function dist(p1, p2) {
  let x = p2.x - p1.x;
  let y = p2.y - p1.y;
  return Math.sqrt(x**2 + y**2);
}

class EditorCanvas extends Canvas {
  constructor(stage) {
    super(stage)

    this.points = [];

    this.scale = 1;
    this.isDragging = false;
    this.offset = { x: 0, y: 0 };
    this.mousePos = { x: 0, y: 0 };
    this.lastMousePosRef = { x: 0, y: 0 };
    this.viewportTopLeft = { x: 0, y: 0 };
    this.el.addEventListener('mousedown', (ev) => {
      this.isDragging = true;
      this.lastMousePosRef = { x: ev.pageX, y: ev.pageY };
      this.clickStart = { x: ev.pageX, y: ev.pageY };
      let point = this.mouseToPoint(ev);
      let closest = closestPoint(point, 10);
      this.selectedPoint = closest;
    });
    this.selectedPoint = null;

    this.undoStack = [];
    this.redoStack = [];
    document.body.addEventListener('keyup', (ev) => {
      // Redo
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

      // Undo
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
    });

    const closestPoint = (target, radius) => {
      return this.points.find((pt) => dist(target, pt) <= radius);
    };

    const closestEdge = (target, radius) => {
      return this.points.findIndex((pt, i) => {
        if (i == this.points.length - 1) {
          return false;
        } else {
          let nextPt = this.points[i+1];
          let m1 = (nextPt.y - pt.y)/(nextPt.x - pt.x);
          let m2 = -1/m1;
          let x = (m1*pt.x-m2*target.x+target.y-pt.y) / (m1-m2)
          let y = m2*(x-target.x)+target.y
          return dist(target, {x, y}) <= radius;
        }
      });
    };

    this.el.addEventListener('mouseup', (ev) => {
      this.isDragging = false;
      const delta = 0.5; // drag threshold to determine if clicking and adding a point or panning
      const diffX = Math.abs(ev.pageX - this.clickStart.x);
      const diffY = Math.abs(ev.pageY - this.clickStart.y);
      if (diffX < delta && diffY < delta) {
        let point = this.mouseToPoint(ev);

        // Ignore if just selecting a point
        if (closestPoint(point, 10)) {
          this.render();
          return;
        }

        // If clicked point is near existing point, select that point
        var closest = closestEdge(point, 10);
        if (closest >= 0) {
          let idx = closest+1;
          this.points.splice(idx, 0, point);
          this.selectedPoint = point;
          this.pushUndo({
            type: 'AddPoint',
            idx,
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
    });

    this.el.addEventListener('mousemove', (ev) => {
      const viewportMousePos = { x: ev.clientX, y: ev.clientY };
      const topLeftCanvasPos = {
        x: this.el.offsetLeft,
        y: this.el.offsetTop
      };
      this.mousePos = diffPoints(viewportMousePos, topLeftCanvasPos);

      if (this.isDragging) {
        const currentMousePos = { x: ev.pageX, y: ev.pageY }; // use document so can pan off element
        const mouseDiff = diffPoints(currentMousePos, this.lastMousePosRef);
        this.lastMousePosRef = currentMousePos;
        var lastOffset = this.offset;
        this.offset = addPoints(this.offset, mouseDiff);

        const offsetDiff = scalePoint(
          diffPoints(this.offset, lastOffset),
          this.scale
        );

        if (!this.selectedPoint) {
          this.ctx.translate(offsetDiff.x, offsetDiff.y);
          this.viewportTopLeft = diffPoints(this.viewportTopLeft, offsetDiff);
        } else {
          this.selectedPoint.x += offsetDiff.x;
          this.selectedPoint.y += offsetDiff.y;
        }
        this.render();
      }
    });
    this.el.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const zoom = 1 - ev.deltaY / ZOOM_SENSITIVITY;
      const viewportTopLeftDelta = {
        x: (this.mousePos.x / this.scale) * (1 - 1 / zoom),
        y: (this.mousePos.y / this.scale) * (1 - 1 / zoom)
      };
      const newViewportTopLeft = addPoints(
        this.viewportTopLeft,
        viewportTopLeftDelta
      );

      this.ctx.translate(this.viewportTopLeft.x, this.viewportTopLeft.y);
      this.ctx.scale(zoom, zoom);
      this.ctx.translate(-newViewportTopLeft.x, -newViewportTopLeft.y);

      this.viewportTopLeft = newViewportTopLeft;
      this.scale = this.scale * zoom;
      this.render();
    });
  }

  mouseToPoint(ev) {
    const viewportMousePos = { x: ev.clientX, y: ev.clientY };
    const topLeftCanvasPos = {
      x: this.el.offsetLeft,
      y: this.el.offsetTop
    };
    let pos = diffPoints(viewportMousePos, topLeftCanvasPos);
    return {
      x: pos.x - this.offset.x,
      y: pos.y - this.offset.y,
    };
  }

  pushUndo(action) {
    this.redoStack = [];
    this.undoStack.push(action);
  }

  resetPoints(points) {
    this.points = points;
    this.undoStack = [];
    this.redoStack = [];
  }

  render() {
    super.render();
    if (this.points.length > 0) {
      // Draw lines
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
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
      this.points.forEach((point, i) => {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        if (point == this.selectedPoint) {
          this.ctx.lineWidth = 5;
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
