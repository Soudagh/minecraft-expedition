// EntityEvents.hurt exposes a read-only amount in this pinned KubeJS build.
// Mutate the actual Forge event instead. The getter uses pinned 1.20.1 SRG;
// reflection avoids its ambiguous JS mapping (getEntity is not exposed).
var expeditionBossDamagePolicy=JsonIO.read('kubejs/config/boss_balance.json').native
var expeditionBossSourceGetter=null
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent',event=>{
 var target=event.entity
 if(target.level.clientSide || !target.isPlayer())return
 var source=event.getSource()
 if(!expeditionBossSourceGetter)expeditionBossSourceGetter=source.getClass().getMethod('m_7639_')
 var attacker=expeditionBossSourceGetter.invoke(source)
 if(!attacker)return
 var rule=expeditionBossDamagePolicy[String(attacker.type)]
 if(rule)event.setAmount(event.getAmount()*rule.damage_multiplier)
})
