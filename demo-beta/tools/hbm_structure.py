"""Separate acquisition from practice; organise HBM into five production chapters."""
import json

PHASES=[('hbm_industry','HBM I · площадка и металлургия'),('hbm_press','HBM II · пресс и оснастка'),('hbm_components','HBM III · компоненты и обмотки'),('hbm_assembly','HBM IV · сборщик и электроника'),('hbm_operations','HBM V · эксплуатация и контроль')]

def structure_book(root):
    chapters={p.stem:json.loads(p.read_text()) for p in sorted((root/'chapters').glob('*.snbt'))}
    # New chapters are rebuilt from the canonical HBM source on every build.
    for slug,_ in PHASES[1:]:chapters.pop(slug,None)
    split={};report=[]
    for slug,c in chapters.items():
        result=[]
        for q in c['quests']:
            items=[t for t in q['tasks'] if t['type']=='item'];checks=[t for t in q['tasks'] if t['type']=='checkmark']
            if items and checks:
                practice_id='1B'+q['id'][:4]+q['id'][-4:]+'000000';split[q['id']]=practice_id
                original=list(q['description']);q['tasks']=items
                q['description']=[p for p in original if not p.startswith('Зачёт:')]+['Зачёт: автоматически по указанному запасу предметов в инвентаре; вещи сохраняются. Практика находится в следующем отдельном задании.']
                practice={**q,'id':practice_id,'title':q['title']+' · Практика','tasks':checks,'dependencies':[q['id']],'description':[p for p in original if not p.startswith('Зачёт:')]+['Зачёт: только ручная галочка после выполнения практики. Предметные задачи находятся в предыдущем задании.'],'hide_dependency_lines':False}
                practice.pop('icon',None);result.extend([q,practice]);report.append({'itemQuest':q['id'],'practiceQuest':practice_id,'chapter':slug})
            else:result.append(q)
        c['quests']=result
    for c in chapters.values():
        for q in c['quests']:
            if q['id'] in split.values():continue
            q['dependencies']=[split.get(d,d) for d in q.get('dependencies',[])]
            items=[t for t in q['tasks'] if t['type']=='item']
            if items:q['icon']=items[0]['item']
    hbm=chapters['hbm_industry'];groups=[[] for _ in PHASES]
    for q in hbm['quests']:
        # Split IDs retain their original prefix in the report; don't infer it.
        origin=next((r['itemQuest'] for r in report if r['practiceQuest']==q['id']),q['id'])
        n=int(origin[-4:],16);prefix=origin[:2]
        if prefix=='19':
            phase=0 if n<=8 or 44<=n<=47 else 1 if 9<=n<=18 or 48<=n<=51 else 2 if 19<=n<=30 or 52<=n<=58 else 3 if 31<=n<=38 or 59<=n<=62 else 4
        elif prefix=='18':phase={1:0,2:1,3:1,4:3,5:3,6:3,7:2,8:4}[n]
        elif prefix=='16':phase=0 if n<=4 else 1 if n<=10 else 2 if n==11 else 3 if n<=14 else 4
        else:phase=1 if n==2 else 0
        groups[phase].append(q)
    for c in chapters.values():c['order_index']=c.get('order_index',0)*10
    base=hbm['order_index']
    for i,(slug,title) in enumerate(PHASES):
        c=hbm if i==0 else {'id':f'300000000000{0x40+i:04X}','filename':slug}
        c.update(title=title,order_index=base+i,quests=groups[i]);chapters[slug]=c
    welcome=next(q for q in groups[0] if q['id']=='1611000000000001')
    welcome['description']=['HBM разделён на пять глав: I — площадка и металлургия, II — пресс и оснастка, III — компоненты, IV — сборщик и электроника, V — эксплуатация и контроль.','Начните с наковальни и пресса после корпуса MV. Медные пластины позволяют собрать печь; металлургия и компоненты сходятся в электронике.','Квест с предметом проверяет только запас. Следующее задание «Практика» содержит только галочку; выполните его действия до перехода дальше.','Переходы между главами перечислены в подготовке каждого задания. Прежние ID квестов и задач сохранены.']
    allq={q['id']:q for c in chapters.values() for q in c['quests']}
    for c in chapters.values():
        for q in c['quests']:
            q['description']=[p for p in q['description'] if not p.startswith(('После этого:','Подготовка:'))]
            if {t['type'] for t in q['tasks']}=={'checkmark'}:
                q['description']=[p for p in q['description'] if not p.startswith('Зачёт:')]+['Зачёт: только ручная галочка после выполнения действий и проверки результата.']
            deps=q.get('dependencies',[])
            if deps:q['description'].insert(0,'Подготовка: '+'; '.join(allq[d]['title'] for d in deps)+'.')
    for slug,c in chapters.items():
        (root/'chapters'/f'{slug}.snbt').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    (root.parents[3]/'docs/QUEST-TASK-SPLITS-0.20.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report
