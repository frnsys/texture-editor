import API from './api.js';

const api = new API();

const searchInput = document.querySelector('input');
searchInput.addEventListener('keyup', (ev) => {
  if (ev.key == 'Enter') {
    let query = searchInput.value;
    let sources = [];
    document.querySelectorAll('.sources input:checked').forEach((source) => {
      sources.push(source.id);
    });
    window.location.href = `/search?query=${query}&sources=${sources.join(',')}`;
  }
});

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('query');
document.querySelectorAll('.search-result').forEach((el) => {
  var saveEl = el.querySelector('.save-result');
  if (saveEl) {
    saveEl.addEventListener('click', () => {
      api.saveSource(
        el.dataset.src,
        el.dataset.url,
        el.dataset.attribution,
        searchQuery).then(({id}) => {
          el.classList.add('selected');
          saveEl.style.display = 'none';
          const viewButton = document.createElement('a');
          viewButton.classList.add('view-result');
          viewButton.innerText = 'View';
          viewButton.href = `/edit/${id}`;
          saveEl.parentNode.appendChild(viewButton);
        });
    });
  }
});
