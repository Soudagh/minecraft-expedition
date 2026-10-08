// Initial conservative demo policy. Keep powerful loot out of early chests.
LootJS.modifiers(event => {
  event.addLootTypeModifier(LootType.CHEST)
    .removeLoot('#simplyswords:uniques')
  event.addLootTypeModifier(LootType.CHEST, LootType.ENTITY)
    .removeLoot('cataclysm:laser_gatling')
    .removeLoot('cataclysm:wither_assault_shoulder_weapon')
    .removeLoot('cataclysm:void_assault_shoulder_weapon')
    .removeLoot('eeeabsmobs:buster_gauntlet')
    .removeLoot('eeeabsmobs:guardian_core')
    .removeLoot('createdieselgenerators:chemical_sprayer')
    .removeLoot('createdieselgenerators:chemical_sprayer_lighter')
    .removeLoot('createdieselgenerators:chemical_turret')
})
ServerEvents.recipes(event => {
  [
    'cataclysm:laser_gatling',
    'cataclysm:wither_assault_shoulder_weapon',
    'cataclysm:void_assault_shoulder_weapon',
    'eeeabsmobs:buster_gauntlet',
    'eeeabsmobs:guardian_core',
    'createdieselgenerators:chemical_sprayer',
    'createdieselgenerators:chemical_sprayer_lighter',
    'createdieselgenerators:chemical_turret'
  ].forEach(id => event.remove({output: id}))
})
