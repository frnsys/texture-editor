import API from './api.js';
import EditorCanvas from './editor/editor.js';

const api = new API();

// Current index of the clip being edited.
// If `curIdx == null` then a new clip is being edited.
var curIdx = null;

// Load the activ eimage
var canvas;
let img = new Image();
img.onload = () => {
  canvas = new EditorCanvas(document.querySelector('#stage'));
  canvas.setImage(img);

  // Select first clip, if there is one
  if (clipEls.length > 0) {
    selectClip(0);
  }
}
img.src = `/img/sources/${sourceName}`;

// Load selected clip on click
const clipEls = document.querySelectorAll('.clips .clip');
clipEls.forEach((el, i) => {
  el.addEventListener('click', () => {
    selectClip(i);
  });
});

// Create a new clip (the null clip)
document.querySelector('.clip-add').addEventListener('click', () => {
  selectClip(null);
});

// Call when selecting a clip
const clipNameInput = document.querySelector('#clip-name-input');
function selectClip(idx) {
  if (curIdx !== null) {
    clipEls[curIdx].classList.remove('selected');
  }
  if (idx !== null) {
    clipEls[idx].classList.add('selected');
    canvas.resetPoints(clips[idx]['points'].map((pt) => ({x:pt[0], y:pt[1]})));
    clipNameInput.value = clips[idx]['name'];
  } else {
    canvas.resetPoints([]);
  }
  curIdx = idx
  canvas.render();
}

// On Enter, save the current clip
document.addEventListener('keyup', (ev) => {
  if (ev.key == 'Enter') {
    if (ev.target != document.body && ev.target != clipNameInput) return;
    let points = canvas.points.map(({x, y}) => [x, y]);
    if (points.length <= 1) return;

    if (curIdx == null) {
      let name = clipNameInput.value;
      if (!name || name.length == 0) {
        name = prompt("Name for this clip:");
      }
      if (!name || name.length == 0) {
        return
      }
      api.clip(sourceId, name, points).then(() => {
        // kinda hacky, refresh to load new clip
        window.location.reload();
      });
    } else {
      let name = clipNameInput.value;
      let id = clips[curIdx]['id'];
      api.updateClip(sourceId, id, name, points).then(({path}) => {
        // Update image, cache-bust
        clipEls[curIdx].querySelector('img').src = `/${path}?${Date.now()}`;
        clipEls[curIdx].querySelector('.clip-name').innerText = name;
      });
    }
  }
});

// Tags input
const tagsInput = document.querySelector('#tags');
tagsInput.addEventListener('keyup', (ev) => {
  if (ev.key == 'Enter') {
    api.updateSource(sourceId, {
      tags: tagsInput.value
    });
  }
});
