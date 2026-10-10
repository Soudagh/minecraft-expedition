"""Keep full lessons, deduplicate practice copies, and budget the sync payload."""
import json
from collections import Counter

# Budget leaves room for the native object metadata in FTB's 1 MiB packet.
TEXT_BUDGET=780_000


def description_bytes(chapters):
    return sum(len(p.encode('utf-8')) for c in chapters.values() for q in c['quests'] for p in q.get('description',[]))


def compact_book(root):
    paths=sorted((root/'chapters').glob('*.snbt'))
    chapters={p.stem:json.loads(p.read_text()) for p in paths}
    before=description_bytes(chapters)
    by={q['id']:q for c in chapters.values() for q in c['quests']}
    practices=[]
    for q in by.values():
        kinds={t['type'] for t in q['tasks']}
        deps=q.get('dependencies',[])
        if q['title'].endswith(' · Практика') and kinds=={'checkmark'} and len(deps)==1:
            parent=by[deps[0]]
            if {t['type'] for t in parent['tasks']}=={'item'}:
                # Only omit paragraphs already present in the linked item card.
                details=[p for p in q['description'] if not p.startswith(('Зачёт:','Подготовка:')) and p not in parent['description']]
                acceptance=[p for p in q['description'] if p.startswith(('Готово, когда:','Проверка результата:'))]
                mode=[p for p in q['description'] if p.startswith(('Учебный стенд:','Исследование:'))]
                q['description']=list(dict.fromkeys(['Подготовка: '+parent['title']+'.','Выполните порядок работы из предыдущего предметного задания. Здесь отмечается практика, а не наличие вещей.']+mode+acceptance+details))
                practices.append({'practice':q['id'],'instructions':parent['id']})
        q['description']=[p for p in q['description'] if not p.startswith('Зачёт:')] if kinds in ({'item'},{'checkmark'}) else q['description']
        if kinds=={'item'}:q['description'].append('Зачёт: предметы в инвентаре; вещи сохраняются.')
        elif kinds=={'checkmark'}:q['description'].append('Зачёт: отметьте после выполнения действий и проверки результата.')
    shared=[]
    keep_prefixes=('Подготовка:','Перед началом:','Порядок работы:','Действия:','Готово, когда:','Проверка результата:','При затруднении:','Если не получилось:','Учебный стенд:','Исследование:','Требуется общий этап','Общий этап','Зачёт:','Выполните порядок работы')
    for slug,c in chapters.items():
        counts=Counter(p for q in c['quests'] for p in q['description'])
        repeated={p for p,n in counts.items() if n>=5 and len(p.encode())>=100 and not p.startswith(keep_prefixes)}
        intro=next((q for q in c['quests'] if q['title'].startswith('Начните здесь')),c['quests'][0])
        for q in c['quests']:
            q['description']=[p for p in q['description'] if p not in repeated]
        intro['description'].extend('Общие правила главы: '+p for p in sorted(repeated))
        shared.extend({'chapter':slug,'intro':intro['id'],'text':p} for p in sorted(repeated))
    after=description_bytes(chapters)
    if after>TEXT_BUDGET:raise ValueError(f'Quest text budget exceeded: {after} > {TEXT_BUDGET}')
    for p in paths:p.write_text(json.dumps(chapters[p.stem],ensure_ascii=False,indent=2)+'\n')
    report={'beforeDescriptionBytes':before,'afterDescriptionBytes':after,'descriptionBudget':TEXT_BUDGET,'practiceReferences':practices,'sharedRules':shared,'scope':'Static text budget; native packet size must also be measured'}
    (root.parents[3]/'docs/QUEST-TEXT-BUDGET-0.22.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report
