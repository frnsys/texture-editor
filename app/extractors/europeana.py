# Get an API Key: https://pro.europeana.eu/page/get-api
# https://pro.europeana.eu/page/search

import config
import requests


def parse_license(url):
    if 'creativecommons' not in url:
        raise Exception('Unrecognized license url: "{}"'.format(url))

    # https://creativecommons.org/licenses/by-sa/3.0/
    if 'licenses' in url:
        parts = url.split('/')
        typ, version = parts[-2], parts[-1]
        return 'CC {} ({})'.format(typ.upper(), version)

    # http://creativecommons.org/publicdomain/mark/1.0/
    elif 'publicdomain' in url:
        return 'Public Domain'

    else:
        raise Exception('Unrecognized license url: "{}"'.format(url))


def search(query):
    params = {
        'query': query,

        # Public Domain/CC0, CC BY, CC BY-SA
        'reusability': 'open',

        'media': 'true',
        'wskey': config.API_KEYS['europeana']
    }
    resp = requests.get('https://api.europeana.eu/record/v2/search.json', params=params)
    data = resp.json()

    results = []
    for r in data['items']:
        license_url = r['rights'][0]
        provider = r['provider'][0]
        attribution = 'Provided by {}, {}, via Europeana'.format(provider, parse_license(license_url))
        results.append({
            'url': r['edmIsShownBy'],
            'thumb': r['edmPreview'],
            'src': r['edmIsShownAt'],
            'attribution': attribution
        })
    return results
