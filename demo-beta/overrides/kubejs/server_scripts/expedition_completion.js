// One shared expedition per server. Offline players see the message on login.
FTBQuestsEvents.completed('1000000000000010', event => {
  event.server.runCommandSilent('function expedition:finish')
})
