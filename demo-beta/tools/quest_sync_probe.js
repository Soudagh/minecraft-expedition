// Opt-in isolated QA server only. Exercise the exact login packet constructor.
ServerEvents.loaded(event=>event.server.scheduleInTicks(120,task=>{
 var Message=Java.loadClass('dev.ftb.mods.ftbquests.net.SyncQuestsMessage')
 var File=Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile')
 var result={limit:1048576,packetConstructed:false,error:''}
 try {
  var packet=new Message(File.INSTANCE).toPacket()
  result.packetConstructed=true
  result.bytes=packet.getData().readableBytes()
 } catch(e) {result.error=String(e)}
 JsonIO.write('kubejs/export/quest-sync-results.json',result)
 console.info('QUEST_SYNC_RESULT '+JSON.stringify(result))
 if(!result.packetConstructed || result.bytes>950000)throw new Error('QUEST_SYNC_FAIL: packet exceeds QA budget or cannot be constructed')
}))
