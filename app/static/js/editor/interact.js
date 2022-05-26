import point from './point.js';
import Canvas from './canvas.js';

// Drag distances below this are considered
// a click, i.e. to add a point.
// Distances above are considered a drag/pan movement.
const DRAG_DELTA_THRESHOLD = 10;

// Zoom sensitivity
const ZOOM_SENSITIVITY = 500;

// A canvas that supports zooming and panning
class InteractCanvas extends Canvas {
  constructor(stage) {
    super(stage);

    this.scale = 1;
    this.panEnabled = false;
    this.isDragging = false;

    // Mouse position within the canvas element
    this.mousePos = { x: 0, y: 0 };
    this.viewportTopLeft = { x: 0, y: 0 };

    this.el.addEventListener('mousedown', this.startDrag.bind(this));
    this.el.addEventListener('mouseup', this.stopDrag.bind(this));
    this.el.addEventListener('mousemove', this.drag.bind(this));
    this.el.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const zoom = 1 - ev.deltaY / ZOOM_SENSITIVITY;
      this.zoom(Math.max(0.01, zoom)); // Prevent negative zooms
    });
    document.body.addEventListener('keydown', (ev) => {
      if (ev.key == ' ') this.panEnabled = true;
    });
    document.body.addEventListener('keyup', (ev) => {
      if (ev.key == ' ') this.panEnabled = false;
    });
  }

  startDrag(ev) {
    this.isDragging = true;
    this.mousePos = this.mouseToCanvasPoint(ev);
    this.clickStart = { x: ev.pageX, y: ev.pageY };
  }

  drag(ev) {
    if (!this.isDragging) return;

    let mousePos = this.mouseToCanvasPoint(ev);
    const diff = point.sub(mousePos, this.mousePos);
    const delta = point.scale(diff, this.scale);
    this.mousePos = mousePos;

    if (this.onDrag(delta) && this.panEnabled) {
      this.translate(delta);
    }
    this.render();
  }

  stopDrag(ev) {
    this.isDragging = false;

    // Check if this was a click (as opposed to a drag)
    const deltaX = Math.abs(ev.pageX - this.clickStart.x);
    const deltaY = Math.abs(ev.pageY - this.clickStart.y);
    if (deltaX < DRAG_DELTA_THRESHOLD && deltaY < DRAG_DELTA_THRESHOLD) {
      this.handleClick(ev);
    }
  }

  onDrag(ev) {
    // Implement in subclasses
    return true;
  }

  handleClick(ev) {
    // Implement in subclasses
  }

  // Zoom the canvas in/out
  zoom(zoom) {
    const viewportTopLeftDelta = {
      x: (this.mousePos.x / this.scale) * (1 - 1 / zoom),
      y: (this.mousePos.y / this.scale) * (1 - 1 / zoom)
    };
    const newViewportTopLeft = point.add(
      this.viewportTopLeft,
      viewportTopLeftDelta
    );

    // Juggle translation so that we zoom into where the cursor is
    this.ctx.translate(this.viewportTopLeft.x, this.viewportTopLeft.y);
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(-newViewportTopLeft.x, -newViewportTopLeft.y);

    this.viewportTopLeft = newViewportTopLeft;
    this.scale = this.scale * zoom;
    this.render();
  }

  translate(delta) {
    this.ctx.translate(delta.x, delta.y);
    this.viewportTopLeft = point.sub(this.viewportTopLeft, delta);
  }

  // Convert a mouse point to position relative to
  // canvas element's top-left corner
  mouseToCanvasPoint(ev) {
    const viewportMousePos = { x: ev.clientX, y: ev.clientY };
    const topLeftCanvasPos = {
      x: this.el.offsetLeft,
      y: this.el.offsetTop
    };
    return point.sub(viewportMousePos, topLeftCanvasPos);
  }

  // Convert a mouse point to transformed canvas space (the context)
  mouseToCtxPoint(ev) {
    const transform = this.getTransform();
    const rect = this.el.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left - transform.offset.x)/transform.scale.x,
      y: (ev.clientY - rect.top - transform.offset.y)/transform.scale.y
    }
  }
}

export default InteractCanvas;
