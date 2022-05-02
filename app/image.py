import math
import numpy as np
from PIL import Image, ImageDraw
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

def pack(clips, max_side: None|int, out_path: str):
    """Pack the provided clips into a single image."""
    packer = newPacker(mode=PackingMode.Offline, bin_algo=PackingBin.BFF, pack_algo=MaxRectsBl, sort_algo=SORT_DIFF, rotation=False)
    total_area = 0

    scales = []
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

    points = []
    img = Image.new(mode="RGBA", size=(side, side), color=(0,0,0,0))
    for rect in packer.rect_list():
        bin_idx, x, y, w, h, rect_id = rect

        clip_path = clips[rect_id]['path']
        clip_img = Image.open(clip_path)\
                .convert('RGBA')\
                .resize((round(w), round(h)), resample=Image.LANCZOS)
        img.paste(clip_img, (round(x), round(y)), clip_img)
        points.append((x,   y))
        points.append((x+w, y+h))
        points.append((x+w, y))
        points.append((x,   y+h))

    bbox = bounding_box(points)
    img = img.crop(bbox)
    img.save(out_path)