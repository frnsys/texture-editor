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
