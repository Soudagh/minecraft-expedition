// Disposable QA. Native effects, claim attack events and GT controller contracts.
ServerEvents.loaded(event=>event.server.scheduleInTicks(340,()=>{
 var server=event.server,world=server.overworld(),checks=0,results={}
 function assert(ok,label){if(!ok)throw new Error('LATE_BALANCE_FAIL '+label);checks++}
 var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID'),Slots=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'),Types=Java.loadClass('net.minecraft.world.entity.EntityType'),Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes'),Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries')
 var owner=Factory.get(world,new Profile(UUID.randomUUID(),'LateQAOwner')),stranger=Factory.get(world,new Profile(UUID.randomUUID(),'LateQAStranger'))
 var board=server.getScoreboard(),saved={},keys=['exp_stage','exp_complete','exp_b1','exp_b2','exp_b3','exp_b4','exp_b5','exp_b6','exp_b7','exp_b8','exp_b9']
 keys.forEach(k=>{saved[k]=board.getOrCreatePlayerScore('$expedition',board.getObjective(k)).getScore()})
 var set=function(k,v){board.getOrCreatePlayerScore('$expedition',board.getObjective(k)).setScore(v)}
 var Abilities=Java.loadClass('divinerpg.events.ArmorAbilitiesEvent'),angel=Registry.MOB_EFFECTS.getValue(Utils.id('divinerpg:angelic_flight'))
 var data=owner.getForgePersistentData().getCompound('PlayerPersisted');owner.getForgePersistentData().put('PlayerPersisted',data)
 var API=Java.loadClass('xaero.pac.common.server.api.OpenPACServerAPI').get(server),claims=API.getServerClaimsManager(),dim=Utils.id(String(world.dimension))
 var Pos=Java.loadClass('net.minecraft.core.BlockPos'),spawn=world.getSharedSpawnPos(),pos=new Pos(spawn.x+96,250,spawn.z+96),cx=pos.x>>4,cz=pos.z>>4,claimMade=false,oldBlock=null,cow=null,zombie=null,machine=null,target=null
 try {
  owner.inventory.clearContent();set('exp_stage',7);data.putInt('exp_angelic_ticks',0)
  ;[['HEAD','helmet'],['CHEST','chestplate'],['LEGS','leggings'],['FEET','boots']].forEach(r=>owner.setItemSlot(Slots[r[0]],Item.of('divinerpg:angelic_'+r[1])))
  Abilities.updateAbilities(owner);assert(!owner.hasEffect(angel),'angelic denied without supply')
  owner.inventory.setItem(8,Item.of('2x kubejs:material_nightlord'));global.expeditionAngelicTick(owner)
  assert(owner.hasEffect(angel) && owner.abilities.mayfly,'supplied native angelic reactivation')
  assert(owner.inventory.getItem(8).count===2,'grounded does not consume supply')
  owner.abilities.flying=true;global.expeditionAngelicTick(owner)
  assert(owner.inventory.getItem(8).count===1 && data.getInt('exp_angelic_ticks')===3599,'one supply pays first flight tick')
  global.expeditionAngelicTick(owner);assert(owner.inventory.getItem(8).count===1 && data.getInt('exp_angelic_ticks')===3598,'prepaid ticks do not double charge')
  owner.abilities.flying=false;global.expeditionAngelicTick(owner);assert(data.getInt('exp_angelic_ticks')===3598,'grounded preserves credit')
  owner.inventory.getItem(8).shrink(1);data.putInt('exp_angelic_ticks',1);owner.abilities.flying=true;global.expeditionAngelicTick(owner);global.expeditionAngelicTick(owner)
  assert(data.getInt('exp_angelic_ticks')===0 && !owner.hasEffect(angel) && !owner.abilities.mayfly,'exhaustion revokes native flight')
  assert(owner.hasEffect(Registry.MOB_EFFECTS.getValue(Utils.id('minecraft:slow_falling'))),'emergency slow fall')
  owner.removeAllEffects();owner.inventory.clearContent();data.putInt('exp_angelic_ticks',123)
  owner.removeAllEffects();assert(data.getInt('exp_angelic_ticks')===123,'credit not stored in effect lifetime')
  results.flight={cost:'1x kubejs:material_nightlord',ticks:3600,groundedCharge:false,emergencySlowFallTicks:80}
  // Native claim API creates an isolated claim and removes it in finally.
  assert(!claims.get(dim,cx,cz),'QA chunk was not already claimed');world.getChunk(cx,cz)
  var claim=claims.claim(dim,owner.uuid,0,cx,cz,false);assert(!!claim,'native claim created');claimMade=true
  assert(API.getChunkProtection().hasChunkAccess(owner.uuid,dim,cx,cz),'owner claim access')
  assert(!API.getChunkProtection().hasChunkAccess(stranger.uuid,dim,cx,cz),'stranger claim denied')
  owner.setPos(pos.x+0.5,pos.y,pos.z+0.5);stranger.setPos(pos.x+2,pos.y,pos.z+0.5)
  cow=Types.COW.create(world);cow.setPos(pos.x+1,pos.y,pos.z+1);zombie=Types.ZOMBIE.create(world);zombie.setPos(pos.x+3,pos.y,pos.z+1)
  var Bus=Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS,Attack=Java.loadClass('net.minecraftforge.event.entity.living.LivingAttackEvent')
  var rows=[]
  ;[['stranger_to_cow',cow,world.damageSources().playerAttack(stranger)],['owner_to_cow',cow,world.damageSources().playerAttack(owner)],['zombie_to_owner',owner,world.damageSources().mobAttack(zombie)],['cow_to_owner',owner,world.damageSources().mobAttack(cow)],['magic_to_owner',owner,world.damageSources().magic()]].forEach(r=>{
   var e=new Attack(r[1],r[2],10);Bus.post(e);rows.push({case:r[0],canceled:e.isCanceled()})
  })
  assert(rows[0].canceled,'stranger cannot kill protected livestock');assert(!rows[1].canceled,'owner can attack own livestock')
  results.claimAttacks=rows;console.info('LATE_QA_CLAIMS '+JSON.stringify(rows))
  // A placed real controller identifies tier correctly but cannot earn a win.
  oldBlock=world.getBlockState(pos);world.setBlock(pos,Registry.BLOCKS.getValue(Utils.id('gtceu:uv_fusion_reactor')).defaultBlockState(),3)
  machine=Java.loadClass('com.gregtechceu.gtceu.api.machine.MetaMachine').getMachine(world,pos)
  assert(!!machine,'native UV machine created');assert(String(machine.getDefinition().getId())==='gtceu:uv_fusion_reactor','native UV definition');console.info('LATE_QA_FUSION_TIER '+machine.getTier());assert(!global.expeditionFinalState(machine),'unformed reactor not eligible')
  set('exp_complete',0);set('exp_stage',9);for(var i=1;i<=9;i++)set('exp_b'+i,1)
  assert(global.expeditionFinalVictories(server),'all nine wins accepted');set('exp_b4',0);assert(!global.expeditionFinalVictories(server),'missing middle win rejected');set('exp_b4',1)
  owner.inventory.clearContent();assert(!global.expeditionFinalComponents(owner),'no components rejected');owner.inventory.setItem(0,Item.of('4x gtceu:uv_electric_motor'));owner.inventory.setItem(1,Item.of('3x gtceu:uv_electric_pump'));assert(!global.expeditionFinalComponents(owner),'short components rejected');owner.inventory.setItem(1,Item.of('4x gtceu:uv_electric_pump'));assert(global.expeditionFinalComponents(owner),'full components accepted')
  assert(!global.expeditionFinalAdvanced(5,{working:true,completed:5}),'same native counter rejected');assert(!global.expeditionFinalAdvanced(5,{working:false,completed:6}),'stopped snapshot rejected');assert(global.expeditionFinalAdvanced(5,{working:true,completed:6}),'completed and continuing snapshot accepted');assert(!global.expeditionFinalAdvanced(5,{working:true,completed:0}),'counter reset rejected')
  var dispatcher=server.getCommands().getDispatcher();assert(dispatcher.execute('expeditionfinal watch '+pos.x+' '+pos.y+' '+pos.z,owner.createCommandSourceStack())===0,'actual unformed command cannot complete')
  assert(board.getOrCreatePlayerScore('$expedition',board.getObjective('exp_complete')).getScore()===0,'no final score from item/controller')
  results.completion={nativeTier:machine.getTier(),unformedRejected:true,positiveScope:'Snapshot reducer only; no assembled fusion or positive end-to-end completion fixture.'}
  // Isolated ordinary hits with real full-set effects; no animated DPS.
  claims.unclaim(dim,cx,cz);claimMade=false
  target=Types.COW.create(world);var armorRows=[]
  owner.getAttribute(Attr.ATTACK_DAMAGE).setBaseValue(16);owner.setSprinting(false);owner.fallDistance=0;owner.setOnGround(true)
  var cls=owner.getClass(),ticker=null;while(cls && !ticker){try{ticker=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}
  assert(!!ticker,'native attack ticker found');ticker.setAccessible(true)
  target.getAttribute(Attr.MAX_HEALTH).setBaseValue(1000);target.setPos(pos.x+1,pos.y,pos.z+1);world.addFreshEntity(target)
  var applied=[]
  ;[null,'minecraft:diamond','minecraft:netherite','divinerpg:eden','divinerpg:wildwood','divinerpg:apalachia','divinerpg:skythern','divinerpg:mortum','divinerpg:halite','divinerpg:awakened_halite'].forEach(prefix=>{
   applied.forEach(m=>target.attributes.removeAttributeModifiers(m));applied=[];target.removeAllEffects()
   ;[['HEAD','helmet'],['CHEST','chestplate'],['LEGS','leggings'],['FEET','boots']].forEach(r=>{var stack=prefix?Item.of(prefix+'_'+r[1]):Item.empty,mods=stack.getAttributeModifiers(Slots[r[0]]);target.setItemSlot(Slots[r[0]],stack);target.attributes.addTransientAttributeModifiers(mods);applied.push(mods)})
   Abilities.updateAbilities(target);var effects=[];target.getActiveEffects().forEach(e=>effects.push(String(Registry.MOB_EFFECTS.getKey(e.effect))))
   target.setHealth(1000);target.invulnerableTime=0;ticker.setInt(owner,100);assert(owner.getAttackStrengthScale(0.5)===1,'full attack cooldown');owner.attack(target);var loss=1000-target.health
   assert(loss>0 && loss<=16,'native protected hit '+prefix);if(!prefix)assert(loss===16,'calibrated naked hit 16 HP')
   armorRows.push({set:prefix || 'none',armor:target.getAttributeValue(Attr.ARMOR),toughness:target.getAttributeValue(Attr.ARMOR_TOUGHNESS),sourceDamage:16,healthLost:loss,effects:effects})
  })
  assert(armorRows[3].healthLost>=armorRows[2].healthLost,'Eden II does not outprotect Netherite III on calibrated hit')
  assert(armorRows[4].healthLost<armorRows[3].healthLost,'Wildwood improves protection over Eden')
  target.discard();results.armor=armorRows
  results.checks=checks;results.scope='Native APIs, actual effects and one ordinary damage source; no real client, assembled fusion, SLB command damage or boss fights.'
  JsonIO.write('kubejs/export/late-balance-results.json',results);console.info('LATE_BALANCE_SUCCESS '+checks+' '+JSON.stringify(results.claimAttacks))
 } finally {
  keys.forEach(k=>set(k,saved[k]));owner.removeAllEffects();owner.inventory.clearContent();data.putInt('exp_angelic_ticks',0)
  if(oldBlock)world.setBlock(pos,oldBlock,3);if(claimMade)claims.unclaim(dim,cx,cz)
  if(cow)cow.discard();if(zombie)zombie.discard();if(target)target.discard()
 }
}))
