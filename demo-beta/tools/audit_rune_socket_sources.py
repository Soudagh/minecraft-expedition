"""Archive pinned native evidence for rune sockets, forge and reroll behavior."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CLASSES = [
    'item.UniqueWeaponItem', 'item.custom.BrimstoneClaymoreItem', 'api.SimplySwordsAPI', 'power.PowerType', 'power.GemPowerComponent', 'power.GemPowerFiller',
    'power.RunicGemPower', 'power.RunefusedGemPower',
    'api.AdditionalGemSocketApi', 'api.AwakeningApi', 'api.AwakeningFormRegistry',
    'screen.RunicForgeScreenHandler',
    'screen.RunicForgeScreenHandler$WeaponSlot',
    'screen.RunicForgeScreenHandler$RunicGemSlot',
    'screen.RunicForgeScreenHandler$NetherGemSlot',
    'recipe.RunicRerollRecipe', 'item.RunicSwordItem',
    'item.RunefusedGemItem', 'item.NetherfusedGemItem',
    'registry.GemPowerRegistry', 'power.powers.OnslaughtPower', 'power.powers.SlowPower',
]


def audit(javap, runtime_config):
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    mod = next(m for m in lock['mods'] if m['slug'] == 'simply-swords')
    jar = ROOT / '.cache/mods' / mod['filename']
    digest = hashlib.sha256(jar.read_bytes()).hexdigest()
    if digest != mod['hashes']['sha256']:
        raise ValueError('Unverified JAR: ' + jar.name)
    report = {
        'gameVersion': lock['version'],
        'scope': 'Pinned native bytecode and packaged recipes. QA supplies forge inputs; not observed loot economics or client cadence.',
        'jar': {'filename': jar.name, 'sha256': digest},
        'bytecode': {}, 'recipes': {},
    }
    for cls in CLASSES:
        result = subprocess.run([javap, '-p', '-c', '-classpath', str(jar),
                                 'net.sweenus.simplyswords.' + cls],
                                capture_output=True, text=True, check=True)
        report['bytecode'][cls] = result.stdout
    with zipfile.ZipFile(jar) as archive:
        for name in sorted(archive.namelist()):
            if name.startswith('data/simplyswords/recipes/') and name.endswith('.json') and any(k in name for k in ['runic', 'gem']):
                report['recipes'][name] = json.loads(archive.read(name))
    gate = ROOT / 'overrides/kubejs/server_scripts/expedition_equipment_use.js'
    report['equipmentGate'] = {'path': str(gate.relative_to(ROOT)), 'sha256': hashlib.sha256(gate.read_bytes()).hexdigest(), 'text': gate.read_text()}
    if runtime_config:
        report['runtimeGeneralConfig'] = Path(runtime_config).read_text()
    dest = ROOT / 'docs/RUNE-SOCKET-SOURCES-0.29.json'
    dest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(dest)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--javap', default='javap')
    parser.add_argument('--runtime-config')
    args = parser.parse_args()
    audit(args.javap, args.runtime_config)
