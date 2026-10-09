// Native APIs only; preserve the mods' own progression and configuration.
const expeditionHexConfig = Java.loadClass('at.petrak.hexcasting.api.mod.HexConfig')
const expeditionHexFloors = {'hexcasting:flight/range':7,'hexcasting:flight/time':7,'hexcasting:flight':7,
  'hexcasting:teleport/great':7,'hexcasting:blink':7,'hexcasting:sentinel/create/great':7,
  'hexcasting:brainsweep':7,'hexcasting:explode':6,'hexcasting:explode/fire':6,'hexcasting:lightning':6}
function expeditionHexStage(id, circle) {
  return Math.max(expeditionHexFloors[id] || 0, circle && id === 'hexcasting:break_block' ? 6 : 0)
}
global.expeditionHexStage = expeditionHexStage
let expeditionHexBase = null
global.expeditionHexOriginal = () => expeditionHexBase
ForgeEvents.onEvent('net.minecraftforge.event.server.ServerStartedEvent', event => {
  const server = event.server
  expeditionHexBase = expeditionHexConfig.server()
  const base = expeditionHexBase
  const open = (id, circle) => {
    const stage = expeditionHexStage(String(id), circle)
    return !stage || server.runCommandSilent('execute if score $expedition exp_stage matches ' + stage + '..') > 0
  }
  expeditionHexConfig.setServer({
    opBreakHarvestLevelBecauseForgeThoughtItWasAGoodIdeaToImplementHarvestTiersUsingAnHonestToGodTopoSort: () => base.opBreakHarvestLevelBecauseForgeThoughtItWasAGoodIdeaToImplementHarvestTiersUsingAnHonestToGodTopoSort(),
    maxOpCount: () => base.maxOpCount(), maxSpellCircleLength: () => base.maxSpellCircleLength(),
    isActionAllowed: id => base.isActionAllowed(id) && open(id, false),
    isActionAllowedInCircles: id => base.isActionAllowedInCircles(id) && open(id, true),
    getActionCostScaling: id => base.getActionCostScaling(id), globalCostScaling: () => base.globalCostScaling(),
    doesGreaterTeleportSplatItems: () => base.doesGreaterTeleportSplatItems(),
    doVillagersTakeOffenseAtMindMurder: () => base.doVillagersTakeOffenseAtMindMurder(),
    canTeleportInThisDimension: dimension => base.canTeleportInThisDimension(dimension),
    trueNameHasAmbit: () => base.trueNameHasAmbit(), traderScrollChance: () => base.traderScrollChance()
  })
})
ForgeEvents.onEvent('net.minecraftforge.event.server.ServerStoppedEvent', event => {
  if (expeditionHexBase) expeditionHexConfig.setServer(expeditionHexBase)
  expeditionHexBase = null
})
function expeditionMnaStage(spell, level) {
  const tier=spell.getTier(level)
  let stage = tier>=5 ? 7 : tier>=4 ? 6 : tier>=3 ? 3 : 0
  spell.getComponents().forEach(component => {
    const name = String(component.getPart().getClass().getSimpleName())
    if (name === 'ComponentFlight' || name === 'ComponentEldrinFlight' || name === 'ComponentBlink') stage = Math.max(stage,7)
    if (name === 'ComponentIcarianFlight') stage = Math.max(stage,4)
  })
  return stage
}
global.expeditionMnaStage = expeditionMnaStage
ForgeEvents.onEvent('com.mna.api.events.SpellCastEvent', event => {
  const player = event.source.getPlayer()
  if (!player || event.context.isClientSide()) return
  const stage = expeditionMnaStage(event.spell, event.context.getLevel())
  if (!stage || player.server.runCommandSilent('execute if score $expedition exp_stage matches ' + stage + '..') > 0) return
  event.setCanceled(true)
  player.tell('Это составное заклинание M&A открывается на общем этапе ' + stage + '.')
})

ForgeEvents.onEvent('top.theillusivec4.curios.api.event.CurioEquipEvent', event => {
  const player=event.entity
  if (!player || !player.isPlayer() || player.level.clientSide || !global.expeditionGearStage) return
  const required=global.expeditionGearStage(event.stack,'curio')
  if (!required) return
  const board=player.server.getScoreboard(), objective=board.getObjective('exp_stage')
  const stage=objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
  if (stage<required) event.setResult(Java.loadClass('net.minecraftforge.eventbus.api.Event$Result').DENY)
})
