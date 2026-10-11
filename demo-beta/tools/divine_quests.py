"""Separate DivineRPG graph; stable IDs and non-consuming inventory goals."""
import json

DIMENSIONS=[('iceika','Ицейка',0),('eden','Эдем',2),('wildwood','Дикий лес',3),('apalachia','Апалачия',4),('skythern','Скайтерн',5),('mortum','Мортум',6),('arcana','Аркана',5),('vethea','Ветея',7)]

def write_divine(root):
    quests=[]
    def add(n,title,item=None,count=1,deps=(),text='',x=0,y=0,adv=None):
        task={'id':f'2C3500000000{n:04X}','type':'item','item':item,'count':count,'consume_items':False} if item else {'id':f'2C3500000000{n:04X}','type':'checkmark'}
        if adv:task={'id':f'2C3500000000{n:04X}','type':'advancement','advancement':adv}
        q={'id':f'1C3500000000{n:04X}','title':title,'description':[text], 'x':float(x),'y':float(y),'tasks':[task]}
        if deps:q['dependencies']=[f'1C3500000000{d:04X}' if isinstance(d,int) else d for d in deps]
        if item:q['icon']=item
        quests.append(q);return n
    add(1,'Divine RPG · план экспедиции',text='Отдельный путь измерений и материалов. Общие этапы кампании ограничивают вход: Эдем II, Дикий лес III, Апалачия IV, Скайтерн V, Мортум VI, Аркана V, Ветея VII. Ицейка открыта с начала. Боссы Divine не заменяют девять боссов кампании. Предметы не изымаются; галочки ставьте после практики.',x=-2)
    add(2,'Командная карта и приват',deps=[1],text='Создайте команду FTB Teams. Лидер выделяет базу на карте Xaero через Open Parties and Claims. /teammap add base сохраняет текущую точку для команды; /teammap list показывает общие метки, нажмите сообщение Xaero для импорта. Проверьте вход второго участника и запрет строительства постороннему.',x=0,y=-3)
    add(3,'Реалмит', 'divinerpg:realmite_ingot',8,[1],text='Добудьте реалмит в обычном мире. Create дробит руду в две единицы сырого металла; обычная плавка остаётся доступна.',x=0)
    add(4,'Арлемит','divinerpg:arlemite_ingot',8,[3],text='Найдите арлемит; сохраните запас для специализации команды. Руда совместима с линией дробления Create.',x=2,y=-1)
    add(5,'Рупий','divinerpg:rupee_ingot',8,[3],text='Найдите рупий; подготовьте добычу, дробление Create и плавку.',x=2,y=1)
    add(6,'Обработка Create','create:crushing_wheel',2,[4,5],text='Соберите пару дробящих колёс и обработайте руду Divine. Проверьте выдачу двух единиц сырья на одну руду.',x=4)
    add(7,'Живой камень портала','botania:livingrock',16,[3,'1000000000000009'],text='Подготовьте Botania: Divine Rock теперь использует livingrock и divine_shards. Обычный камень больше не подходит.',x=2,y=3)
    add(8,'Божественные осколки','divinerpg:divine_shards',16,[7],text='Получите осколки штатным путём Divine RPG; затем изготовьте блоки портала из livingrock.',x=4,y=3)
    add(9,'Портальная рамка','divinerpg:divine_rock',10,[8],text='Соберите рамку Эдема по руководству Divine RPG. Вход разрешён после общего этапа II; готовая рамка не снимает серверное ограничение.',x=6,y=3)
    add(10,'Сумеречные часы','divinerpg:twilight_clock',1,[9,'1400000000000002'],text='Новый рецепт соединяет часы, манасталь Botania и точный механизм Create. Активируйте портал, сохранив путь возвращения.',x=8,y=3)
    add(11,'Первый поход в Ицейку',deps=[2,3],text='Постройте штатный портал Ицейки, возьмите еду и свет. Отметьте вход через /teammap add iceika. Проверьте возвращение каждого игрока.',x=2,y=-5,adv='divinerpg:iceika/explore_iceika')
    add(12,'Припасы холодного похода','minecraft:campfire',1,[11],text='Оборудуйте промежуточный лагерь и запас еды Farmer’s Delight. Разделите роли: маршрут, снабжение, защита и перенос добычи.',x=4,y=-5)
    previous=10
    for index,realm in enumerate(['eden','wildwood','apalachia','skythern','mortum']):
        n=20+index*4;label=dict((r,t) for r,t,_ in DIMENSIONS)[realm];stage=index+2
        add(n,'Экспедиция · '+label,deps=[previous,f'140000000000{stage:04X}'],text=f'Войдите в измерение {label}, отметьте портал и найдите безопасный лагерь. Требуется общий этап {stage}; галочка подтверждает выполненную экспедицию.',x=10+index*4,y=3)
        add(n+1,label+' · фрагменты','divinerpg:'+realm+'_fragments',21,[n],text='Соберите фрагменты штатной добычей. Три фрагмента дают один самоцвет; сохраните природную цепочку продвижения.',x=10+index*4,y=5)
        add(n+2,label+' · самоцветы','divinerpg:'+realm+'_gem',7,[n+1],text='Соберите семь самоцветов для следующего материала. Предметная цель проверяет запас, а не работу портала.',x=12+index*4,y=5)
        add(n+3,label+' · усиленный материал','divinerpg:'+realm+'_chunk',1,[n+2],text='Рецепт сохраняет семь самоцветов и добавляет манасталь Botania и лист Create. Это связывает снаряжение Divine с мастерской команды.',x=12+index*4,y=3)
        previous=n+3
    add(50,'Аркана · рамка','divinerpg:arcana_portal_frame',12,[31,'1400000000000005'],text='Подготовьте soulfire_stone, стальные блоки HBM и материал Relic Annihilator. Штатный выход 12 рамок сохранён. Вход требует этап V.',x=22,y=-1)
    add(51,'Аркана · экспедиция',deps=[50],text='Активируйте штатный портал, исследуйте подземелье Арканы и сохраните точку входа /teammap add arcana. Проверьте отход и снабжение.',x=24,y=-1)
    add(52,'Аркана · арканиум','divinerpg:arcanium',8,[51],text='Освойте штатный экстрактор арканиума. Отдельная магическая валюта не заменяет ману Botania и энергию промышленности.',x=26,y=-1)
    add(53,'Ветея · подготовка','divinerpg:nightmare_bed',1,[39,'1400000000000007'],text='Изготовьте штатную кровать кошмаров. Вход требует этап VII. Ветея имеет собственные правила инвентаря; сперва изучите руководство Divine и подготовьте возвращение.',x=30,y=3)
    add(54,'Ветея · самостоятельная экспедиция',deps=[53],text='Пройдите первый участок Ветеи штатным способом и вернитесь на базу. Запишите встреченные материалы и тактику; эту практику отмечайте вручную.',x=32,y=3)
    add(60,'Командный склад Divine','refinedstorage:controller',1,[6,27],text='Выделите в Refined Storage место для фрагментов, самоцветов и материалов измерений. Подключите линию Create и проверьте отсутствие потерь.',x=18,y=8)
    add(61,'Снабжение измерений','farmersdelight:cooking_pot',1,[12,60],text='Организуйте запас еды и расходников для четырёх игроков; перед экспедицией распределите комплекты.',x=20,y=8)
    add(62,'Атлас команды',deps=[54,52,61],text='Проверьте все сохранённые порталы через /teammap list. Новый участник получает список после входа; импортируйте метки в Xaero. Удаление /teammap remove name очищает серверный список; уже импортированную личную метку удалите на карте.',x=34,y=5)
    (root/'chapters/divine_rpg.snbt').write_text(json.dumps({'id':'3C35000000000001','filename':'divine_rpg','title':'Divine RPG · измерения и командные экспедиции','order_index':25,'quests':quests},ensure_ascii=False,indent=2)+'\n')
    return quests
if __name__=='__main__':
    from pathlib import Path
    write_divine(Path(__file__).resolve().parents[1]/'overrides/config/ftbquests/quests')
