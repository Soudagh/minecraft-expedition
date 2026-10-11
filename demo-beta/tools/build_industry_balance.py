"""Preserve locked HBM machine costs and append a GT hull; no material conversions."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
# Same native recipe IDs retain templates and JEI references.
MACHINES = {
    'battery': 'mv', 'shredder': 'mv', 'compressor': 'mv',
    'centrifuge': 'mv', 'chemical_plant': 'mv', 'refinery': 'mv',
    'gas_centrifuge': 'hv', 'turbine': 'hv', 'industrial_turbine': 'hv',
    'zirnox': 'ev', 'rbmk': 'ev',
}


def build(jar, root=ROOT):
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    mod = next(m for m in lock['mods'] if m['slug'] == 'hbms-nuclear-tech-modernized')
    if hashlib.sha256(jar.read_bytes()).hexdigest() != mod['hashes']['sha256']:
        raise ValueError('HBM JAR differs from mods.lock.json')
    report = {'sourceSha256': mod['hashes']['sha256'], 'recipes': {}}
    with zipfile.ZipFile(jar) as archive:
        for name, tier in MACHINES.items():
            native = json.loads(archive.read(f'data/hbm_m/recipes/{name}.json'))
            if native['type'] != 'hbm_m:assembler' or len(native['ingredients']) >= 12:
                raise ValueError(f'Unsupported native recipe {name}')
            hull = f'gtceu:{tier}_machine_hull'
            native['ingredients'].append({'count': 1, 'item': hull})
            target = root / f'overrides/kubejs/data/hbm_m/recipes/{name}.json'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(native, indent=2) + '\n')
            report['recipes'][f'hbm_m:{name}'] = native
    target = root / 'docs/INDUSTRY-BALANCE-SOURCES.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jar', type=Path, default=ROOT / '.cache/mods/hbm_m-0.2.1-alpha+1.20.1-forge.jar')
    args = parser.parse_args()
    print(f'Generated {len(build(args.jar)["recipes"])} HBM recipes')
