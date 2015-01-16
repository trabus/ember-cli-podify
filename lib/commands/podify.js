var GenerateFileList = require('../tasks/generate-file-list');
var merge = require('lodash-node/modern/objects/merge');

module.exports = {
  name: 'podify',
  description: 'Converts files into pod structure.',
  aliases: ['pod','pf'],
  works: 'insideProject',
  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }
  ],
  anonymousOptions: [
    '<glob-pattern>'
  ],
  run: function(commandOptions, rawArgs) {
    console.log('running podify');
    var task = new GenerateFileList({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing
    });

    var taskArgs = {
      args: rawArgs,
      operation: 'podify'
    };

    var taskOptions = merge(taskArgs, commandOptions || {});
    // console.log(taskOptions);
    return task.run(commandOptions, taskOptions);
  }
}
