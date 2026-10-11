// Isolated native hitbox fixture QA, not live SLB phase or EF client combat.
var slbHitboxQueued=false
ServerEvents.tick(event=>{
 if(slbHitboxQueued)return
 slbHitboxQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,rows=[],targets=[],applied=null
  function assert(ok,label){if(!ok)throw new Error('SLB_HITBOX_FAIL '+label);checks++}
  var fixtures=JsonIO.read('kubejs/export/slb-hitbox-fixtures.json').fixtures
  var Registries=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),Effects=Java.loadClass('net.minecraft.world.effect.MobEffects'),Effect=Java.loadClass('net.minecraft.world.effect.MobEffectInstance'),Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'),Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID'),player=Factory.get(world,new Profile(UUID.randomUUID(),'SLBHitboxQA'))
  var Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry'),Gem=Java.loadClass('net.sweenus.simplyswords.power.GemPowerComponent'),Awake=Java.loadClass('net.sweenus.simplyswords.api.AwakeningApi'),Forms=Java.loadClass('net.sweenus.simplyswords.api.AwakeningFormRegistry'),Implicit=Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry')
  var Caps=Java.loadClass('yesman.epicfight.world.capabilities.EpicFightCapabilities'),Hand=Java.loadClass('net.minecraft.world.InteractionHand'),patch=player.getCapability(Caps.CAPABILITY_ENTITY).orElse(null);assert(!!patch,'native ServerPlayerPatch')
  var Ons=Java.loadClass('net.sweenus.simplyswords.registry.EffectRegistry').ONSLAUGHT.get(),Config=Java.loadClass('net.sweenus.simplyswords.config.Config'),oldChance=Config.gemPowers.slow.chance
  var score=server.getScoreboard().getOrCreatePlayerScore('$expedition',server.getScoreboard().getObjective('exp_stage')),oldStage=score.getScore()
  function fx(entity,type){var e=entity.getEffect(type);return e?{duration:e.duration,amplifier:e.amplifier}:null}
  function cooldown(){var cls=player.getClass(),field=null;while(cls && !field){try{field=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}field.setAccessible(true);field.setInt(player,100);assert(Math.abs(player.getAttackStrengthScale(0.5)-1)<0.002,'native full cooldown')}
  try{
   score.setScore(7);Config.gemPowers.slow.chance=100
   fixtures.forEach(f=>{
    ;['component','attack','attack-resistance225','ef-patch','ef-patch-resistance225'].forEach(mode=>{
     ;['runic','unique4','unique8'].forEach(weapon=>{
      player.removeAllEffects();patch.toVanillaMode(false)
      var target=Registries.ENTITY_TYPES.getValue(Utils.id(f.entity)).create(world);targets.push(target)
      var tag=NBT.toTagCompound(f.snbt);assert(!!tag,'parsed exact fixture SNBT');target.load(tag);target.setPos(2,200,0);player.setPos(0,200,0);player.setSprinting(false);player.setOnGround(true);player.fallDistance=0;target.invulnerableTime=0
      assert(target.isNoAi() && target.isNoGravity(),'exact NoAI/NoGravity '+f.fixture)
      assert(target.hasEffect(Effects.INVISIBILITY),'fixture invisibility loaded '+f.fixture)
      if(f.extraEffect){assert(target.addEffect(new Effect(Effects.DAMAGE_RESISTANCE,f.extraEffect.durationTicks,f.extraEffect.amplifier)),'exact Melkor phase Resistance accepted')}
      if(mode.indexOf('resistance225')>=0)target.addEffect(new Effect(Effects.DAMAGE_RESISTANCE,320,225))
      var before=target.health,resistance=fx(target,Effects.DAMAGE_RESISTANCE)
      var stack=Item.of(weapon==='runic'?'simplyswords:runic_longsword':'simplyswords:brimstone_claymore'),component
      if(weapon==='runic')component=Gem.runic(Utils.id('simplyswords:slow'))
      else{Forms.ensureInitialized(stack);Awake.setLevel(stack,weapon==='unique4'?4:8);component=new Gem(true,true,Utils.id('simplyswords:slow'),Utils.id('simplyswords:onslaught'))}
      Components.GEM_POWER.set(stack,component)
      if(applied)player.attributes.removeAttributeModifiers(applied)
      player.setItemSlot(Slot.MAINHAND,stack);player.setItemSlot(Slot.OFFHAND,Item.empty);applied=stack.getAttributeModifiers(Slot.MAINHAND);player.attributes.addTransientAttributeModifiers(applied);cooldown()
      if(mode==='component')component.postHit(stack,target,player)
      else if(mode.indexOf('ef-patch')===0){
       patch.toEpicFightMode(false);assert(patch.isEpicFightMode(),'EF mode active')
       var cap=stack.getCapability(Caps.CAPABILITY_ITEM).orElse(null),motions=cap.getAutoAttackMotion(patch);assert(!motions.isEmpty(),'native EF basic motion')
       var source=patch.getDamageSource(motions.get(0),Hand.MAIN_HAND)
       Implicit.runSuppressed(()=>patch.attack(source,target,Hand.MAIN_HAND))
      }else Implicit.runSuppressed(()=>player.attack(target))
      var slow=fx(target,Effects.MOVEMENT_SLOWDOWN),ons=fx(player,Ons)
      if(mode==='component'){assert(!!slow,'component accepts Slow '+f.fixture);assert(!!ons===(weapon!=='runic'),'component unique Onslaught '+f.fixture);assert(target.health===before,'component no damage')}
      assert(target.health<=before,'no health gain from hit')
      rows.push({fixture:f.fixture,source:f.source,extraEffect:f.extraEffect||null,entity:f.entity,mode:mode,weapon:weapon,stage:7,spawned:false,initialHealth:before,healthAfter:target.health,healthLost:before-target.health,resistance:resistance,slow:slow,onslaught:ons,armor:target.getAttributeValue(Attr.ARMOR),toughness:target.getAttributeValue(Attr.ARMOR_TOUGHNESS)})
      target.discard()
     })
    })
   })
   JsonIO.write('kubejs/export/slb-hitboxes.json',{checks:checks,scope:'Exact pinned summon NBT loaded into unspawned native Cow/Slime. Component callback versus full cooldown FakePlayer Player.attack and native Epic Fight patch.attack with first basic animation source; implicit suppressed; forcedSlow100. AddedResistance225 diagnostic mirrors effect strength, not actual phase execution. StageVII intentionally permits all weapons. No SLB root/riding/scores/fulltick/client EF movement or DPS.',rows:rows})
   console.info('SLB_HITBOX_SUCCESS checks='+checks+' rows='+rows.length)
  }finally{Config.gemPowers.slow.chance=oldChance;score.setScore(oldStage);if(applied)player.attributes.removeAttributeModifiers(applied);player.setItemSlot(Slot.MAINHAND,Item.empty);patch.toVanillaMode(false);player.removeAllEffects();targets.forEach(t=>t.discard())}
 })
})
