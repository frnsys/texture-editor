import requests

"""
https://www.artic.edu/open-access/open-access-images
> The museum requests that you include the following caption with reproductions of the images: Artist. Title, Date. The Art Institute of Chicago.
"""

img_templ = 'https://www.artic.edu/iiif/2/{identifier}/full/{size},/0/default.jpg'

def search(query):
    params = {
        'q': query,
        'query[term][is_public_domain]': 'true',
        'fields': 'id,artist_title,title,image_id,date_start,date_end,api_link,is_public_domain',
    }
    resp = requests.get('https://api.artic.edu/api/v1/artworks/search', params=params)
    data = resp.json()

    results = []
    for res in data['data']:
        if not res['is_public_domain']: continue
        if res['date_start'] != res['date_end']:
            date = '{}-{}'.format(res['date_start'], res['date_end'])
        else:
            date = res['date_start']

        results.append({
            'url': img_templ.format(size=1686, identifier=res['image_id']),
            'thumb': img_templ.format(size=480, identifier=res['image_id']),
            'src': res['api_link'],
            'attribution': '{artist}. {title}. {date}. The Art Institute of Chicago (CC0)'.format(artist=res['artist_title'], title=res['title'], date=date)
        })
    return results
