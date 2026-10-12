"""Final combat chapter and score-backed advancements, preserving prior IDs."""
import json

def write_final_bosses(root):
    data=root.parents[2]/'kubejs/data/expedition'
    sync=[]
    for slug,score in [('lady_luna','exp_divfin'),('chaos_guardian','exp_chaos'),('wither_storm','exp_storm')]:
        path=data/'advancements/final_bosses'/f'{slug}.json';path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps({'criteria':{'server_unlock':{'trigger':'minecraft:impossible'}}})+'\n')
        sync.append(f'execute if score $expedition {score} matches 1 as @a[advancements={{expedition:final_bosses/{slug}=false}}] run advancement grant @s only expedition:final_bosses/{slug}')
    path=data/'functions/final_bosses/sync.mcfunction';path.parent.mkdir(parents=True,exist_ok=True);path.write_text('\n'.join(sync)+'\n')
    quests=[]
    def add(n,title,deps,text,item=None,count=1,adv=None):
        task={'id':f'2F3800000000{n:04X}','type':'advancement','advancement':adv} if adv else {'id':f'2F3800000000{n:04X}','type':'item','item':item,'count':count,'consume_items':False}
        quests.append({'id':f'1F3800000000{n:04X}','title':title,'dependencies':deps,'description':[text],'x':float((n-1)*3),'y':0.,'tasks':[task]})
    add(1,'Divine RPG · Lady Luna',['1400000000000007'],'Пройдите Ветею и победите Lady Luna штатным способом в выживании. Зачёт общий. Для Draconic Evolution также нужны все девять побед основного маршрута.',adv='expedition:final_bosses/lady_luna')
    add(2,'Draconic · первая основа',['1F38000000000001','1400000000000009'],'После Lady Luna и девяти побед открываются оборудование и экипировка Draconic. Центральный алмаз рецепта draconium_core заменён возобновляемой матрицей синтеза Realmwarden; остальные восемь слитков сохранены.','draconicevolution:draconium_core')
    add(3,'Draconic · пробуждённое ядро',['1F38000000000002'],'Освойте нативное fusion crafting, питание и пробуждённые материалы. Подготовьте Draconic-снаряжение до Chaos Guardian; хаотическая ступень открывается только после него.','draconicevolution:awakened_core')
    add(4,'Финал I · Chaos Guardian',['1F38000000000003'],'Победите настоящего Draconic Guardian в его штатном бою с кристаллами и щитом. Удаление сущности, /kill и творческий режим не засчитываются. Победа открывает хаотическую ступень и Wither Storm.',adv='expedition:final_bosses/chaos_guardian')
    add(5,'Wither Storm · Formidibomb',['1F38000000000004'],'Подготовьте штатную Formidibomb и изучите последовательность фаз. Её взрыв и временное падение Шторма не являются финальной победой. Испытание затрагивает мир; первое полное прохождение проводится на его отдельной копии.','witherstormmod:formidibomb')
    add(6,'Wither Storm · книга командного блока',['1F38000000000005'],'Пройдите штатный этап Withered Symbiont и получите книгу для оружия командного блока. Обычное увеличение урона не заменяет необходимые механики Шторма.','witherstormmod:command_block_book')
    add(7,'Wither Storm · оружие ядра',['1F38000000000006'],'Изготовьте штатное оружие командного блока и подготовьте совместное прохождение внутреннего финального боя.','witherstormmod:command_block_sword')
    add(8,'Финал II · Wither Storm',['1F38000000000007'],'Общий зачёт требует настоящего финального уничтожения через командный блок. Предмет-звезда в инвентаре, ранняя смерть, Formidibomb и /kill не завершают кампанию.',adv='expedition:final_bosses/wither_storm')
    (root/'chapters/final_bosses.snbt').write_text(json.dumps({'id':'3F38000000000001','filename':'final_bosses','title':'Два боевых финала · Chaos Guardian и Wither Storm','order_index':98,'quests':quests},ensure_ascii=False,indent=2)+'\n')
    return quests
