# https://metmuseum.github.io
import requests

def get_object_images(obj_id):
    resp = requests.get('https://collectionapi.metmuseum.org/public/collection/v1/objects/{}'.format(obj_id))
    data = resp.json()
    title = data['title']
    if not data['isPublicDomain']:
        return []
    else:
        imgs = [data['primaryImage']] + data['additionalImages']
        return [
                # full, thumb
                (title, img, img.replace('/original/', '/web-large/'))
                for img in imgs]

def search(query, limit=20):
    results = []
    resp = requests.get('https://collectionapi.metmuseum.org/public/collection/v1/search', params={'q': query, 'hasImages': 'true'})
    data = resp.json()
    for obj_id in data['objectIDs'][:limit]:
        source_url = 'https://www.metmuseum.org/art/collection/search/{}'.format(obj_id)
        results += [{
            'url': img_url,
            'src': source_url,
            'thumb': thumb_url,
            'attribution': '{}. The Metropolitan Museum of Art (Public Domain)'.format(title)
        } for title, img_url, thumb_url in get_object_images(obj_id)]
    return results
