// Workstations remain searchable; all decoration is still selectable inside them.
JEIEvents.hideItems(event => {
  event.hide(/^chipped:(?!alchemy_bench$|botanist_workbench$|carpenters_table$|glassblower$|loom_table$|mason_table$|tinkering_table$).*/)
})
