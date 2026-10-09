// One shared expedition per server. Persistent victories live in world scoreboards.
const expeditionFakePlayer = Java.loadClass('net.minecraftforge.common.util.FakePlayer')
const expeditionNativeBosses = {
  'graveyard:lich': 'champion',
  'eeeabsmobs:relic_annihilator': 'annihilator',
  'eeeabsmobs:realm_warden': 'realmwarden'
}

function expeditionSurvivalPlayer(player) {
  return player && player.isPlayer() && !(player instanceof expeditionFakePlayer) && !player.isCreative() && !player.isSpectator()
}

EntityEvents.hurt(event => {
  const entity = event.entity
  if (event.level.clientSide || event.damage <= 0 || !expeditionSurvivalPlayer(event.source.player)) return
  if (expeditionNativeBosses[entity.type]) entity.persistentData.putBoolean('exp_player_engaged_v1', true)
  // A normal cow/slime has no boss_hitbox score and can never mark a boss root.
  const roots = entity.type === 'minecraft:cow' ? [[10,'aj.slb_aw.root'],[10,'aj.slb_soc.root'],[12,'aj.slb_nl.root'],[13,'aj.slb_te.root']]
    : entity.type === 'minecraft:slime' ? [[1,'aj.lothran_boss_test_1.root'],[4,'aj.gigant_sunflower.root']] : []
  roots.forEach(row => event.server.runCommandSilent('execute as ' + entity.uuid + ' at @s run execute if score @s boss_hitbox matches ' + row[0] + ' at @s run tag @e[type=minecraft:item_display,tag=' + row[1] + ',tag=!mob_battle,distance=..35,sort=nearest,limit=1] add exp_player_engaged_v1'))
})

EntityEvents.death(event => {
  const entity = event.entity
  const boss = expeditionNativeBosses[entity.type]
  if (event.level.clientSide || !boss) return
  // /kill, void deletion and unengaged mobs are never victories. Environmental
  // finishing damage is allowed only after survival-player participation.
  if (event.source.player && !expeditionSurvivalPlayer(event.source.player)) return
  const cause = event.source.type
  if (cause === 'genericKill' || cause === 'outOfWorld') return
  if (!entity.persistentData.getBoolean('exp_player_engaged_v1') && !expeditionSurvivalPlayer(event.source.player)) return
  event.server.runCommandSilent('function expedition:progression/win/' + boss)
})

function expeditionRequiredStage(id) {
  const tiers = {lv:5,mv:5,hv:6,ev:6,iv:7,luv:8,zpm:9,uv:9}
  const match = /^gtceu:(lv|mv|hv|ev|iv|luv|zpm|uv)_/.exec(id)
  if (match && !id.endsWith('_machine_casing')) return tiers[match[1]]
  const machines = {'gtceu:electric_blast_furnace':5,'gtceu:vacuum_freezer':6,'gtceu:cleanroom':6,'gtceu:assembly_line':7,
    'createaddition:electric_motor':5,'createaddition:modular_accumulator':5,'hbm_m:anvil_iron':5,'hbm_m:anvil_lead':5,'hbm_m:press':5,'refinedstorage:controller':5}
  return machines[id] || 0
}

function expeditionStageOpen(server, stage) {
  return server.runCommandSilent('execute if score $expedition exp_stage matches ' + stage + '..') > 0
}

BlockEvents.placed(event => {
  if (event.level.clientSide || !event.player) return
  const stage = expeditionRequiredStage(event.block.id)
  if (stage && !expeditionStageOpen(event.server, stage)) {
    event.cancel()
    event.player.tell('Для этого оборудования нужен общий этап ' + stage + '. Победы отмечаются в главе «Основной маршрут».')
  }
})

BlockEvents.rightClicked(event => {
  if (event.level.clientSide || event.hand.toString() !== 'MAIN_HAND') return
  const blueprint = /^kubejs:blueprint_(watchers|champion|lothric|sunflower|annihilator|cinder|nightlord|melkor|realmwarden)$/.exec(event.item.id)
  if (event.block.id === 'minecraft:smithing_table' && blueprint) {
    event.cancel()
    event.server.runCommandSilent('execute as ' + event.player.uuid + ' at @s run function expedition:processing/' + blueprint[1] + '/check')
    return
  }
  const stage = expeditionRequiredStage(event.block.id)
  if (stage && !expeditionStageOpen(event.server, stage)) {
    event.cancel()
    event.player.tell('Это оборудование открывается на общем этапе ' + stage + '.')
  }
})
