ItemEvents.tooltip(event=>{
 const policy=JsonIO.read('kubejs/config/divine_balance.json')
 Object.keys(policy.gear).forEach(id=>{
  event.add(id,'Сначала завершите цепочку Cataclysm: финальная победа над Игнисом.')
  const stage=policy.gear[id].stage
  if(stage)event.add(id,'Общий этап кампании: '+stage+'. Закрытую экипировку можно перевозить в инвентаре.')
 })
 ;['helmet','chestplate','leggings','boots'].forEach(part=>event.add('divinerpg:angelic_'+part,'Полный комплект: 1 матрица сборочной линии на 3 минуты полёта. На земле запас сохраняется.'))
})
