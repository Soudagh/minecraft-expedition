// Opt-in only. Isolated native Sword Soaring hits and loaded Epic Fight skill parameters.
ServerEvents.loaded(event=>event.server.scheduleInTicks(40,task=>{
  var itemIds=[]
  Java.loadClass('net.minecraftforge.registries.ForgeRegistries').ITEMS.getKeys().forEach(id=>itemIds.push(String(id)))
  itemIds.sort();JsonIO.write('kubejs/export/item-registry.json',{items:itemIds})
  var world=event.server.overworld(),checks=0,rows=[],skillRows=[],sword=null
  var require=(ok,label)=>{if(!ok)throw new Error('SWORD_FAIL '+label);checks++;console.info('SWORD_PASS '+label)}
  var near=(a,b)=>Math.abs(a-b)<0.001
  var Manager=Java.loadClass('yesman.epicfight.api.data.reloader.SkillManager')
  var reference=JsonIO.read('kubejs/export/sword-parameters-reference.json'), baseline=JsonIO.read('kubejs/export/sword-baseline.json'), finalRun=!!baseline
  var expectedCount=0
  Object.keys(reference.parameters).forEach(path=>{
    expectedCount++
    var id='sword_soaring:'+path.split('/').pop().replace('.json',''), defaults=reference.parameters[path], tag=null
    Manager.getSkillParams().forEach(entry=>{if(String(entry.getString('id'))===id)tag=entry})
    require(!!tag,'native loaded params '+id)
    var values={}
    Object.keys(defaults).forEach(key=>{
      var expected=finalRun && id==='sword_soaring:kill_aura_2' && key==='cooldown'?600:defaults[key]
      var actual=tag.getDouble(key);require(near(actual,expected),'native parameter '+id+' '+key);values[key]=actual
    })
    var skill=Manager.getSkill(id), cooldown=null
    require(!!skill,'native registered skill '+id)
    if(id==='sword_soaring:kill_aura_1' || id==='sword_soaring:kill_aura_2'){
      cooldown=skill.getMaxCooldown();require(cooldown===values.cooldown+values.life_time,'actual cooldown includes lifetime '+id)
    }
    skillRows.push({id:id,parameters:values,maxCooldown:cooldown})
  })
  require(expectedCount===14,'all 14 Sword Soaring parameter files checked')
  var weaponReference=[], capabilities=[]
  ;['iron','gold','diamond','netherite','runic'].forEach(material=>{
    ;['longsword','twinblade','rapier','katana','sai','spear','glaive','warglaive','cutlass','claymore','greataxe','greathammer','chakram','scythe','halberd'].forEach(form=>{
      var name=material+'_'+form, mapping=JsonIO.read('kubejs/data/simplyswords/capabilities/weapons/'+name+'.json')
      require(!!mapping && !!mapping.type,'adapter source '+name);weaponReference.push({id:'simplyswords:'+name,type:String(mapping.type)})
    })
  })
  var Epic=Java.loadClass('yesman.epicfight.world.capabilities.EpicFightCapabilities')
  require(weaponReference.length===75,'all 75 declared weapon adapters')
  weaponReference.forEach(row=>{
    var stack=Item.of(row.id), capability=stack.getCapability(Epic.CAPABILITY_ITEM).orElse(null), category=String(capability.getWeaponCategory()).toLowerCase()
    require(!capability.isEmpty() && category===String(row.type).replace('epicfight:',''),'native weapon category '+row.id)
    capabilities.push({id:String(row.id),type:String(row.type),nativeCategory:category})
  })
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'), Attr=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes'), Iron=Java.loadClass('io.redspace.ironsspellbooks.api.registry.AttributeRegistry'), Fly=Java.loadClass('net.p1nero.ss.entity.sword.fly_sword.FlySwordEntity')
  var owner=Type.ZOMBIE.create(world), target=Type.COW.create(world), spawn=world.getSharedSpawnPos(), y=Math.min(300,spawn.y+40)
  function set(entity,attribute,value){entity.getAttribute(attribute).setBaseValue(value)}
  function reset(armor){target.setHealth(1000);target.invulnerableTime=0;target.setPos(spawn.x+0.5,y,spawn.z+0.5);set(target,Attr.ARMOR,armor);set(target,Attr.ARMOR_TOUGHNESS,armor?8:0)}
  try{
    ;[owner,target].forEach(entity=>{set(entity,Attr.MAX_HEALTH,1000);entity.setHealth(1000);entity.setNoAi(true);entity.setNoGravity(true)})
    owner.setPos(spawn.x+8.5,y,spawn.z+0.5);world.addFreshEntity(owner);world.addFreshEntity(target)
    sword=new Fly(Java.loadClass('net.p1nero.ss.entity.SwordSoaringEntities').FLY_SWORD.get(),world)
    sword.tame(owner);sword.setItemStack(Item.of('simplyswords:iron_longsword'));sword.setPos(spawn.x+0.8,y,spawn.z+0.5)
    ;[4,8,16].forEach(attack=>{
      set(owner,Attr.ATTACK_DAMAGE,attack)
      ;[1,4].forEach(power=>{
        set(owner,Iron.SPELL_POWER.get(),power)
        ;[0,20].forEach(armor=>{
          reset(armor);sword.flySwordDamage(0,2)
          var actual=1000-target.getHealth(), before=target.getHealth()
          require(actual>0 && actual<=attack*3+0.001,'actual fly sword hit '+attack+' '+power+' '+armor)
          if(!armor)require(near(actual,attack*3),'native triple attack '+attack+' '+power)
          sword.flySwordDamage(0,2);require(near(target.getHealth(),before),'immediate repeated hit blocked')
          require(target.invulnerableTime===10,'native ten tick invulnerability window')
          for(var tick=0;tick<10;tick++)world.tickNonPassenger(target)
          target.setPos(spawn.x+0.5,y,spawn.z+0.5)
          before=target.getHealth();sword.flySwordDamage(0,2)
          var repeat=before-target.getHealth();require(near(repeat,actual),'hit restored after ten native target ticks')
          rows.push({attack:attack,spellPower:power,armor:armor,toughness:armor?8:0,healthLost:actual,repeatAfterTenTicks:repeat,fixture:'Zombie owner; Cow target; direct native area hit, no client/animation cadence'})
        })
      })
    })
    rows.forEach(row=>{
      var pair=rows.find(other=>other.attack===row.attack && other.armor===row.armor && other.spellPower!==row.spellPower)
      require(near(row.healthLost,pair.healthLost),'magic power does not amplify attack-derived fly sword')
    })
    if(finalRun){require(rows.length===baseline.hits.length,'same native hit matrix');rows.forEach((row,i)=>require(near(row.healthLost,baseline.hits[i].healthLost) && near(row.repeatAfterTenTicks,baseline.hits[i].repeatAfterTenTicks),'per hit damage and target window retained '+i))}
    JsonIO.write('kubejs/export/sword-'+(finalRun?'final':'baseline')+'.json',{schema:1,kind:'loaded skill parameters and isolated native hits; no measured player DPS',checks:checks,capabilities:capabilities,skills:skillRows,hits:rows})
    console.info('SWORD_AUDIT_COMPLETE '+(finalRun?'final':'baseline')+' checks='+checks+' hits='+rows.length)
  }finally{if(sword)sword.discard();owner.discard();target.discard()}
}))
