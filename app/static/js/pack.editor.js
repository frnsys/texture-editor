import El from './el.js';
import API from './api.js';
import Status from './status.js';
import ClipsEditorCanvas from './editor/clips.editor.js';

const api = new API();
const popup = document.querySelector('#clips-popup');

// Load the clip images
let canvas;
let clipsLoaded = 0;
const existingClips = new Set();
CLIPS.forEach((clip) => {
  existingClips.add(clip['id']);
  let img = new Image();
  img.onload = () => {
    clipsLoaded++;
    clip.image = img;
    if (clipsLoaded >= CLIPS.length) {
      canvas = new ClipsEditorCanvas(document.querySelector('#stage'), CLIPS);
      canvas.render();
    }
  }
  img.src = `/img/clips/${clip.name}.png`;
});

function addClip(clip) {
  let img = new Image();
  img.onload = () => {
    canvas.clips.push({
      id: clip['id'],
      name: clip['name'],
      pos: [0, 0],
      size: [img.width, img.height],
      rot: 0,
      image: img,
    });
    canvas.render();
  }
  img.src = `/img/clips/${clip.name}.png`;
}

document.addEventListener('keyup', (ev) => {
// Save the pack
  if (ev.key == 'Enter') {
    Status.show('Saving...');
    api.updatePack(PACK_ID, canvas.clips).then(() => {
      // Update image, cache-bust
      document.querySelector('#pack-preview img').src = `/img/packs/${PACK_NAME}.png?${Date.now()}`;
      Status.hide();
    });

  // Add a clip
  } else if (ev.key == 'a') {
    popup.style.display = 'block';
    popup.replaceChildren();
    api.getClips().then(({clips}) => {
      El({
        className: 'pack-clips-browser',
        children: clips.filter((clip) => {
          return !existingClips.has(clip['id']);
        }).map((clip) => ({
          className: 'pack-clips-browser--clip',
          children: [{
            tag: 'img',
            src: `/img/clips/${clip.name}.png`
          }],
          dataset: {
            name: clip.name,
          },
          on: {
            click: () => {
              addClip(clip);
            }
          }
        }))
      }, popup);
    });

  } else if (ev.key == 'Escape') {
    popup.style.display = 'none';
  }
});
