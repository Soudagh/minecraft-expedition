// First campaign profile; animated combat and special abilities require play QA.
var expeditionBossPolicy=JsonIO.read('kubejs/config/boss_balance.json')
var expeditionBossAttributes=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
function expeditionApplyBossHealth(entity){
 var rule=expeditionBossPolicy.native[String(entity.type)]
 if(!rule || entity.persistentData.getInt('exp_boss_profile')===38)return false
 var attr=entity.getAttribute(expeditionBossAttributes.MAX_HEALTH)
 if(!attr)return false
 var ratio=entity.maxHealth>0 ? entity.health/entity.maxHealth : 1
 attr.setBaseValue(rule.health);entity.setHealth(Math.max(0,Math.min(rule.health,rule.health*ratio)))
 entity.persistentData.putInt('exp_boss_profile',38)
 return true
}
global.expeditionApplyBossHealth=expeditionApplyBossHealth
EntityEvents.spawned(event=>{
 if(!event.level.clientSide)expeditionApplyBossHealth(event.entity)
})
EntityEvents.hurt(event=>{
 if(event.level.clientSide)return
 var target=expeditionBossPolicy.native[String(event.entity.type)]
 if(target && target.requires_cataclysm && !global.expeditionCataclysmComplete(event.server)){
  event.cancel();return
 }
})

ServerEvents.loaded(event=>event.server.scheduleInTicks(1,()=>event.server.runCommandSilent('function expedition:balance/slb')))
