import requests
import lxml.html

def search(query):
    params = {
        'q': query,
        'limit': 100
    }
    resp = requests.get('https://api.wikimedia.org/core/v1/commons/search/page', params=params)
    data = resp.json()

    results = []
    for r in data['pages']:
        if not r['key'].startswith('File:'): continue
        # img_url = r['thumbnail']['url']

        # SUPER messy API. Requires so many different requests just to assemble basic info.
        # First get a higher-res image url.
        resp = requests.get('https://api.wikimedia.org/core/v1/commons/file/{}'.format(r['key']))
        file_data = resp.json()
        if file_data.get('httpCode') == 404: continue
        img_url = file_data['preferred']['url'] # other resolutions also available
        thumb_url = file_data['thumbnail']['url'] # other resolutions also available

        source_url = 'https://commons.wikimedia.org/wiki/{}'.format(r['key'])

        # Collect info for attribution
        resp = requests.get('https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles={}&format=json'.format(r['key']))
        pages = resp.json()['query']['pages']
        page_id = list(pages.keys())[0]
        try:
            metadata = pages[page_id]['imageinfo'][0]['extmetadata']
        except:
            continue
        if 'Artist' not in metadata:
            creator = '(Missing author)'
        else:
            creator = lxml.html.fromstring(metadata['Artist']['value']).text_content().strip()
        license = metadata['LicenseShortName']['value']
        attribution = '{}, {}, via Wikimedia Commons'.format(creator, license)

        results.append({
            'url': img_url,
            'src': source_url,
            'thumb': thumb_url,
            'attribution': attribution
        })
    return results