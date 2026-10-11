"""Archive exact Melkor phase entry/return dispatch and geometry QA inputs."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PREFIX='data/animated_java/functions/slb_te/zzzzzzzz/animations/gigant_lightning_bolt_off/'
def main():
 lock=json.loads((ROOT/'mods.lock.json').read_text());mod=next(m for m in lock['mods'] if m['filename'].startswith('Souls_Like_Bosses'));jar=ROOT/'.cache/mods'/mod['filename'];sha=hashlib.sha256(jar.read_bytes()).hexdigest()
 if sha!=mod['hashes']['sha256']:raise ValueError('Pinned SLB SHA mismatch')
 funcs={}
 with zipfile.ZipFile(jar) as z:
  for n in z.namelist():
   if n.startswith(PREFIX) and (n.endswith('tick_animation.mcfunction') or n.endswith('tick.mcfunction') or n.endswith('_effects_0.mcfunction') or any(n.endswith('/leaf_'+str(frame)+suffix+'.mcfunction') for frame in [43,243] for suffix in ['', '_effects_0','_as_bone'])):
    funcs[n]=z.read(n).decode()
  for n in ['data/souls_like_bosses/functions/bosses/te/main.mcfunction','data/souls_like_bosses/functions/bosses/te/soc/main.mcfunction']:
   funcs[n]=z.read(n).decode()
 entry=funcs[PREFIX+'tree/leaf_43_effects_0.mcfunction']
 ret=funcs[PREFIX+'tree/leaf_243_effects_0.mcfunction']
 subset=[l for l in ret.splitlines() if l.strip() and not l.lstrip().startswith('#') and any(x in l for x in [' run ride ',' remove tmp_dismount','scoreboard players set @s boss_phase_change'])]
 if len(subset)!=3:raise ValueError('Unexpected return command subset')
 dest=ROOT/'docs/MELKOR-PHASE-SOURCES-0.34.json'
 dest.write_text(json.dumps({'gameVersion':lock['version'],'jar':{'filename':jar.name,'sha256':sha},'scope':'Pinned functions. QA executes entry effects function and three return transport/state commands only, not complete animation/phase. Frame difference is not measured wall time.','functions':funcs,'entryFunction':PREFIX[5:].replace('/functions/',':')+'tree/leaf_43_effects_0','entryText':entry,'returnTransportCommands':subset,'frameDifference':243-43},ensure_ascii=False,indent=2)+'\n');print(dest)
if __name__=='__main__':main()
