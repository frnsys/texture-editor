import El from './el.js';
import API from './api.js';
import RectEditorCanvas from './editor/rect.editor.js';

const api = new API();

class SurfaceEditor {
  constructor(source_id, img, edgeSize, fadeSize, parent) {
    this.source_id = source_id;
    this.el = new El({
      id: 'surface-editor',
      children: [{
        ref: 'stage',
        id: 'stage-surface',
      }, {
        ref: 'preview',
        id: 'preview-surface',
      }, {
        id: 'config-surface',
        children: [{
          children: [{
            tag: 'label',
            for: 'surface-edge-size',
            innerText: 'Edge Size',
          }, {
            ref: 'edgeSizeInput',
            id: 'surface-edge-size',
            tag: 'input',
            type: 'text',
            value: edgeSize,
            on: {
              keyup: (_, ev) => {
                let val = parseInt(ev.target.value);
                if (val) this.canvas.setEdgeSize(val);
              }
            }
          }]
        }, {
          children: [{
            tag: 'label',
            for: 'surface-fade-size',
            innerText: 'Fade Size',
          }, {
            id: 'surface-fade-size',
            min: 0,
            max: 1,
            step: 0.01,
            tag: 'input',
            type: 'range',
            ref: 'fadeSizeInput',
            value: fadeSize,
            on: {
              change: (_, ev) => {
                this.canvas.setFadeSize(ev.target.value);
              }
            }
          }]
        }]
      }]
    }, parent);
    this.canvas = new RectEditorCanvas(this.el.$refs.stage);
    this.canvas.setImage(img);
    this.canvas.render();
    this.updatePreview();
  }

  show() {
    this.el.$el.style.display = 'flex';
  }

  hide() {
    this.el.$el.style.display = 'none';
  }

  setClip(clip) {
    this.clip = clip;
    if (clip.surface) {
      this.canvas.rect = clip.surface.rect;
      this.canvas.edgeSize = clip.surface.edge_size;
      this.canvas.fadeSize = clip.surface.fade_size;
      this.el.$refs.edgeSizeInput.value = clip.surface.edge_size;
      this.el.$refs.fadeSizeInput.value = this.canvas._fadeSize;
    }
    this.updatePreview();
  }

  updatePreview() {
    this.el.$refs.preview.replaceChildren();
    if (this.clip && this.clip.name) {
      for (let i=0; i<9; i++) {
        let img = document.createElement('img');
        img.src = `/img/clips/${this.clip.name}.png?${Date.now()}`;
        this.el.$refs.preview.appendChild(img);
      }
    }
  }

  async save(id, name) {
    let rect = this.canvas.rect;
    let edgeSize = this.canvas.edgeSize;
    let fadeSize = this.canvas.fadeSize;
    if (id === null) {
      return api.createSurface(this.source_id, name, rect, edgeSize, fadeSize).then(() => {
        // kinda hacky, refresh to load new clip
        window.location.reload();
      });
    } else {
      return api.updateSurface(SOURCE_ID, id, name, rect, edgeSize, fadeSize);
    }
  }
}

export default SurfaceEditor;
