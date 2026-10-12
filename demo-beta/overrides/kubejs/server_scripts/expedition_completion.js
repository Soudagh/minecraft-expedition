// A real UV fusion cycle and all nine persistent victories complete the campaign.
// The legacy $demo/exp_progress flags remain untouched.
var expeditionFinalMachine=Java.loadClass('com.gregtechceu.gtceu.api.machine.MetaMachine')
var expeditionFinalFusion=Java.loadClass('com.gregtechceu.gtceu.common.machine.multiblock.electric.FusionReactorMachine')
var expeditionFinalPosArg=Java.loadClass('net.minecraft.commands.arguments.coordinates.BlockPosArgument')
var expeditionFinalWatches={}
function expeditionFinalScore(server,key) {
 var board=server.getScoreboard(),objective=board.getObjective(key)
 return objective?board.getOrCreatePlayerScore('$expedition',objective).getScore():0
}
function expeditionFinalVictories(server) {
 for(let i=1;i<=9;i++)if(expeditionFinalScore(server,'exp_b'+i)!==1)return false
 return expeditionFinalScore(server,'exp_stage')>=9
}
function expeditionFinalComponents(player) {
 let motors=0,pumps=0
 for(let i=0;i<36;i++){
  var stack=player.inventory.getItem(i)
  if(stack.id==='gtceu:uv_electric_motor')motors+=stack.count
  if(stack.id==='gtceu:uv_electric_pump')pumps+=stack.count
 }
 return motors>=4 && pumps>=4
}
function expeditionFinalState(machine) {
 if(!(machine instanceof expeditionFinalFusion) || String(machine.getDefinition().getId())!=='gtceu:uv_fusion_reactor' || !machine.isFormed())return null
 var logic=machine.getRecipeLogic()
 return {working:logic.isWorking(),completed:logic.getConsecutiveRecipes()}
}
function expeditionFinalAdvanced(start,now) {
 // Only the native completion counter increase counts, never a progress reset,
 // item in an inventory, a waiting machine or a hand-written quest checkmark.
 return !!now && now.working && now.completed>start
}
function expeditionFinalWatch(player,pos) {
 var server=player.server
 if(player.isCreative() || player.isSpectator()) {player.tell('Зачёт выполняется в выживании.');return 0}
 if(expeditionFinalScore(server,'exp_complete')===1){player.tell('Промышленный финал уже подтверждён.');return 0}
 if(!expeditionFinalVictories(server) || !expeditionFinalComponents(player)){player.tell('Нужны все девять побед и по четыре UV-мотора и UV-помпы в инвентаре. Компоненты сохраняются.');return 0}
 if(player.blockPosition().distSqr(pos)>64){player.tell('Подойдите к контроллеру на расстояние до восьми блоков.');return 0}
 var machine=expeditionFinalMachine.getMachine(player.level,pos),state=expeditionFinalState(machine)
 if(!state || !state.working){player.tell('Нужен собранный UV fusion reactor, выполняющий рецепт. Подготовьте входы хотя бы на два последовательных цикла.');return 0}
 expeditionFinalWatches[String(player.uuid)]={machine:machine,start:state.completed,pos:pos,level:player.level,elapsed:0}
 player.tell('Начат зачёт UV-синтеза. Оставайтесь рядом: требуется завершить цикл и начать следующий. Остановка/перезагрузка отменяет наблюдение; запустите его снова.')
 return 1
}
ServerEvents.loaded(event=>{
 event.server.runCommandSilent('scoreboard objectives add exp_complete dummy')
 event.server.runCommandSilent('execute unless score $expedition exp_complete matches 0.. run scoreboard players set $expedition exp_complete 0')
})
ServerEvents.tick(event=>{
 Object.keys(expeditionFinalWatches).forEach(uuid=>{
  var watch=expeditionFinalWatches[uuid],player=event.server.getPlayerList().getPlayer(Java.loadClass('java.util.UUID').fromString(uuid))
  watch.elapsed++
  if(!player || !player.level.equals(watch.level) || player.blockPosition().distSqr(watch.pos)>256 || player.isCreative() || player.isSpectator() || watch.elapsed>12000 || !watch.level.hasChunkAt(watch.pos)) {delete expeditionFinalWatches[uuid];return}
  var current=expeditionFinalMachine.getMachine(watch.level,watch.pos),state=current && current.equals(watch.machine)?expeditionFinalState(current):null
  if(!state || !state.working){delete expeditionFinalWatches[uuid];player.tell('UV-зачёт остановлен: установка перестала выполнять рецепт. Запустите наблюдение снова.');return}
  if(!expeditionFinalAdvanced(watch.start,state))return
  delete expeditionFinalWatches[uuid]
  if(!expeditionFinalVictories(event.server) || !expeditionFinalComponents(player) || expeditionFinalScore(event.server,'exp_complete')===1)return
  event.server.runCommandSilent('scoreboard players set $expedition exp_complete 1')
  event.server.runCommandSilent('advancement grant @a only expedition:completed')
  event.server.runCommandSilent('tellraw @a {"text":"[Экспедиция] Девять побед и работающий UV-синтез подтверждены. Промышленный финал подтверждён! Боевой финал продолжается.","color":"gold"}')
 })
})
ServerEvents.commandRegistry(event=>{
 var C=event.commands
 event.register(C.literal('expeditionfinal')
  .then(C.literal('status').executes(ctx=>{var p=ctx.source.playerOrException;p.tell('Завершение: '+(expeditionFinalScore(p.server,'exp_complete')===1?'подтверждено':'ещё не подтверждено')+'. Девять побед: '+(expeditionFinalVictories(p.server)?'есть':'не все'));return 1}))
  .then(C.literal('watch').then(C.argument('pos',expeditionFinalPosArg.blockPos()).executes(ctx=>expeditionFinalWatch(ctx.source.playerOrException,expeditionFinalPosArg.getLoadedBlockPos(ctx,'pos'))))))
})
global.expeditionFinalVictories=expeditionFinalVictories
global.expeditionFinalComponents=expeditionFinalComponents
global.expeditionFinalState=expeditionFinalState
global.expeditionFinalAdvanced=expeditionFinalAdvanced

PlayerEvents.loggedIn(event=>{
 if(expeditionFinalScore(event.server,'exp_complete')===1)event.server.runCommandSilent('advancement grant '+event.player.uuid+' only expedition:completed')
})
