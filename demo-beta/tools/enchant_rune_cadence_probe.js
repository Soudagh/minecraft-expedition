// Opt-in isolated QA only. Native hits and animation functions; no real client cadence.
var enchantRuneProbeQueued=false
ServerEvents.tick(event=>{
 if(enchantRuneProbeQueued)return
 enchantRuneProbeQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server, world=server.overworld(), checks=0
  function assert(ok,label){if(!ok)throw new Error('ENCHANT_RUNE_FAIL '+label);checks++}
  function near(a,b){return Math.abs(a-b)<0.002}
  var Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'), Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'), Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory')
  var Profile=Java.loadClass('com.mojang.authlib.GameProfile'), UUID=Java.loadClass('java.util.UUID')
  var Implicits=Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry'), Helpers=Java.loadClass('net.sweenus.simplyswords.util.HelperMethods')
  var Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry'), Gem=Java.loadClass('net.sweenus.simplyswords.power.GemPowerComponent')
  var Awakening=Java.loadClass('net.sweenus.simplyswords.api.AwakeningApi'), Caps=Java.loadClass('yesman.epicfight.world.capabilities.EpicFightCapabilities')
  var Scaling=Java.loadClass('net.sweenus.simplyswords.api.SpellScalingProfile')
  var Enchantments=Java.loadClass('net.minecraft.world.item.enchantment.Enchantments'), Rules=Java.loadClass('plus.dragons.createenchantmentindustry.common.processing.EnchantmentProcessingRules')
  var player=Factory.get(world,new Profile(UUID.randomUUID(),'EnchantRuneQA')), target=Type.COW.create(world)
  var score=server.getScoreboard().getOrCreatePlayerScore('$expedition',server.getScoreboard().getObjective('exp_stage')), oldStage=score.getScore()
  var spawn=world.getSharedSpawnPos(), y=Math.min(300,spawn.y+40), applied=null, armorApplied=[], playerArmorApplied=[], hits=[], awakening=[], cadence=[], caps=[], extensions=[], runeScaling=[], runeEffects=[], speedEffects=[]
  var tickCls=player.getClass(),tickField=null
  while(tickCls && !tickField){try{tickField=tickCls.getDeclaredField('f_19797_')}catch(e){tickCls=tickCls.getSuperclass()}}
  assert(!!tickField,'native entity tick counter');tickField.setAccessible(true)
  var oldTickCount=tickField.getInt(player)
  var EFAttr=Java.loadClass('yesman.epicfight.world.entity.ai.attribute.EpicFightAttributes'), weightAttribute=player.getAttribute(EFAttr.WEIGHT.get()),oldBaseWeight=weightAttribute.getBaseValue()
  var forms=['longsword','twinblade','rapier','katana','sai','spear','glaive','warglaive','cutlass','claymore','greataxe','greathammer','chakram','scythe','halberd']
  function equip(stack){
   if(applied)player.attributes.removeAttributeModifiers(applied)
   player.setItemSlot(Slot.MAINHAND,stack);applied=stack.getAttributeModifiers(Slot.MAINHAND);player.attributes.addTransientAttributeModifiers(applied)
   var cls=player.getClass(), field=null
   while(cls && !field){try{field=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}
   assert(!!field,'attack ticker');field.setAccessible(true);field.setInt(player,100)
   assert(near(player.getAttackStrengthScale(0.5),1),'full cooldown')
  }
  function armor(protection){
   armorApplied.forEach(mod=>target.attributes.removeAttributeModifiers(mod));armorApplied=[]
   ;[['helmet','HEAD'],['chestplate','CHEST'],['leggings','LEGS'],['boots','FEET']].forEach(row=>{
    var stack=Item.of('minecraft:netherite_'+row[0]),slot=Slot[row[1]]
    if(protection)stack=stack.enchant('minecraft:protection',protection)
    assert(stack.hasEnchantment(Enchantments.ALL_DAMAGE_PROTECTION,protection),'fixture Protection level '+protection)
    target.setItemSlot(slot,stack);var mods=stack.getAttributeModifiers(slot);target.attributes.addTransientAttributeModifiers(mods);armorApplied.push(mods)
   })
  }
  function reset(){target.removeAllEffects();player.removeAllEffects();target.setHealth(1000);target.invulnerableTime=0;target.setRemainingFireTicks(0);target.setPos(spawn.x+2.5,y,spawn.z+0.5)}
  try{
   score.setScore(3);player.getAttribute(Attr.ATTACK_DAMAGE).setBaseValue(1);player.getAttribute(Attr.ATTACK_SPEED).setBaseValue(4)
   player.setSprinting(false);player.fallDistance=0;player.setOnGround(true);player.setPos(spawn.x+0.5,y,spawn.z+0.5)
   target.getAttribute(Attr.MAX_HEALTH).setBaseValue(1000);target.setNoAi(true);target.setNoGravity(true);world.addFreshEntity(target)
   ;['SHARPNESS','SMITE','ALL_DAMAGE_PROTECTION','UNBREAKING','MENDING','INFINITY_ARROWS'].forEach(name=>{
    var ench=Enchantments[name],a=Rules.blazeEnchanterLevelExtension(ench),b=Rules.blazeForgerLevelExtension(ench)
    assert(a===0 && b===0,'native CEI extension '+name);extensions.push({enchantment:name,maxLevel:ench.getMaxLevel(),enchanterExtension:a,forgerExtension:b})
   })
   assert(!Enchantments.SHARPNESS.isCompatibleWith(Enchantments.SMITE),'Sharpness Smite incompatible')
   var ignoreCompatibility=String(Java.loadClass('plus.dragons.createenchantmentindustry.config.CEIConfig').enchantments().ignoreEnchantmentCompatibility.get())
   assert(ignoreCompatibility==='false','native CEI incompatibility override disabled')
   ;[0,4].forEach(protection=>{
    armor(protection)
    forms.forEach(form=>[0,5].forEach(sharpness=>{
     var stack=Item.of('simplyswords:runic_'+form);Components.GEM_POWER.set(stack,Gem.DEFAULT)
     if(sharpness)stack=stack.enchant('minecraft:sharpness',sharpness)
     assert(stack.hasEnchantment(Enchantments.SHARPNESS,sharpness),'fixture Sharpness level '+sharpness)
     equip(stack);reset();Implicits.runSuppressed(()=>player.attack(target))
     var damage=1000-target.health,attack=player.getAttributeValue(Attr.ATTACK_DAMAGE)
     assert(damage>0 && damage<=attack+3.01,'enchanted native hit '+form+' '+sharpness+' '+protection)
     hits.push({weapon:String(stack.id),sharpness:sharpness,protectionPerPiece:protection,attack:attack,healthLost:damage,abilityAttackScaled:Helpers.attackScaledDamage(player,stack,1),abilityArcaneScaled:Helpers['abilityScaledDamage(net.sweenus.simplyswords.api.SpellScalingProfile,net.minecraft.world.entity.LivingEntity,net.minecraft.world.item.ItemStack,float,float)'](Scaling.ARCANE,player,stack,1,0)})
    }))
   })
   forms.forEach(form=>{
    var h=hits.filter(row=>row.weapon==='simplyswords:runic_'+form)
    assert(h[1].healthLost>h[0].healthLost,'Sharpness increases hit '+form)
    assert(near(h[2].healthLost,h[0].healthLost*0.36) && near(h[3].healthLost,h[1].healthLost*0.36),'Protection IV reduction '+form)
   })
   ;[0,5].forEach(sharpness=>{
    var stack=Item.of('simplyswords:runic_longsword');Components.GEM_POWER.set(stack,Gem.DEFAULT)
    if(sharpness)stack=stack.enchant('minecraft:sharpness',sharpness)
    equip(stack)
    ;[0.2,0.35,1].forEach(coefficient=>{
     var base=Helpers['gemPowerScaledDamage(net.sweenus.simplyswords.api.SpellScalingProfile,net.minecraft.world.entity.LivingEntity,net.minecraft.world.item.ItemStack,float,float)'](Scaling.ARCANE,player,stack,coefficient,0)
     var value=Helpers.applyAbilityDamageEnchantments(world,stack,target,world.damageSources().playerAttack(player),base)
     assert(near(value-base,sharpness?3:0),'separate native rune enchant bonus '+sharpness+' '+coefficient)
     runeScaling.push({sharpness:sharpness,coefficient:coefficient,scaledBase:base,afterAbilityEnchantments:value})
    })
   })
   ;['simplyswords:brimstone_claymore','simplyswords:watcher_claymore','simplyswords:awakened_lichblade'].forEach(id=>{
    var stack=Item.of(id);assert(!stack.isEmpty(),'unique registered '+id)
    for(var level=0;level<=8;level++){
     Awakening.setLevel(stack,level);equip(stack)
     awakening.push({weapon:id,requestedLevel:level,level:Awakening.getLevel(stack),attack:player.getAttributeValue(Attr.ATTACK_DAMAGE),attackSpeed:player.getAttributeValue(Attr.ATTACK_SPEED),attributeMultiplier:Awakening.getAttributeMultiplier(stack),speedMultiplier:Awakening.getAttackSpeedMultiplier(stack),effectMultiplier:Awakening.getEffectMultiplier(stack),abilityUnlocked:Awakening.isAbilityUnlocked(stack),gemMultiplier:Awakening.getGemPowerMultiplier(stack)})
    }
   })
   ;['simplyswords:brimstone_claymore','simplyswords:watcher_claymore'].forEach(id=>{
    var rows=awakening.filter(row=>row.weapon===id)
    assert(rows.length===9 && rows.every((row,i)=>row.level===i),'native awakening levels '+id)
    assert(rows.every((row,i)=>row.abilityUnlocked===(i>=4)),'native ability unlock level four '+id)
    assert(rows[0].gemMultiplier===0 && rows[8].gemMultiplier===1,'native gem awakening bounds '+id)
   })
   var Config=Java.loadClass('net.sweenus.simplyswords.config.Config'), Powers=Java.loadClass('net.sweenus.simplyswords.registry.GemPowerRegistry')
   var Effects=Java.loadClass('net.minecraft.world.effect.MobEffects'), slowChance=Config.gemPowers.slow.chance
   try{
    Config.gemPowers.slow.chance=100
    ;['simplyswords:runic_longsword','simplyswords:brimstone_claymore'].forEach(id=>[0,8].forEach(level=>{
     var stack=Item.of(id);Awakening.setLevel(stack,level)
     Components.GEM_POWER.set(stack,Gem.runic(Utils.id('simplyswords:slow')))
     equip(stack);reset();Gem.runic(Utils.id('simplyswords:slow')).postHit(stack,target,player)
     var componentEffect=target.getEffect(Effects.MOVEMENT_SLOWDOWN),componentActive=Awakening.areGemPowersActive(stack)
     assert(componentActive?!!componentEffect:!componentEffect,'native component awakening gate '+id+' '+level)
     target.removeAllEffects();Powers.SLOW.get().postHit(stack,target,player)
     var effect=target.getEffect(Effects.MOVEMENT_SLOWDOWN)
     assert(!!effect,'forced native Slow effect '+id+' '+level)
     var duration=effect.duration,amp=effect.amplifier
     Powers.SLOW.get().postHit(stack,target,player)
     effect=target.getEffect(Effects.MOVEMENT_SLOWDOWN)
     assert(effect.duration===duration && effect.amplifier===amp,'Slow refresh does not stack '+id+' '+level)
     runeEffects.push({weapon:id,requestedLevel:level,actualLevel:Awakening.getLevel(stack),componentActive:componentActive,componentAppliedEffect:!!componentEffect,fixtureChance:100,directPowerCallbackDuration:duration,amplifier:amp,secondHitDuration:effect.duration,secondHitAmplifier:effect.amplifier})
    }))
   }finally{Config.gemPowers.slow.chance=slowChance;target.removeAllEffects();player.removeAllEffects()}
   assert(Config.gemPowers.slow.chance===slowChance,'rune configuration restored')
   var patch=player.getCapability(Caps.CAPABILITY_ENTITY).orElse(null)
   console.info('ENCHANT_RUNE_PATCH '+patch)
   assert(!!patch,'native Epic Fight ServerPlayerPatch')
   // FakePlayer never joins a world: set an explicit body-weight fixture, not a measured real-player weight.
   weightAttribute.setBaseValue(40)
   var Hand=Java.loadClass('net.minecraft.world.InteractionHand'),Props=Java.loadClass('yesman.epicfight.api.animation.property.AnimationProperty$AttackAnimationProperty')
   ;[null,'minecraft:iron','minecraft:diamond','minecraft:netherite','botania:terrasteel','irons_spellbooks:wizard','irons_spellbooks:wandering_magician'].forEach(prefix=>{
    playerArmorApplied.forEach(mod=>player.attributes.removeAttributeModifiers(mod));playerArmorApplied=[]
    ;[['helmet','HEAD'],['chestplate','CHEST'],['leggings','LEGS'],['boots','FEET']].forEach(row=>{
     var stack=prefix?Item.of(prefix+'_'+row[0]):Item.empty,slot=Slot[row[1]]
     player.setItemSlot(slot,stack);var mods=stack.getAttributeModifiers(slot);player.attributes.addTransientAttributeModifiers(mods);playerArmorApplied.push(mods)
    })
    forms.forEach(form=>{
    var stack=Item.of('simplyswords:runic_'+form);Components.GEM_POWER.set(stack,Gem.DEFAULT);equip(stack)
    var cap=stack.getCapability(Caps.CAPABILITY_ITEM).orElse(null)
    assert(!!cap,'native weapon capability '+form)
    if(!prefix)caps.push({weapon:String(stack.id),category:String(cap.getWeaponCategory()),style:String(cap.getStyle(patch))})
    if(patch){
     var motions=cap.getAutoAttackMotion(patch)
     for(var i=0;i<motions.size();i++){
      var accessor=motions.get(i), animation=accessor.get(),speed=animation.getPlaySpeed(patch,animation),phases=[]
      animation.phases.forEach(phase=>phases.push({start:phase.start,antic:phase.antic,preDelay:phase.preDelay,contact:phase.contact,recovery:phase.recovery,end:phase.end,hand:String(phase.hand)}))
      assert(speed>0 && animation.getTotalTime()>0,'native animation '+form+' '+i)
      var basis=animation.getProperty(Props.BASIS_ATTACK_SPEED)
      cadence.push({weapon:String(stack.id),armor:prefix||'none',index:i,animation:String(accessor),totalTime:animation.getTotalTime(),playSpeed:speed,fullAnimationTicks:20*animation.getTotalTime()/speed,weight:patch.getWeight(),modifiedAttackSpeed:patch.getAttackSpeed(Hand.MAIN_HAND),attackSpeedFactor:Number(animation.getProperty(Props.ATTACK_SPEED_FACTOR).orElse(1)),basisAttackSpeed:basis.isPresent()?Number(basis.get()):null,phases:phases})
     }
    }
    })
   })
   playerArmorApplied.forEach(mod=>player.attributes.removeAttributeModifiers(mod));playerArmorApplied=[]
   assert(near(patch.getWeight(),40),'armour modifiers restored before Onslaught')
   ;['HEAD','CHEST','LEGS','FEET'].forEach(slot=>player.setItemSlot(Slot[slot],Item.empty))
   ;['longsword','katana','greathammer'].forEach(form=>{
    var stack=Item.of('simplyswords:runic_'+form);Components.GEM_POWER.set(stack,Gem.DEFAULT);equip(stack);reset()
    var cap=stack.getCapability(Caps.CAPABILITY_ITEM).orElse(null),animation=cap.getAutoAttackMotion(patch).get(0).get()
    var beforeSpeed=patch.getAttackSpeed(Hand.MAIN_HAND),beforePlay=animation.getPlaySpeed(patch,animation)
    target.addEffect(new (Java.loadClass('net.minecraft.world.effect.MobEffectInstance'))(Effects.MOVEMENT_SLOWDOWN,50,2))
    Powers.ONSLAUGHT.get().postHit(stack,target,player)
    tickField.setInt(player,40)
    Java.loadClass('net.sweenus.simplyswords.registry.EffectRegistry').ONSLAUGHT.get().applyEffectTick(player,0)
    var afterSpeed=patch.getAttackSpeed(Hand.MAIN_HAND),afterPlay=animation.getPlaySpeed(patch,animation)
    assert(afterSpeed>beforeSpeed,'native Onslaught attack speed '+form)
    assert(near(afterSpeed,beforeSpeed*2.6),'native Onslaught Haste XVI speed '+form)
    assert(afterPlay>beforePlay,'native Onslaught animation speed '+form)
    var haste=player.getEffect(Effects.DIG_SPEED)
    assert(!!haste && haste.amplifier===15 && haste.duration===10,'native Haste pulse '+form)
    speedEffects.push({weapon:String(stack.id),bodyWeightFixture:40,fixtureEntityTick:40,hasteAmplifier:haste.amplifier,hasteDuration:haste.duration,attackSpeedBefore:beforeSpeed,attackSpeedAfter:afterSpeed,animationPlaySpeedBefore:beforePlay,animationPlaySpeedAfter:afterPlay})
    player.removeAllEffects();target.removeAllEffects();tickField.setInt(player,oldTickCount)
   })
   var penalty=Java.loadClass('yesman.epicfight.world.gamerule.EpicFightGameRules').WEIGHT_PENALTY.getRuleValue(world)
   assert(Number(penalty)===100,'native QA weight penalty 100')
   var result={scope:'QA FakePlayer direct full-cooldown native Player.attack with no rune/implicit procs. Native rune damage helper pipeline (no damage proc/uptime); forced native Slow component and power callbacks with QA chance restored in finally; awakening setters and item attributes; native Epic Fight animation functions with explicit body weight 40 and native armour modifiers, and Onslaught effect callback at fixture entity tick 40. No real client input/collision/combo cadence, survival crafting, natural rune effect uptime or measured DPS.',checks:checks,bodyWeightFixture:40,weightPenalty:Number(penalty),ceiIgnoreCompatibility:ignoreCompatibility==='true',extensions:extensions,hits:hits,runeScaling:runeScaling,runeEffects:runeEffects,speedEffects:speedEffects,awakening:awakening,capabilities:caps,cadence:cadence,epicFightPatchAvailable:!!patch}
   JsonIO.write('kubejs/export/enchant-rune-cadence.json',result)
   console.info('ENCHANT_RUNE_SUCCESS checks='+checks+' hits='+hits.length+' animations='+cadence.length)
  }finally{
   score.setScore(oldStage);if(applied)player.attributes.removeAttributeModifiers(applied);player.setItemSlot(Slot.MAINHAND,Item.empty)
   playerArmorApplied.forEach(mod=>player.attributes.removeAttributeModifiers(mod));weightAttribute.setBaseValue(oldBaseWeight);player.removeAllEffects();tickField.setInt(player,oldTickCount)
   ;['HEAD','CHEST','LEGS','FEET'].forEach(slot=>player.setItemSlot(Slot[slot],Item.empty));target.discard()
  }
 })
})
