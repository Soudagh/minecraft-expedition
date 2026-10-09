"""Explain curriculum dependencies and remove redundant edges without changing tasks."""
import json


def connect_book(root):
    chapters={p.stem:json.loads(p.read_text()) for p in sorted((root/'chapters').glob('*.snbt'))}
    quests={q['id']:q for c in chapters.values() for q in c['quests']}
    changes=[]
    def item(slug,name):
        matches=[q for q in chapters[slug]['quests'] if not q['id'].startswith(('18','19')) and any(t.get('item')==name for t in q['tasks'])]
        if not matches:raise ValueError(f'Missing connection anchor {slug}/{name}')
        return next((q for q in matches if q['id'].startswith('16')),matches[0])
    def link(slug,target,parents,reason,replace=False):
        q=item(slug,target)
        deps=[item(s,i)['id'] for s,i in parents]
        if not replace:deps=q.get('dependencies',[])+deps
        q['dependencies']=list(dict.fromkeys(deps))
        # Explicit preparation is more useful than unexplained crossing lines.
        q['hide_dependency_lines']=True
        q['description'].append('Связь производства: '+reason+' Подготовка: '+'; '.join(quests[d]['title']+' ['+next(c['title'] for c in chapters.values() if quests[d] in c['quests'])+']' for d in q['dependencies'])+'.')
        changes.append({'quest':q['id'],'reason':reason})
    rules=[
        ('create_workshop','create:brass_casing',[('create_workshop','create:zinc_ingot'),('create_workshop','create:mechanical_mixer'),('create_workshop','create:basin')],'Латунь соединяет цинк, нагрев и смешивание.'),
        ('create_workshop','create:brass_tunnel',[('create_workshop','create:brass_casing')],'Латунная логистика следует после освоения латуни.'),
        ('create_workshop','create:crushing_wheel',[('create_workshop','create:mechanical_crafter')],'Дробильная пара требует механической сборки.'),
        ('create_workshop','create:rotation_speed_controller',[('create_workshop','create:precision_mechanism')],'Регулятор использует точный механизм; паровой привод остаётся отдельным проектом.'),
        ('botania_supply','botania:livingwood_log',[('botania_supply','botania:pure_daisy')],'Живое дерево получают у чистой маргаритки.'),
        ('botania_supply','botania:mana_pool',[('botania_supply','botania:twig_wand'),('botania_supply','botania:mana_spreader'),('botania_supply','botania:endoflame')],'Рабочий бассейн связывает генерацию, передачу и настройку маны.'),
        ('botania_supply','botania:mana_pearl',[('botania_supply','botania:mana_pool')],'Материалы бассейна требуют подготовленной системы маны.'),
        ('botania_supply','botania:rune_fire',[('demo','botania:runic_altar')],'Руны изготавливаются на алтаре, а не в обычном верстаке.'),
        ('storage','refinedstorage:cable',[('storage','refinedstorage:controller')],'Подключения осваиваются после контроллера сети.'),
        ('storage','refinedstorage:pattern_grid',[('storage','refinedstorage:controller'),('storage','refinedstorage:crafter')],'Шаблоны нужны работающей сети с исполнителем автокрафта.'),
        ('hbm_industry','hbm_m:stamp_iron_plate',[('hbm_industry','hbm_m:anvil_iron')],'Оснастку сначала готовят на рабочем месте HBM.'),
        ('hbm_industry','hbm_m:plate_iron',[('hbm_industry','hbm_m:press')],'Штамп и пресс совместно обеспечивают выпуск пластин.'),
        ('hbm_industry','hbm_m:plate_lead',[('hbm_industry','hbm_m:lead_ingot')],'Свинцовой форме нужен запас свинца HBM.'),
        ('hbm_industry','hbm_m:plate_steel',[('hbm_industry','hbm_m:steel_ingot')],'Стальная партия использует металлургическую ветвь.'),
    ]
    for args in rules:link(*args)
    # Each raw processor uses its own metal but shares silicon and binding.
    for out in ['basic','improved','advanced']:
        link('storage',f'refinedstorage:raw_{out}_processor',[('storage','refinedstorage:silicon'),('storage','refinedstorage:processor_binding')],'Заготовки трёх типов имеют общий кремний и связку, но не расходуют друг друга.',True)
    # Remove false dependencies between independently processed RS types.
    for out,raw in [('basic','raw_basic'),('improved','raw_improved'),('advanced','raw_advanced')]:
        link('storage',f'refinedstorage:{out}_processor',[('storage',f'refinedstorage:{raw}_processor')],'Каждый тип процессора следует из своей заготовки; остальные готовые типы не являются его ингредиентами.',True)
    def ancestors(qid,trail=None):
        trail=set() if trail is None else trail
        if qid in trail:raise ValueError(f'Connection cycle: {qid}')
        result=set();trail=trail|{qid}
        for dep in quests[qid].get('dependencies',[]):result.add(dep);result.update(ancestors(dep,trail))
        return result
    for q in quests.values():ancestors(q['id'])
    removed=[]
    for q in quests.values():
        if not q['id'].startswith(('18','19')):continue
        deps=q.get('dependencies',[])
        redundant={d for d in deps if any(d in ancestors(other) for other in deps if other!=d)}
        q['dependencies']=[d for d in deps if d not in redundant]
        removed.extend({'quest':q['id'],'dependency':d} for d in sorted(redundant))
        if q['id'].startswith('18'):
            local=[d for d in q['dependencies'] if not d.startswith('14')]
            q['hide_dependency_lines']=not (len(local)==1 and local[0].startswith('18') and quests[local[0]]['title'].split(' · ')[0]==q['title'].split(' · ')[0])
        names=[quests[d]['title'] for d in q['dependencies']]
        q['description']=[('Подготовка: '+'; '.join(names)+'. Все требования видны в списке зависимостей.') if p.startswith('Подготовка:') else p for p in q['description']]
    for q in quests.values():
        following=[other['title'] for other in quests.values() if q['id'] in other.get('dependencies',[])]
        q['description']=[p for p in q.get('description',[]) if not p.startswith('После этого:')]
        if following:q['description'].append('После этого: '+'; '.join(following[:5])+('. Другие продолжения показаны связями книги.' if len(following)>5 else '.'))
    for slug,c in chapters.items():
        (root/'chapters'/f'{slug}.snbt').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    report={'connections':changes,'redundantEdgesRemoved':removed}
    (root.parents[3]/'docs/QUEST-CONNECTIONS-0.21.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report
