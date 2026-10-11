// Initial conservative demo policy. Keep powerful loot out of early chests.
LootJS.modifiers(event => {
  event.addLootTypeModifier(LootType.CHEST, LootType.ENTITY)
    .removeLoot(/^hbm_m:(grenade.*|missile_.*|machine_missile_assembly)$/)
  // Defensive filter also covers already generated, unopened structure chests.
  event.addLootTypeModifier(LootType.CHEST)
    .removeLoot(/^hbm_m:(gun_(?!fireext)|ammo_(?!fireext)|grenade|missile_|machine_missile|turret_|rocket_|nuke_|detonator|multi_detonator|range_detonator|airstrike_|airbomb|airnukebomb|barbed_wire|mine_|naval_mine|crate_weapon|crate_ammo|assembly_nuke|custom_nuke|dud_nuke|det_nuke|bomb_|balebomb|fissure_bomb|smoke_bomb|boltgun|chopper_gun|compact_launcher|boy_bullet|mold_shell|struct_launcher).*$/)
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
  event.remove({output: /^hbm_m:(grenade.*|missile_.*|machine_missile_assembly)$/});
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
