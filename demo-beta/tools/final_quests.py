"""Save-stable final project quests; the final task uses a server-only advancement."""
import json

def write_final(root):
    quests=[
        {'id':'1C37000000000001','title':'Поздняя партия для команды','dependencies':['1400000000000009'],'x':0.,'y':0.,'tasks':[{'id':'2C37000000000001','type':'item','item':'gtceu:uv_electric_motor','count':4,'consume_items':False},{'id':'2C37000000000002','type':'item','item':'gtceu:uv_electric_pump','count':4,'consume_items':False}],'description':['Подготовьте четыре UV-мотора и четыре UV-помпы. Компоненты сохраняются и должны оставаться в инвентаре наблюдателя до конца зачёта.']},
        {'id':'1C37000000000002','title':'Работающий UV-синтез','dependencies':['1C37000000000001'],'x':2.,'y':0.,'tasks':[{'id':'2C37000000000003','type':'checkmark'}],'description':['Соберите UV fusion reactor, обеспечьте энергию, входы и выходы минимум для двух последовательных циклов. Этот квест отмечает подготовку вручную; итоговый зачёт выдаёт сервер.','В выживании подойдите на восемь блоков к работающему контроллеру и выполните /expeditionfinal watch X Y Z с его координатами. Оставайтесь в пределах 16 блоков.','Зачёт требует все девять побед и увеличение нативного счётчика завершённых рецептов, пока установка продолжает работать. Если она остановится, наблюдение отменяется; запустите его снова.']},
        {'id':'1C37000000000003','title':'Промышленный финал подтверждён','dependencies':['1C37000000000002'],'x':4.,'y':0.,'tasks':[{'id':'2C37000000000004','type':'advancement','advancement':'expedition:completed'}],'description':['Этот зачёт выдаёт сервер после подтверждённого UV-синтеза и девяти побед. Галочка и наличие контроллера не завершают проект.','Промышленный зачёт сохраняется между перезапусками. Проверьте /expeditionfinal status. Два отдельных боевых финала находятся в главе Chaos Guardian и Wither Storm.']}
    ]
    for q in quests:
        if all(t['type']=='item' for t in q['tasks']):q['icon']=q['tasks'][0]['item']
    (root/'chapters/final_project.snbt').write_text(json.dumps({'id':'3C37000000000001','filename':'final_project','title':'Финальный проект · работающий UV-синтез','order_index':99,'quests':quests},ensure_ascii=False,indent=2)+'\n')
