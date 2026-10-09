"""Detailed whole-pack curriculum. Add stable IDs; preserve historical task objects."""
import json
from pathlib import Path
from progression import STAGES
META = {
 'demo':('01 · Начало: команда и первые шаги','Начните с общей команды, базы и управления. Затем выбирайте ремесленную ветвь.','Книга → главы; JEI → рецепт предмета клавишей R и применения клавишей U. Проверьте назначение этих клавиш в управлении.',0),
 'campaign':('02 · Девять боссов и общие открытия','Следуйте общей линии побед. Подготовка и производство идут в соседних главах.','Материалы этапов выпускаются у кузнечного стола: возьмите чертёж в основную руку и подготовьте входы партии.',1),
 'expedition':('03 · Экспедиции: путь, ресурсы и возвращение','Подготовьте поход, найдите источники материалов и сохраните маршрут для команды.','Координаты и ориентиры записывайте до входа в новое измерение. После похода пополняйте расходники.',2),
 'kitchen':('04 · Кухня: от огорода к общему снабжению','Постройте огород, рабочие места и несколько повторяемых блюд для четырёх игроков.','Farmer’s Delight: разделка на доске и готовка в котле. Brewin’ and Chewin’: ферментация в бочонке с подходящей температурой.',3),
 'building':('05 · Строительство: удобная общая база','Разделите базу на жилую, ремесленную и промышленную зоны; выберите палитру и формы.','Chipped меняет вид блоков в тематических верстаках. FramedBlocks создаёт формы с выбранной внешней отделкой.',4),
 'create_workshop':('06 · Create: от колеса к серийной мастерской','Освойте привод, обработку, транспорт и автоматическую последовательную сборку.','Create работает от вращения. При остановке проверьте источник, соединение валов, направление и перегрузку.',5),
 'botania_supply':('07 · Botania: цветы, мана и руны','Освойте генерацию и передачу маны, материалы бассейна, руны и следующие устройства.','Лексика Botania объясняет формы конструкций. Жезлом леса проверяйте связи; для рецепта в бассейне нужен запас маны.',6),
 'mana_artifice':('08 · Mana and Artifice: учёба, ремесло и помощники','Соберите расходники, научитесь создавать заклинания, развивайте Occulus и выбранную фракцию.','Codex Arcana объясняет операции школы. Occulus показывает личную ступень и её задачи; общий этап команды дополняет эти требования.',7),
 'hex_practice':('09 · Hex Casting: стек, записи и круги','Научитесь читать стек, сохранять данные и составлять проверяемые последовательности.','Откройте справочник Hex Casting. У каждого паттерна есть входные и выходные данные; среда тратится на выполнение эффектов.',8),
 'spell_supply':('10 · Iron’s и Hazen: от свитка к рабочей роли','Постройте рабочие места, начните с одного заклинания и наладьте снабжение книг и чернил.','В найденном свитке сравнивайте школу, уровень, расход маны и откат. Редкие/эпические/легендарные касты требуют III/VI/VII.',9),
 'combat_roles':('11 · Бой: оружие, управление и взаимодействие','Выберите понятное оружие, настройте управление и испытайте роль до похода к боссу.','Включите боевой режим Epic Fight. Навык оружия и обычная атака могут иметь разные кнопки; найдите их в управлении.',10),
 'industrial_prep':('12 · GregTech: инструменты, бронза и пар','Подготовьте ручные инструменты, паровые станки и снабжение первой электрической сети.','До Annihilator можно готовить паровую площадку. Корпуса LV/MV используют промышленный материал этапа V.',11),
 'gt_lv':('13 · GregTech LV: первый электрический завод','Разделите обработку металлов, жидкости и сборку компонентов; соберите работающую доменную печь.','Проверяйте EU/t рецепта, напряжение станка и амперы линии. Для многоблока откройте схему в JEI и предусмотрите входы, выходы и энергию.',12),
 'storage':('14 · Refined Storage: компоненты, сеть и автокрафт','Соберите процессоры, подключите общий склад и научитесь заказывать простые и машинные рецепты.','Контроллеру нужно питание. Сначала проверьте небольшой заказ: входы дошли до станка, выход вернулся в сеть.',13),
 'gt_mv':('15 · GregTech MV: химия и микроэлектроника','Организуйте цепочку пластика и схем, затем расширяйте число параллельных процессов.','Жидкость, напряжение, конфигурация и условия рецепта должны совпадать. Для каждой цепочки отделите исходное сырьё и побочные продукты.',14),
 'power_logistics':('16 · Энергия и логистика: управляемая база','Свяжите вращение, электричество, жидкости и сигналы с реальными потребностями базы.','Create Addition, RF/FE и GregTech EU имеют разные правила подключения. Проверяйте конкретный потребитель и преобразователь.',15),
 'hbm_industry':('17 · HBM: материалы, прессование и электроника','Освойте поддерживаемое ремесло HBM: металлы, оснастку пресса, пластины и схемы.','В этой ветви используются собственные материалы HBM. Для пресса подберите штамп и вход; держите оснастку рядом с рабочим местом.',16),
 'gt_hv_ev':('18 · GregTech HV–EV: развитое производство','Освойте охлаждение, чистую комнату и электронику следующего уровня.','Корпуса HV/EV требуют этапа VI. Проверяйте условия чистой комнаты и минимальное напряжение каждого рецепта.',17),
 'magic_advanced':('19 · Поздняя магия: снабжение и экипировка','Развивайте выбранную школу и комплект под роль команды после общих открытий.','Нативные требования школы сохраняются. Террасталь требует III, незеритовая магическая защита VI; поздние перемещения Iron’s/M&A/Hex — VII.',18),
 'gt_iv_luv':('20 · GregTech IV–LuV: сборочная линия','Подготовьте развитые компоненты и исследуемые рецепты сборочной линии.','IV открывается после VII, LuV после VIII. Проверяйте требования исследования и расход всех входов перед запуском дорогой партии.',19),
 'gt_zpm_uv':('21 · GregTech ZPM–UV: поздние проекты','Наладьте дорогие компоненты и снабжение синтеза; планируйте крупный проект базы.','ZPM/UV требуют IX. Финальный промышленный проект готовится отдельно: один дорогой предмет ещё не подтверждает работающий завод.',20),
}

