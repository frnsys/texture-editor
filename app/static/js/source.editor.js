import API from './api.js';
import Status from './status.js';
import ClipEditor from './clip.editor.js';
import SurfaceEditor from './surface.editor.js';

const api = new API();

// Current index of the clip being edited.
// If `curIdx == null` then a new clip is being edited.
var curIdx = null;

var clipEditor;
var surfaceEditor;

let mode = 'clip';
const stage = document.querySelector('#stage');
const clipTab = document.querySelector('.stage-tabs--clip');
const surfaceTab = document.querySelector('.stage-tabs--surface');
clipTab.addEventListener('click', () => {
  mode = 'clip';
  clipTab.classList.add('selected');
  surfaceTab.classList.remove('selected');

  // This order is important;
  // first hide the other editor
  // so the other can use the full space
  // for the canvas to expand to full height.
  if (surfaceEditor) surfaceEditor.hide();
  getOrCreateEditor().show();
});
surfaceTab.addEventListener('click', () => {
  mode = 'surface';
  clipTab.classList.remove('selected');
  surfaceTab.classList.add('selected');
  if (clipEditor) clipEditor.hide();
  getOrCreateEditor().show();
});

// Load the active image
let img = new Image();
img.onload = () => {
  // Select first clip, if there is one
  if (clipEls.length > 0) {
    selectClip(0);
  } else {
    selectClip(null);
  }
}
img.src = `/img/sources/${SOURCE_NAME}`;

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

  // New clip
  if (idx === null) {
    getOrCreateEditor().setClip({
      name: null,
      points: []
    });
    clipNameInput.value = '';
    surfaceTab.disabled = false;
    clipTab.disabled = false;
  } else {
    let clip = CLIPS[idx];
    if (clip.surface) {
      surfaceTab.disabled = false;
      clipTab.disabled = true;
      surfaceTab.click();
    } else {
      surfaceTab.disabled = true;
      clipTab.disabled = false;
      clipTab.click();
    }
    getOrCreateEditor().setClip(clip);
    clipNameInput.value = clip['name'];

    let el = clipEls[idx];
    el.classList.add('selected');
  }
  curIdx = idx
  getOrCreateEditor().canvas.render();
}

function saveClip() {
  let name = clipNameInput.value;
  if (!name || name.length == 0) {
    name = prompt("Name for this clip:");
  }
  if (!name || name.length == 0) {
    Status.show('The clip needs a name!', 3);
    return
  }

  let id = null;
  if (curIdx !== null) {
    id = CLIPS[curIdx]['id'];
  }

  Status.show('Saving...');

  let editor = mode == 'clip' ? clipEditor : surfaceEditor;
  editor.save(id, name).then((res) => {
    if (res.err) {
      Status.show(`Error: ${res.err}`, 3);
    } else {
      Status.show('Saved.', 3);
      // Update image, cache-bust
      clipEls[curIdx].querySelector('img').src = `/${res.path}?${Date.now()}`;
      clipEls[curIdx].querySelector('.clip-name').innerText = name;
    }
  });
}

function getOrCreateEditor() {
  if (mode == 'clip') {
    if (!clipEditor) {
      clipEditor = new ClipEditor(SOURCE_ID, img, stage);
    }
    return clipEditor;
  } else if (mode == 'surface') {
    if (!surfaceEditor) {
      surfaceEditor = new SurfaceEditor(SOURCE_ID, img, 200, 0.5, stage); // TODO
    }
    return surfaceEditor;
  }
}

// On Enter, save the current clip or surface
document.addEventListener('keyup', (ev) => {
  if (ev.key == 'Enter') {
    if (ev.target != document.body && ev.target != clipNameInput) return;
    saveClip();
  }
});

// Tags input
const tagsInput = document.querySelector('#tags');
tagsInput.addEventListener('keyup', (ev) => {
  if (ev.key == 'Enter') {
    api.updateSource(SOURCE_ID, {
      tags: tagsInput.value
    });
  }
});
