// GT-- 1.3.10 + GTCEu 7.5.3 generates this recipe with an empty ore ingredient.
// Remove the unavailable ore route; do not introduce free neutronium.
ServerEvents.recipes(event => {
  event.remove({id: 'gtceu:shapeless/centrifuged_ore_to_dust_neutronium'})
})