def read_rows():
    result=[]
    for line in Path(__file__).with_name('quest_curriculum.tsv').read_text().splitlines():
        if not line or line.startswith('#'):continue
        fields=line.split('|')
        if len(fields)!=6:raise ValueError(line)
        result.append(fields)
    return result

def gt_rows():
    result=[]
    parts=[('electric_motor','Моторы','Подготовьте провода и механические детали; положите готовые моторы у сборки.','Моторы снабжают несколько станков этого напряжения.'),('electric_pump','Насосы','Разберите входы рецепта насоса и подготовьте небольшую партию.','Жидкостные устройства требуют насосных компонентов.'),('conveyor_module','Конвейерные модули','Подготовьте механические детали и эластичные материалы по рецепту.','Транспорт и станки используют собственные компоненты своего уровня.'),('electric_piston','Поршневые компоненты','Проследите входы поршня и изготовьте компоненты из подготовленного запаса.','Поршни поддерживают механические операции станков.'),('robot_arm','Роботизированная сборка','Соберите манипулятор из компонентов этого напряжения.','Сложные устройства требуют нескольких уже освоенных цепочек.'),('input_bus','Вход предметов','Подготовьте входной автобус для выбранного многоблока и подключите склад.','Конструкция должна получать всю партию предметов.'),('output_bus','Выход предметов','Поставьте выходной автобус и оставьте место для готовой продукции.','Заполненный выход останавливает дальнейшую обработку.'),('input_hatch','Вход жидкостей','Подготовьте входной люк и подведите нужную жидкость отдельной линией.','Жидкостный рецепт требует собственного входа.'),('output_hatch','Выход жидкостей','Организуйте отдельный выход и хранение продукта рецепта.','Побочная жидкость должна освобождать рабочую ёмкость.'),('energy_input_hatch','Питание многоблока','Сверьте напряжение люка, кабеля и источника питания.','Энергетический вход задаёт доступные параметры конструкции.'),('mixer','Смешивание материалов','Подайте входы подходящей смеси и проверьте конфигурацию рецепта.','Отдельная линия смеси снабжает металлургию и химию.'),('centrifuge','Разделение смеси','Выберите полезное разделение, предусмотрите место для всех выходов.','Побочные продукты часто нужны соседним производствам.'),('compressor','Сжатие на новом уровне','Испытайте подходящую операцию и сравните время обработки с прежним станком.','Следующее напряжение расширяет доступные рецепты обработки.'),('alloy_smelter','Отдельная линия сплавов','Выберите регулярно расходуемый сплав и организуйте повторяемую подачу его входов.','Сплавы должны выпускаться вместе с потреблением компонентов.'),('cutter','Резка материалов','Подготовьте материал и жидкость, если она требуется рецепту, и проверьте выход.','Резка связывает полуфабрикаты с электроникой и деталями.'),('forming_press','Формовка','Проверьте форму или оснастку выбранного рецепта перед загрузкой партии.','Некоторые материалы требуют точного способа формования.')]
    for slug,tier,stage in [('gt_lv','lv',5),('gt_mv','mv',5),('gt_hv_ev','hv',6),('gt_iv_luv','iv',7),('gt_zpm_uv','zpm',9)]:
        for suffix,title,how,why in parts:
            section=('Компоненты' if suffix in [p[0] for p in parts[:5]] else 'Станки и порты')+f'@{stage}'
            result.append([slug,section,f'gtceu:{tier}_{suffix}',title+' '+tier.upper(),how,why])
        result.append([slug,f'Рабочий проект@{stage}','~','Две партии '+tier.upper()+' подряд','Выберите один востребованный рецепт; выполните две партии подряд с подачей всех входов и свободным выходом. Запишите, какой ресурс ограничил работу.','Переход напряжения завершается устойчивым производством, а не одним корпусом.'])
    return result

