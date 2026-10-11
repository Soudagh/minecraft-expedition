"""Read exact locked JARs; archive native evidence for the enchant/rune/cadence audit.

Does not change game configuration, lock resolution or recipes.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CLASSES = {
    'epic-fight': {
        'yesman.epicfight.world.capabilities.entitypatch.player.PlayerPatch': ['getAttackSpeed', 'getModifiedAttackSpeed', 'getModifiedStaminaConsume'],
        'yesman.epicfight.world.capabilities.entitypatch.LivingEntityPatch': ['getWeight', 'onJoinWorld'],
        'yesman.epicfight.api.animation.types.AttackAnimation': ['getPlaySpeed', 'lambda$getPlaySpeed'],
        'yesman.epicfight.api.animation.types.BasicAttackAnimation': ['getState', 'bindPhaseState'],
    },
    'simply-swords': {
        'net.sweenus.simplyswords.util.HelperMethods': ['attackScaledDamage', 'abilityScaledDamage', 'gemPowerScaledDamage', 'applyAbilityDamageEnchantments', 'applySpellDamageDiminishingReturns'],
        'net.sweenus.simplyswords.api.AwakeningApi': ['getLevel', 'getAttributeMultiplier', 'getAttackSpeedMultiplier', 'getEffectMultiplier', 'getGemPowerMultiplier', 'isAbilityUnlocked'],
        'net.sweenus.simplyswords.api.AwakeningProfile': ['static {}'],
        'net.sweenus.simplyswords.power.powers.StormlashPower': ['postHit'],
        'net.sweenus.simplyswords.power.powers.SlowPower': ['postHit'],
        'net.sweenus.simplyswords.power.powers.FreezePower': ['postHit'],
        'net.sweenus.simplyswords.power.powers.SwiftnessPower': ['postHit'],
        'net.sweenus.simplyswords.effect.OnslaughtEffect': ['m_6742_'],
        'net.sweenus.simplyswords.power.powers.OnslaughtPower': ['postHit', 'inventoryTick'],
        'net.sweenus.simplyswords.power.powers.RunicSlashPower': ['onSwing'],
        'net.sweenus.simplyswords.world.RunicSlashManager': ['tryFire'],
        'net.sweenus.simplyswords.power.GemPowerComponent': ['postHit', 'inventoryTick'],
    },
    'create-enchantment-industry': {
        'plus.dragons.createenchantmentindustry.common.processing.EnchantmentProcessingRules': ['blazeEnchanterLevelExtension', 'blazeForgerLevelExtension'],
        'plus.dragons.createenchantmentindustry.common.processing.forger.BlazeForgerInventory': ['applyEnchantments', 'incompatibleEnchantments', 'maxEnchantmentLevel'],
    },
}


def method_sections(output, names):
    sections = []
    current = []
    for line in output.splitlines():
        if line.startswith('  ') and not line.startswith('    ') and line.strip():
            if current and any(name in current[0] for name in names):
                sections.append('\n'.join(current).rstrip())
            current = [line]
        else:
            current.append(line)
    if current and any(name in current[0] for name in names):
        sections.append('\n'.join(current).rstrip())
    return sections


def audit(javap):
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    report = {'packVersion': lock['version'], 'scope': 'Static pinned native bytecode and packaged data. Animation timing functions are not measured client cadence or DPS.', 'mods': [], 'overrides': {}}
    for mod in lock['mods']:
        if mod['slug'] not in CLASSES:
            continue
        jar = ROOT / '.cache/mods' / mod['filename']
        digest = hashlib.sha256(jar.read_bytes()).hexdigest()
        if digest != mod['hashes']['sha256']:
            raise ValueError('Unverified JAR: ' + jar.name)
        row = {'slug': mod['slug'], 'filename': jar.name, 'sha256': digest, 'bytecode': {}, 'data': {}}
        for cls, names in CLASSES[mod['slug']].items():
            output = subprocess.run([javap, '-p', '-c', '-classpath', str(jar), cls], text=True, capture_output=True, check=True).stdout
            row['bytecode'][cls] = method_sections(output, names)
        with zipfile.ZipFile(jar) as archive:
            for name in sorted(archive.namelist()):
                if name.endswith('.json') and ('enchantment_processing/rules.json' in name or name.startswith('data/simplyswords/recipes/runic')):
                    row['data'][name] = json.loads(archive.read(name))
        report['mods'].append(row)
    for path in [ROOT / 'overrides/defaultconfigs/create_enchantment_industry-server.toml', ROOT / 'overrides/config/simplyswords/gem_powers.toml']:
        report['overrides'][str(path.relative_to(ROOT))] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'text': path.read_text()}
    report['weaponCapabilities'] = {path.stem: json.loads(path.read_text()) for path in sorted((ROOT / 'overrides/kubejs/data/simplyswords/capabilities/weapons').glob('*.json'))}
    dest = ROOT / 'docs/ENCHANT-RUNE-CADENCE-SOURCES-0.27.json'
    dest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(dest)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--javap', default='javap')
    audit(parser.parse_args().javap)
