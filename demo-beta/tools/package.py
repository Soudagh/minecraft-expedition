"""Create a source/bootstrap ZIP, never bundle caches, worlds or third-party jars."""
from pathlib import Path
import zipfile
import json
ROOT=Path(__file__).resolve().parents[1]
version=json.loads((ROOT/'mods.lock.json').read_text())['version']
dest=ROOT/('dist/expedition-'+version+'-bootstrap.zip')
dest.parent.mkdir(exist_ok=True)
files=[ROOT/'README.md',ROOT/'mods.lock.json',ROOT/'visuals.lock.json']
files+=list((ROOT/'overrides').rglob('*'))
files+=list((ROOT/'docs').glob('*.md'))
files += [ROOT/'tools'/name for name in ['install.py','compat.py','test_install.py','build_quests.py','quest_branches.py']]
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('expedition-demo/START-HERE.txt', (ROOT/'docs/INSTALL-LEGACY-WINDOWS.md').read_text(encoding='utf-8').encode('utf-8-sig'))
    for f in sorted(files):
        if f.is_file(): archive.write(f,Path('expedition-demo')/f.relative_to(ROOT))
print(dest)
