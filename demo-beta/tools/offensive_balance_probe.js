// Opt-in isolated native hit probe; never install as a normal pack server script.
var offenseSpawned=null
EntityEvents.spawned(event=>{if(offenseSpawned && !event.level.clientSide)offenseSpawned.push(event.entity)})
ServerEvents.loaded(event=>event.server.scheduleInTicks(40,task=>{
  var server=event.server, world=server.overworld(), checks=0, cases=[]
  var require=(ok,label)=>{if(!ok)throw new Error('OFFENSE_FAIL '+label);checks++;console.info('OFFENSE_PASS '+label)}
  var near=(a,b)=>Math.abs(a-b)<0.001
  var Config=Java.loadClass('io.redspace.ironsspellbooks.api.config.SpellConfigManager')
  Config.onDatapackSync(new (Java.loadClass('net.minecraftforge.event.OnDatapackSyncEvent'))(server.getPlayerList(),null))
  var registry=Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry').REGISTRY.get()
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'), Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes'), IronAttr=Java.loadClass('io.redspace.ironsspellbooks.api.registry.AttributeRegistry')
  var Magic=Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData'), Source=Java.loadClass('io.redspace.ironsspellbooks.api.spells.CastSource'), Vec=Java.loadClass('net.minecraft.world.phys.Vec3')
  var Helpers=Java.loadClass('net.sweenus.simplyswords.util.HelperMethods'), Components=Java.loadClass('net.sweenus.simplyswords.compat.SpellScalingComponents'), SwordConfig=Java.loadClass('net.sweenus.simplyswords.config.Config')
  var Imbued=Java.loadClass('net.sweenus.simplyswords.power.powers.ImbuedPower')
  var baseline=JsonIO.read('kubejs/export/offense-baseline.json'), finalRun=!!baseline
  var caster=Type.COW.create(world), target=Type.COW.create(world), spawn=world.getSharedSpawnPos(), y=Math.min(300,spawn.y+40)
  var oldChance=SwordConfig.gemPowers.imbued.chance
  function setAttr(entity,attribute,value){var instance=entity.getAttribute(attribute);require(!!instance,'attribute exists '+attribute);instance.setBaseValue(value)}
  function reset(armor,resist){target.setHealth(1000);target.invulnerableTime=0;target.setRemainingFireTicks(0);target.setPos(spawn.x+3.5,y,spawn.z+0.5);setAttr(target,Attr.ARMOR,armor);setAttr(target,Attr.ARMOR_TOUGHNESS,armor?8:0);setAttr(target,IronAttr.SPELL_RESIST.get(),resist)}
  try {
    ;[caster,target].forEach(entity=>{setAttr(entity,Attr.MAX_HEALTH,1000);entity.setHealth(1000);entity.setNoAi(true);entity.setNoGravity(true)})
    caster.setPos(spawn.x+0.5,y,spawn.z+0.5)
    world.addFreshEntity(caster);world.addFreshEntity(target)
    ;['magic_missile','firebolt','chain_lightning'].forEach(name=>{
      var spell=registry.getValue(Utils.id('irons_spellbooks:'+name))
      ;[1,spell.getMaxLevel()].forEach(level=>{
        ;[1,4].forEach(power=>{
          setAttr(caster,IronAttr.SPELL_POWER.get(),power)
          ;[{armor:0,resist:1},{armor:20,resist:1},{armor:0,resist:2}].forEach(defense=>{
            reset(defense.armor,defense.resist);offenseSpawned=[]
            var magic=new Magic()
            if(name==='chain_lightning')magic.setAdditionalCastData(new (Java.loadClass('io.redspace.ironsspellbooks.capabilities.magic.TargetEntityCastData'))(target))
            spell.onCast(world,level,caster,Source.SPELLBOOK,magic)
            var projectile=offenseSpawned.find(entity=>typeof entity.getDamage==='function')
            require(!!projectile,'native projectile spawned '+name+' '+level)
            var configuredDamage=projectile.getDamage()
            if(name==='chain_lightning')projectile.doHurt(target)
            else {projectile.setPos(spawn.x+1.5,y+0.5,spawn.z+0.5);projectile.setDeltaMovement(new Vec(4,0,0));projectile.handleHitDetection()}
            var damage=1000-target.getHealth()
            require(damage>0 && damage<=configuredDamage+0.001,'native hit reaches target '+name+' '+level)
            cases.push({kind:'spell_hit',spell:name,level:level,power:power,armor:defense.armor,toughness:defense.armor?8:0,resist:defense.resist,projectileDamage:configuredDamage,actualHealthLost:damage})
            offenseSpawned.forEach(entity=>entity.discard());offenseSpawned=null
          })
        })
      })
    })
    var reference=JsonIO.read('kubejs/export/spell-stats-reference.json'), Param=Java.loadClass('io.redspace.ironsspellbooks.api.config.SpellConfigParameter')
    require(!!reference && reference.spells.length===111,'0.15 reference contains 111 spells')
    var configuredSpellCount=0
    registry.getValues().forEach(spell=>{
      var id=String(spell.getSpellId()), old=reference.spells.find(row=>String(row.id)===id)
      var unchanged=!!old && spell.getMaxLevel()===Number(old.maxLevel) && String(spell.getSchoolType().getId())===String(old.school) && String(spell.getMinRarity())===String(old.minRarity) && String(spell.isEnabled())===String(old.enabled) && spell.getSpellCooldown()===Number(old.cooldownTicks) && near(Number(Config.getSpellConfigValue(spell,Param.MANA_MULTIPLIER)),old.manaMultiplier) && near(Number(Config.getSpellConfigValue(spell,Param.POWER_MULTIPLIER)),old.powerMultiplier) && String(Config.getSpellConfigValue(spell,Param.ALLOW_CRAFTING))===String(old.allowCrafting)
      for(var level=1;level<=spell.getMaxLevel();level++){
        var before=old.levels[level-1]
        unchanged=unchanged && spell.getManaCost(level)===Number(before.mana) && near(spell.getSpellPower(level,null),before.power) && spell.getCastTime(level)===Number(before.castTicks) && String(spell.getRarity(level))===String(before.rarity) && global.expeditionSpellStage(id,level)===Number(before.stage)
      }
      require(unchanged,'0.15 configured spell retained '+id);configuredSpellCount++
    })
    require(configuredSpellCount===111,'all configured spells retained')
    // Chance is forced ONLY for deterministic conditional-proc measurement and restored in finally.
    SwordConfig.gemPowers.imbued.chance=100
    var stack=Item.of('simplyswords:runic_longsword'), originalNbt=String(stack.nbt)
    ;[false,true].forEach(greater=>{
      ;[1,2,4,8,16].forEach(power=>{
        setAttr(caster,IronAttr.SPELL_POWER.get(),power)
        var floor=greater?10:6, scaling=SwordConfig.gemPowers.imbued.spellScaling
        var raw=Helpers['commonSpellAttributeScaling(float,net.minecraft.world.entity.Entity,net.minecraft.resources.ResourceLocation)'](scaling,caster,Components.power('imbued'))
        var nativeValue=Helpers['gemPowerScaledValue(net.minecraft.resources.ResourceLocation,net.minecraft.world.entity.LivingEntity,net.minecraft.world.item.ItemStack,float,float)'](Components.power('imbued'),caster,stack,floor,scaling)
        require(near(nativeValue,Math.max(floor,raw)),'imbued native value floor/scaling '+greater+' '+power)
        ;[0,20].forEach(armor=>{
          reset(armor,1)
          new Imbued(greater).postHit(stack,target,caster)
          var actual=1000-target.getHealth()
          require(actual>0 && actual<=nativeValue+0.001,'imbued native actual proc '+greater+' '+power+' '+armor)
          cases.push({kind:'imbued_proc',greater:greater,power:power,armor:armor,spellScaling:scaling,rawSpellBranch:raw,nativeValue:nativeValue,actualHealthLost:actual,fixture:'cow caster; native non-player ability/hit multipliers retained; forced proc chance'})
        })
      })
    })
    require(String(stack.nbt)===originalNbt && stack.damageValue===0,'probe leaves weapon NBT/durability intact')
    var weapons=[], Slot=Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
    ;['iron','diamond','netherite','runic'].forEach(material=>{
      ;['longsword','twinblade','rapier','katana','sai','spear','glaive','warglaive','cutlass','claymore','greataxe','greathammer','chakram','scythe','halberd'].forEach(form=>{
        var id='simplyswords:'+material+'_'+form, weapon=Item.of(id)
        require(!weapon.empty,'weapon exists '+id)
        var row={id:id,attackBonus:Helpers.getAttackFromStack(weapon,Slot.MAINHAND),speedModifiers:[]}
        weapon.getAttributeModifiers(Slot.MAINHAND).get(Attr.ATTACK_SPEED).forEach(modifier=>row.speedModifiers.push({amount:modifier.getAmount(),operation:String(modifier.getOperation())}))
        weapons.push(row)
      })
    })
    var mixedSchoolCases=[]
    setAttr(caster,IronAttr.SPELL_POWER.get(),2);setAttr(caster,IronAttr.ENDER_SPELL_POWER.get(),2)
    ;[false,true].forEach(greater=>{
      ;[0,20].forEach(armor=>{
        reset(armor,1);new Imbued(greater).postHit(stack,target,caster)
        var lost=1000-target.getHealth(), matching=cases.find(row=>row.kind==='imbued_proc' && row.greater===greater && row.power===4 && row.armor===armor)
        require(near(lost,matching.actualHealthLost),'global x2 and Ender x2 equals global x4 '+greater+' '+armor)
        mixedSchoolCases.push({greater:greater,armor:armor,globalPower:2,schoolPower:2,actualHealthLost:lost})
      })
    })
    if(finalRun){
      require(weapons.length===baseline.weapons.length,'same 60 weapon matrix')
      weapons.forEach((weapon,i)=>{var old=baseline.weapons[i];require(weapon.id===String(old.id) && near(weapon.attackBonus,old.attackBonus) && weapon.speedModifiers.length===old.speedModifiers.length && weapon.speedModifiers.every((modifier,j)=>near(modifier.amount,old.speedModifiers[j].amount) && modifier.operation===String(old.speedModifiers[j].operation)),'ordinary weapon attack/speed retained '+weapon.id)})
      require(cases.length===baseline.cases.length,'same baseline matrix')
      cases.forEach((row,i)=>{
        var old=baseline.cases[i]
        if(row.kind==='spell_hit')require(near(row.projectileDamage,old.projectileDamage) && near(row.actualHealthLost,old.actualHealthLost),'spell hit unchanged '+i)
        else {require(near(row.spellScaling,1) && near(old.spellScaling,2),'only intended imbued coefficient '+i);require(near(row.rawSpellBranch,old.rawSpellBranch*0.5),'imbued bonus halved '+i);require(row.nativeValue<=old.nativeValue && row.actualHealthLost<=old.actualHealthLost+0.001,'proc damage never increased '+i);if(row.power===1)require(near(row.actualHealthLost,old.actualHealthLost),'unboosted proc retained '+i)}
      })
    }else require(near(SwordConfig.gemPowers.imbued.spellScaling,2),'baseline native imbued coefficient')
    JsonIO.write('kubejs/export/offense-'+(finalRun?'final':'baseline')+'.json',{schema:1,kind:'isolated native hit health loss, not player DPS or boss fight',checks:checks,procChance:oldChance,configuredSpellsRetained:configuredSpellCount,mixedSchoolCases:mixedSchoolCases,weapons:weapons,cases:cases})
    console.info('OFFENSE_AUDIT_COMPLETE '+(finalRun?'final':'baseline')+' cases='+cases.length+' checks='+checks)
  }finally {SwordConfig.gemPowers.imbued.chance=oldChance;if(offenseSpawned)offenseSpawned.forEach(entity=>entity.discard());offenseSpawned=null;caster.discard();target.discard()}
}))
