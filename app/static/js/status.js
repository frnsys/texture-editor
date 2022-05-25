const statusEl = document.querySelector('.status-notification');

function showStatus(text) {
  statusEl.style.display = 'block';
  statusEl.innerText = text;
}

function hideStatus() {
  statusEl.style.display = 'none';
}

export default {
  show: showStatus,
  hide: hideStatus
}
