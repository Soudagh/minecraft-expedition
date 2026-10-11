// Explain the native food costs alongside the shared campaign gates.
ItemEvents.tooltip(event=>{
  event.add('brewinandchewin:saccharine_rum',[
    'Общий этап II. Лечебная ферментация требует Очищенной связки.',
    'Sweet Heart I: до 1 ед. здоровья в секунду за 1 ед. насыщения.',
    'При нулевом насыщении Sweet Heart не лечит.'
  ])
  event.add('brewinandchewin:red_rum',[
    'Общий этап III. Боевая ферментация требует Рунического сплава.'
  ])
  event.add('kubejs:sweet_fermentation_starter','Один настой на 1000 мБ Saccharine Rum — четыре кружки.')
  event.add('kubejs:combat_fermentation_starter','Один настой на 1000 мБ Red Rum — четыре кружки.')
})
