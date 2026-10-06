// Stable world-save IDs: never rename or delete these in updates.
StartupEvents.registry('item', event => {
  event.create('mechanical_core').displayName('Механическое ядро').texture('minecraft:item/clock')
  event.create('attuned_core').displayName('Настроенное ядро').texture('minecraft:item/heart_of_the_sea')
})
