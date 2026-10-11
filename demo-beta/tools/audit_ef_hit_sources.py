"""Pinned Epic Fight hit dispatch excerpts; no client/collider/timing measurement."""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CLASSES={
 'yesman.epicfight.world.capabilities.entitypatch.LivingEntityPatch':['attack','checkLastAttackSuccess'],
 'yesman.epicfight.world.capabilities.entitypatch.player.PlayerPatch':['attack','getDamageSource'],
 'yesman.epicfight.api.animation.types.AttackAnimation':['hurtCollidingEntities']}
def main(javap):
 lock=json.loads((ROOT/'mods.lock.json').read_text());mod=next(m for m in lock['mods'] if m['slug']=='epic-fight');jar=ROOT/'.cache/mods'/mod['filename'];sha=hashlib.sha256(jar.read_bytes()).hexdigest()
 if sha!=mod['hashes']['sha256']:raise ValueError('Locked EF SHA mismatch')
 excerpts={}
 for cls,names in CLASSES.items():
  t=subprocess.run([javap,'-p','-c','-classpath',str(jar),cls],capture_output=True,text=True,check=True).stdout
  headers=list(re.finditer(r'^  (?:public|protected|private).*\([^\n]*\);$',t,re.M))
  found=[]
  for i,m in enumerate(headers):
   if any(' '+n+'(' in m.group() for n in names):found.append(t[m.start():headers[i+1].start() if i+1<len(headers) else len(t)])
  if len(found)<len(names):raise ValueError('Missing evidence methods '+cls)
  excerpts[cls]=found
 dest=ROOT/'docs/EPIC-FIGHT-HIT-SOURCES-0.33.json';dest.write_text(json.dumps({'gameVersion':lock['version'],'jar':{'filename':jar.name,'sha256':sha},'scope':'Pinned selected bytecode methods. Does not execute collider, animation tick, input, network or real client combat.','methodExcerpts':excerpts},ensure_ascii=False,indent=2)+'\n');print(dest)
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--javap',default='javap');args=parser.parse_args();main(args.javap)
