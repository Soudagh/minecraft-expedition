ServerEvents.recipes(event => {
  event.shaped('kubejs:mechanical_core', ['BPB', 'CAC', 'BPB'], {
    B: 'create:brass_ingot', P: 'create:precision_mechanism',
    C: 'create:cogwheel', A: 'create:andesite_alloy'
  }).id('expedition:mechanical_core')
  event.custom({
    type: 'botania:runic_altar', mana: 12000,
    ingredients: [
      {item: 'kubejs:mechanical_core'}, {item: 'gtceu:lv_machine_casing'}, {item: 'botania:rune_water'},
      {item: 'botania:rune_fire'}, {item: 'botania:rune_earth'},
      {item: 'botania:rune_air'}, {item: 'botania:mana_diamond'}
    ], output: {item: 'kubejs:attuned_core'}
  }).id('expedition:attuned_core')
  // Add a production gate without replacing GregTech's own hull recipes.
  event.replaceInput({output: 'gtceu:lv_machine_hull'}, 'gtceu:lv_machine_casing', 'kubejs:attuned_core')
})
