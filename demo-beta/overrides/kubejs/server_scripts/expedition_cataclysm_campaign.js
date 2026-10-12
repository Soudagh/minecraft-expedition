// Separate persistent campaign: never reset the nine existing expedition wins.
var expeditionCatPolicy=JsonIO.read('kubejs/config/cataclysm_campaign.json')
var expeditionCatFake=Java.loadClass('net.minecraftforge.common.util.FakePlayer')
function expeditionCatStage(server) {
  var board=server.getScoreboard(), objective=board.getObjective('exp_cat')
  return objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
}
global.expeditionCataclysmComplete=server=>expeditionCatStage(server)>=8
function expeditionCatPlayer(player) {
  return player && player.isPlayer() && !(player instanceof expeditionCatFake) && !player.isCreative() && !player.isSpectator()
}
function expeditionCatBoss(entity) {
  return expeditionCatPolicy.bosses.find(row=>row.entity===String(entity.type))
}
function expeditionCatVictory(server,entity,source) {
  var boss=expeditionCatBoss(entity)
  if (!boss || (source.player && !expeditionCatPlayer(source.player))) return false
  if (source.type==='genericKill' || source.type==='outOfWorld') return false
  if (!entity.persistentData.getBoolean('exp_cat_engaged') && !expeditionCatPlayer(source.player)) return false
  // Out-of-order kills cannot be banked for a later automatic unlock.
  if (expeditionCatStage(server)!==boss.order-1) return false
  server.runCommandSilent('scoreboard players set $expedition exp_cat '+boss.order)
  server.runCommandSilent('tellraw @a '+JSON.stringify({text:'[Экспедиция] Cataclysm '+boss.order+'/8: '+boss.title+'. Победа общая для сервера.',color:'green'}))
  if (boss.order===8) server.runCommandSilent('tellraw @a '+JSON.stringify({text:'[Экспедиция] Игнис побеждён. Открыты порталы и экипировка Divine RPG; следующие измерения требуют этапы основного маршрута.',color:'gold'}))
  return true
}
global.expeditionCatVictory=expeditionCatVictory
global.expeditionCatStage=expeditionCatStage
EntityEvents.hurt(event=>{
  if (event.level.clientSide || event.damage<=0 || !expeditionCatPlayer(event.source.player)) return
  var boss=expeditionCatBoss(event.entity)
  if (boss && expeditionCatStage(event.server)===boss.order-1) event.entity.persistentData.putBoolean('exp_cat_engaged',true)
})
EntityEvents.death(event=>{
  if (!event.level.clientSide) expeditionCatVictory(event.server,event.entity,event.source)
})
function expeditionCatPortalLocked(event) {
  // A legacy player inside Divine must be able to rebuild a return portal.
  return !event.level.clientSide && event.player && !String(event.level.dimension).startsWith('divinerpg:') && !global.expeditionCataclysmComplete(event.server)
}
BlockEvents.placed(event=>{
  if (expeditionCatPortalLocked(event) && expeditionCatPolicy.blocked_placements.indexOf(String(event.block.id))>=0) {
    event.cancel()
    event.player.tell('Порталы Divine RPG открываются после всей цепочки Cataclysm и победы над Игнисом.')
  }
})
BlockEvents.rightClicked(event=>{
  if (!expeditionCatPortalLocked(event)) return
  if (expeditionCatPolicy.blocked_activators.indexOf(String(event.item.id))>=0 || String(event.block.id)==='divinerpg:nightmare_bed') {
    event.cancel()
    event.player.tell('Сначала завершите Cataclysm: '+expeditionCatStage(event.server)+'/8. Последний босс — Игнис.')
  }
})
ItemEvents.rightClicked(event=>{
  if (expeditionCatPortalLocked(event) && expeditionCatPolicy.blocked_activators.indexOf(String(event.item.id))>=0) event.cancel()
})
