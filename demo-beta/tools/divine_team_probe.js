// Opt-in isolated QA: registries, recipes, travel restrictions, native team tracker,
// command permissions and FTB NBT pin persistence. No client rendering/real fight.
var divineProbeQueued=false
ServerEvents.tick(event=>{
 if(divineProbeQueued)return
 divineProbeQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0
  function assert(ok,label){if(!ok)throw new Error('DIVINE_TEAM_FAIL '+label);checks++}
  var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),RL=Java.loadClass('net.minecraft.resources.ResourceLocation')
  var sources=JsonIO.read('kubejs/export/divine-probe-sources.json')
  sources.items.forEach(id=>assert(Registry.ITEMS.containsKey(new RL(id)),'item '+id))
  sources.recipes.forEach(id=>assert(server.recipeManager.byKey(new RL(id)).isPresent(),'recipe '+id))
  var Config=Java.loadClass('xaero.pac.common.server.config.ServerConfig').CONFIG
  assert(String(Config.primaryPartySystem.get())==='ftb_teams','OPAC primary FTB team')
  assert(Config.partyOwnedClaims.get(),'OPAC party owned claims')
  assert(Config.claimsEnabled.get(),'OPAC enabled claims')
  assert(!Config.partiesEnabled.get(),'OPAC no separate parties')
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID')
  var players=['Owner','Member','Other'].map(name=>Factory.get(world,new Profile(UUID.randomUUID(),'DivineQA'+name)))
  var Manager=Java.loadClass('dev.ftb.mods.ftbteams.data.TeamManagerImpl'),Personal=Java.loadClass('dev.ftb.mods.ftbteams.data.PlayerTeam'),Party=Java.loadClass('dev.ftb.mods.ftbteams.data.PartyTeam'),Rank=Java.loadClass('dev.ftb.mods.ftbteams.api.TeamRank')
  var manager=Manager.INSTANCE,knownField=manager.getClass().getDeclaredField('knownPlayers');knownField.setAccessible(true);var knownPlayers=knownField.get(manager),team=new Party(manager,UUID.randomUUID()),other=new Party(manager,UUID.randomUUID())
  var ownerField=team.getClass().getDeclaredField('owner');ownerField.setAccessible(true);ownerField.set(team,players[0].uuid);ownerField.set(other,players[2].uuid)
  team.addMember(players[0].uuid,Rank.OWNER);team.addMember(players[1].uuid,Rank.MEMBER);other.addMember(players[2].uuid,Rank.OWNER)
  manager.getTeamMap().put(team.id,team);manager.getTeamMap().put(other.id,other)
  players.forEach((p,i)=>{var personal=new Personal(manager,p.uuid);personal.setPlayerName(String(p.getGameProfile().getName()));personal.setEffectiveTeam(i<2?team:other);knownPlayers.put(p.uuid,personal)})
  var objective=server.getScoreboard().getObjective('exp_stage'),score=server.getScoreboard().getOrCreatePlayerScore('$expedition',objective),oldStage=score.getScore()
  try {
   assert(String(global.expeditionMapTeam(players[0]).id)===String(team.id),'pin team owner')
   assert(String(global.expeditionMapTeam(players[1]).id)===String(team.id),'pin team member')
   var Tracker=Java.loadClass('xaero.map.server.mods.ftbteams.FTBTeamsSyncedPlayerTrackerSystem'),tracker=new Tracker()
   assert(tracker.getTrackingLevel(players[0],players[1])===2,'native Xaero teammate tracking')
   assert(tracker.getTrackingLevel(players[0],players[2])===0,'native Xaero stranger hidden')
   var dispatcher=server.getCommands().getDispatcher()
   var executeCommand=function(index,text){return dispatcher.execute(text,players[index].createCommandSourceStack())}
   assert(executeCommand(0,'teammap add base')===1,'add command')
   assert(global.expeditionMapPins(team).length===1,'stored pin')
   assert(executeCommand(1,'teammap add base')===0,'duplicate rejected')
   assert(executeCommand(1,'teammap remove base')===0,'member cannot delete other author')
   assert(executeCommand(2,'teammap remove base')===0,'stranger cannot see/delete pin')
   assert(executeCommand(1,'teammap list')===1,'member list')
   assert(global.expeditionMapPins(other).length===0,'stranger list isolated')
   var copy=new Party(manager,team.id);copy.deserializeNBT(team.serializeNBT())
   assert(global.expeditionMapPins(copy)[0].name==='base','pin native NBT serialize/deserialize')
   var message=String(global.expeditionMapMessage({name:'home_base',dimension:'divinerpg:eden',x:-1,y:64,z:5}))
   assert(message==='xaero-waypoint:home-base:T:-1:64:5:10:false:0:Internal-dim%divinerpg$eden-waypoints','Xaero native share encoding')
   assert(executeCommand(0,'teammap remove base')===1,'author remove')
   assert(global.expeditionMapPins(team).length===0,'pin removed')
   var Travel=Java.loadClass('net.minecraftforge.event.entity.EntityTravelToDimensionEvent'),Bus=Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS,Key=Java.loadClass('net.minecraft.resources.ResourceKey'),Registries=Java.loadClass('net.minecraft.core.registries.Registries')
   sources.dimensions.forEach(row=>{
    var key=Key.create(Registries.DIMENSION,new RL(row.id))
    score.setScore(Math.max(0,row.stage-1));var blocked=new Travel(players[0],key);Bus.post(blocked)
    assert(blocked.isCanceled()===(row.stage>0),'travel below '+row.id)
    score.setScore(row.stage);var allowed=new Travel(players[0],key);Bus.post(allowed)
    assert(!allowed.isCanceled(),'travel unlocked '+row.id)
   })
   score.setScore(0);var returning=new Travel(players[0],Key.create(Registries.DIMENSION,new RL('minecraft:overworld')));Bus.post(returning);assert(!returning.isCanceled(),'return always allowed')
   ;[['divinerpg:eden_blade',2],['divinerpg:mortum_blade',6],['divinerpg:bedrock_sword',7]].forEach(row=>assert(global.expeditionGearStage(Item.of(row[0]),'mainhand')===row[1],'gear stage '+row[0]))
   var result={checks:checks,items:sources.items.length,recipes:sources.recipes.length,scope:'Native server/API and fake-player command checks. No client GUI, actual travel, full claim permission workflow or fight.'}
   JsonIO.write('kubejs/export/divine-team-results.json',result);console.info('DIVINE_TEAM_SUCCESS '+JSON.stringify(result))
  } finally {
   score.setScore(oldStage)
   players.forEach(p=>knownPlayers.remove(p.uuid));manager.getTeamMap().remove(team.id);manager.getTeamMap().remove(other.id)
  }
 })
})
