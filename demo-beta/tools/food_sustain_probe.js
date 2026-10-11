// Opt-in isolated QA; never install this probe in a playing instance.
ServerEvents.loaded(event=>event.server.scheduleInTicks(140,()=>{
  var server=event.server, world=server.overworld(), checks=0
  function assert(ok,label){if(!ok)throw new Error('FOOD_SUSTAIN_FAIL '+label);checks++}
  function near(a,b){return Math.abs(a-b)<0.0001}
  var Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries')
  var Factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory')
  var Profile=Java.loadClass('com.mojang.authlib.GameProfile'), UUID=Java.loadClass('java.util.UUID')
  var Attributes=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var Rules=Java.loadClass('net.minecraft.world.level.GameRules')
  var Instance=Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
  function effect(id){var e=Registry.MOB_EFFECTS.getValue(Utils.id(id));assert(!!e,'registered '+id);return e}
  var sweet=effect('brewinandchewin:sweet_heart'), nourishment=effect('farmersdelight:nourishment'), comfort=effect('farmersdelight:comfort')
  var rule=world.gameRules.getRule(Rules.RULE_NATURAL_REGENERATION), oldRule=rule.get()
  var players=[], rows=[]
  function player(){var p=Factory.get(world,new Profile(UUID.randomUUID(),'SustainQA'));players.push(p);p.getAttribute(Attributes.MAX_HEALTH).setBaseValue(1000);p.setHealth(1);p.foodData.setFoodLevel(20);p.foodData.setSaturation(20);p.foodData.setExhaustion(0);return p}
  try {
    rule.set(true,server)
    var p=player(), food=p.foodData
    sweet.applyEffectTick(p,0)
    assert(near(p.health,2) && near(food.saturationLevel,19),'Sweet Heart consumes one saturation for one HP')
    food.setSaturation(0.25);sweet.applyEffectTick(p,0)
    assert(near(p.health,2.25) && near(food.saturationLevel,0),'fractional saturation cannot create extra HP')
    sweet.applyEffectTick(p,0);assert(near(p.health,2.25),'Sweet Heart stops at zero saturation')
    p.setHealth(1000);food.setSaturation(4);sweet.applyEffectTick(p,0)
    assert(near(food.saturationLevel,4),'full health does not consume saturation')
    p.setHealth(1);food.setExhaustion(3);nourishment.applyEffectTick(p,0)
    assert(near(food.exhaustionLevel,3),'injured saturated Nourishment preserves exhaustion')
    food.setSaturation(0);nourishment.applyEffectTick(p,0)
    assert(near(food.exhaustionLevel,0),'zero saturation Nourishment clears exhaustion')
    food.setSaturation(4);comfort.applyEffectTick(p,0);assert(near(p.health,1),'Comfort does not add saturated healing')
    food.setSaturation(0);comfort.applyEffectTick(p,0);assert(near(p.health,2),'Comfort heals one HP at zero saturation')
    p.setHealth(1);p.addEffect(new Instance(Java.loadClass('net.minecraft.world.effect.MobEffects').REGENERATION,200,0));comfort.applyEffectTick(p,0)
    assert(near(p.health,1),'Comfort skips active vanilla Regeneration');p.removeAllEffects()
    p.foodData.setFoodLevel(20);assert(!p.canEat(false),'full hunger normally blocks ordinary food')
    p.addEffect(new Instance(nourishment,200,0));assert(p.canEat(false),'Nourishment allows food at full hunger');p.removeAllEffects()
    var nSweet=0,nComfort=0
    for(var duration=400;duration>0;duration--){if(sweet.isDurationEffectTick(duration,0))nSweet++;if(comfort.isDurationEffectTick(duration,0))nComfort++}
    assert(nSweet===20 && nComfort===5,'native base cadence 20/80 ticks')
    ;[
      {name:'vanilla',sweet:false,nourish:false,comfort:false,natural:true,saturation:20},
      {name:'sweet',sweet:true,nourish:false,comfort:false,natural:true,saturation:20},
      {name:'sweet_nourishment',sweet:true,nourish:true,comfort:false,natural:true,saturation:20},
      {name:'sweet_nourishment_comfort',sweet:true,nourish:true,comfort:true,natural:true,saturation:20},
      {name:'zero_saturation_nourishment',sweet:false,nourish:true,comfort:false,natural:true,saturation:0},
      {name:'zero_saturation_nourishment_comfort',sweet:false,nourish:true,comfort:true,natural:true,saturation:0},
      {name:'zero_saturation_comfort',sweet:false,nourish:false,comfort:true,natural:false,saturation:0},
      {name:'sweet_no_natural_regeneration',sweet:true,nourish:true,comfort:false,natural:false,saturation:20}
    ].forEach(spec=>{
      var target=player(), data=target.foodData;data.setSaturation(spec.saturation);rule.set(spec.natural,server)
      var sweetHealing=0,sweetCost=0,comfortHealing=0
      for(var duration=400;duration>0;duration--){
        if(spec.nourish)nourishment.applyEffectTick(target,0)
        if(spec.sweet && sweet.isDurationEffectTick(duration,0)){
          var h=target.health,s=data.saturationLevel;sweet.applyEffectTick(target,0)
          sweetHealing+=target.health-h;sweetCost+=s-data.saturationLevel
        }
        if(spec.comfort && comfort.isDurationEffectTick(duration,0)){var h=target.health;comfort.applyEffectTick(target,0);comfortHealing+=target.health-h}
        data.tick(target)
      }
      assert(near(sweetHealing,sweetCost),spec.name+' Sweet Heart HP equals saturation spent')
      assert(data.saturationLevel>=0 && data.foodLevel>=0,spec.name+' food nonnegative')
      if(spec.name==='zero_saturation_comfort')assert(near(comfortHealing,5) && near(target.health,6),'Comfort alone 5 HP in 20 seconds')
      if(spec.name==='sweet_no_natural_regeneration')assert(near(sweetHealing,20) && near(target.health,21),'Sweet Heart independent of natural regeneration but paid')
      rows.push({case:spec.name,ticks:400,healthGained:target.health-1,saturationBefore:spec.saturation,saturationAfter:data.saturationLevel,foodAfter:data.foodLevel,exhaustionAfter:data.exhaustionLevel,sweetHealing:sweetHealing,sweetSaturationSpent:sweetCost,comfortHealing:comfortHealing})
    })
    // Repeated same-strength buff refreshes rather than adding its amplifier.
    p=player();p.addEffect(new Instance(sweet,3600,0));p.addEffect(new Instance(sweet,3600,0))
    assert(p.getEffect(sweet).amplifier===0 && p.getEffect(sweet).duration===3600,'two Sweet Heart buffs do not add strength or duration')
    p=player();p.foodData.setSaturation(0)
    var spellRegistry=Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry').REGISTRY.get()
    var Magic=Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData'), Source=Java.loadClass('io.redspace.ironsspellbooks.api.spells.CastSource')
    var Config=Java.loadClass('io.redspace.ironsspellbooks.api.config.SpellConfigManager')
    Config.onDatapackSync(new (Java.loadClass('net.minecraftforge.event.OnDatapackSyncEvent'))(server.getPlayerList(),null))
    var spells=[]
    ;['heal','greater_heal'].forEach(name=>{
      p.setHealth(1);var spell=spellRegistry.getValue(Utils.id('irons_spellbooks:'+name))
      spell.onCast(world,1,p,Source.SPELLBOOK,new Magic())
      var healed=p.health-1
      assert(healed>0 && near(p.foodData.saturationLevel,0),name+' spell heals independently of food')
      if(name==='greater_heal'){
        assert(near(p.health,p.maxHealth),'Greater Heal still full health')
        assert(spell.getManaCost(1)===150 && spell.getSpellCooldown()===1200,'Greater Heal loaded campaign cost and cooldown')
      }
      spells.push({id:'irons_spellbooks:'+name,level:1,healthGained:healed,manaCost:spell.getManaCost(1),cooldownTicks:spell.getSpellCooldown()})
    })
    var result={checks:checks,scope:'Actual native effect calls and FoodData.tick on isolated QA FakePlayers; prescribed effect order; no real client, damage, eating or full LivingEntity tick simulation',cases:rows,spells:spells}
    JsonIO.write('kubejs/export/food-sustain-results.json',result)
    console.info('FOOD_SUSTAIN_SUCCESS '+JSON.stringify(result))
  } finally {rule.set(oldRule,server);players.forEach(p=>p.removeAllEffects())}
}))
