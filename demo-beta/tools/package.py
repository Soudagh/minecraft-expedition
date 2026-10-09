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
files += [ROOT/'tools'/name for name in ['install.py','compat.py','test_install.py','build_quests.py','quest_branches.py','full_quests.py','validate_quests.py','progression.py','build_progression.py','test_progression.py','audit_combat_sources.py','equipment_quests.py','spell_balance_probe.js','offensive_balance_probe.js','sword_skill_probe.js','quest_book_probe.js','expanded_quests.py','quest_curriculum.tsv','core_quests.py','core_curriculum.tsv','deep_quests.py','deep_curriculum.tsv','quest_connections.py','hbm_structure.py','test_hbm_structure.py','hbm_stages.py','hbm_stages.tsv','test_hbm_stages.py','hbm_stage_probe.js','quest_graph_preview.py','test_quest_connections.py','hbm_quest_probe.js','quest_layout.py','test_quest_layout.py']]
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('expedition-demo/START-HERE.txt', (ROOT/'docs/INSTALL-LEGACY-WINDOWS.md').read_text(encoding='utf-8').encode('utf-8-sig'))
    for f in sorted(set(files)):
        if f.is_file(): archive.write(f,Path('expedition-demo')/f.relative_to(ROOT))
print(dest)
