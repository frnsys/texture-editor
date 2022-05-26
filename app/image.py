import math
import numpy as np
from PIL import Image, ImageDraw, ImageChops, ImageFilter
from rectpack import newPacker, PackingMode, MaxRectsBl, PackingBin, SORT_DIFF

def bounding_box(points: list[tuple[float, float]]):
    """Calculate bounding box for a list of points."""
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs), max(ys)

def get_dimensions(img_path):
    return Image.open(img_path).size

def size_to_fit(size: tuple[int, int], max_side: int):
    w, h = size
    scale = min(max_side/w, max_side/h, 1)
    return round(w * scale), round(h * scale)

# https://stackoverflow.com/a/22650239/1097920
def clip(img_path: str, points: list[tuple[float, float]]):
    """Clip the provided polygon (points) from the given image."""
    img = Image.open(img_path).convert('RGBA')
    img_arr = np.asarray(img)
    mask_img = Image.new('L', (img_arr.shape[1], img_arr.shape[0]), 0)
    ImageDraw.Draw(mask_img).polygon(points, outline=1, fill=1)
    mask_arr = np.array(mask_img)
    new_img_arr = np.empty(img_arr.shape, dtype='uint8')
    new_img_arr[:,:,:3] = img_arr[:,:,:3] # RGB
    new_img_arr[:,:,3] = mask_arr*255     # A

    new_img = Image.fromarray(new_img_arr, 'RGBA')
    bbox = bounding_box(points)
    new_img = new_img.crop(bbox)
    return new_img

def binpack(clips, max_side: None|int):
    """Pack the provided clips into a single image."""
    packer = newPacker(mode=PackingMode.Offline, bin_algo=PackingBin.BFF, pack_algo=MaxRectsBl, sort_algo=SORT_DIFF, rotation=False)
    total_area = 0

    for i, clip in enumerate(clips):
        bbox = bounding_box(clip['points'])
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        if max_side:
            width, height = size_to_fit((width, height), max_side)

        total_area += width * height
        packer.add_rect(width, height, i)

    # Bin big enough
    side = int(math.ceil(math.sqrt(total_area) * 2))
    packer.add_bin(side, side)

    packer.pack()

    # Get clip positions and sizes
    min_x = float('inf')
    min_y = float('inf')
    positioned_clips = []
    for rect in packer.rect_list():
        bin_idx, x, y, w, h, rect_id = rect
        x, y = round(x), round(y)
        w, h = round(w), round(h)

        clip = clips[rect_id]
        clip_path = clip['path']
        positioned_clips.append({
            'id': clip['id'],
            'size': (w, h),
            'pos': (x, y),
            'rot': 0,
        })
        if x < min_x:
            min_x = x
        if y < min_y:
            min_y = y

    # Adjust clips so that 0, 0 is the origin
    for clip in positioned_clips:
        x, y = clip['pos']
        clip['pos'] = [x - min_x, y - min_y]

    return positioned_clips

# Trim blank edges
def trim(img):
    bg = Image.new(mode='RGBA', size=img.size, color=(0,0,0,0))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    else:
        return img

def make_pack(clips):
    """Pack the provided clips into a single image."""
    img_w, img_h = 0, 0

    images = []
    for clip in clips:
        w, h = clip['size']
        w, h = round(w), round(h)
        x, y = clip['pos']
        clip_path = clip['path']
        deg = math.degrees(clip['rot'])
        clip_img = Image.open(clip_path)\
                .convert('RGBA')\
                .resize((w, h), resample=Image.LANCZOS)\
                .rotate(-deg, expand=True, resample=Image.BICUBIC) # Pivot is center of image

        # Adjust position anchor for rotation/change in size
        origin_x = x + w/2
        origin_y = y + h/2
        x = round(origin_x - clip_img.width/2)
        y = round(origin_y - clip_img.height/2)
        images.append((clip_img, (x, y)))

        img_w = max(x + clip_img.width, img_w)
        img_h = max(y + clip_img.height, img_h)

    img = Image.new(mode='RGBA', size=(img_w, img_h), color=(0,0,0,0))
    for clip_img, (x, y) in images:
        img.paste(clip_img, (x, y), clip_img)

    img = trim(img)
    return img

