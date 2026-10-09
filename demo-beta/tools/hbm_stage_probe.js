// Opt-in on a disposable world. Does not place or start machines.
ServerEvents.loaded(event=>event.server.scheduleInTicks(100,task=>{
 var ref=JsonIO.read('kubejs/export/hbm-quest-sources.json'), Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'), RL=Java.loadClass('net.minecraft.resources.ResourceLocation'), blocks=[]
 Object.keys(ref.expectedBlockClasses).forEach(name=>{
  var id='hbm_m:'+name,block=Registry.BLOCKS.getValue(new RL(id)),cls=String(block.getClass().getName())
  if(cls!==ref.expectedBlockClasses[name])throw new Error('HBM_STAGE_CLASS_FAIL '+id+' '+cls)
  blocks.push({id:id,className:cls,hasBlockEntity:block.defaultBlockState().hasBlockEntity()})
 })
 var result={scope:'Native machine classes only; no construction, production or survival test',blocks:blocks}
 JsonIO.write('kubejs/export/hbm-stage-results.json',result);console.info('HBM_STAGE_SUCCESS '+JSON.stringify(result))
}))
