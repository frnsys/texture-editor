import os
import config
from . import db, util, extractors
from .image import clip, pack as make_pack
from flask import Blueprint, abort, request, render_template, jsonify, send_from_directory, session

bp = Blueprint('main', __name__)

def img_path(name: str, typ: str, external=False):
    sub_path = os.path.join(typ, name)
    if external:
        return os.path.join('img', sub_path)
    else:
        return os.path.join(config.IMAGES_DIR, sub_path)

def clip_path(name: str, external=False):
    return img_path('{}.png'.format(name), 'clips', external)

def source_path(name: str, external=False):
    return img_path(name, 'sources', external)

def pack_path(name: str, external=False):
    return img_path('{}.png'.format(name), 'packs', external)


@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/clips')
def clips():
    return render_template('clips.html',
            clips=db.all_clips())

@bp.route('/sources', methods=['GET', 'POST'])
def sources():
    if request.method == 'GET':
        return render_template('sources.html',
                sources=db.all_sources())
    else:
        data = request.get_json()
        url = data['img_url']
        fname = os.path.split(url)[-1]
        outpath = source_path(fname)
        util.download(url, outpath)
        id = db.add_source(source_name=fname, **data)
        db.save()
        return jsonify(success=True, id=id)

@bp.route('/edit/<source_id>', methods=['GET', 'POST'])
def edit(source_id):
    data = db.get_source(source_id)
    if data is None:
        abort(404)
    if request.method == 'POST':
        updates = request.get_json()
        for key, val in updates.items():
            data[key] = val
        db.save()
        return jsonify(success=True)
    else:
        return render_template('edit.html',
                id=data['id'],
                name=data['name'],
                tags=data['tags'],
                src=data['src'],
                attribution=data['attribution'],
                clips=[db.get_clip(id) for id in data['clips']])

@bp.route('/img/<path:subpath>')
def image(subpath):
    subdir, fname = os.path.split(subpath)
    return send_from_directory(os.path.join('..', config.IMAGES_DIR, subdir), fname)

@bp.route('/clip', methods=['POST'])
def clip_image():
    data = request.get_json()
    out_path = clip_path(data['clip_name'])
    points = [tuple(pt) for pt in data['points']]
    source = db.get_source(data['source_id'])
    clip(
        source_path(source['name']),
        points, out_path)
    if 'clip_id' in data:
        clip_data = db.get_clip(data['clip_id'])
        clip_data['name'] = data['clip_name']
        clip_data['points'] = points
    else:
        db.add_clip(data['source_id'], data['clip_name'], points)
    db.save()
    return jsonify(success=True,
            path=clip_path(data['clip_name'], external=True))

@bp.route('/pack', methods=['GET', 'POST'])
def pack_clips():
    if request.method == 'GET':
        pack = [db.get_clip(clip_id) for clip_id in session.get('pack')]
        return jsonify(pack=pack)

    data = request.get_json()

    clips = []
    for clip_id in session.get('pack', []):
        clip = db.get_clip(clip_id)
        if clip is not None:
            out_path = clip_path(data['pack_name'])
            clips.append({
                'points': clip['points'],
                'path': out_path,
            })

    if clips:
        out_path = pack_path(data['pack_name'])
        make_pack(clips, out_path)
        db.add_pack(data['pack_name'], session['pack'])
        db.save()
        return jsonify(success=True,
                path=pack_path(data['pack_name'], external=True))
    else:
        return jsonify(success=False)

@bp.route('/add_to_pack', methods=['POST'])
def add_to_pack():
    if 'pack' not in session:
        session['pack'] = []

    data = request.get_json()
    if data.get('reset'):
        session['pack'] = []
    else:
        clip_id = data.get('clip_id')
        if clip_id is not None and clip_id not in session['pack']:
            session['pack'].append(clip_id)
            session.modified = True

    pack = [db.get_clip(clip_id) for clip_id in session.get('pack')]
    return jsonify(success=True, pack=pack)

@bp.route('/search')
def search():
    query = request.args.get('query', '')
    sources = request.args.get('sources', '').split(',')

    results = []
    if query:
        for source in sources:
            search_fn = extractors.sources.get(source)
            if search_fn:
                results += search_fn(query)

    # Check if any of these have already been saved
    existing_img_urls = {s['url']: s['id'] for s in db.all_sources()}
    for result in results:
        if result['url'] in existing_img_urls:
            result['saved'] = True
            result['id'] = existing_img_urls[result['url']]

    return render_template('search.html',
            results=results, query=query,
            sources=[(src, src in sources) for src in extractors.sources.keys()])
