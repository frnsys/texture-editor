import os
import config

def img_path(name: str, typ: str, external=False):
    sub_path = os.path.join(typ, name)
    if external:
        return os.path.join('img', sub_path)
    else:
        return os.path.join(config.IMAGES_DIR, sub_path)

def clip(name: str, external=False):
    return img_path('{}.png'.format(name), 'clips', external)

def source(name: str, external=False):
    return img_path(name, 'sources', external)

def pack(name: str, external=False):
    return img_path('{}.png'.format(name), 'packs', external)
