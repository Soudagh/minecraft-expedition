// Opt-in on an isolated server. Compare generated book with native FTB loaded objects.
ServerEvents.loaded(event=>event.server.scheduleInTicks(60,task=>{
 var ref=JsonIO.read('kubejs/export/quest-reference.json'), file=Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile').INSTANCE
 var Long=Java.loadClass('java.lang.Long'), Registry=Java.loadClass('net.minecraftforge.registries.ForgeRegistries'), RL=Java.loadClass('net.minecraft.resources.ResourceLocation'), checks=0, quests=0
 var check=(ok,label)=>{if(!ok)throw new Error('QUEST_BOOK_FAIL '+label);checks++}
 check(file!==null,'server quest file exists')
 check(file.getAllChapters().size()===ref.chapters.length,'chapter count')
 check(file.getAllTasks().size()===ref.taskCount,'task count')
 ref.chapters.forEach(row=>{
  var chapter=file.getChapter(Long.parseUnsignedLong(row.id,16))
  check(chapter!==null,'chapter '+row.slug)
  check(chapter.getQuests().size()===row.count,'chapter size '+row.slug);quests+=chapter.getQuests().size()
 })
 check(quests===ref.questCount,'quest count')
 ref.questIDs.forEach(id=>check(file.getQuest(Long.parseUnsignedLong(id,16))!==null,'quest '+id))
 ref.taskIDs.forEach(id=>check(file.getTask(Long.parseUnsignedLong(id,16))!==null,'task '+id))
 ref.items.forEach(id=>check(Registry.ITEMS.containsKey(new RL(id)),'registered item '+id))
 var result={version:ref.version,checks:checks,chapters:ref.chapters.length,quests:quests,tasks:ref.taskCount,registeredItems:ref.items.length}
 JsonIO.write('kubejs/export/quest-book-results.json',result);console.info('QUEST_BOOK_SUCCESS '+JSON.stringify(result))
}))
