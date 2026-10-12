// Disposable native QA. Never install this diagnostic in the game server.
ServerEvents.loaded(event=>event.server.scheduleInTicks(140,()=>{
 var server=event.server,world=server.overworld(),checks=0,rows=[],items=[]
 function assert(ok,label){if(!ok)throw new Error('CAT_DIVINE_FAIL '+label);checks++}
 var board=server.getScoreboard(),cat=board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_cat')),stage=board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_stage'))
 var oldCat=cat.getScore(),oldStage=stage.getScore(),oldWins=[]
 for(var i=1;i<=9;i++)oldWins.push(board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_b'+i)).getScore())
 var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),UUID=Java.loadClass('java.util.UUID'),Profile=Java.loadClass('com.mojang.authlib.GameProfile')
 var Player=Java.loadClass('net.minecraft.server.level.ServerPlayer'),player=new Player(server,world,new Profile(UUID.randomUUID(),'CatDivineQA'))
 var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),fake=Factory.get(world,new Profile(UUID.randomUUID(),'CatDivineFake'))
 var Travel=Java.loadClass('net.minecraftforge.event.entity.EntityTravelToDimensionEvent'),Keys=Java.loadClass('net.minecraft.resources.ResourceKey'),Registries=Java.loadClass('net.minecraft.core.registries.Registries'),Bus=Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS
 var policy=JsonIO.read('kubejs/config/cataclysm_campaign.json'), Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
 function travel(id){var e=new Travel(fake,Keys.create(Registries.DIMENSION,Utils.id(id)));Bus.post(e);return e.isCanceled()}
 try {
  cat.setScore(0);stage.setScore(9)
  Object.keys(policy.dimensions).forEach(id=>assert(travel(id),'all Divine locked before Cat '+id))
  assert(!travel('minecraft:overworld'),'Overworld return allowed')
  assert(!travel('minecraft:the_nether'),'Nether unaffected');assert(!travel('minecraft:the_end'),'End unaffected')
  var Portal=Java.loadClass('divinerpg.blocks.base.BlockModPortal$PortalSpawnEvent')
  var portalEvent=new Portal(world,player.blockPosition(),world.getBlockState(player.blockPosition()),null)
  Bus.post(portalEvent);assert(portalEvent.isCanceled(),'native portal creation blocked before Cat')
  fake.setItemSlot(Slot.MAINHAND,Item.of('divinerpg:eden_blade'));global.expeditionCheckEquipment(fake)
  assert(fake.mainHandItem.isEmpty(),'existing Divine gear cannot bypass Cat gate')
  var preserved=false;for(var k=0;k<36;k++)if(String(fake.inventory.getItem(k).id)==='divinerpg:eden_blade')preserved=true
  assert(preserved,'locked item preserved')
  for(var i=1;i<=9;i++)board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_b'+i)).setScore(0)
  stage.setScore(0);server.runCommandSilent('function expedition:progression/win/watchers')
  assert(stage.getScore()===0,'SLB win cannot skip Cataclysm')
  policy.bosses.forEach(spec=>{
   var boss=Registry.ENTITY_TYPES.getValue(Utils.id(spec.entity)).create(world)
   assert(!!boss,'registered Cat boss '+spec.entity)
   var beforeHealth=boss.maxHealth
   assert(global.expeditionApplyBossHealth(boss),'Cat profile applied '+spec.entity)
   assert(boss.maxHealth===JsonIO.read('kubejs/config/boss_balance.json').native[spec.entity].health,'Cat target health '+spec.entity)
   assert(!global.expeditionApplyBossHealth(boss),'profile not applied twice '+spec.entity)
   rows.push({id:spec.entity,className:String(boss.getClass().getName()),nativeHealth:beforeHealth,health:boss.maxHealth,armor:boss.armorValue})
   cat.setScore(spec.order-1)
   assert(!global.expeditionCatVictory(server,boss,{type:'player',player:fake}),'FakePlayer rejected '+spec.entity)
   assert(!global.expeditionCatVictory(server,boss,{type:'genericKill',player:player}),'command rejected '+spec.entity)
   assert(!global.expeditionCatVictory(server,boss,{type:'outOfWorld',player:null}),'void rejected '+spec.entity)
   assert(!global.expeditionCatVictory(server,boss,{type:'magic',player:null}),'unengaged rejected '+spec.entity)
   cat.setScore(spec.order-2)
   assert(!global.expeditionCatVictory(server,boss,{type:'player',player:player}),'out-of-order rejected '+spec.entity)
   cat.setScore(spec.order-1)
   assert(global.expeditionCatVictory(server,boss,{type:'player',player:player}),'survival victory accepted '+spec.entity)
   assert(cat.getScore()===spec.order,'shared persistent stage '+spec.entity)
   assert(!global.expeditionCatVictory(server,boss,{type:'player',player:player}),'duplicate does not advance '+spec.entity)
   boss.discard()
  })
  cat.setScore(7);stage.setScore(9);assert(travel('divinerpg:eden'),'seven wins do not open first portal')
  cat.setScore(8);stage.setScore(0)
  portalEvent=new Portal(world,player.blockPosition(),world.getBlockState(player.blockPosition()),null)
  Bus.post(portalEvent);assert(!portalEvent.isCanceled(),'native portal creation opens after Cat')
  Object.keys(policy.dimensions).forEach(id=>{
   var required=policy.dimensions[id]
   stage.setScore(required);assert(!travel(id),'unlocked at declared stage '+id)
   if(required){stage.setScore(required-1);assert(travel(id),'next realm locked '+id)}
  })
  stage.setScore(0);server.runCommandSilent('function expedition:progression/win/lothric');assert(stage.getScore()===0,'future SLB cannot bank victory')
  server.runCommandSilent('function expedition:progression/win/watchers');assert(stage.getScore()===1,'first SLB opens after Cat')
  server.runCommandSilent('function expedition:progression/win/champion');assert(stage.getScore()===2,'second SLB opens Wildwood')
  stage.setScore(0);fake.setItemSlot(Slot.MAINHAND,Item.of('divinerpg:eden_blade'));global.expeditionCheckEquipment(fake);assert(!fake.mainHandItem.isEmpty(),'Eden weapon available after Cat')
  fake.setItemSlot(Slot.MAINHAND,Item.of('divinerpg:wildwood_blade'));global.expeditionCheckEquipment(fake);assert(fake.mainHandItem.isEmpty(),'Cat gear preparation cannot bypass Divine realm gear stages')
  Registry.ENTITY_TYPES.getEntries().forEach(entry=>{
   var id=String(entry.getKey().location());if(!id.startsWith('divinerpg:'))return
   var entity=entry.getValue().create(world);if(!entity)return
   var name=String(entity.getClass().getName())
   if(name.startsWith('divinerpg.entities.boss.')){
    var nativeHealth=entity.maxHealth;assert(global.expeditionApplyBossHealth(entity),'Divine profile '+id)
    assert(entity.maxHealth===JsonIO.read('kubejs/config/boss_balance.json').native[id].health,'Divine target '+id)
    rows.push({id:id,className:name,nativeHealth:nativeHealth,health:entity.maxHealth,armor:entity.armorValue})
   }
   entity.discard()
  })
  Registry.ITEMS.getEntries().forEach(entry=>{
   var id=String(entry.getKey().location());if(!id.startsWith('cataclysm:'))return
   var stack=Item.of(id),mods=[]
   ;['MAINHAND','HEAD','CHEST','LEGS','FEET'].forEach(slot=>{
    var entries=[];stack.getAttributeModifiers(Slot[slot]).entries().forEach(m=>entries.push({attribute:String(m.getKey().descriptionId),amount:m.getValue().amount,operation:String(m.getValue().operation)}))
    if(entries.length)mods.push({slot:slot,modifiers:entries})
   })
   if(mods.length)items.push({id:id,attributes:mods})
  })
  var result={checks:checks,bosses:rows,cataclysmGear:items,scope:'Native gate and attribute QA; no animated multiplayer combat.'}
  JsonIO.write('kubejs/export/cataclysm-divine-results.json',result)
  console.info('CAT_DIVINE_SUCCESS '+checks+' bosses='+rows.length+' gear='+items.length)
 } finally {
  cat.setScore(oldCat);stage.setScore(oldStage)
  for(var i=1;i<=9;i++)board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_b'+i)).setScore(oldWins[i-1])
  player.inventory.clearContent();player.discard();fake.discard()
 }
}))
