'use strict';
function Addon(){
  this.name = 'ember-cli-podify';
}

Addon.prototype.includedCommands = function(){
  return {
    'Podify': {
      name: 'podify',
      aliases: ['pod','pf']
    },
    'Depodify': {
      name: 'depodify',
      aliases: ['depod','dp']
    }
  }
}

module.exports = Addon;
