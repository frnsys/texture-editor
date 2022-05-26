function setupFilter(selector, fieldsFn) {
  const searchInput = document.querySelector(selector);
  searchInput.addEventListener('keyup', () => {
    let query = searchInput.value;
    document.querySelectorAll('.clip').forEach((el) => {
      if (query.length == 0 || fieldsFn(el).some((text) => text.includes(query))) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  });
}

function setupPreviews() {
  const preview = document.querySelector('#clip-browser-preview');
  document.querySelectorAll('.clip').forEach((el) => {
    const img = el.querySelector('.clip-preview img');
    el.addEventListener('mouseenter', () => {
      preview.style.display = 'block';
      preview.querySelector('img').src = img.src;
    });
    el.addEventListener('mouseleave', () => {
      preview.style.display = 'none';
    });
  });
}
