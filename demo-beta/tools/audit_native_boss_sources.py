"""Collect pinned bytecode for native boss effect acceptance and rune chaining."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
GROUPS={
 'eeeabsmobs':[
 'com.eeeab.eeeabsmobs.sever.entity.EEEABMobEntity',
 'com.eeeab.eeeabsmobs.sever.entity.EEEABMobLibrary',
 'com.eeeab.eeeabsmobs.sever.entity.mob.relicron.EntityAbsRelicron',
 'com.eeeab.eeeabsmobs.sever.entity.mob.relicron.EntityRelicAnnihilator',
 'com.eeeab.eeeabsmobs.sever.entity.mob.relicron.EntityRealmWarden',
 'com.eeeab.eeeabsmobs.sever.entity.util.ModEntityUtils'],
 'The_Graveyard':['com.lion.graveyard.entities.LichEntity'],
 'simplyswords':['net.sweenus.simplyswords.power.GemPowerComponent','net.sweenus.simplyswords.power.powers.SlowPower','net.sweenus.simplyswords.power.powers.OnslaughtPower']}
def main(javap):
 lock=json.loads((ROOT/'mods.lock.json').read_text());jars=[];code={}
 for prefix,classes in GROUPS.items():
  mod=next(m for m in lock['mods'] if m['filename'].lower().startswith(prefix.lower()))
  jar=ROOT/'.cache/mods'/mod['filename'];sha=hashlib.sha256(jar.read_bytes()).hexdigest()
  if sha!=mod['hashes']['sha256']:raise ValueError('Locked JAR mismatch '+jar.name)
  jars.append({'filename':jar.name,'sha256':sha})
  for cls in classes:
   code[cls]=subprocess.run([javap,'-p','-c','-classpath',str(jar),cls],capture_output=True,text=True,check=True).stdout
 dest=ROOT/'docs/NATIVE-BOSS-RUNE-SOURCES-0.32.json'
 dest.write_text(json.dumps({'gameVersion':lock['version'],'scope':'Pinned bytecode, not live boss phases or client combat.','jars':jars,'bytecode':code, 'equipmentGate':{'path':'overrides/kubejs/server_scripts/expedition_equipment_use.js','sha256':hashlib.sha256((ROOT/'overrides/kubejs/server_scripts/expedition_equipment_use.js').read_bytes()).hexdigest(),'text':(ROOT/'overrides/kubejs/server_scripts/expedition_equipment_use.js').read_text()}},ensure_ascii=False,indent=2)+'\n')
 print(dest)
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--javap',default='javap');args=parser.parse_args();main(args.javap)
