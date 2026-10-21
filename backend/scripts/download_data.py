from pathlib import Path
from urllib.request import urlretrieve

data_dir = Path(__file__).resolve().parents[1] / "app" / "data"
data_dir.mkdir(parents=True, exist_ok=True)
base = "https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/"
for filename in ("ids.txt", "ucs-strokes.txt"):
    urlretrieve(base + filename, data_dir / filename)
    print("Downloaded", filename)
