"""Save-stable Cataclysm victory quests; no manual checkmark unlocks."""
import json
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1]/'overrides/kubejs/config/cataclysm_campaign.json'

def write_cataclysm(root):
    policy=json.loads(POLICY.read_text())
    data=root.parents[2]/'kubejs/data/expedition'
    quests=[]
    sync=[]
    for row in policy['bosses']:
        n=row['order'];slug=row['entity'].split(':')[1]
        advancement='expedition:cataclysm/'+slug
        path=data/'advancements/cataclysm'/f'{slug}.json'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps({'criteria':{'server_unlock':{'trigger':'minecraft:impossible'}}})+'\n')
        sync.append(f'execute if score $expedition exp_cat matches {n}.. as @a[advancements={{{advancement}=false}}] run advancement grant @s only {advancement}')
        quests.append({'id':f'1C3800000000{n:04X}','title':f'{n} · Cataclysm: '+row['title'],
            'x':float((n-1)*4),'y':0.0,'dependencies':[f'1C3800000000{n-1:04X}'] if n>1 else [],
            'description':['Настоящая победа в выживании, общая для всего сервера. Убийство раньше предыдущего этапа не записывается; команды и творческий режим не засчитываются.',
                'После Игниса открываются порталы и экипировка Divine RPG. Девять боссов основного маршрута продолжат развитие между его измерениями.' if n==8 else 'Подготовьте экипировку, магию, лечение и снабжение. Бой проходите на штатной арене.'],
            'tasks':[{'id':f'2C3800000000{n:04X}','type':'advancement','advancement':advancement}]})
    (root/'chapters/cataclysm.snbt').write_text(json.dumps({'id':'3C38000000000001','filename':'cataclysm','title':'Cataclysm · до Divine RPG','order_index':1,'quests':quests},ensure_ascii=False,indent=2)+'\n')
    path=data/'functions/cataclysm/sync.mcfunction';path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text('\n'.join(sync)+'\n')
    return quests
