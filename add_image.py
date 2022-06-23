#!/usr/bin/env python

import os
import click
import shutil
from PIL import Image
from app import db, util

here = os.path.dirname(os.path.realpath(__file__))

@click.command()
@click.argument('path', type=click.Path(exists=True))
@click.option('--attrib', default='Self')
@click.option('--tags', default='', help='tags')
def add_image(path, attrib, tags):
    im = Image.open(path)
    fname = util.slugify(os.path.split(path)[-1])
    shutil.copy(path, os.path.join(here, 'data/images/sources', fname))

    db.add_source(
        source_name=fname,
        img_url=None,
        src_url=None,
        tags=tags,
        attribution=attrib,
        size=(im.width, im.height))
    db.save()

if __name__ == '__main__':
    add_image()