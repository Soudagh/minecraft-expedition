// Reject only Divine's angelic effect; preserve spells and other flying abilities.
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Applicable',event=>{
 const player=event.entity
 if(!player.isPlayer() || player.level.clientSide)return
 const id=String(Java.loadClass('net.minecraftforge.registries.ForgeRegistries').MOB_EFFECTS.getKey(event.effectInstance.effect))
 if(id!=='divinerpg:angelic_flight')return
 if(!global.expeditionAngelicCanApply || !global.expeditionAngelicCanApply(player))event.setResult(Java.loadClass('net.minecraftforge.eventbus.api.Event$Result').DENY)
})
