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
})
ServerEvents.recipes(event => {
  [
    'cataclysm:laser_gatling',
    'cataclysm:wither_assault_shoulder_weapon',
    'cataclysm:void_assault_shoulder_weapon',
    'eeeabsmobs:buster_gauntlet',
    'eeeabsmobs:guardian_core'
  ].forEach(id => event.remove({output: id}))
})
