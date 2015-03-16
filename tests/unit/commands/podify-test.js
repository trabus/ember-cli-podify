var expect         = require('chai').expect;
var MockUI         = require('ember-cli/tests/helpers/mock-ui');
var MockAnalytics  = require('ember-cli/tests/helpers/mock-analytics');
var Command        = require('ember-cli/lib/models/command');
var commandOptions = require('ember-cli/tests/factories/command-options');
var Task           = require('ember-cli/lib/models/task');
var RSVP           = require('rsvp');
var tmp            = require('quick-temp');

var PodifyCommandBase = require('../../../lib/commands/podify');

describe('podify command', function() {
  var ui;
  var tasks;
  var analytics;
  var project;
  var options;
  var command;
  var CommandUnderTest;
  var buildTaskCalled;
  var buildTaskReceivedProject;

  before(function() {
    CommandUnderTest = Command.extend(PodifyCommandBase);
  });

  beforeEach(function() {
    ui = new MockUI();
    options = commandOptions({
      settings: {},
      ui: ui,
      project: {
        isEmberCLIProject: function() {
          return false;
        }
      }
    });

    command = new CommandUnderTest(options);
  });

  it('command runs', function() {
    return command.validateAndRun(['foo']).then(function(){
      console.log(ui.output);
    });
  });
});
