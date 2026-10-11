// Opt-in QA. Real Player.attack calls on FakePlayer, without Epic Fight animation cadence.
var equipmentCombatProbeQueued=false
ServerEvents.tick(event=>{
 if(equipmentCombatProbeQueued)return
 equipmentCombatProbeQueued=true
 event.server.scheduleInTicks(140,()=>{
  var server=event.server, world=server.overworld(), checks=0
  function assert(ok,label){if(!ok)throw new Error('EQUIPMENT_COMBAT_FAIL '+label);checks++}
  function near(a,b){return Math.abs(a-b)<0.002}
  var Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot'), Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'), Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory')
  var Profile=Java.loadClass('com.mojang.authlib.GameProfile'), UUID=Java.loadClass('java.util.UUID')
  var Implicits=Java.loadClass('net.sweenus.simplyswords.api.WeaponImplicitRegistry')
  var Helpers=Java.loadClass('net.sweenus.simplyswords.util.HelperMethods')
  var player=Factory.get(world,new Profile(UUID.randomUUID(),'EquipmentQA')), target=Type.COW.create(world)
  var spawn=world.getSharedSpawnPos(), y=Math.min(300,spawn.y+40), applied=null, armorApplied=[]
  var board=server.getScoreboard(), objective=board.getObjective('exp_stage'), score=board.getOrCreatePlayerScore('$expedition',objective), oldStage=score.getScore()
  var oldHealth=player.health, weapons=[], armors=[], hits=[], gateHits=[]
  var forms=['longsword','twinblade','rapier','katana','sai','spear','glaive','warglaive','cutlass','claymore','greataxe','greathammer','chakram','scythe','halberd']
  function equip(stack){
    if(applied)player.attributes.removeAttributeModifiers(applied)
    player.setItemSlot(Slot.MAINHAND,stack)
    applied=stack.getAttributeModifiers(Slot.MAINHAND);player.attributes.addTransientAttributeModifiers(applied)
    // Direct fixture manipulation removes the vanilla cooldown; assert the native getter.
    var cls=player.getClass(), field=null
    while(cls && !field){try{field=cls.getDeclaredField('f_20922_')}catch(e){cls=cls.getSuperclass()}}
    assert(!!field,'native attack ticker field found');field.setAccessible(true);field.setInt(player,100)
    assert(near(player.getAttackStrengthScale(0.5),1),'native full attack cooldown')
  }
  function reset(){target.removeAllEffects();player.removeAllEffects();target.setHealth(1000);target.invulnerableTime=0;target.setRemainingFireTicks(0);target.setPos(spawn.x+2.5,y,spawn.z+0.5)}
  function armor(prefix){
    armorApplied.forEach(mod=>target.attributes.removeAttributeModifiers(mod));armorApplied=[]
    ;[['helmet','HEAD'],['chestplate','CHEST'],['leggings','LEGS'],['boots','FEET']].forEach(row=>{
      var stack=prefix?Item.of(prefix+'_'+row[0]):Item.empty, slot=Slot[row[1]]
      assert(!prefix || !stack.isEmpty(),'registered armour '+prefix+'_'+row[0])
      target.setItemSlot(slot,stack)
      var modifiers=stack.getAttributeModifiers(slot);target.attributes.addTransientAttributeModifiers(modifiers);armorApplied.push(modifiers)
    })
  }
  try {
    score.setScore(3);player.getAttribute(Attr.ATTACK_DAMAGE).setBaseValue(1);player.getAttribute(Attr.ATTACK_SPEED).setBaseValue(4)
    player.setSprinting(false);player.fallDistance=0;player.setOnGround(true);player.setPos(spawn.x+0.5,y,spawn.z+0.5)
    target.getAttribute(Attr.MAX_HEALTH).setBaseValue(1000);target.setHealth(1000);target.setNoAi(true);target.setNoGravity(true);world.addFreshEntity(target)
    ;['iron','gold','diamond','netherite','runic'].forEach(material=>forms.forEach(form=>{
      var stack=Item.of('simplyswords:'+material+'_'+form);assert(!stack.isEmpty(),'registered '+stack.id);equip(stack)
      var attack=player.getAttributeValue(Attr.ATTACK_DAMAGE), speed=player.getAttributeValue(Attr.ATTACK_SPEED)
      assert(attack>0 && speed>0,'positive native attack/speed '+stack.id)
      assert(near(attack,1+Helpers.getAttackFromStack(stack,Slot.MAINHAND)),'native item attack applied '+stack.id)
      weapons.push({id:String(stack.id),attack:attack,attackSpeed:speed,stage:global.expeditionGearStage(stack,'mainhand'),statProduct:attack*speed})
    }))
    ;[null,'minecraft:iron','minecraft:diamond','minecraft:netherite','botania:terrasteel','irons_spellbooks:wizard','irons_spellbooks:wandering_magician'].forEach(prefix=>{
      target.removeAllEffects();armor(prefix)
      var a=target.getAttributeValue(Attr.ARMOR), toughness=target.getAttributeValue(Attr.ARMOR_TOUGHNESS)
      var pieces=[]
      ;[['HEAD','head'],['CHEST','chest'],['LEGS','legs'],['FEET','feet']].forEach(row=>{
        var stack=target.getItemBySlot(Slot[row[0]]), modifiers=[]
        stack.getAttributeModifiers(Slot[row[0]]).entries().forEach(entry=>modifiers.push({attribute:String(entry.getKey().getDescriptionId()),amount:entry.getValue().amount,operation:String(entry.getValue().operation)}))
        pieces.push({id:String(stack.id),modifiers:modifiers})
      })
      armors.push({id:prefix||'none',armor:a,toughness:toughness,pieces:pieces})
      ;['minecraft:iron_sword','minecraft:diamond_sword','minecraft:netherite_sword','simplyswords:iron_longsword','simplyswords:diamond_longsword','simplyswords:netherite_longsword','simplyswords:diamond_greathammer','simplyswords:diamond_rapier'].forEach(id=>{
        var stack=Item.of(id);equip(stack);reset();Implicits.runSuppressed(()=>player.attack(target))
        var damage=1000-target.health
        assert(damage>0 && damage<=player.getAttributeValue(Attr.ATTACK_DAMAGE)+0.01,'native ordinary player hit '+id+' '+prefix)
        hits.push({weapon:id,armor:prefix||'none',attack:player.getAttributeValue(Attr.ATTACK_DAMAGE),healthLost:damage})
      })
    })
    armor(null)
    ;['netherite','runic'].forEach(material=>{
      var stack=Item.of('simplyswords:'+material+'_longsword')
      ;[2,3].forEach(stage=>{
        score.setScore(stage);equip(stack);reset();player.attack(target)
        gateHits.push({weapon:String(stack.id),stage:stage,healthLost:1000-target.health})
        assert(stage===3?target.health<1000:(material==='runic' && global.expeditionGearStage(stack,'mainhand')===0?target.health<1000:near(target.health,1000)),'stage gate actual hit '+material+' '+stage)
      })
    })
    ;['minecraft:netherite_sword','minecraft:netherite_axe'].forEach(id=>{
      ;[2,3].forEach(stage=>{
        score.setScore(stage);equip(Item.of(id));reset();Implicits.runSuppressed(()=>player.attack(target))
        assert(stage===3?target.health<1000:near(target.health,1000),'vanilla Netherite gate '+id+' '+stage)
        gateHits.push({weapon:id,stage:stage,healthLost:1000-target.health})
      })
    })
    var procHits=[], ImplicitComponent=Java.loadClass('net.sweenus.simplyswords.item.component.WeaponImplicitComponent'), Components=Java.loadClass('net.sweenus.simplyswords.registry.ComponentTypeRegistry')
    ;[null,'minecraft:iron','minecraft:diamond','minecraft:netherite'].forEach(prefix=>{
      armor(prefix)
      ;[0,100].forEach(chance=>{
        var stack=Item.of('simplyswords:diamond_rapier')
        Components.WEAPON_IMPLICIT.set(stack,new ImplicitComponent(Utils.id('simplyswords:armor_pierce'),Utils.id('simplyswords:rapier'),chance))
        equip(stack);reset();player.attack(target)
        var loss=1000-target.health
        assert(loss>0 && loss<=6,'forced native rapier proc '+prefix+' '+chance)
        procHits.push({armor:prefix||'none',fixtureChance:chance,healthLost:loss})
      })
    })
    score.setScore(3)
    var baseline=JsonIO.read('kubejs/export/equipment-combat-baseline.json'), finalRun=!!baseline
    if(finalRun){
      assert(baseline.weapons.length===weapons.length && baseline.hits.length===hits.length,'same matrix')
      weapons.forEach((row,i)=>assert(row.id===String(baseline.weapons[i].id) && near(row.attack,Number(baseline.weapons[i].attack)) && near(row.attackSpeed,Number(baseline.weapons[i].attackSpeed)),'weapon attributes retained '+row.id))
      hits.forEach((row,i)=>{if(!near(row.healthLost,Number(baseline.hits[i].healthLost)))console.info('EQUIPMENT_DIFFERENCE '+i+' '+JSON.stringify(row)+' BEFORE '+JSON.stringify(baseline.hits[i]));assert(row.weapon===String(baseline.hits[i].weapon) && row.armor===String(baseline.hits[i].armor) && near(row.healthLost,Number(baseline.hits[i].healthLost)),'ordinary hit retained '+i)})
      assert(procHits.length===baseline.procHits.length,'same forced proc matrix')
      procHits.forEach((row,i)=>assert(row.armor===String(baseline.procHits[i].armor) && row.fixtureChance===Number(baseline.procHits[i].fixtureChance) && near(row.healthLost,Number(baseline.procHits[i].healthLost)),'rapier proc retained '+i))
      forms.forEach(form=>{var id='simplyswords:runic_'+form;assert(global.expeditionGearStage(Item.of(id),'mainhand')===3 && global.expeditionGearStage(Item.of(id),'offhand')===3,'both hands gated '+id)})
      ;['helmet','chestplate','leggings','boots'].forEach((name,i)=>{
        var stack=Item.of('minecraft:netherite_'+name), slot=['head','chest','legs','feet'][i]
        assert(global.expeditionGearStage(stack,slot)===3 && global.expeditionGearStage(stack,'mainhand')===0,'Netherite armour gate and transport '+name)
      })
      ;['pickaxe','shovel','hoe'].forEach(name=>assert(global.expeditionGearStage(Item.of('minecraft:netherite_'+name),'mainhand')===0,'mining tool unchanged '+name))
      assert(global.expeditionGearStage(Item.of('simplyswords:runic_tablet'),'mainhand')===0,'tablet remains unrestricted')
      assert(near(gateHits.find(r=>r.weapon==='simplyswords:runic_longsword' && r.stage===2).healthLost,0),'runic bypass closed')
    }
    var result={scope:'Native item attributes and direct Player.attack on QA FakePlayer at full cooldown; no Epic Fight animations, measured DPS, enchants or armour set passives; ordinary matrix suppresses native weapon implicits; separate rapier tests force chance 0/100 on QA-only stacks; rune procs possible in gate tests',checks:checks,weapons:weapons,armors:armors,hits:hits,procHits:procHits,gateHits:gateHits}
    JsonIO.write('kubejs/export/equipment-combat-'+(finalRun?'final':'baseline')+'.json',result)
    console.info('EQUIPMENT_COMBAT_SUCCESS '+(finalRun?'final':'baseline')+' checks='+checks+' hits='+hits.length+' gates='+JSON.stringify(gateHits))
  } finally {
    score.setScore(oldStage);if(applied)player.attributes.removeAttributeModifiers(applied);player.setItemSlot(Slot.MAINHAND,Item.empty);player.setHealth(oldHealth);target.discard()
  }
})
})
