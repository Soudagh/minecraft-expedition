"""Add campaign supply to two drinks without changing keg slots or native fluids."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DRINKS = {
    'saccharine_rum_from_mead': ('minecraft:melon', 'sweet_fermentation_starter', 'champion', 2),
    'red_rum_from_bloody_mary': ('minecraft:shroomlight', 'combat_fermentation_starter', 'lothric', 3),
}


def build(jar, root=ROOT):
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    mod = next(m for m in lock['mods'] if m['filename'].startswith('BrewinAndChewin-'))
    if hashlib.sha256(jar.read_bytes()).hexdigest() != mod['hashes']['sha256']:
        raise ValueError('BrewinAndChewin JAR differs from mods.lock.json')
    report = {'sourceSha256': mod['hashes']['sha256'], 'recipes': {}, 'starters': {}}
    with zipfile.ZipFile(jar) as archive:
        for name, (ingredient, starter, material, stage) in DRINKS.items():
            native = json.loads(archive.read(f'data/brewinandchewin/recipes/fermenting/{name}.json'))
            replacement = {'item': 'kubejs:' + starter}
            index = native['ingredients'].index({'item': ingredient})
            native['ingredients'][index] = replacement
            path = root / f'overrides/kubejs/data/brewinandchewin/recipes/fermenting/{name}.json'
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(native, indent=2) + '\n')
            report['recipes']['brewinandchewin:fermenting/' + name] = native
            report['starters']['kubejs:' + starter] = {
                'ingredient': ingredient, 'material': 'kubejs:material_' + material,
                'stage': stage, 'drink': native['result']['fluid']}
    path = root / 'docs/KITCHEN-BALANCE-SOURCES.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jar', type=Path, default=ROOT / '.cache/mods/BrewinAndChewin-1.20.1-3.2.1.jar')
    args = parser.parse_args()
    print(f'Generated {len(build(args.jar)["recipes"])} drink recipes')
