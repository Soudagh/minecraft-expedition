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
files+=[ROOT/'docs/COMBAT-SOURCES.json']
files+=list((ROOT/'docs').glob('SPELL-STATS-*.json'))
files+=list((ROOT/'docs').glob('OFFENSIVE-STATS-*.json'))
files+=list((ROOT/'docs').glob('SWORD-SKILL-STATS-*.json'))
files+=[ROOT/'docs/SWORD-SOARING-PARAMETERS.json',ROOT/'docs/QUEST-CURRICULUM-0.17.json',ROOT/'docs/QUEST-BOOK-RESULTS-0.17.json',ROOT/'docs/QUEST-CURRICULUM-0.18.json',ROOT/'docs/QUEST-LAYOUT-0.18.json',ROOT/'docs/QUEST-BOOK-RESULTS-0.18.json']
files+=list((ROOT/'docs').glob('*0.19.json'))
files+=list((ROOT/'docs').glob('*0.19.svg'))
files+=list((ROOT/'docs').glob('*0.20.*'))
files+=list((ROOT/'docs').glob('*0.21.*'))
files+=list((ROOT/'docs').glob('*0.22.*'))
files+=list((ROOT/'docs').glob('*0.23.*'))
files+=[ROOT/'docs/INDUSTRY-BALANCE-SOURCES.json',ROOT/'docs/KITCHEN-BALANCE-SOURCES.json']
files+=list((ROOT/'docs').glob('*0.24.*'))
files+=list((ROOT/'docs').glob('*0.25.*'))
files+=list((ROOT/'docs').glob('*0.26.*'))
for audit_version in ['0.27','0.28','0.29','0.30','0.31','0.32','0.33','0.34']:
    files+=list((ROOT/'docs').glob('*'+audit_version+'.json'))
files+=list((ROOT/'qa').rglob('*'))
files+=list((ROOT/'docs').glob('*0.35.json'))
files+=list((ROOT/'docs').glob('*0.36.json'))
files+=list((ROOT/'docs').glob('*0.37.json'))
files+=list((ROOT/'docs').glob('*0.38.json'))
files += [ROOT/'tools'/name for name in ['cataclysm_quests.py','final_boss_quests.py','test_cataclysm_campaign.py','cataclysm_divine_probe.js','final_boss_probe.js']]
files += [ROOT/'tools/final_quests.py',ROOT/'tools/late_balance_probe.js']
files += [ROOT/'tools/divine_balance_probe.js']
files += [ROOT/'tools'/name for name in ['divine_quests.py','build_divine_probe_sources.py','build_hbm_peaceful.py','divine_team_probe.js','test_divine_integration.py']]
files += [ROOT/'tools'/name for name in ['build_melkor_phase_sources.py','melkor_phase_geometry_probe.js','build_slb_hitbox_fixtures.py','audit_ef_hit_sources.py','slb_hitbox_probe.js','audit_boss_control_sources.py','audit_native_boss_sources.py','boss_rune_probe.js','audit_enchant_rune_sources.py','audit_rune_socket_sources.py','build_gem_economy.py','combat_capture_server.js','combat_capture_startup.js','enchant_rune_cadence_probe.js','gem_economy_probe.js','onslaught_cycle_probe.js','rune_socket_probe.js','summarize_combat_capture.py']]
files += [ROOT/'tools'/name for name in ['equipment_combat_probe.js','food_sustain_probe.js','build_kitchen_balance.py','test_kitchen_balance.py','kitchen_energy_probe.js','build_industry_balance.py','test_industry_balance.py','industry_balance_probe.js','install.py','compat.py','test_install.py','build_quests.py','quest_branches.py','full_quests.py','validate_quests.py','progression.py','build_progression.py','test_progression.py','audit_combat_sources.py','equipment_quests.py','spell_balance_probe.js','offensive_balance_probe.js','sword_skill_probe.js','quest_book_probe.js','expanded_quests.py','quest_curriculum.tsv','core_quests.py','core_curriculum.tsv','deep_quests.py','deep_curriculum.tsv','quest_connections.py','hbm_structure.py','test_hbm_structure.py','hbm_stages.py','hbm_stages.tsv','test_hbm_stages.py','hbm_stage_probe.js','quest_text_budget.py','test_quest_text_budget.py','quest_sync_probe.js','quest_graph_preview.py','test_quest_connections.py','hbm_quest_probe.js','quest_layout.py','test_quest_layout.py']]
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('expedition-demo/START-HERE.txt', (ROOT/('docs/INSTALL-0.38.md' if version.startswith('0.38.') else 'docs/INSTALL-0.37.md' if version.startswith('0.37.') else 'docs/INSTALL-LEGACY-WINDOWS.md')).read_text(encoding='utf-8').encode('utf-8-sig'))
    for f in sorted(set(files)):
        if f.is_file(): archive.write(f,Path('expedition-demo')/f.relative_to(ROOT))
