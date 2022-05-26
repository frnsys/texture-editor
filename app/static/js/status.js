const statusEl = document.querySelector('.status-notification');

let timer;

function showStatus(text, timeout=0) {
  statusEl.style.display = 'block';
  statusEl.innerText = text;

  if (timeout > 0) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      hideStatus();
    }, timeout * 1000);
  }
}

function hideStatus() {
  statusEl.style.display = 'none';
}

export default {
  show: showStatus,
  hide: hideStatus
}
