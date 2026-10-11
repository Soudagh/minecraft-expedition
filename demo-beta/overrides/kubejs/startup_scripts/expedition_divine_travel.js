// Travel gating catches prebuilt portals and creative-obtained activation items.
// Returning to the Overworld is always allowed. Same campaign scoreboard as gear.
ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityTravelToDimensionEvent', event => {
  const player=event.getEntity()
  if (!player.isPlayer() || player.level.clientSide) return
  const target=String(event.getDimension().location())
  const stages={'divinerpg:eden':2,'divinerpg:wildwood':3,'divinerpg:apalachia':4,
    'divinerpg:skythern':5,'divinerpg:mortum':6,'divinerpg:arcana':5,'divinerpg:vethea':7}
  const required=stages[target] || 0
  if (!required) return
  const board=player.server.getScoreboard(), objective=board.getObjective('exp_stage')
  const stage=objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
  if (stage<required) {
    event.setCanceled(true)
    if (player.tickCount % 40 === 0) player.tell('Это измерение Divine RPG требует общий этап '+required+'.')
  }
})
