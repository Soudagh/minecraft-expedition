// Forge-visible protection and melee modifiers; retain native abilities/speed.
var expeditionCatEquipmentPolicy=JsonIO.read('kubejs/config/boss_balance.json')
var expeditionCatAttr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
var expeditionCatModifier=Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
var expeditionCatUUID=Java.loadClass('java.util.UUID')
var expeditionCatSlots={helmet:'HEAD',chestplate:'CHEST',leggings:'LEGS',boots:'FEET'}
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent',event=>{
 var id=String(event.itemStack.id)
 if(!id.startsWith('cataclysm:'))return
 var spec=expeditionCatEquipmentPolicy.cataclysm_armor[id],slot=String(event.slotType)
 if(spec){
  var part=id.substring(id.lastIndexOf('_')+1)
  if(slot!==expeditionCatSlots[part])return
  var index={HEAD:1,CHEST:2,LEGS:3,FEET:4}[slot]
  var uuid=expeditionCatUUID.fromString('00003800-0000-4000-8000-00000000000'+index)
  event.removeAttribute(expeditionCatAttr.ARMOR);event.removeAttribute(expeditionCatAttr.ARMOR_TOUGHNESS)
  event.addModifier(expeditionCatAttr.ARMOR,new expeditionCatModifier(uuid,'Expedition Cataclysm armor',spec.armor,expeditionCatModifier.Operation.ADDITION))
  event.addModifier(expeditionCatAttr.ARMOR_TOUGHNESS,new expeditionCatModifier(uuid,'Expedition Cataclysm toughness',spec.toughness,expeditionCatModifier.Operation.ADDITION))
 }
 if(slot==='MAINHAND'){
  var mods=event.originalModifiers.get(expeditionCatAttr.ATTACK_DAMAGE),sum=0,additive=true
  mods.forEach(mod=>{sum+=mod.amount;if(String(mod.operation)!=='ADDITION')additive=false})
  if(additive && sum>expeditionCatEquipmentPolicy.cataclysm_attack_cap){
   event.removeAttribute(expeditionCatAttr.ATTACK_DAMAGE)
   event.addModifier(expeditionCatAttr.ATTACK_DAMAGE,new expeditionCatModifier(expeditionCatUUID.fromString('00003800-0000-4000-8000-000000000005'),'Expedition Cataclysm melee',expeditionCatEquipmentPolicy.cataclysm_attack_cap,expeditionCatModifier.Operation.ADDITION))
  }
 }
})
