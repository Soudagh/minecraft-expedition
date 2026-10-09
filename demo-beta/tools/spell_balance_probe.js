// Opt-in diagnostic: copy only to an isolated disposable server. See COMBAT-SUSTAIN.md.
var sustainSpawned=null
EntityEvents.spawned(event=>{if(sustainSpawned && !event.level.clientSide)sustainSpawned.push(event.entity)})
ServerEvents.loaded(event=>event.server.scheduleInTicks(40,task=>{
  var server=event.server, world=server.overworld()
  var require=(ok,label)=>{if(!ok)throw new Error('SUSTAIN_FAIL '+label);console.info('SUSTAIN_PASS '+label)}
  var near=(a,b)=>Math.abs(a-b)<0.0001
  var Config=Java.loadClass('io.redspace.ironsspellbooks.api.config.SpellConfigManager')
  var Param=Java.loadClass('io.redspace.ironsspellbooks.api.config.SpellConfigParameter')
  Config.onDatapackSync(new (Java.loadClass('net.minecraftforge.event.OnDatapackSyncEvent'))(server.getPlayerList(),null))
  var registry=Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry').REGISTRY.get()
  var changed={healing_circle:{cooldown:40,mana:1.5,power:0.65},greater_heal:{cooldown:60,mana:1.5,power:1},shield:{cooldown:16,mana:1.25,power:0.8},root:{cooldown:45,mana:1.25,power:0.5},slow:{cooldown:80,mana:1.25,power:0.5}}
  var baseline=JsonIO.read('kubejs/export/sustain-baseline.json'), finalRun=!!baseline, rows=[]
  registry.getValues().forEach(spell=>{
    var id=String(spell.getSpellId()), levels=[]
    var row={id:id,school:String(spell.getSchoolType().getId()),maxLevel:spell.getMaxLevel(),minRarity:String(spell.getMinRarity()),enabled:spell.isEnabled(),allowCrafting:String(Config.getSpellConfigValue(spell,Param.ALLOW_CRAFTING))==='true',cooldownTicks:spell.getSpellCooldown(),manaMultiplier:Number(Config.getSpellConfigValue(spell,Param.MANA_MULTIPLIER)),powerMultiplier:Number(Config.getSpellConfigValue(spell,Param.POWER_MULTIPLIER)),levels:levels}
    for(var level=1;level<=row.maxLevel;level++)levels.push({level:level,mana:spell.getManaCost(level),power:spell.getSpellPower(level,null),castTicks:spell.getCastTime(level),rarity:String(spell.getRarity(level)),stage:global.expeditionSpellStage(id,level)})
    if(finalRun){
      var old=baseline.spells.find(other=>other.id===id)
      require(!!old,'baseline exists '+id)
      var policy=changed[id.replace('irons_spellbooks:','')]
      if(!policy){
        var unchanged=row.school===String(old.school) && row.maxLevel===Number(old.maxLevel) && row.minRarity===String(old.minRarity) && String(row.enabled)===String(old.enabled) && String(row.allowCrafting)===String(old.allowCrafting) && row.cooldownTicks===Number(old.cooldownTicks) && near(row.manaMultiplier,Number(old.manaMultiplier)) && near(row.powerMultiplier,Number(old.powerMultiplier)) && levels.length===old.levels.length
        levels.forEach((entry,i)=>{var before=old.levels[i];unchanged=unchanged && entry.level===Number(before.level) && entry.mana===Number(before.mana) && near(entry.power,Number(before.power)) && entry.castTicks===Number(before.castTicks) && entry.rarity===String(before.rarity) && entry.stage===Number(before.stage)})
        if(!unchanged)console.info('SUSTAIN_DIFFERENCE '+JSON.stringify(row)+' OLD '+JSON.stringify(old))
        require(unchanged,'untargeted spell unchanged '+id)
      }
      else {
        require(row.maxLevel===Number(old.maxLevel) && row.minRarity===String(old.minRarity) && row.school===String(old.school) && String(row.enabled)===String(old.enabled) && String(row.allowCrafting)===String(old.allowCrafting),'spell availability retained '+id)
        require(row.cooldownTicks===policy.cooldown*20 && near(row.manaMultiplier,policy.mana) && near(row.powerMultiplier,policy.power),'native config effective '+id)
        levels.forEach((entry,i)=>{
          var before=old.levels[i]
          require(entry.mana===Math.floor(before.mana*policy.mana) && near(entry.power,before.power*policy.power),'native scaled level '+id+' '+entry.level)
          require(entry.castTicks===Number(before.castTicks) && entry.rarity===String(before.rarity) && entry.stage===Number(before.stage),'cast time rarity stage retained '+id+' '+entry.level)
        })
      }
    }
    if(!finalRun && changed[id.replace('irons_spellbooks:','')])console.info('SUSTAIN_DEFAULT '+id+' cooldown='+row.cooldownTicks+' ctor='+spell.getDefaultConfig().cooldownInSeconds+' mana='+row.manaMultiplier+' power='+row.powerMultiplier)
    if(!finalRun && changed[id.replace('irons_spellbooks:','')])require(near(row.manaMultiplier,1) && near(row.powerMultiplier,1) && row.cooldownTicks===spell.getDefaultConfig().cooldownInSeconds*20,'baseline uses native defaults '+id)
    rows.push(row)
  })
  rows.sort((a,b)=>a.id.localeCompare(b.id))
  require(rows.length===111,'all 111 configured spells recorded')
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'), Magic=Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData'), Source=Java.loadClass('io.redspace.ironsspellbooks.api.spells.CastSource')
  var target=Type.COW.create(world), cases=[]
  var spawn=world.getSharedSpawnPos();target.setPos(spawn.x+0.5,spawn.y+1,spawn.z+0.5)
  try{
    ;['heal','greater_heal'].forEach(name=>{
      var spell=registry.getValue(Utils.id('irons_spellbooks:'+name))
      target.setHealth(1)
      spell.onCast(world,1,target,Source.SPELLBOOK,new Magic())
      var healed=target.getHealth()-1
      require(near(healed,name==='heal'?Math.min(target.getMaxHealth()-1,spell.getSpellPower(1,null)):target.getMaxHealth()-1),'native actual health '+name)
      cases.push({case:name,healthBefore:1,healthAfter:target.getHealth(),maxHealth:target.getMaxHealth(),healed:healed})
    })
    target.getAttribute(Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes').MAX_HEALTH).setBaseValue(1000)
    target.setNoAi(true);target.setNoGravity(true);world.addFreshEntity(target)
    ;[1,10].forEach(level=>{
      var circle=registry.getValue(Utils.id('irons_spellbooks:healing_circle'))
      sustainSpawned=[];circle.onCast(world,level,target,Source.SPELLBOOK,new Magic())
      var aoe=sustainSpawned.find(entity=>String(entity.type)==='irons_spellbooks:healing_aoe')
      require(!!aoe,'native circle entity spawned '+level)
      target.setHealth(1);aoe.applyEffect(target)
      var healed=target.getHealth()-1
      require(near(healed,circle.getSpellPower(level,null)*0.25),'native circle actual health per application '+level)
      target.setPos(aoe.x,aoe.y,aoe.z);target.setHealth(1)
      for(var tick=0;tick<200;tick++)world.tickNonPassenger(aoe)
      var total=target.getHealth()-1
      require(total>healed,'native circle full lifetime heals target '+level)
      cases.push({case:'healing_circle',level:level,healedPerApplication:healed,healedFullLifetime:total,aoeDamage:aoe.getDamage(),durationTicks:aoe.getDuration(),reapplicationTicks:aoe.getReapplicationDelay()})
      sustainSpawned.forEach(entity=>entity.discard());sustainSpawned=null
    })
    var shield=registry.getValue(Utils.id('irons_spellbooks:shield'))
    sustainSpawned=[];shield.onCast(world,10,target,Source.SPELLBOOK,new Magic())
    var shieldEntity=sustainSpawned.find(entity=>String(entity.type)==='irons_spellbooks:shield')
    require(!!shieldEntity,'native shield entity spawned')
    var shieldHealth=shieldEntity.getHealth()
    require(near(shieldHealth,10+shield.getSpellPower(10,null)),'native shield health follows power')
    shieldEntity.takeDamage(world.damageSources().generic(),10,shieldEntity.position())
    require(near(shieldEntity.getHealth(),shieldHealth-10),'native shield takes actual damage')
    cases.push({case:'shield',level:10,power:shield.getSpellPower(10,null),healthBefore:shieldHealth,healthAfterHit:shieldEntity.getHealth(),hitDamage:10})
    sustainSpawned.forEach(entity=>entity.discard());sustainSpawned=null
    ;['root','slow'].forEach(name=>{
      var spell=registry.getValue(Utils.id('irons_spellbooks:'+name))
      ;[1,spell.getMaxLevel()].forEach(level=>{
        var duration=spell.getDuration(level,null)
        require(duration===Math.floor(spell.getSpellPower(level,null)*20),'native control duration '+name+' '+level)
        cases.push({case:name,level:level,durationTicks:duration})
      })
    })
    JsonIO.write('kubejs/export/'+(finalRun?'sustain-final.json':'sustain-baseline.json'),{schema:1,kind:'native stats and isolated effects; spell power is not DPS',spells:rows,cases:cases})
    console.info('SUSTAIN_AUDIT_COMPLETE '+(finalRun?'final':'baseline'))
  }finally{if(sustainSpawned)sustainSpawned.forEach(entity=>entity.discard());sustainSpawned=null;target.discard()}
}))
