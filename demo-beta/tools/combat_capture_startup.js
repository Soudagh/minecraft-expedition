// Opt-in QA recorder. Install only in an isolated instance's startup_scripts.
// NORMAL Forge listener priority: observed event amounts, not guaranteed final HP loss.
var combatCaptureRegistry=Java.loadClass('dev.latvian.mods.kubejs.registry.RegistryInfo')
var combatCaptureAttr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
var combatCaptureCaps=Java.loadClass('yesman.epicfight.world.capabilities.EpicFightCapabilities')
var combatCaptureActorMethod=null
function combatCaptureActor(source){
 if(!combatCaptureActorMethod){source.getClass().getMethods().forEach(method=>{if((String(method.name)==='m_7639_' || String(method.name)==='getEntity') && method.getParameterCount()===0)combatCaptureActorMethod=method})}
 if(!combatCaptureActorMethod)throw new Error('QA damage actor method missing')
 return combatCaptureActorMethod.invoke(source)
}
var combatCaptureTimeMethod=null
function combatCaptureTime(level){
 if(!combatCaptureTimeMethod){level.getClass().getMethods().forEach(method=>{if((String(method.name)==='m_46467_' || String(method.name)==='getGameTime') && method.getParameterCount()===0)combatCaptureTimeMethod=method})}
 if(!combatCaptureTimeMethod)throw new Error('QA game-time method missing')
 return Number(combatCaptureTimeMethod.invoke(level))
}
var combatCaptureState={enabled:false,session:null,startedTick:null,rows:[],dropped:0,errors:[],maxRows:20000}
function combatCaptureGuard(callback){
 try{return callback()}catch(error){combatCaptureState.enabled=false;combatCaptureState.errors.push(String(error));console.error('COMBAT_CAPTURE_DISABLED '+error)}
}
function combatCapturePush(row){
 if(!combatCaptureState.enabled)return
 if(combatCaptureState.rows.length>=combatCaptureState.maxRows){combatCaptureState.dropped++;return}
 combatCaptureState.rows.push(row)
}
function combatCaptureTagged(entity,tag){return !!entity && entity.getTags().contains(tag)}
function combatCaptureSample(player){
 if(!combatCaptureState.enabled || !combatCaptureTagged(player,'exp_combat_observe'))return
 var patch=player.getCapability(combatCaptureCaps.CAPABILITY_ENTITY).orElse(null),effects=[]
 player.getActiveEffects().forEach(effect=>effects.push({id:String(combatCaptureRegistry.MOB_EFFECT.getId(effect.effect)),amplifier:effect.amplifier,duration:effect.duration}))
 combatCapturePush({kind:'sample',tick:combatCaptureTime(player.level),player:String(player.uuid),health:player.health,weapon:String(player.mainHandItem.id),attack:player.getAttributeValue(combatCaptureAttr.ATTACK_DAMAGE),attackSpeed:player.getAttributeValue(combatCaptureAttr.ATTACK_SPEED),epicFight:patch?{stamina:patch.getStamina(),weight:patch.getWeight(),battleMode:patch.isEpicFightMode()}:null,effects:effects})
}
function combatCaptureDamage(event,kind){
 if(!combatCaptureState.enabled || event.entity.level.clientSide)return
 var source=event.source,actor=combatCaptureActor(source),target=event.entity
 if(!combatCaptureTagged(actor,'exp_combat_observe') || !combatCaptureTagged(target,'exp_combat_target'))return
 combatCapturePush({kind:kind,tick:combatCaptureTime(target.level),player:String(actor.uuid),target:String(target.uuid),source:String(source),observedAmount:event.amount,targetHealthBeforeEvent:target.health,canceled:event.isCanceled()})
}
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingAttackEvent',event=>combatCaptureGuard(()=>combatCaptureDamage(event,'living_attack')))
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent',event=>combatCaptureGuard(()=>combatCaptureDamage(event,'living_damage')))
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.AttackEntityEvent',event=>combatCaptureGuard(()=>{
 if(!combatCaptureState.enabled || event.entity.level.clientSide || !combatCaptureTagged(event.entity,'exp_combat_observe') || !combatCaptureTagged(event.target,'exp_combat_target'))return
 combatCapturePush({kind:'attack_entity',tick:combatCaptureTime(event.entity.level),player:String(event.entity.uuid),target:String(event.target.uuid),canceled:event.isCanceled()})
}))
global.expeditionCombatCapture={time:combatCaptureTime,state:combatCaptureState,sample:player=>combatCaptureGuard(()=>combatCaptureSample(player)),flush:()=>{
 if(!combatCaptureState.session)return
 JsonIO.write('kubejs/export/combat-capture-'+combatCaptureState.session+'.json',{scope:'Opt-in tagged QA players and targets. Forge listeners at NORMAL priority; observed damage-event amounts may change in later listeners and are not guaranteed final HP loss. No client input or missed swings recorded.',session:combatCaptureState.session,enabled:combatCaptureState.enabled,startedTick:combatCaptureState.startedTick,dropped:combatCaptureState.dropped,errors:combatCaptureState.errors,maxRows:combatCaptureState.maxRows,rows:combatCaptureState.rows})
}}
