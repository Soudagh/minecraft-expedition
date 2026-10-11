// Disposable QA: native item attributes and declared stages, not animated DPS.
ServerEvents.loaded(event=>event.server.scheduleInTicks(240,()=>{
 var policy=JsonIO.read('kubejs/config/divine_balance.json'), checks=0
 function assert(ok,label){if(!ok)throw new Error('DIVINE_BALANCE_FAIL '+label);checks++}
 var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'),Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'),rows=[]
 Registry.ITEMS.getEntries().forEach(entry=>{
  var id=String(entry.getKey().location());if(!id.startsWith('divinerpg:'))return
  var stack=Item.of(id),mods=[],stage=0
  ;[['MAINHAND','mainhand'],['HEAD','head'],['CHEST','chest'],['LEGS','legs'],['FEET','feet']].forEach(pair=>{
   var slotMods=[];stack.getAttributeModifiers(Slot[pair[0]]).entries().forEach(m=>slotMods.push({attribute:String(m.getKey().descriptionId),amount:m.getValue().amount,operation:String(m.getValue().operation)}))
   if(slotMods.length)mods.push({slot:pair[1],modifiers:slotMods})
   stage=Math.max(stage,global.expeditionGearStage(stack,pair[1]))
  })
  if(mods.length)rows.push({id:id,stage:stage,className:String(stack.item.getClass().getName()),attributes:mods})
 })
 Object.keys(policy.gear).forEach(id=>{
  var stack=Item.of(id),rule=policy.gear[id];assert(!stack.isEmpty(),'registered '+id)
  if(rule.kind==='weapon'){
   assert(global.expeditionGearStage(stack,'mainhand')===rule.stage,'mainhand '+id)
   assert(global.expeditionGearStage(stack,'offhand')===rule.stage,'offhand '+id)
  } else {
   var slot=id.endsWith('_chestplate')?'chest':id.endsWith('_leggings')?'legs':id.endsWith('_boots')?'feet':'head'
   assert(global.expeditionGearStage(stack,slot)===rule.stage,'worn '+id)
   assert(global.expeditionGearStage(stack,'mainhand')===0,'armor transport '+id)
  }
 })
 Object.keys(policy.attack_modifiers).forEach(id=>{
  var found=rows.filter(r=>r.id===id)[0],mods=found.attributes.filter(s=>s.slot==='mainhand')[0].modifiers
  var attack=mods.filter(m=>m.attribute==='attribute.name.generic.attack_damage')[0].amount
  assert(attack===policy.attack_modifiers[id],'native attack modifier '+id)
 })
 Object.keys(policy.armor_modifiers).forEach(id=>{
  var found=rows.filter(r=>r.id===id)[0],spec=policy.armor_modifiers[id],modifiers=found.attributes[0].modifiers
  var armor=modifiers.filter(m=>m.attribute==='attribute.name.generic.armor')[0].amount,tough=modifiers.filter(m=>m.attribute==='attribute.name.generic.armor_toughness')[0].amount
  assert(modifiers.filter(m=>m.attribute==='attribute.name.generic.armor').length===1 && modifiers.filter(m=>m.attribute==='attribute.name.generic.armor_toughness').length===1 && armor===spec.armor && tough===spec.toughness,'native armor modifier '+id)
 })
 var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),Profile=Java.loadClass('com.mojang.authlib.GameProfile'),UUID=Java.loadClass('java.util.UUID')
 var player=Factory.get(event.server.overworld(),new Profile(UUID.randomUUID(),'DivineBalanceQA'))
 var score=event.server.getScoreboard().getOrCreatePlayerScore('$expedition',event.server.getScoreboard().getObjective('exp_stage')),oldStage=score.getScore()
 var Abilities=Java.loadClass('divinerpg.events.ArmorAbilitiesEvent')
 try {
  score.setScore(7);player.inventory.setItem(8,Item.of('kubejs:material_nightlord'))
  ;[['helmet','HEAD'],['chestplate','CHEST'],['leggings','LEGS'],['boots','FEET']].forEach(r=>player.setItemSlot(Slot[r[1]],Item.of('divinerpg:angelic_'+r[0])))
  Abilities.updateAbilities(player);assert(player.abilities.mayfly,'native angelic flight at VII')
  var oldArmor=['HEAD','CHEST','LEGS','FEET'].map(slot=>player.getItemBySlot(Slot[slot]).copy())
  score.setScore(6);global.expeditionCheckEquipment(player)
  // FakePlayers are not engine-ticked: post the equipment-change events that a
  // normal LivingEntity tick emits, including Divine's native effect removal.
  var Change=Java.loadClass('net.minecraftforge.event.entity.living.LivingEquipmentChangeEvent'),Bus=Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS
  ;['HEAD','CHEST','LEGS','FEET'].forEach((slot,i)=>Bus.post(new Change(player,Slot[slot],oldArmor[i],player.getItemBySlot(Slot[slot]))))
  assert(!player.abilities.mayfly,'native angelic flight removed below VII')
  ;['HEAD','CHEST','LEGS','FEET'].forEach(slot=>assert(player.getItemBySlot(Slot[slot]).isEmpty(),'locked angelic slot cleared '+slot))
 } finally {score.setScore(oldStage);player.removeAllEffects();player.inventory.clearContent()}
 JsonIO.write('kubejs/export/divine-balance-checks.json',{checks:checks,policyItems:Object.keys(policy.gear).length,attackModifiers:policy.attack_modifiers,scope:'Native registry, slot gates, item attack modifiers and angelic effect revocation; not animated DPS.'})
 console.info('DIVINE_BALANCE_SUCCESS '+checks)
 JsonIO.write('kubejs/export/divine-balance-items.json' ,{scope:'Native attributes and gate catalogue; not animated DPS or full-set abilities.',items:rows});console.info('DIVINE_BALANCE_CATALOGUE '+rows.length)
}))
