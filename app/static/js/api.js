async function get(url) {
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

async function post(url, data) {
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

async function del(url, data) {
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
      points,
    });
  }

  getClips() {
    return get('/clips.json');
  }

  saveSource(srcUrl, imgUrl, attribution, tags) {
    return post('/sources', {
      src_url: srcUrl,
      img_url:  imgUrl,
      tags: tags,
      attribution: attribution,
    });
  }

  createPack(packName, maxSide) {
    return post('/pack', {
      pack_name: packName,
      max_side: maxSide
    });
  }

  updatePack(packId, clips) {
    return post(`/pack/${packId}`, {
      clips: clips,
    });
  }

  getPackCart() {
    return get('/pack/cart');
  }

  addToPackCart(clipId) {
    return post('/pack/cart', {
      clip_id: clipId
    });
  }

  remFromPackCart(clipId) {
    return del('/pack/cart', {
      clip_id: clipId
    });
  }

  resetPackCart() {
    return post('/pack/cart', {
      reset: true
    });
  }

  updateSource(sourceId, data) {
    return post(`/edit/${sourceId}`, data);
  }
}

export default API;
