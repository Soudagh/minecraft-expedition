// Opt-in on a disposable QA server; verify recipes cited by the HBM curriculum.
ServerEvents.loaded(event=>event.server.scheduleInTicks(80,task=>{
 var ref=JsonIO.read('kubejs/export/hbm-quest-sources.json'), server=event.server
 var JMap=Java.loadClass('java.util.Map'), catalogue=server.recipeManager.getRecipes(), found={}
 var outer=(catalogue instanceof JMap?catalogue.values():catalogue).iterator()
 while(outer.hasNext()){
  var value=outer.next()
  if(value instanceof JMap){var nested=value.values().iterator();while(nested.hasNext()){var r=nested.next();found[String(r.id)]=true}}
  else found[String(value.id)]=true
 }
 var ids=Object.keys(ref.recipes).map(id=>'hbm_m:'+id).concat(['expedition:hbm_press','expedition:hbm_anvil_iron','expedition:hbm_anvil_lead'])
 ids.forEach(id=>{if(!found[id])throw new Error('HBM_QUEST_RECIPE_MISSING '+id)})
 var result={scope:'Native recipe existence; no production or GUI test',recipes:ids.length,recipeIDs:ids}
 JsonIO.write('kubejs/export/hbm-quest-results.json',result);console.info('HBM_QUEST_SUCCESS '+JSON.stringify(result))
}))
