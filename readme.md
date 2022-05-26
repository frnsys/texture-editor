# Overview

This provides a way to quickly get source images, clip parts of them out, and assemble them into textures.

# Setup

```
pip install -r requirements.txt
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
