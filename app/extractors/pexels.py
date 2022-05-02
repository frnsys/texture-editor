import config
import requests

# https://www.pexels.com/license/
# Commercial use ok: https://pexels-help.zendesk.com/hc/en-us/articles/360042295214-Can-I-use-the-photos-and-videos-for-a-commercial-project-
def search(query):
    headers = {
        'Authorization': config.API_KEYS['pexels'],
    }
    params = {
        'query': query,
        'per_page': 80
    }
    resp = requests.get('https://api.pexels.com/v1/search',
            params=params, headers=headers)
    data = resp.json()

    results = []

    # https://www.pexels.com/api/documentation/#photos-search
    for r in data['photos']:
        source_url = r['url']
        img_url = r['src']['large2x']
        thumb_url = r['src']['medium']
        attribution = '{} via Pexels'.format(r['photographer'])
        results.append({
            'src': source_url,
            'url': img_url,
            'thumb': thumb_url,
            'attribution': attribution
        })
    return results
