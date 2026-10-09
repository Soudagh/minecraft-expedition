// Shared production: Create assembles early electronics; GT scales the same inputs.
ServerEvents.recipes(event => {
  const processors = [
    ['basic', 'minecraft:iron_ingot'],
    ['improved', 'minecraft:gold_ingot'],
    ['advanced', 'minecraft:diamond']
  ]
  processors.forEach(row => {
    const output = 'refinedstorage:raw_' + row[0] + '_processor'
    const ingredients = ['refinedstorage:processor_binding', row[1], '#forge:silicon', 'minecraft:redstone']
    event.remove({id: 'refinedstorage:raw_' + row[0] + '_processor'})
    event.custom({type: 'create:mixing', ingredients: ingredients.map(id => id.startsWith('#') ? {tag: id.substring(1)} : {item: id}),
      results: [{item: output}], processingTime: 100}).id('expedition:mix_raw_' + row[0] + '_processor')
    event.recipes.gtceu.assembler('expedition_raw_' + row[0] + '_processor')
      .itemInputs(ingredients).itemOutputs(output).duration(100).EUt(16)
  })
  // The native slime/string recipe remains available before chemical production.
  event.recipes.gtceu.assembler('expedition_polymer_binding')
    .itemInputs('2x minecraft:string').inputFluids('gtceu:polyethylene 144')
    .itemOutputs('16x refinedstorage:processor_binding').duration(100).EUt(16)
  // Keep capacitors, plates and copper coils; change only the central component.
  event.remove({output: 'createaddition:alternator'})
  event.custom({type:'create:mechanical_crafting',pattern:['  A  ',' ISI ','ISRSI',' ICI '],
    key:{A:{item:'kubejs:mechanical_core'},I:{tag:'forge:plates/iron'},S:{item:'createaddition:copper_spool'},
      R:{tag:'forge:rods/iron'},C:{item:'createaddition:capacitor'}},result:{item:'createaddition:alternator'}}).id('expedition:alternator')
  event.remove({output: 'createaddition:electric_motor'})
  event.custom({type:'create:mechanical_crafting',pattern:['  A  ',' BSB ','BSRSB',' BCB '],
    key:{A:{item:'gtceu:lv_electric_motor'},B:{tag:'forge:plates/brass'},S:{item:'createaddition:copper_spool'},
      R:{tag:'forge:rods/iron'},C:{item:'createaddition:capacitor'}},result:{item:'createaddition:electric_motor'}}).id('expedition:electric_motor')
  event.replaceInput({output: 'createaddition:modular_accumulator'}, 'create:brass_casing', 'gtceu:lv_machine_hull')
})
