// Preserve native tier materials; converge with Create, Botania and HBM.
ServerEvents.recipes(event => {
  event.remove({output:'divinerpg:twilight_clock'})
  event.shaped('divinerpg:twilight_clock',['MMM','PCP','MMM'],{
    M:'botania:manasteel_ingot',P:'create:precision_mechanism',C:'minecraft:clock'
  }).id('expedition:divine/twilight_clock')
  event.remove({output:'divinerpg:divine_rock'})
  event.shapeless('divinerpg:divine_rock',['divinerpg:divine_shards','botania:livingrock']).id('expedition:divine/divine_rock')
  ;['eden','wildwood','apalachia','skythern','mortum'].forEach(tier=>{
    event.remove({output:'divinerpg:'+tier+'_chunk'})
    event.shaped('divinerpg:'+tier+'_chunk',['GGG','GMG','GPG'],{
      G:'divinerpg:'+tier+'_gem',M:'botania:manasteel_ingot',P:'create:iron_sheet'
    }).id('expedition:divine/'+tier+'_chunk')
  })
  event.remove({output:'divinerpg:arcana_portal_frame'})
  event.shaped('12x divinerpg:arcana_portal_frame',[' C ','III','CT '],{
    C:'divinerpg:soulfire_stone',I:'hbm_m:block_steel',T:'kubejs:material_annihilator'
  }).id('expedition:divine/arcana_portal_frame')
  ;['realmite','arlemite','rupee'].forEach(metal=>{
    ;[metal+'_ore',metal+'_ore_deepslate'].forEach(ore=>{
      event.custom({type:'create:crushing',ingredients:[{item:'divinerpg:'+ore}],results:[{item:'divinerpg:raw_'+metal,count:2}],processingTime:400}).id('expedition:divine/crushing_'+ore)
    })
  })
})
