"""Extract exact summon NBT from pinned SLB; fixtures are QA inputs, not live bosses."""
import hashlib,json,re,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SELECT={
 'watchers-start':'data/souls_like_bosses/functions/bosses/aw/boss_start.mcfunction',
 'watchers-transition':'data/animated_java/functions/slb_aw/zzzzzzzz/animations/phase_change/tree/leaf_284_effects_0.mcfunction',
 'lothric-start':'data/souls_like_bosses/functions/bosses/lothran/init_lothian.mcfunction',
 'lothric-resummon':'data/animated_java/functions/lothran_boss_test_1/zzzzzzzz/animations/idle_end_tp_away/tree/leaf_32_effects_0.mcfunction',
 'sunflower-start':'data/animated_java/functions/gigant_sunflower/zzzzzzzz/animations/idle/tree/leaf_5_effects_0.mcfunction',
 'sunflower-transition':'data/animated_java/functions/gigant_sunflower/zzzzzzzz/animations/third_phase_transition/tree/leaf_650_effects_0.mcfunction',
 'cinder-start':'data/souls_like_bosses/functions/bosses/soc/boss_start.mcfunction',
 'nightlord-start':'data/souls_like_bosses/functions/bosses/nl/boss_start.mcfunction',
 'melkor-start':'data/souls_like_bosses/functions/bosses/te/boss_start.mcfunction'}
def main():
 lock=json.loads((ROOT/'mods.lock.json').read_text());mod=next(m for m in lock['mods'] if m['filename'].startswith('Souls_Like_Bosses'));jar=ROOT/'.cache/mods'/mod['filename'];sha=hashlib.sha256(jar.read_bytes()).hexdigest()
 if sha!=mod['hashes']['sha256']:raise ValueError('Pinned SLB hash mismatch')
 rows=[];resistance={}
 with zipfile.ZipFile(jar) as z:
  for label,name in SELECT.items():
   lines=[l for l in z.read(name).decode().splitlines() if l.strip() and not l.lstrip().startswith('#')]
   candidates=[l for l in lines if re.search(r'\bsummon (cow|slime) ',l)]
   if not candidates:raise ValueError('No fixture summon '+name)
   line=candidates[0];kind=re.search(r'\bsummon (cow|slime) ',line).group(1)
   rows.append({'fixture':label,'entity':'minecraft:'+kind,'source':name,'command':line,'snbt':line[line.index('{'):],'executedFullFunction':False})
  for n in z.namelist():
   if not n.endswith('.mcfunction'):continue
   lines=[l for l in z.read(n).decode().splitlines() if not l.lstrip().startswith('#') and 'resistance' in l and ('effect give' in l or 'effect clear' in l)]
   if lines and ('bosses/' in n or '/animations/' in n):resistance[n]=lines
  phase_source='data/animated_java/functions/slb_te/zzzzzzzz/animations/gigant_lightning_bolt_off/tree/leaf_43_effects_0.mcfunction'
  phase_command=next(l for l in z.read(phase_source).decode().splitlines() if not l.lstrip().startswith('#') and 'effect give' in l and 'resistance 10 250 true' in l)
  melkor=dict(next(row for row in rows if row['fixture']=='melkor-start'))
  melkor.update({'fixture':'melkor-lightning-resistance250','extraEffect':{'effect':'minecraft:resistance','durationTicks':200,'amplifier':250,'source':phase_source,'command':phase_command},'scope':'Start hitbox NBT plus exact effect-command parameters. Keyframe conditions/timing and full animation are not executed.'})
  rows.append(melkor)
 dest=ROOT/'docs/SLB-HITBOX-FIXTURES-0.33.json';dest.write_text(json.dumps({'gameVersion':lock['version'],'jar':{'filename':jar.name,'sha256':sha},'scope':'Exact summon NBT only. Command conditions, riding/root, scoreboards, full functions and live phase transitions are not executed.','fixtures':rows,'resistanceCommands':resistance},ensure_ascii=False,indent=2)+'\n');print(dest,len(rows),'fixtures')
if __name__=='__main__':main()
