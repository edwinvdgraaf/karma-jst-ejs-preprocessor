var ejs = require('ejs'),
    path = require('path');

var createJstEjsPreprocessor = function(args, config, logger, helper) {
  config = config || {};

  var log = logger.create('preprocessor.jst-ejs');
  var defaultOptions = { 
    logicalMountPoint: "src"
  };
  
  var options = helper.merge(defaultOptions, args.options || {}, config.options || {});

  var transformPath = function(filepath) {
    return filepath.replace(/\.jst.ejs$/, '.js');
  };

  // Removes base and sprockets untill sprockets mountPath with options.logicalPathStrip
  var transformLogicalPath = function(filepath) {
    var logicalPath = filepath.replace(/\.jst.ejs$/, '');
    // Poor mans solutions here, its somewhat more complex
    return logicalPath.substring(logicalPath.indexOf(options.logicalMountPoint));
  };

  // Internal (private) namespace storage
  var namespace = 'this.JST';

  var makeJST = function (data, file) {
    return "(function () { " +
      namespace + " || (" + namespace + " = {}); " +
      namespace + "[" + JSON.stringify(file.logicalPath) + "] = " +
      data.replace(/$(.)/mg, '$1  ').trimLeft().trimRight() +
      " }).call(this);";
  };

  return function(content, file, done) {
    var result = null;

    log.debug('Processing "%s".', file.originalPath);
    file.path = transformPath(file.originalPath);
    file.logicalPath = transformLogicalPath(file.originalPath);

    try {
      result = ejs.compile(content, {client: true}).toString();
      result = makeJST(result, file);
    } catch (e) {
      log.error('%s\n  at %s', e.message, file.originalPath);
      return;
    }
    // We are done!
    done(result);
  };
};

createJstEjsPreprocessor.$inject = ['args', 'config.JstEjsPreprocessor', 'logger', 'helper'];

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:jst-ejs': ['factory', createJstEjsPreprocessor]
};