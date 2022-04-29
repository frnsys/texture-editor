import point from './point.js';
import Canvas from './canvas.js';

// Drag distances below this are considered
// a click, i.e. to add a point.
// Distances above are considered a drag/pan movement.
const DRAG_DELTA_THRESHOLD = 5;

// Zoom sensitivity
const ZOOM_SENSITIVITY = 500;

// A canvas that supports zooming and panning
class InteractCanvas extends Canvas {
  constructor(stage) {
    super(stage);

    this.scale = 1;
    this.isDragging = false;
    this.mousePagePos = { x: 0, y: 0 };
    this.mouseCanvasPos = { x: 0, y: 0 };
    this.viewportTopLeft = { x: 0, y: 0 };

    this.el.addEventListener('mousedown', this.startDrag.bind(this));
    this.el.addEventListener('mouseup', this.stopDrag.bind(this));
    this.el.addEventListener('mousemove', this.drag.bind(this));
    this.el.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const zoom = 1 - ev.deltaY / ZOOM_SENSITIVITY;
      this.zoom(zoom);
    });
  }

  startDrag(ev) {
    this.isDragging = true;
    this.mousePagePos = { x: ev.pageX, y: ev.pageY };
    this.clickStart = { x: ev.pageX, y: ev.pageY };
  }

  drag(ev) {
    const viewportMousePos = { x: ev.clientX, y: ev.clientY };
    const topLeftCanvasPos = {
      x: this.el.offsetLeft,
      y: this.el.offsetTop
    };
    this.mouseCanvasPos = point.sub(viewportMousePos, topLeftCanvasPos);

    if (!this.isDragging) return;

    // Use document so can pan off element
    const currentMousePos = { x: ev.pageX, y: ev.pageY };
    const mouseDiff = point.sub(currentMousePos, this.mousePagePos);
    this.mousePagePos = currentMousePos;
    const delta = point.scale(mouseDiff, this.scale);

    if (this.onDrag(delta)) {
      this.ctx.translate(delta.x, delta.y);
      this.viewportTopLeft = point.sub(this.viewportTopLeft, delta);
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
      x: (this.mouseCanvasPos.x / this.scale) * (1 - 1 / zoom),
      y: (this.mouseCanvasPos.y / this.scale) * (1 - 1 / zoom)
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

  // Convert a mouse point to canvas space
  mouseToPoint(ev) {
    const transform = this.getTransform();
    return {
      x: (ev.clientX - this.el.offsetLeft - transform.offset.x)/transform.scale.x,
      y: (ev.clientY - this.el.offsetTop - transform.offset.y)/transform.scale.y
    }
  }
}

export default InteractCanvas;
