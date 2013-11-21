/**
 * Utils
 */

// Node.js
var fs    = require('fs');
var path  = require('path');

// node_modules
var grunt = require('grunt');
var frep = require('frep');
var _ = require('lodash');


exports.meta = function (key, obj) {
  if (_.isUndefined(key)) {
    return {};
  } else if (_.isString(obj[key])) {
    return String(obj[key]) || "";
  } else if (_.isObject(obj[key])) {
    return JSON.stringify(obj[key], null, 2) || {};
  } else {
    return null;
  }
};


exports.dataFileReaderFactory = function(filepath) {
  var ext = path.extname(filepath);
  var reader = grunt.file.readJSON;
  switch(ext) {
    case '.json':
      grunt.verbose.writeln('>> Reading JSON'.yellow);
      reader = grunt.file.readJSON;
      break;
    case '.yml':
    case '.yaml':
      grunt.verbose.writeln('>> Reading YAML'.yellow);
      reader = grunt.file.readYAML;
      break;
  }
  return reader(filepath);
};


exports.optionsDataFormatFactory = function(data) {
  var metadata;
  if (_.isString(data) || _.isArray(data)) {

    data.map(function(val) {
      grunt.verbose.ok('Type:'.yellow, grunt.util.kindOf(val));
      // Skip empty data files to avoid compiler errors
      if (_.isString(val)) {
        grunt.file.expand(val).forEach(function(filepath) {
          var checkForContent = grunt.file.read(filepath);
          if (checkForContent.length === 0 || checkForContent === '') {
            grunt.verbose.warn('Skipping empty path:'.yellow, val);
          } else {
            var parsedData = exports.dataFileReaderFactory(filepath);
            metadata = grunt.config.process(_.extend({}, metadata, parsedData));
            grunt.verbose.ok('metadata:'.yellow, metadata);
          }
        });
      }
      if (_.isObject(val)) {
        metadata = grunt.config.process(_.extend({}, metadata, val));
        grunt.verbose.ok('metadata:'.yellow, metadata);
      }
    });
  } else if (_.isObject(data)) {
    metadata = data;
  } else {
    metadata = {};
  }
  return metadata;
};



exports.compileTemplate = function (src, dest, options, fn) {
  options = options || {};

  var output = grunt.template.process(src, {
    data: options.data || {},
    delimiters: options.delimiters || 'readme'
  });

  function postprocess(src, fn) {return fn(src);}
  var fallbackFn = function(src) {return src;};
  output = postprocess(output, fn || fallbackFn);

  grunt.file.write(dest, output);
  grunt.verbose.ok('Created:', dest);
};


/**
 * Replacement patterns
 */
var arr = [
  {
    pattern: /^`#/gm,
    replacement: '#'
  },
  {
    pattern: /\[\%/g,
    replacement: '{%'
  },
  {
    pattern: /\%\]/g,
    replacement: '%}'
  },
  {
    pattern: /^\s*/,
    replacement: ''
  },
  {
    pattern: /\s*\{{!(--)?.+(--)?}}/g,
    replacement: ''
  }
];

exports.frep = function(str) {
  return frep.strWithArr(str, arr);
};
