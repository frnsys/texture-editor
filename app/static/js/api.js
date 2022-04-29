function get(url) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'GET',
  })
    .then(res => res.json())
}

function post(url, data) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then(res => res.json())
}

function del(url, data) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'DELETE',
    body: JSON.stringify(data)
  })
    .then(res => res.json())
}

class API {
  clip(sourceId, clipName, points) {
    return post('/clip', {
      source_id: sourceId,
      clip_name: clipName,
      points: points
    });
  }

  updateClip(sourceId, clipId, clipName, points) {
    return post('/clip', {
      clip_id: clipId,
      source_id: sourceId,
      clip_name: clipName,
      points: points
    });
  }

  getPack() {
    return get('/pack');
  }

  createPack(packName) {
    return post('/pack', {
      pack_name: packName
    });
  }

  addToPack(clipId) {
    return post('/add_to_pack', {
      clip_id: clipId
    });
  }

  resetPack() {
    return post('/add_to_pack', {
      reset: true
    });
  }

  updateSource(sourceId, data) {
    return post(`/edit/${sourceId}`, data);
  }
}

export default API;
