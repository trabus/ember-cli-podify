var Blueprint = require('ember-cli/lib/models/blueprint');
var FileInfo =  require('ember-cli/lib/models/file-info');
var Task =      require('ember-cli/lib/models/task');
var Promise =   require('ember-cli/lib/ext/promise');
var walkSync =  require('walk-sync');
var path =      require('path');
var fs =        require('fs-extra');
var inflector = require('inflection');
var without =   require('lodash-node/modern/arrays/without');
var filter =    require('lodash-node/modern/collections/filter');
var nodeMkdirp =require('mkdirp');
var rename =    Promise.denodeify(fs.rename);
var rmdir =     Promise.denodeify(fs.rmdir);
var mkdirp =    Promise.denodeify(nodeMkdirp);

module.exports = Task.extend({
  run: function(commandOptions, options) {
    console.log('Running task: generate-file-list');
    this.operation = options.operation;
    this.appPath = path.join(this.project.root,"app");
    this.testPath = path.join(this.project.root,"tests");
    this.getPodBlueprints();
    var files = this.files("app");
    // console.log(options);
    this.ui.writeLine(this.operation);
    // console.log(this.appPath,this.project.pkg);
    // console.log('files',files);

    var fileInfos = files.map(this.buildFileInfo.bind(this, "app"));
    fileInfos = without(fileInfos,undefined);
    // console.log(fileInfos);
    var operations = fileInfos.map(this.buildFileOperation.bind(this));
    operations = filter(operations,{operation:this.operation});
    // console.log(operations);
    return Promise.resolve(operations)
      .map(this.processFile.bind(this))
      .then(function(result){
        console.log(result);
        return result;
      });
  },

  files: function(file) {
    var filePath = path.join(this.project.root,file);
    if(fs.existsSync(filePath)) {
      return walkSync(filePath);
    }
  },

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
    var segments = filePath.split('/');
    var fileName = segments[segments.length - 1].split('.');
    var extension = fileName[1];
    var type, paths, pathName;

    // console.log('type',type, segments.length);
    segments[segments.length - 1] = fileName[0];
    segments.forEach(function(segment){
      var item = inflector.singularize(segment);
      if(podlist.indexOf(item) !== -1){
        type = item;
      }
    });
    segments = without(segments, 'pods');
    if(isFile && !filePath.match(/.gitkeep/) && segments.length > 1 && type !== undefined){
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
        pathName: paths.join('/'),
        extension: extension,
        type: type,
        pod: type === segments.slice(-1)[0],
        originPath: originPath
      };
    }
  },

  buildFileOperation: function(file) {
    var output = {
        type: file.type,
        filename: file.pathName,
        inputPath: file.originPath,
        outputPath: outputPath(file),
        outputDir: outputDir(file),
        inputDir: inputDir(file)
      };
    if(file.pod){
      output.operation = 'depodify';
    } else {
      output.operation = 'podify';
    }
    return output;
  },

  processFile: function(file) {
    // console.log('renaming:', file.type, file.filename);
    // console.log('isFile:',fs.statSync(file.inputPath).isFile(),(file.inputPath === file.originPath));
     console.log(file);
    if (!fs.existsSync(file.outputDir)) {
      console.log('nodir ',file.outputDir);
      //fs.mkdirSync(file.outputDir);
    }
    return mkdirp(file.outputDir)
      .then(function(){
        return rename(file.inputPath,file.outputPath)
      })
      .then(function(){
        console.log('deleting dir:',file.inputDir);
        return rmdir(file.inputDir);
      })
      .catch(function(err){
        console.log(err);
        return true;
      });
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
  }
});

function inputDir(file) {
  return file.originPath.split('/').slice(0,-1).join('/');
}

function outputPath(file) {
  // if file is already pod
  if (file.pod) {
    return path.join(file.root, file.base, inflector.pluralize(file.type), file.pathName + '.' + file.extension);
  } else {
    return path.join(file.root, file.base, 'pods', file.pathName, file.type + '.' + file.extension);
  }
}
function outputDir(file) {
  // if file is already pod
  if (file.pod) {
    return path.join(file.root, file.base, inflector.pluralize(file.type));
  } else {
    return path.join(file.root, file.base, 'pods', file.pathName);
  }
}
