// Isolated QA: native forge slots/commit and native attacks. No client Epic Fight cadence.
var runeSocketQueued=false
ServerEvents.tick(event=>{
 if(runeSocketQueued)return
 runeSocketQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,forgeRows=[],hitRows=[],rerolls=[]
  function assert(ok,label){if(!ok)throw new Error('RUNE_SOCKET_FAIL '+label);checks++}
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID')
  var Forge=Java.loadClass('net.sweenus.simplyswords.screen.RunicForgeScreenHandler'),Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry'),Gem=Java.loadClass('net.sweenus.simplyswords.power.GemPowerComponent')
  var API=Java.loadClass('net.sweenus.simplyswords.api.SimplySwordsAPI'),Awake=Java.loadClass('net.sweenus.simplyswords.api.AwakeningApi'),Forms=Java.loadClass('net.sweenus.simplyswords.api.AwakeningFormRegistry'),Extra=Java.loadClass('net.sweenus.simplyswords.api.AdditionalGemSocketApi')
  var Powers=Java.loadClass('net.sweenus.simplyswords.registry.GemPowerRegistry'),PowerType=Java.loadClass('net.sweenus.simplyswords.power.PowerType'),Config=Java.loadClass('net.sweenus.simplyswords.config.Config')
  var Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'),Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes'),Type=Java.loadClass('net.minecraft.world.entity.EntityType'),Effects=Java.loadClass('net.minecraft.world.effect.MobEffects'),Ons=Java.loadClass('net.sweenus.simplyswords.registry.EffectRegistry').ONSLAUGHT.get()
  var Click=Java.loadClass('net.minecraft.world.inventory.ClickType'),Integer=Java.loadClass('java.lang.Integer'),Enchantments=Java.loadClass('net.minecraft.world.item.enchantment.Enchantments')
  function nativeCall(obj,srg,alias,args){var found=null;obj.getClass().getMethods().forEach(m=>{if((String(m.name)===srg || String(m.name)===alias) && m.getParameterCount()===args.length)found=m});assert(!!found,'native method '+alias);return found.invoke(obj,args)}
  var player=Factory.get(world,new Profile(UUID.randomUUID(),'RuneSocketQA')),target=Type.COW.create(world),spawn=world.getSharedSpawnPos(),oldChance=Config.gemPowers.slow.chance,applied=null
  var score=server.getScoreboard().getOrCreatePlayerScore('$expedition',server.getScoreboard().getObjective('exp_stage')),oldStage=score.getScore()
  function component(stack){return Components.GEM_POWER.getOrDefault(stack,Gem.DEFAULT)}
  function describe(stack){var c=component(stack);return {id:String(stack.id),level:Awake.getLevel(stack),hasRunic:c.hasRunicPower(),hasNether:c.hasNetherPower(),runic:String(c.runicPower()),nether:String(c.netherPower())}}
  function effect(entity,which){var e=entity.getEffect(which);return e?{duration:e.duration,amplifier:e.amplifier}:null}
  function reset(){player.removeAllEffects();target.removeAllEffects();target.setHealth(1000);target.invulnerableTime=0;player.setSprinting(false);player.setOnGround(true);player.fallDistance=0}
  function equip(main,off){if(applied)player.attributes.removeAttributeModifiers(applied);player.setItemSlot(Slot.MAINHAND,main);player.setItemSlot(Slot.OFFHAND,off);applied=main.getAttributeModifiers(Slot.MAINHAND);player.attributes.addTransientAttributeModifiers(applied);var cls=player.getClass(),field=null;while(cls && !field){try{field=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}field.setAccessible(true);field.setInt(player,100);assert(Math.abs(player.getAttackStrengthScale(0.5)-1)<0.002,'native attack full cooldown')}
  function gem(id,power,nether){var stack=Item.of(id);Components.GEM_POWER.set(stack,nether?Gem.nether(Utils.id(power)):Gem.runic(Utils.id(power)));return stack}
  try{
   score.setScore(7);Config.gemPowers.slow.chance=100
   var pools={};['RUNIC','RUNEFUSED','NETHER'].forEach(type=>{pools[type]=[];Powers.getPowers(PowerType[type]).forEach(power=>pools[type].push(String(power.getId())))})
   assert(pools.RUNEFUSED.indexOf('simplyswords:slow')>=0,'Slow belongs to available Runefused pool')
   assert(pools.NETHER.indexOf('simplyswords:onslaught')>=0,'Onslaught belongs to available Nether pool')
   assert(pools.RUNIC.indexOf('simplyswords:onslaught')<0,'Onslaught absent from ordinary Runic pool')
   assert(Config.general.additionalGemSocketItems.get().isEmpty(),'no configured extra sockets')
   player.setPos(spawn.x+0.5,Math.min(300,spawn.y+40),spawn.z+0.5);target.setPos(player.x+2,player.y,player.z);target.getAttribute(Attr.MAX_HEALTH).setBaseValue(1000);target.setHealth(1000);target.setNoAi(true);target.setNoGravity(true);world.addFreshEntity(target)
   var plainRunic=Item.of('simplyswords:runic_longsword');Components.GEM_POWER.set(plainRunic,Gem.runic(Utils.id('simplyswords:slow')))
   var rejectMenu=new Forge(1,player.inventory,spawn)
   assert(!rejectMenu.getSlot(0).mayPlace(plainRunic),'ordinary Runic cannot enter unique forge')
   assert(!Extra.isManaged(plainRunic),'ordinary Runic no extra socket management')
   forgeRows.push({fixture:'ordinary-runic',weapon:describe(plainRunic),weaponSlotAccepts:false})
   var forged=[]
   ;[0,1,4,8].forEach(level=>{
    var stack=Item.of('simplyswords:brimstone_claymore');nativeCall(stack.item,'m_6883_','inventoryTick',[stack,world,player,Integer.valueOf('0'),Java.loadClass('java.lang.Boolean').FALSE]);assert(component(stack).hasRunicPower() && component(stack).hasNetherPower(),'native unique inventory tick opens both sockets');Forms.ensureInitialized(stack);Awake.setLevel(stack,0)
    stack=stack.enchant('minecraft:sharpness',5);stack=stack.enchant('minecraft:unbreaking',3);stack=stack.enchant('minecraft:mending',1)
    var menu=new Forge(2,player.inventory,spawn),inv=menu.getForgeInventory()
    assert(menu.getSlot(0).mayPlace(stack),'unique accepted by forge '+level);inv.setItem(0,stack)
    var slow=gem('simplyswords:runefused_gem','simplyswords:slow',false),ons=gem('simplyswords:netherfused_gem','simplyswords:onslaught',true)
    assert(menu.getSlot(1).mayPlace(slow) && menu.getSlot(2).mayPlace(ons),'both gem slots accept typed gems '+level)
    inv.setItem(1,slow);inv.setItem(2,ons)
    for(var i=0;i<level;i++)inv.setItem(3+i,Item.of('simplyswords:runic_tablet'))
    var preview=menu.getPreviewStack();assert(describe(preview).runic==='simplyswords:slow' && describe(preview).nether==='simplyswords:onslaught','dual gem preview '+level)
    // Taking weapon slot through the native container click commits configuration.
    nativeCall(menu,'m_150399_','clicked',[Integer.valueOf('0'),Integer.valueOf('0'),Click.PICKUP,player])
    var result=menu.getCarried();assert(!result.isEmpty(),'committed weapon carried '+level)
    assert(Awake.getLevel(result)===level,'forge tablets set awakening '+level)
    assert(component(result).runicPower().toString()==='simplyswords:slow' && component(result).netherPower().toString()==='simplyswords:onslaught','committed dual powers '+level)
    assert(result.hasEnchantment(Enchantments.SHARPNESS,5) && result.hasEnchantment(Enchantments.UNBREAKING,3) && result.hasEnchantment(Enchantments.MENDING,1),'forge preserves enchantments '+level)
    for(var s=0;s<11;s++)assert(inv.getItem(s).isEmpty(),'forge inputs consumed '+level+' '+s)
    forgeRows.push({fixture:'unique-forge',tabletsInserted:level,weapon:describe(result),gemsConsumed:2,sharpness:5,unbreaking:3,mending:1})
    forged.push(result.copy());menu.setCarried(Item.empty)
   })
   score.setScore(3);reset();equip(forged[3],Item.empty);Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry').runSuppressed(()=>player.attack(target))
   assert(target.health===1000 && !effect(target,Effects.MOVEMENT_SLOWDOWN) && !effect(player,Ons),'unique dual-power attack blocked at stage III')
   hitRows.push({fixture:'unique-dual-power-stage-III-rejected',stage:3,healthLost:1000-target.health,slow:effect(target,Effects.MOVEMENT_SLOWDOWN),onslaught:effect(player,Ons)});score.setScore(7)
   forged.forEach(stack=>{
    reset();equip(stack,Item.empty);Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry').runSuppressed(()=>player.attack(target))
    var level=Awake.getLevel(stack),slow=effect(target,Effects.MOVEMENT_SLOWDOWN),ons=effect(player,Ons)
    assert(!Awake.areGemPowersActive(stack)?!slow && !ons:!!slow && !!ons,'real same hit dual power awakening '+level)
    assert(1000-target.health>0,'real native damage at allowed stage '+level)
    hitRows.push({fixture:'real-native-attack-dual-unique',weapon:describe(stack),stage:7,gemActive:Awake.areGemPowersActive(stack),slow:slow,onslaught:ons,healthLost:1000-target.health})
   })
   var Container=Java.loadClass('net.minecraft.world.SimpleContainer'),JMap=Java.loadClass('java.util.Map'),recipes={},catalogue=server.recipeManager.getRecipes()
   var outer=(catalogue instanceof JMap?catalogue.values():catalogue).iterator()
   while(outer.hasNext()){var value=outer.next();if(value instanceof JMap){var nested=value.values().iterator();while(nested.hasNext()){var r=nested.next();recipes[String(r.id)]=r}}else recipes[String(value.id)]=value}
   ;['longsword','twinblade','rapier','katana','sai','spear','glaive','warglaive','cutlass','claymore','greataxe','greathammer','chakram','scythe','halberd'].forEach(form=>{
    var base=Item.of('simplyswords:runic_'+form);Components.GEM_POWER.set(base,Gem.runic(Utils.id('simplyswords:slow')))
    base=base.enchant('minecraft:sharpness',5);base=base.enchant('minecraft:unbreaking',3);base=base.enchant('minecraft:mending',1);base.damageValue=7;base.getOrCreateTag().putString('qa_marker','preserve-reroll')
    assert(!rejectMenu.getSlot(0).mayPlace(base),'all Runic forms excluded from unique forge '+form)
    var recipe=recipes['simplyswords:runic2_'+form];assert(!!recipe,'native reroll recipe '+form)
    var inputs=new Container(Item.of('simplyswords:runic_tablet'),base,Item.of('minecraft:diamond'))
    assert(recipe.matches(inputs,world),'native reroll full inputs '+form)
    var result=recipe.assemble(inputs,server.registryAccess())
    assert(String(result.id)==='simplyswords:runic_'+form && result.hasEnchantment(Enchantments.SHARPNESS,5) && result.hasEnchantment(Enchantments.UNBREAKING,3) && result.hasEnchantment(Enchantments.MENDING,1),'reroll preserves form/enchantments '+form)
    assert(result.damageValue===7 && result.getOrCreateTag().getString('qa_marker')==='preserve-reroll','reroll preserves durability and custom NBT '+form)
    assert(Components.GEM_POWER.get(result)===null,'reroll clears old gem component '+form)
    inputs.setItem(0,Item.empty);assert(!recipe.matches(inputs,world),'reroll rejects missing tablet '+form)
    rerolls.push({weapon:String(result.id),sharpness:5,unbreaking:3,mending:1,damage:result.damageValue,oldPowerCleared:true,fullInputsMatch:true,missingTabletRejected:true})
   })
   var off=forged[3].copy();Components.GEM_POWER.set(off,Gem.nether(Utils.id('simplyswords:onslaught')))
   reset();equip(plainRunic,off);Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry').runSuppressed(()=>player.attack(target))
   assert(!!effect(target,Effects.MOVEMENT_SLOWDOWN) && !effect(player,Ons),'passive offhand does not postHit on native main attack')
   hitRows.push({fixture:'native-main-Slow-passive-offhand-Onslaught',slow:effect(target,Effects.MOVEMENT_SLOWDOWN),onslaught:effect(player,Ons),healthLost:1000-target.health})
   JsonIO.write('kubejs/export/rune-sockets.json',{scope:'Pinned native unique forge slot validation, identified typed gems with native unique inventory initialization, real container commit and input conservation, then real full-cooldown Player.attack. Stage III rejection and stage VII native hits; Slow chance forced100 and restored. QA supplies all inputs; not a natural loot/drop/re-roll cost measurement, client menu sync or Epic Fight dual-wield attack test.',checks:checks,powerPools:pools,forge:forgeRows,hits:hitRows,rerolls:rerolls,originalSlowChance:oldChance})
   console.info('RUNE_SOCKET_SUCCESS checks='+checks+' forge='+forgeRows.length+' hits='+hitRows.length)
  }finally{Config.gemPowers.slow.chance=oldChance;score.setScore(oldStage);if(applied)player.attributes.removeAttributeModifiers(applied);player.setItemSlot(Slot.MAINHAND,Item.empty);player.setItemSlot(Slot.OFFHAND,Item.empty);player.removeAllEffects();target.discard()}
 })
})
