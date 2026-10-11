// QA only: unspawned native entities, effect acceptance and component postHit callback.
// No actual boss phase, damage event, client hit, movement, cadence or DPS.
var bossRuneQueued=false
ServerEvents.tick(event=>{
 if(bossRuneQueued)return
 bossRuneQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,rows=[],carryRows=[],weaknessRows=[],targets=[]
  function assert(ok,label){if(!ok)throw new Error('BOSS_RUNE_FAIL '+label);checks++}
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID')
  var Registries=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),Effect=Java.loadClass('net.minecraft.world.effect.MobEffectInstance'),Effects=Java.loadClass('net.minecraft.world.effect.MobEffects')
  var Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry'),Gem=Java.loadClass('net.sweenus.simplyswords.power.GemPowerComponent'),Awake=Java.loadClass('net.sweenus.simplyswords.api.AwakeningApi'),Forms=Java.loadClass('net.sweenus.simplyswords.api.AwakeningFormRegistry')
  var Ons=Java.loadClass('net.sweenus.simplyswords.registry.EffectRegistry').ONSLAUGHT.get(),Config=Java.loadClass('net.sweenus.simplyswords.config.Config'),Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var player=Factory.get(world,new Profile(UUID.randomUUID(),'BossRuneQA')),oldChance=Config.gemPowers.slow.chance
  function fx(entity,type){var e=entity.getEffect(type);return e?{duration:e.duration,amplifier:e.amplifier}:null}
  try{
   Config.gemPowers.slow.chance=100
   ;['minecraft:cow','minecraft:slime','graveyard:lich','eeeabsmobs:relic_annihilator','eeeabsmobs:realm_warden'].forEach(id=>{
    var type=Registries.ENTITY_TYPES.getValue(Utils.id(id));assert(!!type,'registered type '+id)
    var target=type.create(world);assert(!!target,'native entity created '+id);targets.push(target)
    var eeeab=id.indexOf('eeeabsmobs:')===0,immune=eeeab || id==='graveyard:lich',health=target.health,movement=target.getAttributeValue(Attr.MOVEMENT_SPEED)
    target.removeAllEffects()
    var accepted=target.addEffect(new Effect(Effects.MOVEMENT_SLOWDOWN,50,2)),direct=fx(target,Effects.MOVEMENT_SLOWDOWN),slowedMovement=target.getAttributeValue(Attr.MOVEMENT_SPEED)
    assert(!!accepted===!immune && !!direct===!immune,'native Slow acceptance '+id)
    target.removeAllEffects();var beneficial=target.addEffect(new Effect(Effects.REGENERATION,50,0))
    // Undead vanilla rules may reject regeneration; EEEAB bosses permit beneficial effects.
    if(eeeab)assert(!!beneficial,'EEEAB beneficial effect permitted '+id)
    var base={entity:id,nativeClass:String(target.getClass().getName()),spawned:false,health:health,movementAttribute:movement,directSlowAccepted:!!accepted,directSlow:direct,movementAttributeWithSlow:slowedMovement,regenerationAccepted:!!beneficial}
    ;['slow','greater_slow'].forEach(power=>{
     ;[4,8].forEach(level=>{
      target.removeAllEffects();player.removeAllEffects()
      var stack=Item.of('simplyswords:brimstone_claymore');Forms.ensureInitialized(stack);Awake.setLevel(stack,level)
      var component=new Gem(true,true,Utils.id('simplyswords:'+power),Utils.id('simplyswords:onslaught'));Components.GEM_POWER.set(stack,component)
      assert(Awake.areGemPowersActive(stack),'active awakening '+level)
      component.postHit(stack,target,player)
      var slow=fx(target,Effects.MOVEMENT_SLOWDOWN),ons=fx(player,Ons)
      assert(!!slow===!immune && !!ons===!immune,'component Slow to Onslaught '+id+' '+power+' '+level)
      if(!immune){assert(slow.amplifier===2 && slow.duration===(level===4?25:50),'native Slow values');assert(ons.duration===(level===4?40:80),'native Onslaught duration')}
      assert(target.health===health,'callback no damage '+id)
      rows.push({target:base,power:power,awakening:level,slow:slow,onslaught:ons,healthUnchanged:true})
     })
    })
   })
   targets.forEach((target,index)=>{
    var id=['minecraft:cow','minecraft:slime','graveyard:lich','eeeabsmobs:relic_annihilator','eeeabsmobs:realm_warden'][index],immune=id==='graveyard:lich' || id.indexOf('eeeabsmobs:')===0
    var stack=Item.of('simplyswords:brimstone_claymore');Forms.ensureInitialized(stack);Awake.setLevel(stack,8)
    var component=new Gem(true,true,Utils.id('simplyswords:slow'),Utils.id('simplyswords:onslaught'));Components.GEM_POWER.set(stack,component)
    target.removeAllEffects();player.removeAllEffects();player.addEffect(new Effect(Ons,31,0))
    component.postHit(stack,target,player)
    var ons=fx(player,Ons);console.info('BOSS_RUNE_CARRY '+id+' '+JSON.stringify({slow:fx(target,Effects.MOVEMENT_SLOWDOWN),ons:ons,level:Awake.getLevel(stack)}));assert(!!ons && ons.duration===(immune?31:80),'existing Onslaught preserved or refreshed '+id)
    carryRows.push({entity:id,initialOnslaughtDuration:31,afterCallbackOnslaught:ons,slow:fx(target,Effects.MOVEMENT_SLOWDOWN),refreshed:!immune})
    target.removeAllEffects();player.removeAllEffects();player.addEffect(new Effect(Effects.WEAKNESS,80,0))
    component.postHit(stack,target,player)
    assert(!fx(player,Ons) && !!fx(player,Effects.WEAKNESS),'Weakness prevents Onslaught '+id)
    weaknessRows.push({entity:id,weakness:fx(player,Effects.WEAKNESS),slow:fx(target,Effects.MOVEMENT_SLOWDOWN),onslaught:fx(player,Ons)})
   })
   JsonIO.write('kubejs/export/boss-runes.json',{checks:checks,scope:'Unspawned freshly-created native entities. Native addEffect and GemPowerComponent.postHit; chance forced100 restored. No actual hit/damage, phase initialization, full entity tick, SLB root, EF client cadence or DPS.',rows:rows,carry:carryRows,weakness:weaknessRows})
   console.info('BOSS_RUNE_SUCCESS checks='+checks+' rows='+rows.length+' carry='+carryRows.length+' weakness='+weaknessRows.length)
  }finally{Config.gemPowers.slow.chance=oldChance;player.removeAllEffects();targets.forEach(t=>t.discard())}
 })
})
