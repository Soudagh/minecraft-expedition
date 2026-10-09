// HBM starts after GregTech MV; keep alternative HBM anvil tiers behind this gate.
ServerEvents.recipes(event => {
  ['anvil_iron', 'anvil_lead', 'press'].forEach(name => event.remove({output: 'hbm_m:' + name}))
  event.shaped('hbm_m:anvil_iron', ['SSS', ' M ', 'SSS'], {
    S: 'gtceu:steel_plate', M: 'gtceu:mv_machine_hull'
  }).id('expedition:hbm_anvil_iron')
  event.shaped('hbm_m:anvil_lead', ['LLL', ' M ', 'SSS'], {
    L: 'gtceu:lead_plate', S: 'gtceu:steel_plate', M: 'gtceu:mv_machine_hull'
  }).id('expedition:hbm_anvil_lead')
  event.shaped('hbm_m:press', ['SPS', 'SMS', 'SCS'], {
    S: 'gtceu:steel_plate', P: 'gtceu:mv_electric_piston',
    M: 'gtceu:mv_machine_hull', C: 'kubejs:attuned_core'
  }).id('expedition:hbm_press')
  // The storage controller follows the existing magical LV hull gate.
  event.replaceInput({output: 'refinedstorage:controller'}, 'refinedstorage:machine_casing', 'gtceu:lv_machine_hull')
})
