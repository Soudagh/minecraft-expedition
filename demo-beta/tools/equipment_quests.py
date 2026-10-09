"""Optional combat-role goals. No role becomes a prerequisite of boss victories."""
def write_equipment(root,json):
    goals=[
        ('Террастальная защита','botania:terrasteel_chestplate',3,'Настройте каждый слиток террастали материалом Lothric. Рецепт сохраняет манастальную броню, сезонную руну и веточки; это вариант защиты, не обязательная форма команды.'),
        ('Руническое оружие','simplyswords:netherite_longsword',3,'Пример незеритового оружия Simply Swords. Для всех 15 форм используется рунический незерит: слиток плюс материал Lothric. Алмазная основа и кузнечный шаблон сохраняются; выберите оружие под свои навыки.'),
        ('Книга развитого заклинателя','irons_spellbooks:diamond_spell_book',3,'Два алмаза настраиваются материалом Lothric; остальные компоненты сохраняются. Найденный свиток не обходит серверную проверку каста. M&A и Hex остаются отдельными специализациями.'),
        ('Редкие чернила','kubejs:rare_ink_catalyst',3,'Железо плюс материал Lothric дают катализатор котла. 1000 mB uncommon ink превращаются в 250 mB rare ink. Create разливает чернила по бутылкам.'),
        ('Поздняя магическая защита','irons_spellbooks:netherite_mage_chestplate',6,'Усиленный незерит соединяет обычный слиток с материалом Cinder. Основа wizard chestplate и кузнечный шаблон сохранены. Получение вещи не доказывает освоение заклинаний.'),
        ('Эпические чернила','kubejs:epic_ink_catalyst',6,'Золото плюс материал Cinder дают катализатор котла. 1000 mB rare ink превращаются в 250 mB epic ink. Эпические касты требуют общего этапа VI.'),
        ('Легендарные чернила','kubejs:legendary_ink_catalyst',7,'Аметист плюс материал Nightlord дают катализатор котла. 1000 mB epic ink превращаются в 250 mB legendary ink. Полёт Angel Wing и Teleport открываются на этапе VII.'),
    ]
    quests=[]
    for i,(title,item,stage,text) in enumerate(goals,1):
        quests.append({'id':f'150000000000{i:04X}','title':title,'x':float((i-1)%4*4),'y':float((i-1)//4*3),
                       'description':[text,'Необязательная цель выбранной роли. Квест не расходует предметы. Найденная или переданная закрытая экипировка снимается в инвентарь; при нехватке места хранится в личном резерве до освобождения ячейки.'],
                       'dependencies':[f'140000000000{stage:04X}'],
                       'tasks':[{'id':f'260000000000{i:04X}','type':'item','item':item,'count':1,'consume_items':False}]})
    (root/'chapters/combat_roles.snbt').write_text(json.dumps({'id':'3000000000000021','filename':'combat_roles','title':'Боевые роли · настройка экипировки','order_index':22,'quests':quests},ensure_ascii=False,indent=2)+'\n')
