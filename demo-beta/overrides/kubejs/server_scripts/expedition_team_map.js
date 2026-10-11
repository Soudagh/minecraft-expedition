// FTB-owned persistent pins. Xaero's native chat importer confirms local imports.
const expeditionMapTeams=Java.loadClass('dev.ftb.mods.ftbteams.api.FTBTeamsAPI')
const expeditionMapString=Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
function expeditionMapTeam(player) {
  const team=expeditionMapTeams.api().getManager().getTeamForPlayer(player).orElse(null)
  return team && team.isPartyTeam() ? team : null
}
function expeditionMapPins(team) {
  const text=String(team.getExtraData().getString('expedition_map_pins_v1'))
  return text ? JSON.parse(text) : []
}
function expeditionMapSave(team,pins) {
  team.getExtraData().putString('expedition_map_pins_v1',JSON.stringify(pins));team.markDirty()
}
function expeditionMapEncode(text) {return String(text).replace(/-/g,'^min^').replace(/_/g,'-').replace(/:/g,'^col^').replace(/\*/g,'^ast^')}
function expeditionMapMessage(pin) {
  const dim='dim%'+pin.dimension.replace(':','$').replace(/\//g,'%').replace(/\./g,',')
  return 'xaero-waypoint:'+expeditionMapEncode(pin.name)+':T:'+pin.x+':'+pin.y+':'+pin.z+':10:false:0:Internal-'+expeditionMapEncode(dim)+'-waypoints'
}
function expeditionMapList(player) {
  const team=expeditionMapTeam(player)
  if (!team) {player.tell('Сначала создайте или вступите в команду FTB Teams.');return 0}
  const pins=expeditionMapPins(team)
  player.tell('Метки команды: '+pins.length+'. Нажмите сообщение Xaero и подтвердите импорт в карту.')
  pins.forEach(pin=>player.tell(expeditionMapMessage(pin)))
  return 1
}
ServerEvents.commandRegistry(event=>{
  const C=event.commands
  event.register(C.literal('teammap').executes(ctx=>expeditionMapList(ctx.source.playerOrException))
    .then(C.literal('list').executes(ctx=>expeditionMapList(ctx.source.playerOrException)))
    .then(C.literal('add').then(C.argument('name',expeditionMapString.word()).executes(ctx=>{
      const player=ctx.source.playerOrException,team=expeditionMapTeam(player)
      if (!team) {player.tell('Сначала вступите в команду FTB Teams.');return 0}
      const name=String(expeditionMapString.getString(ctx,'name'))
      if (!/^[a-zA-Zа-яА-ЯёЁ0-9_-]{1,32}$/.test(name)) {player.tell('Имя: 1–32 буквы, цифры, _ или -, без пробелов.');return 0}
      const pins=expeditionMapPins(team),old=pins.find(p=>p.name===name)
      if (old) {player.tell('Имя уже занято. Удалите прежнюю метку или выберите другое имя.');return 0}
      if (pins.length>=64) {player.tell('Лимит команды: 64 метки.');return 0}
      const pin={name:name,dimension:String(player.level.dimension),x:Math.floor(player.x),y:Math.floor(player.y),z:Math.floor(player.z),author:String(player.uuid)}
      pins.push(pin);expeditionMapSave(team,pins)
      team.getOnlineMembers().forEach(member=>{member.tell('Новая метка команды: '+name);member.tell(expeditionMapMessage(pin))})
      return 1
    })))
    .then(C.literal('remove').then(C.argument('name',expeditionMapString.word()).executes(ctx=>{
      const player=ctx.source.playerOrException,team=expeditionMapTeam(player)
      if (!team) return 0
      const name=String(expeditionMapString.getString(ctx,'name')),pins=expeditionMapPins(team),pin=pins.find(p=>p.name===name)
      if (!pin) {player.tell('Метка не найдена.');return 0}
      if (pin.author!==String(player.uuid) && team.getRankForPlayer(player.uuid).ordinal()<5) {player.tell('Удалять чужие метки может офицер или лидер.');return 0}
      expeditionMapSave(team,pins.filter(p=>p.name!==name))
      team.getOnlineMembers().forEach(member=>member.tell('Удалена общая метка '+name+'. Если вы импортировали её в Xaero, удалите личную копию на карте.'))
      return 1
    }))))
})
PlayerEvents.loggedIn(event=>event.server.scheduleInTicks(80,()=>{
  if (expeditionMapTeam(event.player)) expeditionMapList(event.player)
}))
global.expeditionMapTeam=expeditionMapTeam
global.expeditionMapPins=expeditionMapPins
global.expeditionMapSave=expeditionMapSave
global.expeditionMapMessage=expeditionMapMessage
