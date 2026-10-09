ServerEvents.recipes(event => {
  ;[['runic_terrasteel','botania:terrasteel_ingot','lothric'],['runic_diamond','minecraft:diamond','lothric'],
    ['rare_ink_catalyst','minecraft:iron_ingot','lothric'],['epic_ink_catalyst','minecraft:gold_ingot','cinder'],['legendary_ink_catalyst','minecraft:amethyst_shard','nightlord'],
    ['runic_netherite','minecraft:netherite_ingot','lothric'],['advanced_netherite','minecraft:netherite_ingot','cinder']].forEach(row => {
    event.shapeless('kubejs:'+row[0], [row[1],'kubejs:material_'+row[2]]).id('expedition:'+row[0])
  })
  ;['rare','epic','legendary'].forEach(tier => event.forEachRecipe({id:'irons_spellbooks:alchemist_cauldron/brew_'+tier+'_ink'}, recipe => {
    const input = recipe.json.getAsJsonObject('input')
    input.remove('tag')
    input.addProperty('item','kubejs:'+tier+'_ink_catalyst')
    recipe.changed = true
  }))
  ;['helmet','chestplate','leggings','boots'].forEach(slot => {
    event.forEachRecipe({id:'botania:terrasteel_'+slot}, recipe => {
      const key=recipe.json.getAsJsonObject('key').getAsJsonObject('S')
      key.remove('tag')
      key.addProperty('item','kubejs:runic_terrasteel')
      recipe.changed=true
    })
    event.forEachRecipe({id:'irons_spellbooks:netherite_mage_'+slot},recipe=>{
      const addition=recipe.json.getAsJsonObject('addition')
      addition.remove('tag');addition.addProperty('item','kubejs:advanced_netherite');recipe.changed=true
    })
  })
  ;[['diamond','D','runic_diamond'],['netherite','N','advanced_netherite']].forEach(row=>event.forEachRecipe({id:'irons_spellbooks:'+row[0]+'_spell_book'},recipe=>{
    const key=recipe.json.getAsJsonObject('key').getAsJsonObject(row[1])
    key.remove('tag');key.addProperty('item','kubejs:'+row[2]);recipe.changed=true
  }))
  ;['chakram','claymore','cutlass','glaive','greataxe','greathammer','halberd','katana','longsword','rapier','sai','scythe','spear','twinblade','warglaive'].forEach(weapon => {
    event.forEachRecipe({id:'simplyswords:netherite_'+weapon},recipe=>{
      const addition=recipe.json.getAsJsonObject('addition')
      addition.addProperty('item','kubejs:runic_netherite');recipe.changed=true
    })
  })
})
