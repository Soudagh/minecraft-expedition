StartupEvents.registry('item',event=>{
  event.create('sweet_fermentation_starter').displayName('Настой для лечебной ферментации').texture('minecraft:item/glistering_melon_slice')
  event.create('combat_fermentation_starter').displayName('Настой для боевой ферментации').texture('minecraft:item/blaze_powder')
})
function expeditionKitchenStage(id) {
  return id==='brewinandchewin:saccharine_rum' ? 2 : id==='brewinandchewin:red_rum' ? 3 : 0
}
global.expeditionKitchenStage=expeditionKitchenStage
const expeditionKitchenFakePlayer=Java.loadClass('net.minecraftforge.common.util.FakePlayer')
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEntityUseItemEvent$Start',event=>{
  const player=event.entity
  if (!player.isPlayer() || player.level.clientSide) return
  const stage=expeditionKitchenStage(String(event.item.id))
  if (!stage) return
  const board=player.server.getScoreboard(), objective=board.getObjective('exp_stage')
  const current=objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
  if (current>=stage) return
  event.setCanceled(true)
  if (!(player instanceof expeditionKitchenFakePlayer)) player.tell('Этот напиток открывается на общем этапе '+stage+'. Кружка сохранена; обычная еда и напитки доступны без этого ограничения.')
})
