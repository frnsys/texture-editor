const dpr = window.devicePixelRatio || 1;

// Convenience wrapper around a canvas element/context
class Canvas {
  constructor(stage) {
    this.stage = stage;
    this.width = this.stage.clientWidth;
    this.height = this.stage.clientHeight;

    this.el = document.createElement('canvas');
    this.ctx = this.el.getContext('2d');
    this.setSize();
    this.stage.appendChild(this.el);

    window.addEventListener('resize', () => {
      this.setSize();
      this.render();
    });
  }

  setSize() {
    this.width = this.stage.clientWidth;
    this.height = this.stage.clientHeight;
    this.el.width = this.width * dpr;
    this.el.height = this.height * dpr;
    this.el.style.width = `${this.width}px`;
    this.el.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  setImage(img) {
    this.image = img;
    this.render();
  }

  render() {
    this.ctx.save();
    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
    if (this.image) {
      this.ctx.drawImage(this.image, 0, 0);
    }
  }
}

export default Canvas;
