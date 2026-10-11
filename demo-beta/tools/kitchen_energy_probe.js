// Opt-in disposable QA. No real player or reactor is required.
ServerEvents.loaded(event=>event.server.scheduleInTicks(140,task=>{
  var server=event.server, checks=0, JMap=Java.loadClass('java.util.Map'), recipes={}
  var catalogue=server.recipeManager.getRecipes(), outer=(catalogue instanceof JMap?catalogue.values():catalogue).iterator()
  function assert(ok,label){if(!ok)throw new Error('KITCHEN_ENERGY_FAIL '+label);checks++}
  while(outer.hasNext()){
    var value=outer.next()
    if(value instanceof JMap){var nested=value.values().iterator();while(nested.hasNext()){var r=nested.next();recipes[String(r.id)]=r}}
    else recipes[String(value.id)]=value
  }
  var ref=JsonIO.read('kubejs/export/kitchen-balance-sources.json')
  var Handler=Java.loadClass('net.minecraftforge.items.ItemStackHandler'), Tank=Java.loadClass('net.minecraftforge.fluids.capability.templates.FluidTank')
  var Wrapper=Java.loadClass('umpaz.brewinandchewin.common.utility.KegRecipeWrapper')
  var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'), RL=Java.loadClass('net.minecraft.resources.ResourceLocation')
  var result={scope:'Native keg ingredient/fluid matching, Forge use-start gates with QA FakePlayer and energy APIs; no full line or real player test',drinks:[],energy:{}}
  Object.keys(ref.recipes).forEach(id=>{
    var expected=ref.recipes[id], recipe=recipes[id]
    assert(recipe && String(recipe.type)==='brewinandchewin:fermenting',id+' native recipe')
    assert(recipe.getFermentTime()===expected.fermentingtime && recipe.getTemperature()===expected.temperature,id+' time/temperature')
    assert(recipe.getAmount()===expected.result.count && String(Registry.FLUIDS.getKey(recipe.getResultFluid()))===expected.result.fluid,id+' native output')
    var handler=new Handler(4), tank=new Tank(1000), wrapper=new Wrapper(handler,tank)
    var inputs=recipe.ingredients
    assert(inputs.size()===expected.ingredients.length,id+' native slot count')
    for(var i=0;i<inputs.size();i++){
      assert(String(inputs[i].toJson()).indexOf(expected.ingredients[i].item)>=0,id+' ingredient '+i)
      handler.setStackInSlot(i,Item.of(expected.ingredients[i].item))
    }
    console.info('KITCHEN_SOURCE_FLUID '+id+' '+String(recipe.getFluidIngredient()))
    tank.setFluid(Fluid.of(String(expected.basefluid.fluid),Number(expected.basefluid.count)))
    var baseID=String(Registry.FLUIDS.getKey(tank.getFluid().getFluid()))
    console.info('KITCHEN_BASE_FLUID '+id+' amount='+tank.getFluidAmount()+' id='+baseID+' expected='+expected.basefluid.count+'/'+expected.basefluid.fluid)
    assert(tank.getFluidAmount()===expected.basefluid.count && baseID===String(expected.basefluid.fluid),id+' native base fluid')
    assert(recipe.matches(wrapper,server.overworld()),id+' complete batch')
    var slot=inputs.size()-1, starter=handler.getStackInSlot(slot).copy()
    handler.setStackInSlot(slot,Item.empty)
    assert(!recipe.matches(wrapper,server.overworld()),id+' missing starter rejected')
    handler.setStackInSlot(slot,Item.of(id.indexOf('saccharine')>=0?'minecraft:melon':'minecraft:shroomlight'))
    assert(!recipe.matches(wrapper,server.overworld()),id+' original ungated input rejected')
    handler.setStackInSlot(slot,starter)
    tank.getFluid().setAmount(999)
    assert(!recipe.matches(wrapper,server.overworld()),id+' short fluid rejected')
    result.drinks.push({id:id,slots:inputs.size(),amount:recipe.getAmount(),time:recipe.getFermentTime(),temperature:recipe.getTemperature()})
  })
  Object.keys(ref.starters).forEach(id=>{
    var spec=ref.starters[id], r=recipes['expedition:'+id.substring(7)]
    assert(r && r.getResultItem(server.registryAccess()).id===id,id+' starter exists')
    var text=r.ingredients.map(i=>String(i.toJson())).join(',')
    assert(r.ingredients.size()===2 && text.indexOf(spec.ingredient)>=0 && text.indexOf(spec.material)>=0,id+' exact two inputs')
  })
  // Post the actual Forge event. Restore the shared score even when an assertion fails.
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory')
  var UseStart=Java.loadClass('net.minecraftforge.event.entity.living.LivingEntityUseItemEvent$Start')
  var Forge=Java.loadClass('net.minecraftforge.common.MinecraftForge'), player=Factory.getMinecraft(server.overworld())
  var board=server.getScoreboard(), objective=board.getObjective('exp_stage'), score=board.getOrCreatePlayerScore('$expedition',objective), old=score.getScore()
  try {
    Object.keys(ref.starters).forEach(id=>{
      var spec=ref.starters[id], stack=Item.of(spec.drink)
      score.setScore(spec.stage-1)
      var denied=new UseStart(player,stack,32);Forge.EVENT_BUS.post(denied)
      assert(denied.isCanceled(),spec.drink+' before stage denied')
      assert(stack.count===1,spec.drink+' denied stack retained')
      score.setScore(spec.stage)
      var allowed=new UseStart(player,stack,32);Forge.EVENT_BUS.post(allowed)
      assert(!allowed.isCanceled(),spec.drink+' at stage allowed')
    })
    score.setScore(0)
    var bread=new UseStart(player,Item.of('minecraft:bread'),32);Forge.EVENT_BUS.post(bread)
    assert(!bread.isCanceled(),'ordinary bread available')
    var beer=new UseStart(player,Item.of('brewinandchewin:beer'),32);Forge.EVENT_BUS.post(beer)
    assert(!beer.isCanceled(),'ordinary beer available')
  } finally {score.setScore(old)}
  // Motor method enumeration needs absent optional ComputerCraft types.
  // Use its exact pinned-bytecode formula and runtime ForgeConfig values;
  // alternator production is still evaluated through the actual native function.
  var Config=Java.loadClass('com.mrh0.createaddition.config.Config')
  var Alt=Java.loadClass('com.mrh0.createaddition.blocks.alternator.AlternatorBlockEntity')
  var feAtMax=Number(Config.FE_RPM.get()), minimum=Number(Config.ELECTRIC_MOTOR_MINIMUM_CONSUMPTION.get())
  assert(feAtMax===480 && minimum===8,'loaded motor baseline')
  var rates=[]
  for(var rpm=1;rpm<=256;rpm++){
    var consumed=Math.floor(Math.max(feAtMax*rpm/256,minimum)), generated=Alt.getEnergyProductionRate(rpm)
    assert(generated<consumed,'motor/alternator loss at '+rpm)
    if(rpm===16 || rpm===64 || rpm===256)rates.push({rpm:rpm,consumed:consumed,generated:generated})
  }
  result.energy.create={scope:'Native alternator rates vs exact motor consumption formula from locked bytecode (motor method blocked by absent optional API)',feAtMax:feAtMax,minimum:minimum,rates:rates}
  var GT=Java.loadClass('com.gregtechceu.gtceu.config.ConfigHolder').INSTANCE.compat.energy
  assert(!GT.enableFEConverters && GT.nativeEUToFE && GT.euToFeRatio===4 && GT.feToEuRatio===4,'GT one-way native conversion and balanced ratios')
  result.energy.gt={nativeEUToFE:GT.nativeEUToFE,enableFEConverters:GT.enableFEConverters,euToFeRatio:GT.euToFeRatio,feToEuRatio:GT.feToEuRatio}
  var Converter=Java.loadClass('com.hbm_m.api.energy.ConverterBlockEntity'), Pos=Java.loadClass('net.minecraft.core.BlockPos')
  var tile=new Converter(new Pos(0,0,0),Registry.BLOCKS.getValue(new RL('hbm_m:converter_block')).defaultBlockState()), fe=tile.getForgeWrapper()
  tile.setEnergyStored(0)
  assert(fe.receiveEnergy(1000,true)===1000 && tile.getEnergyStored()===0,'HE/FE simulate receive is pure')
  assert(fe.receiveEnergy(1000,false)===1000 && tile.getEnergyStored()===1000,'FE to HE 1:1')
  assert(fe.extractEnergy(1000,true)===1000 && tile.getEnergyStored()===1000,'HE/FE simulate extract is pure')
  assert(fe.extractEnergy(1000,false)===1000 && tile.getEnergyStored()===0,'HE to FE 1:1 roundtrip')
  result.energy.hbm={received:1000,extracted:1000,remaining:0}
  result.checks=checks
  JsonIO.write('kubejs/export/kitchen-energy-results.json',result)
  console.info('KITCHEN_ENERGY_SUCCESS '+JSON.stringify(result))
}))
