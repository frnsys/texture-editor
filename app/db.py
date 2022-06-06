import json
from typing import TypedDict
from datetime import datetime

class PackClip(TypedDict):
    id: str
    size: tuple[int, int]
    pos: tuple[int, int]
    rot: float

try:
    db = json.load(open('data/db.json', 'r'))
except FileNotFoundError:
    db = {
        'sources': {},
        'packs': {},
        'clips': {},
    }

def _id():
    return str(int(datetime.utcnow().timestamp() * 1000))

def save():
    with open('data/db.json', 'w') as f:
        json.dump(db, f)

def get_source(source_id: str):
    return db['sources'].get(source_id)

def add_source(source_name: str, img_url: str, tags: str, src_url: str, attribution: str, size: tuple[int, int]):
    id = _id()
    db['sources'][id] = {
        'id': id,
        'name': source_name,
        'clips': [],
        'tags': tags,
        'size': size,
        'url': img_url,
        'src': src_url,
        'attribution': attribution,
    }
    return id

def all_sources():
    return db['sources'].values()

def add_clip(source_id: str, clip_name: str, points: list[tuple[float, float]], surface: dict | None):
    id = _id()
    db['clips'][id] = {
        'id': id,
        'name': clip_name,
        'points': points,
        'source': source_id,
        'surface': surface,
    }
    db['sources'][source_id]['clips'].append(id)

def get_clip(clip_id: str):
    return db['clips'].get(clip_id)

def all_clips():
    return db['clips'].values()

def add_pack(pack_name: str, clips: list[PackClip]):
    id = _id()
    db['packs'][id] = {
        'id': id,
        'name': pack_name,
        'clips': clips
    }
    return db['packs'][id]

def get_pack(pack_id: str):
    return db['packs'].get(pack_id)

def update_pack(pack_id: str, clips: list[PackClip]):
    db['packs'][pack_id]['clips'] = clips

def all_packs():
    return db['packs'].values()
