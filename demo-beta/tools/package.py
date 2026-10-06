"""Create a source/bootstrap ZIP, never bundle caches, worlds or third-party jars."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
dest=ROOT/'dist/expedition-0.1.0-dev-bootstrap.zip'
dest.parent.mkdir(exist_ok=True)
files=[ROOT/'README.md',ROOT/'mods.lock.json']
files+=list((ROOT/'overrides').rglob('*'))
files += [ROOT/'tools'/name for name in ['install.py','test_install.py','build_quests.py']]
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
    for f in sorted(files):
        if f.is_file(): archive.write(f,Path('expedition-demo')/f.relative_to(ROOT))
print(dest)
