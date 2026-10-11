"""Prepare opt-in native QA inputs in a disposable installed server instance."""
import argparse,json,shutil
from pathlib import Path
from divine_quests import DIMENSIONS
ROOT=Path(__file__).resolve().parents[1]
def build(instance):
    instance=Path(instance)
    if not (instance/'expedition-installed.json').is_file():raise ValueError('Use an installed disposable instance')
    chapter=json.loads((ROOT/'overrides/config/ftbquests/quests/chapters/divine_rpg.snbt').read_text())
    items={t['item'] for q in chapter['quests'] for t in q['tasks'] if t['type']=='item'}
    items.update('divinerpg:raw_'+m for m in ['realmite','arlemite','rupee'])
    recipes=['twilight_clock','divine_rock','arcana_portal_frame']+[r+'_chunk' for r in ['eden','wildwood','apalachia','skythern','mortum']]+['crushing_'+m+'_ore'+suffix for m in ['realmite','arlemite','rupee'] for suffix in ['','_deepslate']]
    data={'items':sorted(items),'recipes':['expedition:divine/'+r for r in recipes],'dimensions':[{'id':'divinerpg:'+r,'stage':s} for r,_,s in DIMENSIONS]}
    out=instance/'kubejs/export/divine-probe-sources.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(data,indent=2)+'\n')
    shutil.copy2(ROOT/'tools/divine_team_probe.js',instance/'kubejs/server_scripts/zz_divine_team_probe.js')
    shutil.copy2(ROOT/'tools/quest_sync_probe.js',instance/'kubejs/server_scripts/zz_quest_sync_probe.js')
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--instance',type=Path,required=True);args=parser.parse_args();build(args.instance)
