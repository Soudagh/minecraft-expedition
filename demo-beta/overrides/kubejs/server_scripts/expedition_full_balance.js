// First whole-pack recipe constraints. These are production requirements,
// not boss locks; spells, loot and donated items require separate enforcement.
ServerEvents.recipes(event => {
  // Preserve Gaia's drops and elementium; move the base tiara to EV production.
  // Wing appearance recipes consume an existing tiara and stay unchanged.
  event.replaceInput({id: 'botania:flighttiara_0'}, 'botania:ender_air_bottle', 'gtceu:ev_machine_hull')
  // Basic RS storage/autocrafting remains LV; portable access follows HV.
  event.replaceInput({output: 'refinedstorage:wireless_grid'}, 'refinedstorage:advanced_processor', 'gtceu:hv_machine_hull')
})
