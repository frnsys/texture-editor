import config
import requests


# https://pixabay.com/service/license/
# Attribution not required, commercial use ok
def search(query):
    params = {
        'q': query,
        'apikey': config.API_KEYS['pixabay'],
        'per_page': 100,
    }
    resp = requests.get('https://pixabay.com/api/', params=params)
    data = resp.json()

    results = []
    for r in data['hits']:
        source_url = r['pageURL']
        thumb_url = r['previewURL']
        img_url = r['largeImageURL']
        attribution = '{}, via Pixabay'.format(r['user'])
        results.append({
            'src': source_url,
            'thumb': thumb_url,
            'url': img_url,
            'attribution': attribution,
        })
    return results
