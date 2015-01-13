module.exports = {
  name: 'ember-cli-podify',
  includedCommands: function() {
    return {
      'podify': require('./lib/commands/podify'),
      'depodify': require('./lib/commands/depodify')
    }
  }
}
/*
  returns files for defined path
*/
function files(){

}
