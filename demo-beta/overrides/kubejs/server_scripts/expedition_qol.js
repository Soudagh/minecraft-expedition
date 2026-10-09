// Accelerate a finite list of ordinary metal parts, never whole machine categories.
ServerEvents.recipes(event => {
  const jsonParser = Java.loadClass('com.google.gson.JsonParser')
  const materials = ['iron', 'copper', 'tin', 'bronze', 'steel', 'lead', 'silver', 'gold', 'red_alloy']
  const parts = ['plate', 'rod', 'long_rod', 'bolt', 'screw', 'ring', 'foil', 'single_wire']
  const outputs = []
  materials.forEach(material => {
    parts.forEach(part => outputs.push('gtceu:' + material + '_' + part))
    outputs.push('gtceu:fine_' + material + '_wire')
  })
  let changed = 0
  ;['bender', 'wiremill', 'lathe', 'cutter'].forEach(type => event.forEachRecipe({type: 'gtceu:' + type}, recipe => {
    const data = JSON.parse(recipe.json.toString())
    const items = data.outputs && data.outputs.item
    const energy = data.tickInputs && data.tickInputs.eu
    if (!items || items.length !== 1 || !energy || energy.length !== 1) return
    const item = items[0].content && items[0].content.ingredient && items[0].content.ingredient.item
    if (outputs.indexOf(item) < 0 || energy[0].content > 128 || data.duration <= 1) return
    recipe.json.add('duration', jsonParser.parseString(String(Math.ceil(data.duration / 2))))
    recipe.changed = true
    changed++
  }))
  console.info('Expedition: accelerated ' + changed + ' ordinary GT recipes (LV/MV, duration only)')
})
