// Isolated native gates and terminal-state snapshots. No live final boss spawned.
ServerEvents.loaded(event=>event.server.scheduleInTicks(240,()=>{
 var server=event.server,world=server.overworld(),checks=0
 function assert(ok,label){if(!ok)throw new Error('FINAL_BOSS_FAIL '+label);checks++}
 var board=server.getScoreboard(),names=['exp_cat','exp_stage','exp_divfin','exp_chaos','exp_storm']
 for(var i=1;i<=9;i++)names.push('exp_b'+i)
 var old={};names.forEach(n=>old[n]=board.getOrCreatePlayerScore('$expedition',board.getObjective(n)).getScore())
 function set(n,v){board.getOrCreatePlayerScore('$expedition',board.getObjective(n)).setScore(v)}
 var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'), Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
 var Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID'),Player=Java.loadClass('net.minecraft.server.level.ServerPlayer')
 var player=new Player(server,world,new Profile(UUID.randomUUID(),'FinalBossQA'))
 var FakeFactory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),fake=FakeFactory.get(world,new Profile(UUID.randomUUID(),'FinalBossFake'))
 var guardian=null,storm=null,luna=null
 try {
  names.forEach(n=>set(n,0))
  var Bus=Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS,Join=Java.loadClass('net.minecraftforge.event.entity.EntityJoinLevelEvent')
  guardian=Registry.ENTITY_TYPES.getValue(Utils.id('draconicevolution:draconic_guardian')).create(world)
  storm=Registry.ENTITY_TYPES.getValue(Utils.id('witherstormmod:wither_storm')).create(world)
  luna=Registry.ENTITY_TYPES.getValue(Utils.id('divinerpg:lady_luna')).create(world)
  assert(!!guardian && !!storm && !!luna,'three final registry types')
  var e=new Join(guardian,world);Bus.post(e);assert(e.isCanceled(),'early Chaos join refused')
  e=new Join(storm,world);Bus.post(e);assert(e.isCanceled(),'early Storm join refused')
  set('exp_cat',8);set('exp_stage',9);for(var i=1;i<=9;i++)set('exp_b'+i,1)
  assert(!global.expeditionChaosOpen(server),'Lady Luna is required in addition to nine campaign wins')
  assert(!global.expeditionFinalBossRecord(server,luna,{type:'genericKill',player:player}),'Luna /kill rejected')
  assert(!global.expeditionFinalBossRecord(server,luna,{type:'player',player:fake}),'Luna fake player rejected')
  assert(global.expeditionFinalBossRecord(server,luna,{type:'player',player:player}),'Luna survival snapshot accepted')
  assert(global.expeditionChaosOpen(server),'Chaos opens after Divine finale')
  assert(!global.expeditionStormOpen(server),'Chaos victory still needed for Storm')
  e=new Join(guardian,world);Bus.post(e);assert(!e.isCanceled(),'Chaos allowed at finale')
  set('exp_b5',0);assert(!global.expeditionChaosOpen(server),'all nine wins required');set('exp_b5',1)
  assert(global.expeditionFinalModLocked(server,'draconicevolution:chaotic_core'),'chaotic gear requires real Chaos win')
  assert(!global.expeditionFinalModLocked(server,'draconicevolution:awakened_core'),'Draconic preparation possible before Chaos')
  assert(!global.expeditionFinalBossRecord(server,guardian,{type:'genericKill',player:player}),'Chaos command rejected')
  assert(global.expeditionFinalBossRecord(server,guardian,{type:'player',player:player}),'Chaos survival snapshot accepted')
  assert(global.expeditionStormOpen(server),'Storm opens after Chaos')
  assert(!global.expeditionFinalModLocked(server,'draconicevolution:chaotic_core'),'chaotic gear opens after win')
  assert(!global.expeditionFinalBossRecord(server,storm,{type:'player',player:player}),'early Storm phase cannot be a finale')
  // The terminal native source is distinct from its ordinary "player" message.
  var Damage=Java.loadClass('nonamecrackers2.witherstormmod.common.init.WitherStormModDamageTypes')
  var source=Damage.playerAttackWitherStorm(player)
  assert(String(source.typeHolder().unwrapKey().get().location())==='witherstormmod:player_attack_wither_storm','native command-block final damage key')
  var snapshot={type:'witherstormmod:wither_storm',getPhase:()=>7,isPlayingDead:()=>false,persistentData:storm.persistentData}
  assert(!global.expeditionFinalBossRecord(server,snapshot,world.damageSources().playerAttack(player)),'ordinary attack not a terminal Storm kill')
  snapshot.isPlayingDead=()=>true;assert(!global.expeditionFinalBossRecord(server,snapshot,source),'playing-dead snapshot rejected')
  snapshot.isPlayingDead=()=>false;assert(global.expeditionFinalBossRecord(server,snapshot,source),'native final source plus terminal snapshot accepted')
  assert(!global.expeditionFinalBossRecord(server,snapshot,source),'duplicate Storm victory rejected')
  var policy=JsonIO.read('kubejs/config/boss_balance.json'),armor=[]
  Object.keys(policy.cataclysm_armor).forEach(id=>{
   var spec=policy.cataclysm_armor[id],part=id.substring(id.lastIndexOf('_')+1),slot={helmet:'HEAD',chestplate:'CHEST',leggings:'LEGS',boots:'FEET'}[part]
   var mods=Item.of(id).getAttributeModifiers(Slot[slot]),protection=0,toughness=0
   mods.get(Attr.ARMOR).forEach(m=>protection+=m.amount);mods.get(Attr.ARMOR_TOUGHNESS).forEach(m=>toughness+=m.amount)
   assert(protection===spec.armor && toughness===spec.toughness,'Cat final Forge armor '+id)
   armor.push({id:id,armor:protection,toughness:toughness})
  })
  var attack=0;Item.of('cataclysm:the_incinerator').getAttributeModifiers(Slot.MAINHAND).get(Attr.ATTACK_DAMAGE).forEach(m=>attack+=m.amount)
  assert(attack===8,'Cat melee cap is Forge-visible')
  var recipe=server.recipeManager.byKey(Utils.id('draconicevolution:components/draconium_core')).get(),hasGate=false
  recipe.getIngredients().forEach(ingredient=>{if(ingredient.test(Item.of('kubejs:material_realmwarden')))hasGate=true})
  assert(hasGate,'native Draconium core uses Realmwarden material')
  server.runCommandSilent('function expedition:balance/slb')
  var health={};['aw','lothran','soc','nl','te'].forEach(slug=>{
   health[slug]=board.getOrCreatePlayerScore('.s_l_b_global',board.getObjective(slug+'_health')).getScore()
   assert(health[slug]===policy.slb[slug].health,'SLB native health global '+slug)
  })
  var Hurt=Java.loadClass('net.minecraftforge.event.entity.living.LivingHurtEvent')
  var hit=new Hurt(fake,world.damageSources().mobAttack(luna),10);Bus.post(hit)
  assert(Math.abs(hit.amount-12.5)<0.001,'native owner-attributed Divine damage multiplier')
  var environmental=new Hurt(fake,world.damageSources().drown(),10);Bus.post(environmental)
  assert(environmental.amount===10,'environmental damage is unchanged')
  var result={checks:checks,guardianHealth:guardian.maxHealth,stormHealth:storm.maxHealth,stormTerminalDamageKey:'witherstormmod:player_attack_wither_storm',catArmor:armor,incineratorAttack:attack,slbHealth:health,scope:'Native registries, gates, attributes and terminal-state snapshots; no real Chaos/Storm or multiplayer fight.'}
  JsonIO.write('kubejs/export/final-boss-results.json',result);console.info('FINAL_BOSS_SUCCESS '+checks)
 } finally {
  names.forEach(n=>set(n,old[n]));[guardian,storm,luna,player,fake].forEach(entity=>{if(entity)entity.discard()})
 }
}))
