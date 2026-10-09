"""Production chains with explicit prerequisites and immutable curriculum keys."""
import json
from pathlib import Path
from expanded_quests import META


def write_deep(root):
    rows=[]
    for line in Path(__file__).with_name('deep_curriculum.tsv').read_text().splitlines():
        if not line or line.startswith('#'):continue
        fields=line.split('|')
        if len(fields)!=10:raise ValueError(f'Expected 10 fields: {line}')
        rows.append(fields)
    chapters={slug:json.loads((root/'chapters'/f'{slug}.snbt').read_text()) for slug in META}
    old=[q for c in chapters.values() for q in c['quests']]
    index={slug:i for i,slug in enumerate(META,1)}
    keys={};titles={q['id']:q['title'] for q in old}
    for slug,key,branch,requires,goals,stage,title,actions,acceptance,diagnosis in rows:
        identity=(slug,key)
        if identity in keys:raise ValueError(f'Duplicate curriculum key: {identity}')
        keys[identity]=f'19{index[slug]:02X}00000000{int(key):04X}'
        titles[keys[identity]]=branch+' · '+title
    summary=[];previous={}
    for slug,key,branch,requires,goals,stage,title,actions,acceptance,diagnosis in rows:
        deps=[]
        for ref in requires.split(';'):
            if ref.startswith('@'):
                anchor_slug,sep,anchor=ref[1:].partition('/')
                if not sep or anchor_slug not in chapters:anchor_slug,anchor=slug,ref[1:]
                candidates=[q for q in chapters[anchor_slug]['quests'] if not q['id'].startswith('19') and any(t.get('item')==anchor for t in q['tasks'])]
                if not candidates:raise ValueError(f'Missing prerequisite {slug}: {ref}')
                deps.append(candidates[-1]['id'])
            else:
                dep_slug,sep,dep_key=ref.partition(':')
                deps.append(keys[(dep_slug,dep_key)] if sep else keys[(slug,ref)])
        if stage:deps.append(f'140000000000{int(stage):04X}')
        tasks=[]
        if goals!='~':
            for n,goal in enumerate(goals.split(';'),1):
                item,_,count=goal.partition('*')
                tasks.append({'id':f'2A{index[slug]:02X}{int(key):04X}{n:08X}','type':'item','item':item,'count':int(count or 1),'consume_items':False})
        tasks.append({'id':f'2A{index[slug]:02X}{int(key):04X}000000FF','type':'checkmark','title':'Практика выполнена · отметить вручную'})
        description=[
            'Цель: '+title+'.',
            'Подготовка: '+'; '.join(titles[d] for d in deps if d in titles)+'. Все требования видны в списке зависимостей.',
            'Порядок работы: '+actions,
            'Готово, когда: '+acceptance,
            'При затруднении: '+diagnosis,
            'Зачёт: предметы проверяются в инвентаре и не расходуются. Практику отметьте вручную после проверки; книга не измеряет производство автоматически.',
        ]
        if stage:description.insert(2,f'Общий этап {stage} обязателен для этого задания; условия рецептов, напряжения и личное развитие сохраняются.')
        if slug=='hbm_industry':description.insert(2,'HBM Modernized 0.2.1-alpha: используйте рецепты установленного порта и подсказки JEI. Собственная энергия HBM не считается автоматически совместимой с EU/FE.')
        show_line=requires==previous.get((slug,branch))
        previous[(slug,branch)]=key
        chapters[slug]['quests'].append({'id':keys[(slug,key)],'title':branch+' · '+title,'description':description,'dependencies':list(dict.fromkeys(deps)),'tasks':tasks,'x':0.0,'y':0.0,'hide_dependency_lines':not show_line})
    for slug,chapter in chapters.items():
        count=sum(r[0]==slug for r in rows)
        if count:
            (root/'chapters'/f'{slug}.snbt').write_text(json.dumps(chapter,ensure_ascii=False,indent=2)+'\n')
            summary.append({'chapter':slug,'added':count})
    return summary
