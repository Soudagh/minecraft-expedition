// Six native attack modifiers; preserve speed, abilities and recipes.
ItemEvents.modification(event=>{
 var policy=JsonIO.read('kubejs/config/divine_balance.json')
 Object.keys(policy.attack_modifiers).forEach(id=>event.modify(id,item=>{
  item.attackDamage=policy.attack_modifiers[id]
 }))
})
// Override the final Forge stack attributes, preserving all other attributes.
// Armor material/getDefense stays native; an item setter alone is insufficient.
var expeditionDivineArmorPolicy=JsonIO.read('kubejs/config/divine_balance.json').armor_modifiers
var expeditionDivineArmorAttr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
var expeditionDivineArmorModifier=Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
var expeditionDivineArmorUUID=Java.loadClass('java.util.UUID')
var expeditionDivineArmorSlots={helmet:'HEAD',chestplate:'CHEST',leggings:'LEGS',boots:'FEET'}
var expeditionDivineArmorUUIDs={HEAD:'00003700-0000-4000-8000-000000000001',CHEST:'00003700-0000-4000-8000-000000000002',LEGS:'00003700-0000-4000-8000-000000000003',FEET:'00003700-0000-4000-8000-000000000004'}
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent',event=>{
 var id=String(event.itemStack.id),spec=expeditionDivineArmorPolicy[id]
 if(!spec)return
 var part=id.substring(id.lastIndexOf('_')+1),slot=String(event.slotType)
 if(slot!==expeditionDivineArmorSlots[part])return
 var uuid=expeditionDivineArmorUUID.fromString(expeditionDivineArmorUUIDs[slot])
 event.removeAttribute(expeditionDivineArmorAttr.ARMOR)
 event.removeAttribute(expeditionDivineArmorAttr.ARMOR_TOUGHNESS)
 event.addModifier(expeditionDivineArmorAttr.ARMOR,new expeditionDivineArmorModifier(uuid,'Expedition Divine protection',spec.armor,expeditionDivineArmorModifier.Operation.ADDITION))
 event.addModifier(expeditionDivineArmorAttr.ARMOR_TOUGHNESS,new expeditionDivineArmorModifier(uuid,'Expedition Divine toughness',spec.toughness,expeditionDivineArmorModifier.Operation.ADDITION))
})
