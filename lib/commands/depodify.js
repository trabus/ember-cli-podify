var GenerateFileList = require('../tasks/generate-file-list');

module.exports = {
  name: 'depodify',
  aliases: ['depod','dp'],
  works: 'insideProject',
  run: function(commandOptions, rawArgs) {
    console.log('running depodify');
    var options = {operation:'depodify'};
    var task = new GenerateFileList({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing
    });
    return task.run(commandOptions,options);
  }
}
