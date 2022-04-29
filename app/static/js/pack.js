import El from './el.js';
import API from './api.js';

const api = new API();

const packCart = El({
  className: 'pack-cart',
  children: [{
    className: 'pack-header',
    children: [{
      className: 'pack-count',
      ref: 'packCount'
    }, {
      innerText: 'View',
      className: 'pack-clips-toggle',
      state: {
        hidden: true
      },
      on: {
        'click': (self) => {
          self.$state.hidden = !self.$state.hidden;
          if (self.$state.hidden) {
            self.$refs.packClips.style.display = 'none';
            self.$el.innerText = 'View';
          } else {
            self.$refs.packClips.style.display = 'block';
            self.$el.innerText = 'Hide';
          }
        }
      }
    }]
  }, {
    className: 'pack-result',
    style: {
      display: 'none'
    },
    ref: 'packResult',
    children: [{
      tag: 'img',
      ref: 'packResultImg',
    }, {
      className: 'pack-name',
      ref: 'packResultName',
    }]
  }, {
    className: 'pack-clips',
    style: {
      display: 'none'
    },
    ref: 'packClips'
  }, {
    className: 'pack-controls',
    children: [{
      tag: 'button',
      innerText: 'Reset',
      className: 'reset-pack',
      on: {
        'click': () => {
          if (confirm('Are you sure you want to reset this pack?')) {
            api.resetPack().then(() => {
              updatePack();
            });
          }
        }
      }
    }, {
      tag: 'button',
      innerText: 'Generate',
      className: 'make-pack',
      on: {
        'click': (self) => {
          var name = prompt('Name for this pack:');
          if (name && name.length > 0) {
            api.createPack(name).then(({path}) => {
              self.$refs.packResult.style.display = 'block';
              self.$refs.packResultImg.src = `/${path}?${Date.now()}`;
              self.$refs.packResultName.innerText = path;
            });
          }
        }
      }
    }]
  }]
}, document.body)

updatePack();

document.querySelectorAll('.clip').forEach((el) => {
  let clipId = el.dataset.id;
  el.querySelector('.add-to-pack').addEventListener('click', () => {
    api.addToPack(clipId).then(() => {
      updatePack();
    });
  });
});

function updatePack() {
  api.getPack().then(({pack}) => {
    packCart.$refs.packCount.innerText = `${pack.length} clips`;
    packCart.$refs.packResult.style.display = 'none';

    packCart.$refs.packClips.replaceChildren(); // Clear children
    pack.forEach((clip) => {
      El({
        tag: 'img',
        src: `/img/clips/${clip.name}.png`
      }, packCart.$refs.packClips);
    });

    const clipIds = pack.map((clip) => clip.id);
    document.querySelectorAll('.clip').forEach((el) => {
      let clipId = el.dataset.id;
      if (clipIds.includes(clipId)) {
        el.classList.add('in-pack');
      } else {
        el.classList.remove('in-pack');
      }
    });
  });
}
