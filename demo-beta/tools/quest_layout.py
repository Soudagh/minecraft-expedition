"""Compact, deterministic dependency-aware layout for FTB Quests 2001.4.22."""
import json
from collections import defaultdict

X_STEP=1.6
Y_STEP=1.6


def layout_book(root):
    reports=[]
    for path in sorted((root/'chapters').glob('*.snbt')):
        chapter=json.loads(path.read_text());quests=chapter['quests'];by_id={q['id']:q for q in quests}
        before={'width':max(q['x'] for q in quests)-min(q['x'] for q in quests),'height':max(q['y'] for q in quests)-min(q['y'] for q in quests)}
        welcome=next((q for q in quests if q['id'].startswith('16') and q['id'].endswith('0001')),None)
        if welcome:
            welcome.update(x=-X_STEP,y=0.0,hide_dependent_lines=True)
            welcome['description']=[p.replace('В верхней части главы расположены основные рубежи, ниже — подробные учебные ветви.', 'Сверху расположены основные рубежи по порядку зависимостей; ниже — компактные тематические строки. В каждой строке читайте задания слева направо. Общие линии от вступления скрыты; требования сохраняются. Первая карточка углублённой ветви называет подготовительное задание в описании.') for p in welcome['description']]
        if path.stem in ('boss_atlas','practice_archive'):
            for i,q in enumerate(quests):q.update(x=(i%5)*X_STEP,y=(i//5)*Y_STEP,hide_dependency_lines=True)
            path.write_text(json.dumps(chapter,ensure_ascii=False,indent=2)+'\n')
            reports.append({'chapter':path.stem,'before':before,'after':{'width':max(q['x'] for q in quests),'height':max(q['y'] for q in quests)},'quests':len(quests)})
            continue
        overview=[q for q in quests if not q['id'].startswith(('16','18'))]
        overview_ids={q['id'] for q in overview}
        levels={}
        def level(qid):
            if qid not in levels:levels[qid]=max((level(d)+1 for d in by_id[qid].get('dependencies',[]) if d in overview_ids),default=0)
            return levels[qid]
        columns=defaultdict(list)
        for q in overview:columns[level(q['id'])].append(q)
        placed={}
        # Place each dependency layer beside its predecessors, rather than
        # wrapping an unrelated quest list into four-column grid rows.
        for depth,column in sorted(columns.items()):
            def parent_y(q):
                ys=[placed[d] for d in q.get('dependencies',[]) if d in placed]
                return sum(ys)/len(ys) if ys else 0
            column.sort(key=lambda q:(parent_y(q),q['id']))
            for row,q in enumerate(column):q.update(x=depth*X_STEP,y=row*Y_STEP);placed[q['id']]=q['y']
        # Short overview graphs can have long edges skipping a layer. Reserve
        # space for those edges and minimise crossings before placing lessons.
        edges=[(by_id[d],q) for q in overview for d in q.get('dependencies',[]) if d in overview_ids and not q.get('hide_dependency_lines') and not by_id[d].get('hide_dependent_lines')]
        def orient(a,b,c):return (b['x']-a['x'])*(c['y']-a['y'])-(b['y']-a['y'])*(c['x']-a['x'])
        def score():
            total=0.0
            for a,b in edges:
                dx=b['x']-a['x'];dy=b['y']-a['y'];length=dx*dx+dy*dy
                total+=length*.01
                for n in overview:
                    if n is a or n is b:continue
                    t=((n['x']-a['x'])*dx+(n['y']-a['y'])*dy)/length
                    if 0<t<1:
                        distance=(n['x']-a['x']-t*dx)**2+(n['y']-a['y']-t*dy)**2
                        if distance<.36:total+=10000+(0.36-distance)*100
            for i,(a,b) in enumerate(edges):
                for c,d in edges[i+1:]:
                    if any(v is w for v in (a,b) for w in (c,d)):continue
                    if orient(a,b,c)*orient(a,b,d)<0 and orient(c,d,a)*orient(c,d,b)<0:total+=100
            return total
        slots=max((len(c) for c in columns.values()),default=1)+2
        for iteration in range(8):
            changed=False
            for column in columns.values():
                for q in column:
                    best_score=score();best_y=q['y'];best_swap=None;original_y=q['y']
                    for row in range(slots):
                        candidate=row*Y_STEP
                        other=next((n for n in column if n is not q and n['y']==candidate),None)
                        q['y']=candidate
                        if other:other['y']=original_y
                        candidate_score=score()
                        if candidate_score<best_score-1e-8:best_score,best_y,best_swap=candidate_score,candidate,other
                        q['y']=original_y
                        if other:other['y']=candidate
                    if best_y!=original_y:
                        q['y']=best_y
                        if best_swap:best_swap['y']=original_y
                        changed=True
            if not changed:break
        y=max((q['y'] for q in overview),default=-Y_STEP)+2*Y_STEP
        groups={}
        for q in quests:
            if q is welcome or q in overview:continue
            # Introductory lessons and advanced projects have separate rows;
            # every section is a simple left-to-right chain.
            group=(q['id'][:2],q['title'].split(' · ',1)[0])
            if q['title'].startswith('Подготовка к этапу'):
                group=('16','Подготовка к этапам')
                q['hide_dependency_lines']=True
                prerequisites=[by_id[d]['title'] for d in q.get('dependencies',[]) if d in by_id and by_id[d] is not welcome]
                text='Условие перед походом: '+('; '.join(prerequisites) if prerequisites else 'прочитайте вступление к кампании')+'. Требования показаны в списке зависимостей; длинные линии между подготовкой и победами скрыты.'
                if text not in q['description']:q['description'].append(text)
            groups.setdefault(group,[]).append(q)
        for group,members in groups.items():
            for i,q in enumerate(members):q.update(x=i*X_STEP,y=y)
            y+=Y_STEP
        chapter['quests']=quests
        path.write_text(json.dumps(chapter,ensure_ascii=False,indent=2)+'\n')
        after={'width':max(q['x'] for q in quests)-min(q['x'] for q in quests),'height':max(q['y'] for q in quests)-min(q['y'] for q in quests)}
        reports.append({'chapter':path.stem,'before':before,'after':after,'quests':len(quests)})
    return reports
