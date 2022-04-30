import math
import numpy as np
from PIL import Image, ImageDraw
from rectpack import newPacker, PackingMode, MaxRectsBl, PackingBin, SORT_LSIDE

def bounding_box(points: list[tuple[float, float]]):
    """Calculate bounding box for a list of points."""
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs), max(ys)

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

def pack(clips, out_path: str):
    """Pack the provided clips into a single image."""
    packer = newPacker(mode=PackingMode.Offline, bin_algo=PackingBin.BFF, pack_algo=MaxRectsBl, sort_algo=SORT_LSIDE, rotation=True)
    total_area = 0
    for i, clip in enumerate(clips):
        bbox = bounding_box(clip['points'])
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
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
        clip_img = Image.open(clip_path).convert('RGBA')
        img.paste(clip_img, (x, y), clip_img)
        points.append((x,   y))
        points.append((x+w, y+h))
        points.append((x+w, y))
        points.append((x,   y+h))

    bbox = bounding_box(points)
    img = img.crop(bbox)
    img.save(out_path)