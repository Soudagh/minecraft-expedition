// Isolated execution of entry keyframe and selected return commands, no animation tick/client.
var melkorGeometryQueued=false
ServerEvents.tick(event=>{
 if(melkorGeometryQueued)return
 melkorGeometryQueued=true
 event.server.scheduleInTicks(160,()=>{
  var server=event.server,world=server.overworld(),checks=0,rows=[],entities=[],spawn=world.getSharedSpawnPos()
  function assert(ok,label){if(!ok)throw new Error('MELKOR_GEOMETRY_FAIL '+label);checks++}
  var Type=Java.loadClass('net.minecraft.world.entity.EntityType'),Effects=Java.loadClass('net.minecraft.world.effect.MobEffects')
  var source=JsonIO.read('kubejs/export/melkor-phase-sources.json'),fixtures=JsonIO.read('kubejs/export/slb-hitbox-fixtures.json').fixtures
  var fixture=null;fixtures.forEach(f=>{if(f.fixture==='melkor-start')fixture=f});assert(!!fixture,'exact Melkor initial NBT')
  var objective=server.getScoreboard().getObjective('boss_phase_change');assert(!!objective,'upstream phase objective exists')
  function bounds(body){var b=body.getBoundingBox();return {minX:b.minX,minY:b.minY,minZ:b.minZ,maxX:b.maxX,maxY:b.maxY,maxZ:b.maxZ}}
  function distance(p,b){var dx=Math.max(b.minX-p.x,0,p.x-b.maxX),dy=Math.max(b.minY-p.y,0,p.y-b.maxY),dz=Math.max(b.minZ-p.z,0,p.z-b.maxZ);return Math.sqrt(dx*dx+dy*dy+dz*dz)}
  try{
   ;[0,3,8].forEach(rootOffset=>{
    var root=Type.ITEM_DISPLAY.create(world),body=Type.COW.create(world);entities.push(body);entities.push(root)
    var rootY=Math.min(280,spawn.y+40)+rootOffset
    root.setPos(spawn.x+0.5,rootY,spawn.z+0.5);body.load(NBT.toTagCompound(fixture.snbt));body.setPos(root.x,rootY,root.z)
    assert(world.addFreshEntity(root) && world.addFreshEntity(body),'isolated root/body registered')
    assert(body.startRiding(root,true),'hitbox mounted before entry')
    var phase=server.getScoreboard().getOrCreatePlayerScore(String(root.uuid),objective)
    var before={bodyY:body.y,riding:!!body.getVehicle(),bounds:bounds(body)}
    var prefix='execute as '+String(root.uuid)+' at @s run '
    server.runCommandSilent(prefix+'function '+source.entryFunction)
    var resist=body.getEffect(Effects.DAMAGE_RESISTANCE),b=bounds(body)
    assert(!body.getVehicle(),'exact keyframe dismounts hitbox')
    assert(Math.abs(body.y-(rootY-10))<0.00001,'exact keyframe lowers body ten blocks')
    assert(!!resist && resist.amplifier===250 && resist.duration===200,'exact keyframe Resistance250/200ticks')
    assert(body.getTags().contains('tmp_dismount') && phase.getScore()===2,'exact keyframe state/tag')
    var points={rootFloor:{x:root.x+2,y:rootY,z:root.z},rootEye:{x:root.x+2,y:rootY+1.62,z:root.z},lowerFloor:{x:root.x+2,y:rootY-10,z:root.z}}
    var distances={};Object.keys(points).forEach(k=>{distances[k]=distance(points[k],b)})
    assert(distances.rootFloor>6 && distances.rootEye>6,'root-height points outside six-block sphere')
    assert(distances.lowerFloor<3,'lower point within three-block sphere')
    var during={bodyY:body.y,bounds:b,resistance:{duration:resist.duration,amplifier:resist.amplifier},phase:phase.getScore(),riding:false,pointToAABBDistance:distances}
    source.returnTransportCommands.forEach(cmd=>server.runCommandSilent(prefix+cmd))
    assert(!!body.getVehicle() && body.getVehicle().equals(root),'exact return commands remount same body')
    assert(!body.getTags().contains('tmp_dismount') && phase.getScore()===0,'exact return tag/state reset')
    // A full entity tick would reposition the passenger. Do not claim that happened here.
    rows.push({rootOffset:rootOffset,rootY:rootY,before:before,during:during,afterReturn:{riding:true,phase:phase.getScore(),bodyYBeforePassengerTick:body.y},spawnedInQA:true,fullAnimation:false})
    body.discard();root.discard()
   })
   JsonIO.write('kubejs/export/melkor-geometry.json',{checks:checks,scope:'Exact entry keyframe function and three selected return commands on isolated spawned item_display root and native Cow loaded from Melkor NBT. No AnimatedJava root tag, full phase, animation tick, natural terrain, player input, EF collider, hit or DPS. Distances are geometry for chosen test points; six-block sphere is a diagnostic threshold, not actual weapon reach.',rows:rows})
   console.info('MELKOR_GEOMETRY_SUCCESS checks='+checks+' rows='+rows.length)
  }finally{entities.forEach(e=>e.discard())}
 })
})
