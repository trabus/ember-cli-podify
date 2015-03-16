'use strict';

var Blueprint   = require('ember-cli/lib/models/blueprint');
var FileInfo    = require('ember-cli/lib/models/file-info');
var Task        = require('ember-cli/lib/models/task');
var Promise     = require('ember-cli/lib/ext/promise');
var walkSync    = require('walk-sync');
var path        = require('path');
var fs          = require('fs-extra');
var inflector   = require('inflection');
var without     = require('lodash-node/modern/arrays/without');
var filter      = require('lodash-node/modern/collections/filter');
var chalk       = require('chalk');
var nodeMkdirp  = require('mkdirp');
var execSync    = require('child_process').execSync;
var rename      = Promise.denodeify(fs.rename);
var rmdir       = Promise.denodeify(fs.rmdir);
var mkdirp      = Promise.denodeify(nodeMkdirp);

module.exports = Task.extend({
  run: function(commandOptions, options) {
     console.log('Running task: generate-file-list, operation:', options.operation);
    this.operation = options.operation;
    this.appPath = path.join(this.project.root,"app");
    this.testPath = path.join(this.project.root,"tests");
    this.ignoredTypes = options.ignored;
    //this.getPodBlueprints();
    var files = this.files("app");
    // console.log(options);
    // this.ui.writeLine(this.operation);
    // console.log(this.appPath,this.project.pkg);
    // console.log('files',files);
    if (options.dryRun) {
      this.ui.writeLine(chalk.yellow('You specified the dry-run flag, so no changes will be written.'));
    }

    var fileInfos = files.map(this.buildFileInfo.bind(this, "app"));
    fileInfos = without(fileInfos,undefined);
    console.log(fileInfos);
    var operations = fileInfos.map(this.buildFileOperation.bind(this));
    console.log(operations,this.operation);
    operations = filter(operations,{operation:this.operation});
    console.log('operations:',operations);
    return Promise.resolve(operations)
      .map(this.processFile.bind(this, options))
      .then(function(result){
        // console.log(result);
        if (options.dryRun) {
          this.ui.writeLine(chalk.yellow('Run of ' + options.operation + ' dry run complete. No changes were written.'));
        }
        return result;
      }.bind(this));
  },

  files: function(file) {
    var filePath = path.join(this.project.root,file);
    if(fs.existsSync(filePath)) {
      return walkSync(filePath);
    }
  },

/*
  Build file info object for processing
*/
  buildFileInfo: function(file, filePath) {
    // process each file to get info for later processing
  /*
  * rename all files in hash
  * get podModulePrefix from config
  * match(/podModulePrefix/);
  * get root path
  * get type of blueprint
  * extract properties for renaming
    * type
    * root path
    * resource path
    * extension
  */
    var podlist = this.getPodBlueprints();
    var originPath = path.resolve(this.project.root, file, filePath);
    var isFile = fs.statSync(originPath).isFile();
    var segments = filePath.split(path.sep);
    var fileName = segments[segments.length - 1].split('.');
    var extension = fileName[1];
    var isIgnoredFile = this.getIgnoredFiles().indexOf(fileName[1]) !== -1;
    var type, paths, pathName;
    // console.log(fileName, this.getIgnoredFiles().indexOf(fileName[1]));
    // console.log('type',type, segments.length);
    segments[segments.length - 1] = fileName[0];
    segments.some(function(segment){
      var item = inflector.singularize(segment);
      if(podlist.indexOf(item) !== -1){
        type = item;
      }
      return type === item;
    });
    // TODO: find a better way to detect type than this temporary fix for component templates
    if (extension === 'hbs') {
      type = 'template';
    }
    segments = without(segments, 'pods');
    if(isFile && !isIgnoredFile && !this.isIgnoredType(type) && segments.length > 1 && type !== undefined){
      // console.log('processing:',filePath);
      paths = segments.map(function(segment){
        var item = inflector.singularize(segment);
        if(podlist.indexOf(item) !== -1){
          return '';
        } else {
          return segment;
        }
      });
      paths = without(paths, '');
      return {
        root: this.project.root,
        base: file,
        segments: segments,
        pathName: paths.join(path.sep),
        extension: extension,
        type: type,
        pod: type === segments.slice(-1)[0],
        originPath: originPath,
        isComponent: originPath.match(/component/)
      };
    }
  },

  buildFileOperation: function(file) {
    var filepath = outputPath(file);
    var output = {
        type: file.type,
        filename: file.pathName,
        inputPath: file.originPath,
        outputPath: outputPath(file),
        outputDir: outputDir(filepath),
        inputDir: inputDir(file)
      };
    if(file.pod){
      output.operation = 'depodify';
    } else {
      output.operation = 'podify';
    }
    return output;
  },

  processFile: function(options, file) {
    // console.log('file',file);
    // console.log('options',options)
    // console.log('renaming:', file.type, file.filename);
    // console.log('isFile:',fs.statSync(file.inputPath).isFile(),(file.inputPath === file.originPath));
    // console.log(file);
    var operationText;
    var gitProject = isInsideGitProject(this.project.root);
    console.log(gitProject)
    var outputDir = file.outputDir;
    if (!fs.existsSync(file.outputDir)) {
      // console.log('nodir ',file.outputDir);
    }
    if (options.dryRun) {
      outputDir = '';
    }
    return mkdirp(outputDir)
      .then(function(){
        console.log(outputDir);
        operationText = gitProject ? 'git mv file: ' : 'renaming file: ';
        var stat = fs.lstatSync(outputDir);
        console.log('isdir',stat.isDirectory());
        this.ui.writeLine(chalk.green(operationText) + '\'' + chalk.yellow(file.inputPath) + '\' to ' + chalk.green('\'' + file.outputPath + '\''));
        if(options.dryRun) {
          return true;
        } else {
          if (gitProject) {
            console.log('gitmv')
            return execSync("git mv " + file.inputPath + " " + file.outputPath);
          } else {
            console.log(file.outputPath)
            console.log('renaming file:', file.outputPath)
            return rename(file.inputPath,file.outputPath);
          }
        }
      }.bind(this))
      .then(function(){
          console.log('deleting',isEmpty(file.inputDir))
        this.ui.writeLine(chalk.red('deleting empty directory: ' + file.inputDir));
        if(options.dryRun) {
          return true;
        } else {
          if(isEmpty(file.inputDir)) {
         console.log('deleting dir:',file.inputDir);
            return rmdir(file.inputDir);
          } else {
            return false;
          }
        }
      }.bind(this))
      .catch(function(err){
        if(err.code === 'ENOENT') {
          console.log(err);
        } else {
          this.ui.writeLine(chalk.red('deleting directory failed: ' + err.path));
        }
        return false;
      }.bind(this));
  },

  getPodBlueprints: function(options) {
    // fake list for now
    return [
      'adapter',
      'controller',
      'component',
      'model',
      'resource',
      'route',
      'serializer',
      'template',
      'transform',
      'view'
    ];
    /*
    var lookupPaths   = this.project.blueprintLookupPaths();
    var blueprintList = Blueprint.list({ paths: lookupPaths });
    // loop through list
    console.log(lookupPaths);
    //console.log(blueprintList);
    var path;
    blueprintList.forEach(function(collection){
      // console.log(collection.blueprints);
      collection.blueprints.forEach(function(blueprint){
        if(blueprint && blueprint.name){
          //console.log(blueprint);
          //console.log(blueprint.name);
          try {
            path = blueprint.files().join();
            if(path.match(/__path__/)) {
              console.log(blueprint.name);
            }
          }
          catch(e){
            console.log('error',e);
          }

        }
      });
    });
    */
  },

  getIgnoredFiles: function() {
    return [
    'DS_Store',
    'gitkeep'
    ];
  },

  isIgnoredType: function(type) {
    return this.ignoredTypes.indexOf(type) !== -1;
  }
});

function inputDir(file) {
  return path.join.apply(null,file.originPath.split(path.sep).slice(0,-1));
}

function isEmpty(path) {
  console.log('isempty',path)
  var files = fs.readdirSync(path);
  console.log(files.length)
  return !!!files.length;
};

function isInsideGitProject(root) {
  console.log(path.join(root,'.git'))
  return fs.existsSync(path.join(root,'.git'));
}

function outputPath(file) {
  // if file is already pod
  var subpath = '';
  if (file.pod) {
    // if the file is a template
    if(file.type === 'template' && file.isComponent) {
      subpath = 'components';
    }
    //
    return path.join(file.root, file.base, inflector.pluralize(file.type), subpath, file.pathName + '.' + file.extension);
  } else {
    var podpath = 'pods';
    if(file.type === 'component') {
      podpath += path.sep + inflector.pluralize(file.type);
    }
    if(file.type === 'template' && file.isComponent) {
      subpath = 'components';
    }
    return path.join(file.root, file.base, podpath, subpath, file.pathName, file.type + '.' + file.extension);
  }
}

function outputDir(filePath) {
  // console.log('filepath',filePath,filePath.split('/').slice(0,-1).join('/'));
  return path.join.apply(null,filePath.split(path.sep).slice(0,-1));
}
