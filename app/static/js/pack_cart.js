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
            api.resetPackCart().then(() => {
              updatePackCart();
            });
          }
        }
      }
    }, {
      tag: 'input',
      type: 'text',
      ref: 'packName',
      placeholder: 'Name',
      className: 'pack-name-input',
      title: 'Name for the pack',
    }, {
      tag: 'input',
      type: 'text',
      ref: 'packMaxSide',
      placeholder: 'Max',
      className: 'pack-max-side',
      title: 'Maximum dimension for each clip',
    }, {
      tag: 'button',
      innerText: 'Generate',
      className: 'make-pack',
      on: {
        'click': (self) => {
          let name = self.$refs.packName.value;
          if (name && name.length > 0) {
            let maxSide = parseInt(self.$refs.packMaxSide.value);
            api.createPack(name, maxSide).then(({path}) => {
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

updatePackCart();

document.querySelectorAll('.clip').forEach((el) => {
  let clipId = el.dataset.id;
  el.querySelector('.add-to-pack').addEventListener('click', () => {
    api.addToPackCart(clipId).then(() => {
      updatePackCart();
    });
  });
  el.querySelector('.rem-from-pack').addEventListener('click', () => {
    api.remFromPackCart(clipId).then(() => {
      updatePackCart();
    });
  });
});

function updatePackCart() {
  api.getPackCart().then(({pack}) => {
    packCart.$refs.packCount.innerText = `${pack.length} clips`;
    packCart.$refs.packResult.style.display = 'none';

    packCart.$refs.packClips.replaceChildren(); // Clear children
    pack.forEach((clip) => {
      El({
        className: 'pack-clip',
        children: [{
          tag: 'a',
          href: `/edit/${clip.source}`,
          children: [{
            tag: 'img',
            src: `/img/clips/${clip.name}.png`
          }]
        }, {
          className: 'clip-menu',
          children: [{
            tag: 'img',
            src: '/static/assets/rem_from_pack.png',
            on: {
              click: () => {
                api.remFromPack(clip.id).then(() => {
                  updatePackCart();
                });
              }
            }
          }]
        }]
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
