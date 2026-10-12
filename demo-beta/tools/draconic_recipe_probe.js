// Disposable native RecipeManager validation, never shipped with gameplay.
var expeditionDraconicProbeDone=false
ServerEvents.tick(event=>{
 if(expeditionDraconicProbeDone)return
 expeditionDraconicProbeDone=true
 var server=event.server,rows=JsonIO.read('kubejs/config/draconic_recipe_manifest.json').recipes,checks=0
 function assert(ok,label){if(!ok)throw new Error('DRACONIC_RECIPE_FAIL '+label);checks++}
 rows.forEach(row=>{
  var found=server.recipeManager.byKey(Utils.id(row.recipe.replace('draconicevolution/','draconicevolution:')))
  assert(found.isPresent(),'loaded '+row.recipe)
  var recipe=found.get(),ingredients=recipe.fusionIngredients()
  assert(ingredients.size()===row.injectors,'injector count '+row.output)
  var expected={}
  row.added.forEach(id=>{expected[id]=(expected[id]||0)+1;assert(!Item.of(id).empty,'registered '+id)})
  Object.keys(expected).forEach(id=>{
   var matches=0
   ingredients.forEach(i=>{if(i.get().test(Item.of(id)))matches++})
   assert(matches===expected[id],'native ingredient multiplicity '+row.output+' '+id)
  })
 })
 JsonIO.write('kubejs/export/draconic-recipe-results.json',{checks:checks,recipes:rows.length,scope:'Native loaded fusion recipes and registered ingredient counts; no assembled live fusion crafting.'})
 console.info('DRACONIC_RECIPE_SUCCESS '+checks)
})
