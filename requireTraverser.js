/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
'use strict';

// todo:
// * implement true asynchronous version

var fs = require('fs')
var path = require('path')
var Future = require('asyncFuture')

var resolve = require('resolve')
var detective = require('detective')

module.exports = function() {
    try {
		var opts = {}
		if(arguments[0] instanceof Array) { // multiple modules
			var dependencies = arguments[0]
            if(arguments.length <= 2) {
				var errback = arguments[1]
			} else {
            	opts = arguments[1]
            	var errback = arguments[2]
			}
		} else { 							// one module
			var dependencies = [{dir: arguments[0], module: arguments[1]}]
            if(arguments.length <= 3) {
				var errback = arguments[2]
			} else {
            	opts = arguments[2]
            	var errback = arguments[3]
			}
		}

        var modulesToTraverse = dependencies.map(function(dependency) {
            return resolveDependencyFileName(dependency.dir, dependency.module, opts)
        })

        Future.all(modulesToTraverse).then(function(modules) {
			var dependencyMap = {}
			traverse(modules, dependencyMap, opts)	
			errback(undefined, dependencyMap)
		}).catch(errback)
    }catch(e) {
        errback(e)
    }
}

// takes two arguments:
    // an array of objects like: {dir: <base directory>, module: <module>}, and
    // a cache of the already-parsed file paths
// mutates dependencyMap, adding more dependencies
var traverse = function(dependencies, dependencyMap, opts) {
    dependencies.forEach(function(dependencyFile) {
        if(dependencyMap[dependencyFile] === undefined) { // only traverse a file if it hasn't already been traversed
            var filePath = path.resolve(dependencyFile)
            var fileDirectory = path.dirname(filePath)
            var source = fs.readFileSync(dependencyFile)
            var detectiveWork = detective.find(source)

            var subdependencies = []
            var unfoundSubDependencies = []
            var futures = []
            detectiveWork.strings.forEach(function(subdependency) {
                futures.push(resolveDependencyFileName(fileDirectory, subdependency, opts).then(function(file) {
					Future.wrap(fs, 'exists')(file).then(function(exists) {
						if(exists) {
		                    subdependencies.push({relative: subdependency, absolute: file})
		                } else {
		                    unfoundSubDependencies.push(subdependency)
		                }	
					})
				}))
            })

			Future.all(futures).then(function() {
	            dependencyMap[dependencyFile] = {   resolved: subdependencies,
	                                                unresolved: detectiveWork.expressions,
	                                                unfound: unfoundSubDependencies}
	
	            var newDependencies = subdependencies.map(function(subdependency) {
	                return subdependency.absolute
	            })
	
	            traverse(newDependencies, dependencyMap, opts)	            
			})
        }
    })
}

function resolveDependencyFileName(directory, dependency, opts) {
	opts.basedir = directory
    return Future.wrap(resolve)(dependency, opts).catch(function(e) {
		if(e.message.indexOf("Cannot find module") === 0) {
            return null
        } else {
            throw e // unknown error
        }
	})

}