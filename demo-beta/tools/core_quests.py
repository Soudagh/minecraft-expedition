"""Advanced practical projects; stable IDs independent of the introductory curriculum."""
import json
from pathlib import Path
from expanded_quests import META


def rows():
    result=[]
    for line in Path(__file__).with_name('core_curriculum.tsv').read_text().splitlines():
        if line and not line.startswith('#'):
            fields=line.split('|')
            if len(fields)!=7:raise ValueError(line)
            result.append(fields)
    # Each voltage tier has its own production project, rather than repeating
    # the same generic instruction with a different machine name.
    tiers=[
        ('gt_lv','lv',5,'Сталь и первые схемы','стали для следующих станков','доменную печь, подготовку кислорода и подходящие катушки','температуру рецепта, энергетические входы и свободные выходы'),
        ('gt_mv','mv',5,'Пластик и химические потоки','полиэтилена для связок RS и компонентов','получение исходных жидкостей, химическую переработку и конечный полимер','точные жидкости, конфигурации рецептов и хранение побочных продуктов'),
        ('gt_hv_ev','hv',6,'Чистая комната и электроника','электроники для перехода HV–EV','необходимые полуфабрикаты, подходящие станки и чистую комнату, если её требует рецепт','условие чистоты, напряжение, форму материала и свободный выход'),
        ('gt_iv_luv','iv',7,'Исследование и сборочная линия','компонентов для перехода IV–LuV','требования исследования конкретного рецепта и все входы сборочной линии','исследование, порядок входов, минимальное напряжение и полный комплект жидкостей'),
        ('gt_zpm_uv','zpm',9,'Дорогие компоненты и синтез','компонентов для перехода ZPM–UV','подготовку дорогих полуфабрикатов и доступный синтез нужного материала','доступность цепочки, полный набор входов и устойчивость питания'),
    ]
    for slug,tier,stage,theme,product,chain,conditions in tiers:
        branch=theme+'@'+str(stage)
        tasks=[
            ('electric_motor','Спецификация проекта','Выберите доступный рецепт '+product+'. Разверните его до исходных материалов через JEI, отметьте размер выхода каждой операции.','Записаны все промежуточные операции и материалы одной полной партии.','Проверяйте действующие рецепты сборки; рецепт из внешней вики может отличаться.'),
            ('energy_input_hatch','Паспорт энергетики','Для проекта запишите EU/t каждого рецепта, напряжение станков, амперы и потери кабелей. Сверьте генерацию и потребление при совместной работе.','Параметры всей линии согласованы; известен запас источника под нагрузкой.','Средней генерации недостаточно, если сеть не обеспечивает мгновенную нагрузку рецепта.'),
            ('input_bus','Буферы одной партии','Подготовьте '+chain+'. Выделите отдельные буферы сырью и дорогим промежуточным деталям; сначала загрузите одну полную партию.','Комплект партии готов до расходования редких входов.','Проверьте '+conditions+'.'),
            ('output_hatch','Учесть все выходы','Выпишите основные и побочные выходы выбранной цепочки. Разведите несовместимые жидкости и оставьте свободное место для повторного запуска.','Все типы выходов имеют приёмник; первая партия не заблокировала следующую.','Заполненный побочный выход может остановить линию при свободном основном складе.'),
            ('electric_pump','Найти узкое место','Выполните две небольшие партии проекта и наблюдайте простои. Назовите самый медленный участок, улучшите именно его снабжение и повторите опыт.','Известна причина простоя и результат одного изменения.','Проверяйте входы, энергию и выходы по отдельности; более высокое напряжение не исправляет нехватку сырья.'),
            ('robot_arm','Повторный заказ команды','Соберите востребованную партию '+product+'. Передайте результат соседней ветви и восстановите расходные запасы. Для следующего напряжения проверьте отдельный командный этап.','Выполнены два повторяемых заказа с учётом остатков и резерва.','LuV требует VIII, UV вместе с ZPM — IX; IV требует VII, HV/EV — VI, LV/MV — V.'),
            ('input_hatch','Инструкция запуска и остановки','Запишите порядок подготовки проекта, включения питания, подачи материалов и штатной остановки. Попросите союзника выполнить небольшой повтор по инструкции.','Другой игрок воспроизвёл одну партию без ваших подсказок.','Не меняйте напряжение и дорогие входы при диагностике наугад; проверяйте сообщения станка и JEI.'),
        ]
        for suffix,name,actions,acceptance,diagnosis in tasks:
            result.append([slug,f'gtceu:{tier}_{suffix}',branch,name,actions,acceptance,diagnosis])
    return result


def write_core(root):
    curriculum=rows();summary=[]
    all_quests=[q for p in sorted((root/'chapters').glob('*.snbt')) for q in json.loads(p.read_text())['quests']]
    for chapter_index,slug in enumerate(META,1):
        selected=[r for r in curriculum if r[0]==slug]
        if not selected:continue
        path=root/'chapters'/f'{slug}.snbt';chapter=json.loads(path.read_text())
        original=list(chapter['quests']);last={}
        for index,(_,anchor,section,title,actions,acceptance,diagnosis) in enumerate(selected,1):
            label,_,stage=section.partition('@')
            candidates=[q for q in original if any(t.get('item')==anchor for t in q['tasks'])]
            if not candidates:candidates=[q for q in all_quests if any(t.get('item')==anchor for t in q['tasks'])]
            if not candidates:raise ValueError(f'Missing curriculum anchor {slug}: {anchor}')
            # Prefer the detailed item lesson over an older overview milestone.
            prerequisite=candidates[-1]
            deps=list(dict.fromkeys([last.get(section,prerequisite['id']),prerequisite['id']]))
            if stage:deps.append(f'140000000000{int(stage):04X}')
            qid=f'18{chapter_index:02X}00000000{index:04X}'
            description=[
                'Практическая цель: '+title+'. Эта ветвь закрепляет настройку и эксплуатацию, а не только наличие устройства.',
                'Перед началом: '+prerequisite['title']+'. Рабочее место и доступные рецепты подготовьте по этому заданию.',
                'Порядок работы: '+actions,
                'Проверка результата: '+acceptance,
                'Если не получилось: '+diagnosis,
                'Зачёт: ручная отметка после выполнения и проверки результата. Книга автоматически не измеряет работу линии или заклинания. Предметные цели сохраняют вещи.',
            ]
            if stage:description.insert(2,f'Требуется общий этап {stage}; личные требования школы и условия рецепта сохраняются.')
            tasks=[]
            # A new branch starts with both the actual device and a practice
            # checkmark; later lessons focus on observable operation.
            first=section not in last
            if first:tasks.append({'id':f'29{chapter_index:02X}{index:04X}00000001','type':'item','item':anchor,'count':1,'consume_items':False})
            tasks.append({'id':f'29{chapter_index:02X}{index:04X}00000002','type':'checkmark','title':'Результат проверен · отметить вручную'})
            chapter['quests'].append({'id':qid,'title':label+' · '+title,'description':description,'dependencies':deps,'tasks':tasks,'x':0.0,'y':0.0,'hide_dependency_lines':first or len([d for d in deps if not d.startswith('14')])>1})
            last[section]=qid
        path.write_text(json.dumps(chapter,ensure_ascii=False,indent=2)+'\n')
        summary.append({'chapter':slug,'added':len(selected)})
    return summary