print(dest)

# Small update: the payload must include balance changes for industry versions.
if version.startswith(('0.23.','0.24.','0.25.','0.26.')):
    patch=ROOT/('dist/expedition-'+version+'-balance-patch.zip')
    selected=[ROOT/'overrides/kubejs/server_scripts'/name for name in
              ['expedition_industry.js','expedition_progression.js']]
    selected+=list((ROOT/'overrides/kubejs/data/hbm_m/recipes').glob('*.json'))
    if version.startswith(('0.24.','0.25.','0.26.')):
        selected += [ROOT/'overrides/kubejs/startup_scripts/expedition_kitchen.js',
                     ROOT/'overrides/kubejs/server_scripts/expedition_kitchen_recipes.js']
        selected += list((ROOT/'overrides/kubejs/data/brewinandchewin/recipes/fermenting').glob('*.json'))
    if version.startswith(('0.25.','0.26.')):
        selected += [ROOT/'overrides/kubejs/client_scripts/expedition_kitchen_tooltips.js']
    if version.startswith('0.26.'):
        selected += [ROOT/'overrides/kubejs/server_scripts/expedition_equipment_use.js',
                     ROOT/'overrides/kubejs/client_scripts/expedition_equipment_tooltips.js']
    update = '0.26' if version.startswith('0.26.') else '0.25' if version.startswith('0.25.') else '0.24' if version.startswith('0.24.') else '0.23'
    with zipfile.ZipFile(patch,'w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('UPDATE-'+update+'.txt',(ROOT/('docs/UPDATE-'+update+'.md')).read_text(encoding='utf-8').encode('utf-8-sig'))
        if version.startswith(('0.24.','0.25.','0.26.')):
            archive.writestr('KITCHEN-BALANCE.md',(ROOT/'docs/KITCHEN-BALANCE.md').read_bytes())
        if version.startswith(('0.25.','0.26.')):
            archive.writestr('FOOD-SUSTAIN.md',(ROOT/'docs/FOOD-SUSTAIN.md').read_bytes())
        if version.startswith('0.26.'):
            archive.writestr('EQUIPMENT-COMBAT-BALANCE.md',(ROOT/'docs/EQUIPMENT-COMBAT-BALANCE.md').read_bytes())
        archive.writestr('INDUSTRY-BALANCE.md',(ROOT/'docs/INDUSTRY-BALANCE.md').read_bytes())
        for f in sorted(selected):archive.write(f,f.relative_to(ROOT/'overrides'))
elif not version.startswith(('0.35.','0.36.','0.37.','0.38.')):
    patch=ROOT/('dist/expedition-'+version+'-quests-patch.zip')
    quest_root=ROOT/'overrides/config/ftbquests/quests'
    with zipfile.ZipFile(patch,'w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('UPDATE-0.22.txt',(ROOT/'docs/UPDATE-0.22.md').read_text(encoding='utf-8').encode('utf-8-sig'))
        for f in sorted(quest_root.rglob('*')):
            if f.is_file():archive.write(f,f.relative_to(ROOT/'overrides'))
if not version.startswith(('0.35.','0.36.','0.37.','0.38.')):
    print(patch)
