// Initial conservative demo policy. Keep powerful loot out of early chests.
LootJS.modifiers(event => {
  event.addLootTypeModifier(LootType.CHEST)
    .removeLoot('#simplyswords:uniques')
    .removeLoot('irons_spellbooks:scroll')
    .removeLoot('irons_spellbooks:epic_ink')
    .removeLoot('irons_spellbooks:legendary_ink')
  event.addLootTypeModifier(LootType.CHEST, LootType.ENTITY)
    .removeLoot('cataclysm:laser_gatling')
    .removeLoot('cataclysm:wither_assault_shoulder_weapon')
    .removeLoot('cataclysm:void_assault_shoulder_weapon')
})
ServerEvents.recipes(event => {
  [
    'cataclysm:laser_gatling',
    'cataclysm:wither_assault_shoulder_weapon',
    'cataclysm:void_assault_shoulder_weapon'
  ].forEach(id => event.remove({output: id}))
})
