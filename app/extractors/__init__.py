from . import met
from . import chicago
from . import wikimedia
from . import openverse
from . import pexels
from . import pixabay

sources = {
    'Art Institute of Chicago': chicago.search,
    # 'MET': met.search,
    'MET': lambda query: openverse.search(query, 'met'),
    # openverse wikimedia doesn't return correct results?
    # The custom extractor is way slower but at least gives proper results
    # 'Wikimedia': lambda query: openverse.search(query, 'wikimedia'),
    'Wikimedia': wikimedia.search,
    'Pexels': pexels.search,
    'Pixabay': pixabay.search,
    'Flickr': lambda query: openverse.search(query, 'flickr'),
    'rawpixel': lambda query: openverse.search(query, 'rawpixel'),
    'WordPress': lambda query: openverse.search(query, 'wordpress'),
    '500px': lambda query: openverse.search(query, '500px'),
    'Smithsonian': lambda query: openverse.search(query, 'smithsonian_zoo_and_conservation,smithsonian_postal_museum,smithsonian_portrait_gallery,smithsonian_national_museum_of_natural_history,smithsonian_libraries,smithsonian_institution_archives,smithsonian_hirshhorn_museum,smithsonian_gardens,smithsonian_freer_gallery_of_art,smithsonian_cooper_hewitt_museum,smithsonian_anacostia_museum,smithsonian_american_indian_museum,smithsonian_american_history_museum,smithsonian_american_art_museum,smithsonian_air_and_space_museum,smithsonian_african_art_museum,smithsonian_african_american_history_museum'),
}
