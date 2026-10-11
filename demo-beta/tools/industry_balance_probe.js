// Disposable QA only. Native ingredient matching; no reactors are placed or run.
ServerEvents.loaded(event=>event.server.scheduleInTicks(100,task=>{
  var server=event.server, ref=JsonIO.read('kubejs/export/industry-balance-sources.json')
  var Container=Java.loadClass('net.minecraft.world.SimpleContainer')
  var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries')
  var RL=Java.loadClass('net.minecraft.resources.ResourceLocation')
  var JMap=Java.loadClass('java.util.Map'), catalogue=server.recipeManager.getRecipes(), recipes={}
  var outer=(catalogue instanceof JMap?catalogue.values():catalogue).iterator(), checks=0, tested=[]
  function assert(ok,label){if(!ok)throw new Error('INDUSTRY_BALANCE_FAIL '+label);checks++}
  while(outer.hasNext()){
    var value=outer.next()
    if(value instanceof JMap){var nested=value.values().iterator();while(nested.hasNext()){var r=nested.next();recipes[String(r.id)]=r}}
    else recipes[String(value.id)]=value
  }
  Object.keys(ref.recipes).forEach(id=>{
    var expected=ref.recipes[id], recipe=recipes[id]
    assert(!!recipe,id+' exists')
    assert(String(recipe.type)==='hbm_m:assembler',id+' native assembler')
    assert(recipe.getDuration()===expected.duration && recipe.getPowerConsumption()===expected.power,id+' unchanged time/power')
    assert(recipe.getResultItem(server.registryAccess()).id===expected.output.item,id+' unchanged output')
    var slots=recipe.getInputDisplaySlots(), container=new Container(Item.empty,Item.empty,Item.empty,Item.empty,Item.empty,Item.empty,
      Item.empty,Item.empty,Item.empty,Item.empty,Item.empty,Item.empty)
    assert(slots.size()===expected.ingredients.length,id+' slots')
    for(var index=0;index<slots.size();index++){
      var input=expected.ingredients[index]
      var slot=slots[index], ingredient=slot.ingredient(), raw=JSON.parse(String(ingredient.toJson()))
      assert(slot.count()===(input.count || 1),id+' count '+index)
      var nativeIds=(Array.isArray(raw)?raw:[raw]).map(i=>i.item)
      var expectedIds=[]
      if(input.items)input.items.forEach(i=>expectedIds.push(String(i.item)))
      else expectedIds.push(String(input.item))
      assert(JSON.stringify(nativeIds.sort())===JSON.stringify(expectedIds.sort()),id+' choices '+index)
      var stack=Item.of(expectedIds[0],slot.count());container.setItem(index,stack)
    }
    assert(recipe.matches(container,server.overworld()),id+' full batch matches')
    var last=slots.size()-1, hull=container.getItem(last).copy()
    container.setItem(last,Item.empty)
    assert(!recipe.matches(container,server.overworld()),id+' missing hull rejected')
    container.setItem(last,hull)
    var original=container.getItem(0).copy(), short=original.copy();short.shrink(1);container.setItem(0,short)
    assert(!recipe.matches(container,server.overworld()),id+' short native ingredient rejected')
    tested.push({id:id,hull:String(hull.id),slots:slots.size(),duration:recipe.getDuration(),power:recipe.getPowerConsumption()})
  })
  var converter=recipes['hbm_m:crafting/converter_block'], counts={}
  assert(converter && String(converter.type)==='create:mechanical_crafting','converter mechanical assembly')
  converter.ingredients.forEach(i=>{
    var raw=JSON.parse(String(i.toJson()))
    if(raw.item){var id=raw.item;counts[id]=(counts[id] || 0)+1}
  })
  assert(counts['hbm_m:capacitor']===3 && counts['minecraft:redstone']===3 && counts['hbm_m:steel_ingot']===3 && counts['gtceu:mv_machine_hull']===1,'converter original nine + hull')
  assert(Registry.BLOCKS.getValue(new RL('hbm_m:converter_block')).defaultBlockState().hasBlockEntity(),'working converter block entity')
  var stages={machine_assembler:5,advanced_assembly_machine:5,blast_furnace:5,crucible:5,
    shredder:5,compressor:5,centrifuge:5,chemical_plant:5,refinery:5,converter_block:5,
    machine_battery:5,machine_battery_socket:5,steam_turbine:5,steam_condenser:5,
    industrial_boiler:5,solar_boiler:5,gas_centrifuge:6,turbine:6,industrial_turbine:6,
    zirnox:6,rbmk_blank:6,rbmk_loader:6,rbmk_control:6,rbmk_boiler:6}
  Object.keys(stages).forEach(name=>{
    var id='hbm_m:'+name
    assert(Registry.BLOCKS.containsKey(new RL(id)),'stage block registered '+id)
    assert(expeditionRequiredStage(id)===stages[name],'stage '+id)
  })
  assert(expeditionRequiredStage('createaddition:alternator')===0,'early Create generator preserved')
  assert(expeditionRequiredStage('minecraft:furnace')===0,'vanilla furnace preserved')
  assert(expeditionRequiredStage('hbm_m:steel_scaffold')===0,'HBM decor preserved')
  var result={scope:'Native recipes, full/short/missing-hull batch matching and stage mapping; no assembled line or reactor production',checks:checks,recipes:tested,converter:counts}
  JsonIO.write('kubejs/export/industry-balance-results.json',result)
  console.info('INDUSTRY_BALANCE_SUCCESS '+JSON.stringify(result))
}))
