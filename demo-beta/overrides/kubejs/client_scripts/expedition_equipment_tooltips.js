ItemEvents.tooltip(event=>{
  event.add(/^minecraft:netherite_(sword|axe|helmet|chestplate|leggings|boots)$/,
    'Боевая экипировка открывается на общем этапе III. Вещь можно хранить до открытия этапа.')
  event.add(/^simplyswords:(netherite|runic)_(longsword|twinblade|rapier|katana|sai|spear|glaive|warglaive|cutlass|claymore|greataxe|greathammer|chakram|scythe|halberd)$/,
    'Оружие открывается на общем этапе III. Найденное оружие можно хранить до открытия этапа.')
})
