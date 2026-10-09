// Forge listeners must be registered at startup; full restart is required.
const expeditionSpellRegistry = Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry')
const expeditionSpellFloors = {
  'irons_spellbooks:angel_wing':7, 'irons_spellbooks:teleport':7,
  'irons_spellbooks:greater_heal':3, 'irons_spellbooks:healing_circle':3,
  'irons_spellbooks:raise_dead':3, 'irons_spellbooks:summon_polar_bear':3,
  'irons_spellbooks:summon_vex':6, 'irons_spellbooks:raise_hell':6
}
function expeditionSpellStage(id, level) {
  const spell = expeditionSpellRegistry.REGISTRY.get().getValue(Utils.id(id))
  if (!spell) return expeditionSpellFloors[id] || 0
  const rarity = spell.getRarity(level).getValue()
  return Math.max(expeditionSpellFloors[id] || 0, rarity >= 4 ? 7 : rarity >= 3 ? 6 : rarity >= 2 ? 3 : 0)
}
global.expeditionSpellStage = expeditionSpellStage
ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellPreCastEvent', event => {
  const player = event.entity
  if (!player || player.level.clientSide || !player.server) return
  const stage = expeditionSpellStage(String(event.spellId), event.spellLevel)
  if (!stage || player.server.runCommandSilent('execute if score $expedition exp_stage matches ' + stage + '..') > 0) return
  event.setCanceled(true)
  player.tell('Это заклинание открывается на общем этапе ' + stage + '. Проверьте основной маршрут квестов.')
})
