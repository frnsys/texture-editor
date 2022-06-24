import config
import requests
from datetime import datetime, timedelta

AUTH = None

# https://api.openverse.engineering/v1/#operation/image_search
# Openverse covers a lot of different sources:
# wordpress
# woc_tech
# wikimedia
# waltersartmuseum
# thorvaldsensmuseum
# thingiverse
# svgsilh
# stocksnap
# statensmuseum
# spacex
# smithsonian_zoo_and_conservation
# smithsonian_postal_museum
# smithsonian_portrait_gallery
# smithsonian_national_museum_of_natural_history
# smithsonian_libraries
# smithsonian_institution_archives
# smithsonian_hirshhorn_museum
# smithsonian_gardens
# smithsonian_freer_gallery_of_art
# smithsonian_cooper_hewitt_museum
# smithsonian_anacostia_museum
# smithsonian_american_indian_museum
# smithsonian_american_history_museum
# smithsonian_american_art_museum
# smithsonian_air_and_space_museum
# smithsonian_african_art_museum
# smithsonian_african_american_history_museum
# sketchfab
# sciencemuseum
# rijksmuseum
# rawpixel
# phylopic
# nypl
# national_museum_of_finland
# nasa
# museumsvictoria
# met
# mccordmuseum
# iha
# geographorguk
# floraon
# flickr
# finnish_heritage_agency
# eol
# digitaltmuseum
# deviantart
# clevelandmuseum
# brooklynmuseum
# bio_diversity
# behance
# animaldiversity
# WoRMS
# CAPL
# 500px

source_names = {
    'met': 'The Metropolitan Museum of Art',
    'wikimedia': 'Wikimedia Commons',
    'flickr': 'Flickr',
    'rawpixel': 'rawpixel',
    'wordpress': 'WordPress',
    '500px': '500px',
    'smithsonian_zoo_and_conservation,smithsonian_postal_museum,smithsonian_portrait_gallery,smithsonian_national_museum_of_natural_history,smithsonian_libraries,smithsonian_institution_archives,smithsonian_hirshhorn_museum,smithsonian_gardens,smithsonian_freer_gallery_of_art,smithsonian_cooper_hewitt_museum,smithsonian_anacostia_museum,smithsonian_american_indian_museum,smithsonian_american_history_museum,smithsonian_american_art_museum,smithsonian_air_and_space_museum,smithsonian_african_art_museum,smithsonian_african_american_history_museum': 'The Smithsonian',
}


def auth():
    resp = requests.post('https://api.openverse.engineering/v1/auth_tokens/token/',
            data={
                'client_id': config.API_KEYS['openverse']['client_id'],
                'client_secret': config.API_KEYS['openverse']['client_secret'],
                'grant_type': 'client_credentials'
            })
    resp.raise_for_status()
    data = resp.json()
    expires_at = datetime.now() + timedelta(seconds=data['expires_in'])
    return (data['access_token'], expires_at)

def search(query, source):
    global AUTH
    if AUTH is None or datetime.now() >= AUTH[1]:
        AUTH = auth()

    params = {
        'q': query,
        'page_size': 100,
        'source': source,
        'license_type': 'commercial,modification',
        'format': 'json',
    }
    headers = {
        'Authorization': 'Bearer {}'.format(AUTH[0]),
    }
    resp = requests.get('https://api.openverse.engineering/v1/images', params, headers=headers)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for r in data['results']:
        creator = r.get('creator', '(Missing author)')
        attribution = '{}. {}{} {}. From {} via Openverse.'.format(
                r.get('title', '(Missing title)'),
                '{}. '.format(creator) if creator else '',
                r['license'], r['license_version'],
                source_names[source]).replace('..', '.')
        results.append({
            'url': r['url'],
            'thumb': r['thumbnail'],
            'src': r['foreign_landing_url'],
            'attribution': attribution
        })
    return results
