// Combat finale: Lady Luna + all campaign wins -> Chaos Guardian -> Wither Storm.
var expeditionFinalBossFake=Java.loadClass('net.minecraftforge.common.util.FakePlayer')
function expeditionFinalBossScore(server,name){
 var board=server.getScoreboard(),objective=board.getObjective(name)
 return objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
}
function expeditionFinalBossPlayer(player){
 return player && player.isPlayer() && !(player instanceof expeditionFinalBossFake) && !player.isCreative() && !player.isSpectator()
}
function expeditionChaosOpen(server){
 if(!global.expeditionCataclysmComplete(server) || expeditionFinalBossScore(server,'exp_stage')<9 || expeditionFinalBossScore(server,'exp_divfin')!==1)return false
 for(var i=1;i<=9;i++)if(expeditionFinalBossScore(server,'exp_b'+i)!==1)return false
 return true
}
function expeditionStormOpen(server){return expeditionChaosOpen(server) && expeditionFinalBossScore(server,'exp_chaos')===1}
global.expeditionChaosOpen=expeditionChaosOpen
global.expeditionStormOpen=expeditionStormOpen
function expeditionFinalBossRecord(server,entity,source){
 var id=String(entity.type),objective=null
 if(source.player && !expeditionFinalBossPlayer(source.player))return false
 if(source.type==='genericKill' || source.type==='outOfWorld')return false
 if(id==='divinerpg:lady_luna'){
  if(!global.expeditionCataclysmComplete(server) || expeditionFinalBossScore(server,'exp_stage')<7)return false
  objective='exp_divfin'
 } else if(id==='draconicevolution:draconic_guardian'){
  if(!expeditionChaosOpen(server))return false
  objective='exp_chaos'
 } else if(id==='witherstormmod:wither_storm'){
  if(!expeditionStormOpen(server) || entity.getPhase()<7 || entity.isPlayingDead())return false
  // The native command-block final phase uses this exact damage type. A star
  // in inventory, a formidibomb knockdown, /kill or an early phase is not a win.
  if(!expeditionFinalBossPlayer(source.player) || !source.typeHolder || String(source.typeHolder().unwrapKey().get().location())!=='witherstormmod:player_attack_wither_storm')return false
  objective='exp_storm'
 } else return false
 if(!entity.persistentData.getBoolean('exp_final_engaged') && !expeditionFinalBossPlayer(source.player))return false
 if(expeditionFinalBossScore(server,objective)===1)return false
 server.runCommandSilent('scoreboard players set $expedition '+objective+' 1')
 server.runCommandSilent('tellraw @a '+JSON.stringify({text:'[Экспедиция] Общая финальная победа: '+id+'.',color:'gold'}))
 return true
}
global.expeditionFinalBossRecord=expeditionFinalBossRecord
EntityEvents.hurt(event=>{
 if(event.level.clientSide || event.damage<=0 || !expeditionFinalBossPlayer(event.source.player))return
 if(['divinerpg:lady_luna','draconicevolution:draconic_guardian','witherstormmod:wither_storm'].indexOf(String(event.entity.type))>=0)event.entity.persistentData.putBoolean('exp_final_engaged',true)
})
EntityEvents.death(event=>{if(!event.level.clientSide)expeditionFinalBossRecord(event.server,event.entity,event.source)})
function expeditionFinalModLocked(server,id){
 if(id.startsWith('draconicevolution:')){
  if(!expeditionChaosOpen(server))return true
  if(id.indexOf('chaotic')>=0 || id.indexOf('chaos_shard')>=0 || id==='draconicevolution:chaos_crystal')return expeditionFinalBossScore(server,'exp_chaos')!==1
  return false
 }
 if(id.startsWith('witherstormmod:'))return !expeditionStormOpen(server)
 return false
}
global.expeditionFinalModLocked=expeditionFinalModLocked
BlockEvents.placed(event=>{
 if(event.level.clientSide || !event.player || !expeditionFinalModLocked(event.server,String(event.block.id)))return
 event.cancel();event.player.tell('Финальный контент требует завершения Divine RPG и основного маршрута; Wither Storm — ещё и победы над Chaos Guardian.')
})
BlockEvents.broken(event=>{
 if(!event.level.clientSide && expeditionFinalModLocked(event.server,String(event.block.id)))event.cancel()
})
BlockEvents.rightClicked(event=>{
 if(event.level.clientSide)return
 if(expeditionFinalModLocked(event.server,String(event.block.id)) || expeditionFinalModLocked(event.server,String(event.item.id)))event.cancel()
})
ItemEvents.rightClicked(event=>{if(!event.level.clientSide && expeditionFinalModLocked(event.server,String(event.item.id)))event.cancel()})
ServerEvents.recipes(event=>{
 // The renewable Realmwarden material is available only after stage IX.
 event.replaceInput({output:'draconicevolution:draconium_core'},'#forge:gems/diamond','kubejs:material_realmwarden')
})
