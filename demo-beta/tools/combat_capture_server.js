// Opt-in QA companion for combat_capture_startup.js. Control file is local only.
ServerEvents.tick(event=>{
 var capture=global.expeditionCombatCapture
 if(!capture)return
 var tick=capture.time(event.server.overworld()),state=capture.state
 if(tick%20===0){
  var control=JsonIO.read('kubejs/export/combat-capture-control.json')
  var enabled=!!control && control.enabled===true,session=control?String(control.session):''
  if(enabled && !/^[a-z0-9_-]{1,64}$/.test(session)){console.warn('COMBAT_CAPTURE invalid session ID');enabled=false}
  if(enabled && (!state.enabled || state.session!==session)){
   capture.flush();state.enabled=true;state.session=session;state.startedTick=tick;state.rows=[];state.dropped=0;state.errors=[]
   console.info('COMBAT_CAPTURE_START '+session)
  }else if(!enabled && state.enabled){state.enabled=false;capture.flush();console.info('COMBAT_CAPTURE_STOP '+state.session)}
  if(state.enabled)capture.flush()
 }
 if(state.enabled)event.server.getPlayerList().getPlayers().forEach(player=>capture.sample(player))
})
ServerEvents.unloaded(event=>{
 var capture=global.expeditionCombatCapture
 if(capture && capture.state.enabled){capture.state.enabled=false;capture.flush()}
})
