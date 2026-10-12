// Refuse premature final-boss joins, including naturally generated Chaos islands.
// Other DE entities (e.g. crystals) keep their native behavior.
ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityJoinLevelEvent',event=>{
 var entity=event.entity,level=event.level
 if(level.clientSide)return
 var id=String(entity.type)
 if(id==='draconicevolution:draconic_guardian' && !global.expeditionChaosOpen(level.server))event.setCanceled(true)
 if(id==='witherstormmod:wither_storm' && !global.expeditionStormOpen(level.server))event.setCanceled(true)
})
