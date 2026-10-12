"""Extend locked native fusion recipes; preserve upgrades, energy and tiers."""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build():
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    mod = next(m for m in lock['mods'] if m['slug'] == 'draconic-evolution')
    rows = []
    with zipfile.ZipFile(ROOT / '.cache/mods' / mod['filename']) as jar:
        for name in sorted(jar.namelist()):
            if not name.startswith('data/draconicevolution/recipes/tools/') or not name.endswith('.json'):
                continue
            original = json.loads(jar.read(name))
            if original['type'] != 'draconicevolution:fusion_crafting':
                continue
            tier = original['tier']
            motor = 'gtceu:zpm_electric_motor' if tier == 'WYVERN' else 'gtceu:uv_electric_motor'
            extras = [motor, 'botania:gaia_ingot', 'hbm_m:schrabidium_powder'] * (2 if tier == 'CHAOTIC' else 1)
            original['ingredients'].extend({'item': item} for item in extras)
            path = ROOT / 'overrides/kubejs' / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(original, indent=2) + '\n')
            rows.append({'recipe': name[5:-5].replace('/recipes/', '/'), 'output': original['result']['item'], 'tier': tier, 'added': extras, 'injectors': len(original['ingredients'])})
    (ROOT / 'docs/DRACONIC-RECIPE-MANIFEST.json').write_text(json.dumps(rows, indent=2) + '\n')
    return rows

if __name__ == '__main__':
    print('Extended fusion recipes:', len(build()))
