// Locked gear is moved, never deleted or dropped. Inventory transport is allowed.
const expeditionEquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
const expeditionEquipmentTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const expeditionEquipmentList = Java.loadClass('net.minecraft.nbt.ListTag')
const expeditionEquipmentStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const expeditionCuriosApi = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')
function expeditionGearStage(stack, slot) {
  const id=String(stack.id)
  if (slot === 'curio') return id === 'botania:flight_tiara' ? 6 : 0
  if (slot === 'mainhand' || slot === 'offhand') {
    if (id.startsWith('simplyswords:netherite_')) return 3
    if (stack.hasTag('simplyswords:uniques')) return 7
    if (id === 'irons_spellbooks:diamond_spell_book') return 3
    if (id === 'irons_spellbooks:netherite_spell_book') return 6
    return 0
  }
  if (/^botania:terrasteel_(helmet|chestplate|leggings|boots)$/.test(id)) return 3
  if (/^irons_spellbooks:netherite_mage_(helmet|chestplate|leggings|boots)$/.test(id)) return 6
  if (/^gtceu:(advanced_)?nanomuscle_/.test(id)) return 6
  if (/^gtceu:(advanced_)?quarktech_/.test(id)) return 8
  return 0
}
function expeditionPlayerStage(player) {
  const board=player.server.getScoreboard()
  const objective=board.getObjective('exp_stage')
  return objective ? board.getOrCreatePlayerScore('$expedition',objective).getScore() : 0
}
function expeditionEquipmentReserve(player) {
  // KubeJS persistentData is a separate NBT root; use Forge's death-preserved root.
  const forgeData=player.getForgePersistentData()
  const persisted=forgeData.getCompound('PlayerPersisted')
  forgeData.put('PlayerPersisted',persisted)
  if (!persisted.contains('expedition_gear_reserve',9)) persisted.put('expedition_gear_reserve',new expeditionEquipmentList())
  return persisted.getList('expedition_gear_reserve',10)
}
function expeditionReserveGear(player, stack) {
  expeditionEquipmentReserve(player).add(stack.save(new expeditionEquipmentTag()))
}
function expeditionReturnGear(player, stage) {
  const queue=expeditionEquipmentReserve(player)
  for (let index=0; index<queue.size();) {
    const stack=expeditionEquipmentStack.of(queue.getCompound(index))
    let inserted=false
    for (let slot=0;slot<36;slot++) {
      if (slot===player.inventory.selected && expeditionGearStage(stack,'mainhand')>stage) continue
      if (!player.inventory.getItem(slot).isEmpty()) continue
      player.inventory.setItem(slot,stack)
      queue.remove(index);inserted=true;break
    }
    if (!inserted) index++
  }
}
function expeditionCheckEquipment(player) {
  const stage=expeditionPlayerStage(player)
  let moved=0
  ;[['HEAD','head'],['CHEST','chest'],['LEGS','legs'],['FEET','feet'],['MAINHAND','mainhand'],['OFFHAND','offhand']].forEach(row=>{
    const slot=expeditionEquipmentSlot[row[0]]
    const stack=player.getItemBySlot(slot)
    if (stack.isEmpty() || expeditionGearStage(stack,row[1])<=stage) return
    expeditionReserveGear(player,stack)
    player.getAttributes().removeAttributeModifiers(stack.getAttributeModifiers(slot))
    player.setItemSlot(slot,expeditionEquipmentStack.EMPTY)
    moved++
  })
  const curios=expeditionCuriosApi.getCuriosInventory(player).resolve()
  if (curios.isPresent()) curios.get().getCurios().values().forEach(handler=>{
    const stacks=handler.getStacks()
    for (let i=0;i<stacks.getSlots();i++) {
      const stack=stacks.getStackInSlot(i)
      if (stack.isEmpty() || expeditionGearStage(stack,'curio')<=stage) continue
      expeditionReserveGear(player,stack)
      stacks.setStackInSlot(i,expeditionEquipmentStack.EMPTY)
      moved++
    }
  })
  expeditionReturnGear(player,stage)
  if (moved) player.tell('Закрытая экипировка возвращена в инвентарь. Если места нет, она сохранена в личном резерве и вернётся, когда вы освободите место.')
}
global.expeditionGearStage=expeditionGearStage
global.expeditionCheckEquipment=expeditionCheckEquipment
global.expeditionEquipmentReserve=expeditionEquipmentReserve
PlayerEvents.tick(event=>{
  if (!event.player.level.clientSide) expeditionCheckEquipment(event.player)
})
EntityEvents.hurt(event=>{
  const player=event.source.player
  if (!player || event.level.clientSide) return
  const stage=expeditionGearStage(player.mainHandItem,'mainhand')
  if (stage>expeditionPlayerStage(player)) event.cancel()
})
ItemEvents.rightClicked(event=>{
  if (event.level.clientSide) return
  if (expeditionGearStage(event.item,'mainhand')>expeditionPlayerStage(event.player)) event.cancel()
})
