var GenerateFileList = require('../tasks/generate-file-list');
var merge = require('lodash-node/modern/objects/merge');

module.exports = {
  name: 'depodify',
  aliases: ['depod','dp'],
  works: 'insideProject',
  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }
  ],

  run: function(commandOptions, rawArgs) {
    console.log('running depodify');

    var task = new GenerateFileList({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing
    });

    var taskArgs = {
      args: rawArgs,
      targetFiles: rawArgs || '',
      ignored: commandOptions.ignore || [],
      operation: 'depodify'
    };

    var taskOptions = merge(taskArgs, commandOptions || {});
    // console.log(taskOptions);
    return task.run(commandOptions,taskOptions);
  }
};
