# Overview

This provides a way to quickly get source images, clip parts of them out, and assemble them into textures ("packs") or seamless textures ("surfaces").

# Setup

```
pip install -r requirements.txt
```

Add keys in `config.py`;

```
IMAGES_DIR = 'data/images'
SECRET_KEY = 'foobar'

API_KEYS = {
    # https://pro.europeana.eu/page/get-api
    'europeana': '---',

    # https://www.pexels.com/api/new/
    'pexels': '---',

    # https://pixabay.com/api/docs/
    'pixabay': '---',

    # openverse
    # <https://api.openverse.engineering/v1/#section/Register-and-Authenticate/Authenticate>
    'openverse': {
        'client_id': '---',
        'client_secret': '---',
    },
}
```

# Usage

```
python main.py
```

Then visit `localhost:8000`.

# Adding source images manually

If you have your own images you want to add as source images, you can do so with the `add_image.py` script:

```
./add_image.py ~/path/to/image.jpg --attrib Unknown --tags=foo,bar,baz
```