def rotate_image(img, rads):
    deg = math.degrees(rads)
    return img.rotate(-deg, expand=True, resample=Image.BICUBIC)

# ---

# Cut out the specified edge
def cut_edge(im, side, edge_size):
    if side == 'left':
        box = (0, 0, edge_size, im.height)
        crop = (edge_size, 0, im.width, im.height)
    elif side == 'top':
        box = (0, 0, im.width, edge_size)
        crop = (0, edge_size, im.width, im.height)
    elif side == 'bottom':
        box = (0, im.height - edge_size, im.width, im.height)
        crop = (0, 0, im.width, im.height - edge_size)
    elif side == 'right':
        box = (im.width - edge_size, 0, im.width, im.height)
        crop = (0, 0, im.width - edge_size, im.height)

    edge = im.crop(box)
    remaining = im.crop(crop)
    return edge, remaining

# Fade the specified edge
def fade_edge(edge, side, fade_size):
    if fade_size % 2 is not 0:
        fade_size = int(fade_size)
        fade_size += 1

    im_mask = Image.new('L', (edge.size[0] + fade_size, edge.size[1] + fade_size), '#ffffff')

    if side == 'left':
        box = (0, 0, fade_size * 3, im_mask.size[1])
    elif side == 'top':
        box = (0, 0, im_mask.size[0], fade_size * 3)
    elif side == 'bottom':
        box = (0, im_mask.size[1] - fade_size * 3, im_mask.size[0], im_mask.size[1])
    elif side == 'right':
        box = (im_mask.size[0] - fade_size * 3, 0, im_mask.size[0], im_mask.size[1])

    drawmask = ImageDraw.Draw(im_mask)
    drawmask.rectangle(box, fill='#000000')
    im_mask_blur = im_mask.filter(ImageFilter.GaussianBlur(radius=fade_size))
    im_mask_blur_crop = im_mask_blur.crop(box=(int(fade_size / 2), int(fade_size / 2),
                                               im_mask_blur.size[0] - int(fade_size / 2),
                                               im_mask_blur.size[1] - int(fade_size / 2)))
    edge.putalpha(im_mask_blur_crop)
    return edge

# Blend the specified edge to its opposite side,
# to make the texture seamless along that axis.
# For example:
# side=left means cutting the left side and pasting it on the right side.
def blend_edge(im, side, edge_size, fade_size):
    edge, remaining = cut_edge(im, side, edge_size)
    edge = fade_edge(edge, side, fade_size)

    if side == 'left':
        target = (remaining.width - edge_size, 0)
    elif side == 'top':
        target = (0, remaining.height - edge_size)
    elif side == 'bottom':
        target = (0, 0)
    elif side == 'right':
        target = (0, 0)
    else:
        raise Exception('Unrecognized side: "{}"'.format(side))

    host_im = Image.new('RGBA', (remaining.width, remaining.height), '#00000000')
    host_im.paste(edge, target, edge)
    return Image.alpha_composite(remaining, host_im)

# Make a seamless version of the provided image
def make_seamless(im, edges, edge_size, fade_size):
    im = im.convert('RGBA')
    for side in edges:
        im = blend_edge(im, side, edge_size, fade_size)
    return im

def rect_to_points(rect):
    x, y = rect['pos']
    w, h = rect['size']
    theta = rect['rot']
    cx, cy = x + w/2, y + h/2

    # Get rotated points around rect center
    corners = [(x, y), (x+w, y), (x+w, y+h), (x, y+h)]
    return [rotate_point(pt, theta, center=(cx, cy)) for pt in corners]

def rotate_point(point, theta, center=[0,0]):
    x, y = point
    cx, cy = center
    x_ = x - cx
    y_ = y - cy

    rx = x_*math.cos(theta) - y_*math.sin(theta) + cx
    ry = x_*math.sin(theta) + y_*math.cos(theta) + cy
    return rx, ry