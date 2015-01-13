var GenerateFileList = require('../tasks/generate-file-list');

module.exports = {
  name: 'podify',
  description: 'Converts files into pod structure.',
  aliases: ['pod','pf'],
  works: 'insideProject',
  anonymousOptions: [
    '<glob-pattern>'
  ],
  run: function(commandOptions, rawArgs) {
    console.log('running podify');
    var options = {operation:'podify'};
    var task = new GenerateFileList({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing
    });
    return task.run(commandOptions,options);
  }
}
