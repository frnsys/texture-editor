import math
import numpy as np
from PIL import Image, ImageDraw, ImageChops
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
def clip(img_path: str, points: list[tuple[float, float]], out_path: str):
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
    new_img.save(out_path)

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

def make_pack(clips, out_path: str):
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
    img.save(out_path)