def write_expanded(root):
    rows=read_rows()+gt_rows()
    summary=[]
    for chapter_index,(slug,(title,aim,help_text,order)) in enumerate(META.items(),1):
        path=root/'chapters'/f'{slug}.snbt'
        chapter=json.loads(path.read_text()) if path.exists() and slug!='building' else {'id':'3000000000000030','filename':slug,'quests':[]}
        old=chapter['quests']
        if slug=='demo':
            legacy=[q for q in old if q['id'] in ('100000000000000E','1000000000000010')]
            old=[q for q in old if q not in legacy]
            archive_path=root/'chapters/practice_archive.snbt'
            archive=json.loads(archive_path.read_text());archive['quests'].extend(legacy)
            archive_path.write_text(json.dumps(archive,ensure_ascii=False,indent=2)+'\n')
        chapter.update(title=title,order_index=order)
        new=[]
        def add(n,title,sections,items,description,deps,x,y):
            qid=f'16{chapter_index:02X}00000000{n:04X}'
            tasks=[]
            for i,(item,count) in enumerate(items):
                task={'id':f'27{chapter_index:02X}{n:04X}0000{i:04X}'}
                task.update({'type':'item','item':item,'count':count,'consume_items':False} if item else {'type':'checkmark','title':'Упражнение выполнено · отметить вручную'})
                tasks.append(task)
            new.append({'id':qid,'title':title,'description':description,'dependencies':deps,'x':float(x),'y':float(y),'tasks':tasks})
            return qid
        welcome=add(1,'Начните здесь · '+title.split(' · ',1)[-1],[],[(None,1)],[aim,help_text,'В верхней части главы расположены основные рубежи, ниже — подробные учебные ветви. Начинайте с материалов и рабочих мест; идите по стрелкам внутри выбранной ветви. Задания с предметами засчитываются по указанному запасу в инвентаре; он остаётся у вас. Практику отмечайте после выполнения описанных действий.'],[],0,-4)
        for i,quest in enumerate(old):
            if not quest.get('dependencies'):quest['dependencies']=[welcome]
            quest['x']=float(i%4*4);quest['y']=float(i//4*3)
            original=' '.join(quest.get('description',[]))
            inventory=[t for t in quest['tasks'] if t['type']=='item']
            description=[original,help_text]
            if inventory:description.append('Для зачёта подготовьте весь указанный набор в инвентаре. Наведите курсор на каждую цель и откройте её рецепт клавишей R; клавиша U показывает дальнейшие применения.')
            next_titles=[q['title'] for q in old if quest['id'] in q.get('dependencies',[])]
            if next_titles:description.append('После этого: '+', '.join(next_titles)+'.')
            quest['description']=description
        section_nodes={};section_lanes={};offset=(len(old)+3)//4*3+4
        chapter_rows=[r for r in rows if r[0]==slug]
        existing_items={t.get('item') for q in old for t in q['tasks']}
        n=1
        for _,section,item,name,how,why in chapter_rows:
            if slug.startswith('gt_') and item in existing_items:continue
            n+=1
            label,_,stage=section.partition('@')
            lane=section_lanes.setdefault(section,len(section_lanes));prev=section_nodes.get(section,welcome)
            deps=[prev]
            if stage:deps.append(f'140000000000{int(stage):04X}')
            if item=='~':items=[(None,1)];finish='Выполните упражнение и поставьте ручную отметку после проверки результата.'
            else:
                item,_,count=item.partition('*');items=[(item,int(count or 1))];finish='Подготовьте указанное количество в инвентаре; затем используйте предмет в описанной работе.'
            pos=sum(1 for q in new if q.get('_section')==section)
            qid=add(n,label+' · '+name,[section],items,[why,'Действия: '+how,help_text,finish],deps,pos*4,offset+lane*4)
            new[-1]['_section']=section;section_nodes[section]=qid
        if slug=='campaign':
            for stage,boss_slug,boss_title,material,ingredients in STAGES:
                n+=1
                deps=[welcome]+([f'140000000000{stage-1:04X}'] if stage>1 else [])
                add(n,f'Подготовка к этапу {stage} · {boss_title}',[],[('minecraft:bread',16),('minecraft:torch',32)],['Перед походом найдите нужную структуру или ритуальное место, отметьте обратный путь и соберите команду.','Пополните пищу и свет; распределите защиту, нанесение урона и поддержку. Оружие и школа выбираются по вашей роли.',f'После настоящей победы открывается этап {stage} и производство материала «{material}». Чертёж позволяет повторять выпуск без повторного убийства босса.'],deps,(stage-1)%3*6,offset+4+(stage-1)//3*4)
        for q in new:q.pop('_section',None)
        chapter['quests']=old+new
        path.write_text(json.dumps(chapter,ensure_ascii=False,indent=2)+'\n')
        summary.append({'chapter':slug,'title':title,'old':len(old),'added':len(new),'total':len(old)+len(new)})
    for slug,title,order in [('boss_atlas','Архив · прежний проект атласа боссов',98),('practice_archive','Архив · прежние отметки практики',99)]:
        p=root/'chapters'/f'{slug}.snbt';c=json.loads(p.read_text());c.update(title=title,order_index=order)
        for q in c['quests']:q['description'].insert(0,'Историческая запись прежней версии. Актуальные задания и общие открытия находятся в рабочих главах книги.')
        p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    # Replace obsolete directions while retaining the original task definition.
    p=root/'chapters/demo.snbt';c=json.loads(p.read_text())
    next(q for q in c['quests'] if q['id']=='100000000000000D')['description']=['Подготовьте щит, еду и оружие. В настройках управления найдите переключение боевого режима Epic Fight и клавишу навыка оружия. Испытайте обычный удар, защиту и уклонение на безопасной площадке.','Продолжите обучение в главе боя и выберите одну понятную роль перед походом к первому боссу.']
    p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    p=root/'chapters/industrial_prep.snbt';c=json.loads(p.read_text())
    for q in c['quests']:
        q['description']=[paragraph.replace('Разовая трофейная разблокировка пока не добавлена, не фармите босса на каждый корпус.', 'Рецепт настроенного ядра связывает Create с рунами Botania. Электрические корпуса дополнительно требуют воспроизводимый промышленный материал этапа V.') for paragraph in q['description']]
    p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    return summary


def write_report(root):
    """Expected native object inventory, derived from the generated book."""
    pack=root.parents[3]
    chapters=[];items=set();quest_ids=[];task_ids=[];layout=[]
    for path in sorted((root/'chapters').glob('*.snbt')):
        chapter=json.loads(path.read_text())
        chapters.append({'id':chapter['id'],'slug':path.stem,'count':len(chapter['quests']),'title':chapter['title'],'order':chapter.get('order_index',0)})
        for quest in chapter['quests']:
            quest_ids.append(quest['id'])
            layout.append({'id':quest['id'],'x':quest['x'],'y':quest['y'],'hideDependencyLines':quest.get('hide_dependency_lines',False),'hideDependentLines':quest.get('hide_dependent_lines',False)})
            for task in quest['tasks']:
                task_ids.append(task['id'])
                item=task.get('item')
                if isinstance(item,dict):item=item.get('id')
                if item:items.add(item)
    report={'version':json.loads((pack/'mods.lock.json').read_text())['version'],'chapters':sorted(chapters,key=lambda c:c['order']),'questCount':len(quest_ids),'taskCount':len(task_ids),'questIDs':quest_ids,'taskIDs':task_ids,'items':sorted(items),'layout':layout}
    (pack/'docs/QUEST-CURRICULUM-0.18.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
