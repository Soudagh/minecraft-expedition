// Isolated QA only. Native LivingEntity.tickEffects with explicit entity-tick phases.
// Not a real client/entity tick or measured attack DPS.
var onslaughtCycleQueued=false
ServerEvents.tick(event=>{
 if(onslaughtCycleQueued)return
 onslaughtCycleQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,rows=[],collisions=[]
  function assert(ok,label){if(!ok)throw new Error('ONSLAUGHT_CYCLE_FAIL '+label);checks++}
  function near(a,b){return Math.abs(a-b)<0.002}
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID')
  var Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes'),Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'),Type=Java.loadClass('net.minecraft.world.entity.EntityType')
  var Effects=Java.loadClass('net.minecraft.world.effect.MobEffects'),Instance=Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
  var Powers=Java.loadClass('net.sweenus.simplyswords.registry.GemPowerRegistry'),Ons=Java.loadClass('net.sweenus.simplyswords.registry.EffectRegistry').ONSLAUGHT.get()
  var player=Factory.get(world,new Profile(UUID.randomUUID(),'OnslaughtCycleQA')),target=Type.COW.create(world),stack=Item.of('simplyswords:runic_longsword')
  var cls=player.getClass(),tickField=null,effectTick=null
  while(cls && (!tickField || !effectTick)){
   if(!tickField){try{tickField=cls.getDeclaredField('f_19797_')}catch(e){}}
   if(!effectTick){try{cls.getDeclaredMethods().forEach(method=>{if(String(method.name)==='m_21217_' && method.getParameterCount()===0)effectTick=method})}catch(e){}}
   cls=cls.getSuperclass()
  }
  assert(!!tickField && !!effectTick,'native entity age and tickEffects found');tickField.setAccessible(true);effectTick.setAccessible(true)
  var oldAge=tickField.getInt(player),mods=stack.getAttributeModifiers(Slot.MAINHAND)
  player.setItemSlot(Slot.MAINHAND,stack);player.attributes.addTransientAttributeModifiers(mods)
  function reset(){player.removeAllEffects();target.removeAllEffects();tickField.setInt(player,0)}
  function trigger(){target.addEffect(new Instance(Effects.MOVEMENT_SLOWDOWN,50,2));Powers.ONSLAUGHT.get().postHit(stack,target,player)}
  function effect(effect){var e=player.getEffect(effect);return e?{amplifier:e.amplifier,duration:e.duration}:null}
  try{
   ;[0,1,10,30,39,40,60,64,65,79,120,259,519].forEach(phase=>[0,10].forEach(refresh=>{
    reset();trigger();assert(player.hasEffect(Ons),'native proc starts '+phase+' '+refresh)
    var timeline=[],hasteTicks=0,weaknessTicks=0,onslaughtTicks=0,sumSpeed=0,rejected=0
    for(var i=0;i<160;i++){
     tickField.setInt(player,phase+i)
     if(refresh && i>0 && i%refresh===0){var blocked=player.hasEffect(Effects.WEAKNESS);trigger();if(blocked)rejected++}
     effectTick.invoke(player)
     var haste=effect(Effects.DIG_SPEED),weakness=effect(Effects.WEAKNESS),onslaught=effect(Ons),speed=player.getAttributeValue(Attr.ATTACK_SPEED)
     if(haste)hasteTicks++;if(weakness)weaknessTicks++;if(onslaught)onslaughtTicks++;sumSpeed+=speed
     assert(speed>=1.59 && speed<=4.17,'bounded native speed '+phase+' '+i)
     timeline.push({tick:i,entityAge:phase+i,haste:haste,weakness:weakness,onslaught:onslaught,attackSpeed:speed,attack:player.getAttributeValue(Attr.ATTACK_DAMAGE)})
    }
    assert(refresh || !player.hasEffect(Ons),'finite Onslaught expires '+phase)
    rows.push({phase:phase,refreshHitEveryTicks:refresh,ticks:160,hasteTicks:hasteTicks,weaknessTicks:weaknessTicks,onslaughtTicks:onslaughtTicks,rejectedRefreshesDuringWeakness:rejected,meanAttackSpeed:sumSpeed/160,timeline:timeline})
   }))
   ;[40,65,71].forEach(age=>{
    reset();trigger();if(age===71){player.removeAllEffects();player.addEffect(new Instance(Ons,9,0))}
    player.addEffect(new Instance(Effects.DIG_SPEED,600,0));tickField.setInt(player,age)
    effectTick.invoke(player)
    collisions.push({fixtureEntityAge:age,fixtureOnslaughtDuration:age===71?9:80,externalHasteBefore:{amplifier:0,duration:600},hasteAfter:effect(Effects.DIG_SPEED),weaknessAfter:effect(Effects.WEAKNESS),onslaughtAfter:effect(Ons)})
   })
   assert(collisions[0].hasteAfter && collisions[0].hasteAfter.amplifier===15,'Onslaught replaces external Haste at pulse')
   assert(!collisions[1].hasteAfter,'Onslaught removes external Haste at age 65')
   assert(!collisions[2].hasteAfter && !!collisions[2].weaknessAfter && !collisions[2].onslaughtAfter,'ending Onslaught removes external Haste and applies Weakness')
   reset();player.addEffect(new Instance(Effects.WEAKNESS,80,0));trigger();assert(!player.hasEffect(Ons),'Weakness prevents native retrigger')
   // Verify recorder against a real full-cooldown Player.attack and HP change in QA.
   reset();var capture=global.expeditionCombatCapture;assert(!!capture,'QA recorder loaded');capture.state.enabled=true;capture.state.session='qa-native';capture.state.startedTick=capture.time(world);capture.state.rows=[];capture.state.dropped=0;capture.state.errors=[]
   player.addTag('exp_combat_observe');target.addTag('exp_combat_target');target.getAttribute(Attr.MAX_HEALTH).setBaseValue(1000);target.setHealth(1000);target.setNoAi(true);target.setNoGravity(true)
   var spawn=world.getSharedSpawnPos();player.setPos(spawn.x+0.5,Math.min(300,spawn.y+40),spawn.z+0.5);target.setPos(player.x+2,player.y,player.z);world.addFreshEntity(target)
   var score=server.getScoreboard().getOrCreatePlayerScore('$expedition',server.getScoreboard().getObjective('exp_stage')),oldStage=score.getScore()
   try{
    score.setScore(3);cls=player.getClass();var attackField=null
    while(cls && !attackField){try{attackField=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}
    attackField.setAccessible(true);attackField.setInt(player,100);player.setOnGround(true);player.fallDistance=0;player.setSprinting(false)
    Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry').runSuppressed(()=>player.attack(target))
    player.addEffect(new Instance(Effects.DIG_SPEED,100,0));capture.sample(player)
    var sample=capture.state.rows.filter(row=>row.kind==='sample')[0]
    assert(!!sample && /^[a-f0-9-]{36}$/.test(sample.player) && isFinite(sample.tick),'recorder UUID and game tick valid')
    assert(sample.effects.some(effect=>effect.id==='minecraft:haste' && effect.amplifier===0 && effect.duration===100),'recorder active effect registry verified')
    var recorded=capture.state.rows.filter(row=>row.kind==='living_damage'),loss=1000-target.health
    assert(capture.state.errors.length===0,'recorder without diagnostic errors')
    assert(recorded.length===1 && near(recorded[0].observedAmount,loss) && loss>0,'recorder event amount matches native QA HP loss')
    assert(capture.state.rows.some(row=>row.kind==='attack_entity') && capture.state.rows.some(row=>row.kind==='sample'),'recorder attack and sample captured')
    capture.flush()
   }finally{score.setScore(oldStage);capture.state.enabled=false;capture.flush();player.removeTag('exp_combat_observe');target.removeTag('exp_combat_target')}
   JsonIO.write('kubejs/export/onslaught-cycle.json',{scope:'Native power callbacks and LivingEntity.tickEffects, explicit entity age phases, 160 prescribed effect ticks per scenario. No full entity/client tick, actual swings, survival rune pairing, combat DPS or natural trigger probability. Recorder separately verified by one real native Player.attack.',checks:checks,rows:rows,collisions:collisions,recorderVerified:true})
   console.info('ONSLAUGHT_CYCLE_SUCCESS checks='+checks+' scenarios='+rows.length)
  }finally{player.removeAllEffects();target.removeAllEffects();tickField.setInt(player,oldAge);player.attributes.removeAttributeModifiers(mods);player.setItemSlot(Slot.MAINHAND,Item.empty);target.discard()}
 })
})
