// Travel gating catches prebuilt portals and creative-obtained activation items.
// Returning to the Overworld is always allowed. Same campaign scoreboard as gear.
ForgeEvents.onEvent('divinerpg.blocks.base.BlockModPortal$PortalSpawnEvent',event=>{
  const level=event.getLevel()
  if (level.clientSide || String(level.dimension).startsWith('divinerpg:')) return
  const board=level.server.getScoreboard(), objective=board.getObjective('exp_cat')
  const stage=objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
  if (stage<8) event.setCanceled(true)
})
ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityTravelToDimensionEvent', event => {
  const player=event.getEntity()
  if (!player.isPlayer() || player.level.clientSide) return
  const target=String(event.getDimension().location())
  const stages=JsonIO.read('kubejs/config/cataclysm_campaign.json').dimensions
  if (!Object.prototype.hasOwnProperty.call(stages,target)) return
  const required=stages[target]
  const board=player.server.getScoreboard(), objective=board.getObjective('exp_stage')
  const stage=objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
  const catObjective=board.getObjective('exp_cat')
  const cat=catObjective ? board.getOrCreatePlayerScore('$expedition',catObjective).getScore() : 0
  if (cat<8 || stage<required) {
    event.setCanceled(true)
    if (player.tickCount % 40 === 0) player.tell(cat<8 ? 'Сначала завершите Cataclysm и победите Игниса.' : 'Это измерение Divine RPG требует общий этап '+required+'.')
  }
})
