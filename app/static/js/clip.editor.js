import API from './api.js';
import El from './el.js';
import PolyEditorCanvas from './editor/poly.editor.js';

const api = new API();

class ClipEditor {
  constructor(source_id, img, parent) {
    this.source_id = source_id;
    this.el = new El({
      ref: 'stage',
      id: 'stage-clip',
    }, parent);
    this.canvas = new PolyEditorCanvas(this.el.$refs.stage);
    this.canvas.setImage(img);
    this.canvas.render();
  }

  show() {
    this.el.$el.style.display = 'flex';
  }

  hide() {
    this.el.$el.style.display = 'none';
  }

  setClip(clip) {
    this.canvas.resetPoints(clip['points'].map(([x, y]) => ({x, y})));
    this.canvas.render();
  }

  async save(id, name) {
    let points = this.canvas.points.map(({x, y}) => [x, y]);
    if (points.length <= 1) return Promise.resolve({err: 'Not enough points'});

    if (id === null) {
      return api.createClip(this.source_id, name, points).then(() => {
        // kinda hacky, refresh to load new clip
        window.location.reload();
      });
    } else {
      return api.updateClip(this.source_id, id, name, points);
    }
  }
}

export default ClipEditor;
