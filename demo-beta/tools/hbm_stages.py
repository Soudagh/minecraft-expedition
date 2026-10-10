"""Explicit stable curriculum for all implemented HBM stages and bounded workshops."""
import json
from pathlib import Path
from hbm_structure import PHASES

FIELDS=('phase','key','title','requires','goals','stage','actions','acceptance','diagnosis','recipes','mode')
def rows():
    result=[]
    for line in Path(__file__).with_name('hbm_stages.tsv').read_text().splitlines():
        if not line or line.startswith('#'):continue
        fields=line.split('|')
        if len(fields)!=len(FIELDS):raise ValueError('Invalid HBM stage row: '+line)
        result.append(dict(zip(FIELDS,fields)))
    return result

def quest_id(key,practice=False):return f'1C{int(key):06X}{1 if practice else 0:08X}'
def deep_id(key):return f'191100000000{int(key):04X}'
def practice_of(qid):return '1B'+qid[:4]+qid[-4:]+'000000'

def write_stages(root):
    curriculum=rows();by_key={r['key']:r for r in curriculum}
    if len(by_key)!=len(curriculum):raise ValueError('Duplicate HBM stage key')
    chapters={p.stem:json.loads(p.read_text()) for p in (root/'chapters').glob('*.snbt')}
    base=chapters['hbm_industry']['order_index']
    for phase,(slug,title) in enumerate(PHASES[5:],5):
        chapters[slug]={'id':f'300000000000{0x40+phase:04X}','filename':slug,'title':title,'order_index':base+phase,'quests':[]}
    existing={q['id']:q for c in chapters.values() for q in c['quests']}
    def completion(ref):
        if ref.startswith('d:'):
            qid=deep_id(ref[2:]);return practice_of(qid) if practice_of(qid) in existing else qid
        row=by_key[ref];return quest_id(ref,row['goals']!='~')
    all_titles={**{q['id']:q['title'] for q in existing.values()},**{quest_id(r['key'],r['goals']!='~'):r['title']+(' · Практика' if r['goals']!='~' else '') for r in curriculum}}
    summary=[]
    for r in curriculum:
        phase=int(r['phase']);slug=PHASES[phase][0];key=int(r['key']);mode=r['mode']
        if mode not in ('production','workshop','survey'):raise ValueError('Unknown mode: '+mode)
        deps=list(dict.fromkeys([completion(d) for d in r['requires'].split(';')]+[f'140000000000{int(r["stage"]):04X}']))
        if any(d not in all_titles and not d.startswith('14') for d in deps):raise ValueError('Unknown prerequisite: '+r['key'])
        description=['Цель: '+r['title']+'.','Подготовка: '+'; '.join(all_titles.get(d,'Общий этап '+r['stage']) for d in deps)+'.', 'Порядок работы: '+r['actions'],'Готово, когда: '+r['acceptance'],'При затруднении: '+r['diagnosis']]
        if mode=='workshop':description.insert(1,'Учебный стенд: выполняйте опыт в отдельной копии мира. Творческие экземпляры допустимы только здесь; такой зачёт не подтверждает доступность производства в выживании.')
        elif mode=='survey':description.insert(1,'Исследование: проверяйте действующие рецепты и источники в установленном порте. Отметка означает составленный паспорт; отсутствующий рецепт запишите как пробел, а не как выполненный крафт.')
        if r['recipes']!='~':description.append('Рецепты установленного HBM: '+'; '.join('hbm_m:'+n for n in r['recipes'].split(';'))+'.')
        description.append('Параметры и энергия HBM проверяются в установленном порте; значения EU/FE не подставляются автоматически.')
        tasks=[]
        if r['goals']!='~':
            if mode!='production':raise ValueError('Workshop/survey must not require survival items')
            for i,goal in enumerate(r['goals'].split(';'),1):
                item,_,count=goal.partition('*');tasks.append({'id':f'2B{key:06X}{i:08X}','type':'item','item':item,'count':int(count or 1),'consume_items':False})
        q={'id':quest_id(key),'title':r['title'],'dependencies':deps,'description':description.copy(),'tasks':tasks or [{'id':f'2B{key:06X}000000FF','type':'checkmark','title':'Действия выполнены · отметить вручную'}],'x':0.,'y':0.,'hide_dependency_lines':False}
        if tasks:
            q['icon']=tasks[0]['item'];q['description'].append('Зачёт: только наличие указанного запаса в инвентаре; вещи сохраняются. Практика — отдельная следующая карточка.')
            practice={**q,'id':quest_id(key,True),'title':q['title']+' · Практика','dependencies':[q['id']],'description':description+['Зачёт: ручная галочка после выполнения действий и проверки результата.'],'tasks':[{'id':f'2B{key:06X}000000FF','type':'checkmark','title':'Практика выполнена · отметить вручную'}]};practice.pop('icon');chapters[slug]['quests'].extend([q,practice])
        else:
            q['description'].append('Зачёт: ручная галочка после выполнения действий и записи результата.');chapters[slug]['quests'].append(q)
        summary.append({**r,'chapter':slug,'quest':q['id'],'completion':quest_id(key,bool(tasks)),'dependencies':deps})
    for slug,c in chapters.items():
        (root/'chapters'/f'{slug}.snbt').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    (root.parents[3]/'docs/HBM-STAGES-0.22.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    return summary
