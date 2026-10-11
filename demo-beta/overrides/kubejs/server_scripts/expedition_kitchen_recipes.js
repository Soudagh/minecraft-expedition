// One renewable campaign material per 1000 mB batch (four ordinary tankards).
// Each starter retains the ingredient it replaces in the native keg recipe.
ServerEvents.recipes(event=>{
  event.shapeless('kubejs:sweet_fermentation_starter',[
    'minecraft:melon','kubejs:material_champion'
  ]).id('expedition:sweet_fermentation_starter')
  event.shapeless('kubejs:combat_fermentation_starter',[
    'minecraft:shroomlight','kubejs:material_lothric'
  ]).id('expedition:combat_fermentation_starter')
})
