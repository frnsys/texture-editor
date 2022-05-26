import requests
from urllib.parse import unquote

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36'
}

def download(url, outfile):
    with requests.get(url, headers=headers, stream=True) as r:
        r.raise_for_status()
        with open(outfile, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)
                    # f.flush()
    return outfile


non_url_safe = ['"', '#', '$', '%', '&', '+',
                    ',', '/', ':', ';', '=', '?',
                    '@', '[', '\\', ']', '^', '`',
                    '{', '|', '}', '~', "'"]

def slugify(s):
    s = unquote(s)
    non_safe = [ch for ch in s if ch in non_url_safe]
    for i in non_safe:
        s = s.replace(i, '')
    return '-'.join(s.split())
