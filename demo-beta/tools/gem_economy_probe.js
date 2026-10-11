// Isolated QA: actual smithing/smelting recipe matching and gem identification callbacks.
// No full machine ticking or measured production throughput.
var gemEconomyQueued=false
ServerEvents.tick(event=>{
 if(gemEconomyQueued)return
 gemEconomyQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,rows=[],recipes={}
  function assert(ok,label){if(!ok)throw new Error('GEM_ECONOMY_FAIL '+label);checks++}
  var JMap=Java.loadClass('java.util.Map'),Container=Java.loadClass('net.minecraft.world.SimpleContainer'),catalogue=server.recipeManager.getRecipes(),outer=(catalogue instanceof JMap?catalogue.values():catalogue).iterator()
  while(outer.hasNext()){var value=outer.next();if(value instanceof JMap){var nested=value.values().iterator();while(nested.hasNext()){var r=nested.next();recipes[String(r.id)]=r}}else recipes[String(value.id)]=value}
  var Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry'),Gem=Java.loadClass('net.sweenus.simplyswords.power.GemPowerComponent'),Powers=Java.loadClass('net.sweenus.simplyswords.registry.GemPowerRegistry'),Types=Java.loadClass('net.sweenus.simplyswords.power.PowerType')
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID'),player=Factory.get(world,new Profile(UUID.randomUUID(),'GemEconomyQA'))
  var pools={};['RUNEFUSED','NETHER'].forEach(type=>{pools[type]=[];Powers.getPowers(Types[type]).forEach(p=>pools[type].push(String(p.getId())))})
  var melting=recipes['simplyswords:gem_melting'];assert(!!melting,'native gem melting exists');assert(melting.getCookingTime()===500,'melting cooking time500')
  ;[['runefused','minecraft:crying_obsidian','RUNEFUSED'],['netherfused','minecraft:netherite_ingot','NETHER']].forEach(spec=>{
   var id='simplyswords:'+spec[0]+'_gem',recipe=recipes[id];assert(!!recipe,'native gem smithing '+id)
   var inputs=new Container(Item.of('simplyswords:runic_tablet'),Item.of('simplyswords:empowered_remnant'),Item.of(spec[1]))
   assert(recipe.matches(inputs,world),'full inputs match '+id)
   var output=recipe.assemble(inputs,server.registryAccess());assert(String(output.id)===id && output.count===1,'one gem output '+id)
   assert(Components.GEM_POWER.get(output)===null,'new crafted gem not identified yet '+id)
   var method=null;output.item.getClass().getMethods().forEach(m=>{if((String(m.name)==='m_7836_' || String(m.name)==='onCraftedBy') && m.getParameterCount()===3)method=m})
   assert(!!method,'native crafted callback '+id);method.invoke(output.item,[output,world,player])
   var component=Components.GEM_POWER.get(output);assert(!!component,'native crafted callback identifies '+id)
   var power=spec[2]==='NETHER'?String(component.netherPower()):String(component.runicPower())
   assert(pools[spec[2]].indexOf(power)>=0,'identified power within current pool '+id)
   method.invoke(output.item,[output,world,player]);var second=Components.GEM_POWER.get(output),secondPower=spec[2]==='NETHER'?String(second.netherPower()):String(second.runicPower())
   assert(secondPower===power,'repeated callback retains identified power '+id)
   inputs.setItem(0,Item.empty);assert(!recipe.matches(inputs,world),'missing tablet rejected '+id);inputs.setItem(0,Item.of('simplyswords:runic_tablet'))
   inputs.setItem(2,Item.of(spec[2]==='NETHER'?'minecraft:crying_obsidian':'minecraft:netherite_ingot'));assert(!recipe.matches(inputs,world),'wrong addition rejected '+id)
   output.getOrCreateTag().putString('qa_marker','gem-marker')
   var furnace=new Container(output,Item.of('minecraft:coal'),Item.empty)
   assert(melting.matches(furnace,world),'identified gem can melt '+id)
   var remnant=melting.assemble(furnace,server.registryAccess());assert(String(remnant.id)==='simplyswords:empowered_remnant' && remnant.count===1,'one remnant returned '+id)
   assert(Components.GEM_POWER.get(remnant)===null && !remnant.getOrCreateTag().contains('qa_marker'),'melt output clears prior power/NBT '+id)
   var again=new Container(Item.of('simplyswords:runic_tablet'),remnant,Item.of(spec[1]));assert(recipe.matches(again,world),'recycled remnant is reusable '+id)
   var fresh=recipe.assemble(again,server.registryAccess());assert(Components.GEM_POWER.get(fresh)===null,'recycled gem needs new identification '+id)
   furnace.setItem(0,Item.of('simplyswords:runic_tablet'));assert(!melting.matches(furnace,world),'tablet cannot melt as gem')
   rows.push({gem:id,addition:spec[1],craftOutput:1,identifiedPower:power,repeatedIdentificationStable:true,meltOutput:'simplyswords:empowered_remnant',meltOutputCount:1,meltTicks:500,oldPowerCleared:true,recycledRemnantAccepted:true})
  })
  JsonIO.write('kubejs/export/gem-economy.json',{scope:'Actual native recipe matching/assemble and gem onCraftedBy callback. Inputs supplied by QA, no actual furnace ticks, client smithing input consumption, natural loot or measured factory throughput.500ticks is runtime recipe duration.',checks:checks,powerPools:pools,recipes:rows})
  console.info('GEM_ECONOMY_SUCCESS checks='+checks+' recipes='+rows.length)
 })
})
