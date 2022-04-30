import requests

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

def search(query, source):
    params = {
        'q': query,
        'page_size': 100,
        'source': source,
        'license_type': 'commercial,modification',
        'format': 'json',
    }
    resp = requests.get('https://api.openverse.engineering/v1/images', params)
    data = resp.json()

    results = []
    for r in data['results']:
        creator = r.get('creator', '(Missing author)')
        attribution = '{}. {}{} {}'.format(
                r['title'],
                '{}. '.format(creator) if creator else '',
                r['license'], r['license_version'])
        results.append({
            'url': r['url'],
            'thumb': r['thumbnail'],
            'src': r['foreign_landing_url'],
            'attribution': attribution
        })
    return results
