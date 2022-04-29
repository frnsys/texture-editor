import os
import config
from . import db
from .image import clip, pack as make_pack
from flask import Blueprint, abort, request, render_template, jsonify, send_from_directory, session

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/clips')
def clips():
    return render_template('clips.html',
            clips=db.all_clips())

@bp.route('/sources')
def sources():
    return render_template('sources.html',
            sources=db.all_sources())

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
    sub_path = os.path.join('clips', '{}.png'.format(data['clip_name']))
    out_path = os.path.join(config.IMAGES_DIR, sub_path)
    points = [tuple(pt) for pt in data['points']]
    source = db.get_source(data['source_id'])
    clip(
        os.path.join(config.IMAGES_DIR, 'sources', source['name']),
        points,
        out_path)
    if 'clip_id' in data:
        clip_data = db.get_clip(data['clip_id'])
        clip_data['name'] = data['clip_name']
        clip_data['points'] = points
    else:
        db.add_clip(data['source_id'], data['clip_name'], points)
    db.save()
    return jsonify(success=True, path=os.path.join('img', sub_path))

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
            sub_path = os.path.join('clips', '{}.png'.format(clip['name']))
            out_path = os.path.join(config.IMAGES_DIR, sub_path)
            clips.append({
                'points': clip['points'],
                'path': out_path,
            })

    if clips:
        sub_path = os.path.join('packs', '{}.png'.format(data['pack_name']))
        out_path = os.path.join(config.IMAGES_DIR, sub_path)

        make_pack(clips, out_path)
        db.add_pack(data['pack_name'], session['pack'])
        db.save()
        return jsonify(success=True, path=os.path.join('img', sub_path))
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
