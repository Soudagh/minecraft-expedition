// One renewable VII material pays for three minutes of actual angelic flight.
// Credit survives death; grounded time and other flight sources are not charged.
var expeditionAngelicEffect=Java.loadClass('net.minecraftforge.registries.ForgeRegistries').MOB_EFFECTS.getValue(Utils.id('divinerpg:angelic_flight'))
var expeditionAngelicSlowFall=Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
function expeditionAngelicCredit(player) {
 var root=player.getForgePersistentData(),data=root.getCompound('PlayerPersisted');root.put('PlayerPersisted',data);return data
}
function expeditionAngelicHasSupply(player) {
 for(var i=0;i<36;i++)if(player.inventory.getItem(i).id==='kubejs:material_nightlord')return true
 return false
}
function expeditionAngelicCanApply(player) {
 if(player.isCreative() || player.isSpectator())return true
 return expeditionPlayerStage(player)>=7 && (expeditionAngelicCredit(player).getInt('exp_angelic_ticks')>0 || expeditionAngelicHasSupply(player))
}
function expeditionAngelicTick(player) {
 if(player.level.clientSide || player.isCreative() || player.isSpectator())return
 if(!player.hasEffect(expeditionAngelicEffect)) {
  if(!expeditionAngelicCanApply(player))return
  var slots=Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
  var full=[['HEAD','helmet'],['CHEST','chestplate'],['LEGS','leggings'],['FEET','boots']].every(row=>player.getItemBySlot(slots[row[0]]).id==='divinerpg:angelic_'+row[1])
  if(full)Java.loadClass('divinerpg.events.ArmorAbilitiesEvent').updateAbilities(player)
 }
 if(!player.hasEffect(expeditionAngelicEffect))return
 var data=expeditionAngelicCredit(player);var ticks=Math.max(0,data.getInt('exp_angelic_ticks'))
 if(expeditionPlayerStage(player)<7 || (!ticks && !expeditionAngelicHasSupply(player))) {
  var flying=player.abilities.flying
  player.removeEffect(expeditionAngelicEffect)
  if(flying)player.addEffect(new expeditionAngelicSlowFall(Java.loadClass('net.minecraftforge.registries.ForgeRegistries').MOB_EFFECTS.getValue(Utils.id('minecraft:slow_falling')),80,0))
  if(flying)player.tell('Запас ангельского полёта исчерпан. Для следующих трёх минут нужна матрица сборочной линии; спускайтесь, действует краткое медленное падение.')
  return
 }
 if(!player.abilities.flying)return
 if(!ticks) {
  for(var i=0;i<36;i++){
   var stack=player.inventory.getItem(i)
   if(stack.id!=='kubejs:material_nightlord')continue
   stack.shrink(1);ticks=3600;break
  }
 }
 if(ticks>0){ticks--;data.putInt('exp_angelic_ticks',ticks)}
 if(ticks===200)player.tell('Ангельский полёт: осталось 10 секунд оплаченного времени. Подготовьте матрицу сборочной линии или приземлитесь.')
}
global.expeditionAngelicCanApply=expeditionAngelicCanApply
global.expeditionAngelicTick=expeditionAngelicTick
PlayerEvents.tick(event=>expeditionAngelicTick(event.player))
