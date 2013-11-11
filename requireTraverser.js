/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License */
'use strict';

var fs = require('fs')
var path = require('path')
var Future = require('async-future')

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
            var undefinedModules = []
            modules.forEach(function(module, n) {
                if(module === undefined)
                    undefinedModules.push(dependencies[n].module)
            })

            if(undefinedModules.length > 0)
                throw Error("Can't find modules: "+undefinedModules)


            var dependencyMap = {}
            return traverse(modules, dependencyMap, opts)

		}).then(function(dependencyMap) {
            errback(undefined, dependencyMap)

        }).catch(errback).done()
    }catch(e) {
        errback(e)
    }
}

// takes two arguments:
    // an array of objects like: {dir: <base directory>, module: <module>}, and
    // a cache of the already-parsed file paths
// mutates dependencyMap, adding more dependencies
// returns a future
var traverse = function(dependencies, dependencyMap, opts) {
    var mainFutures = []
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
					if(file === undefined)
                        var exists = Future(false)
                    else {
                        var exists = new Future
                        fs.exists(file, function(result) {
							exists.return(result)
						})
					}

                    return exists.then(function(exists) {
                        if(exists) {
                            subdependencies.push({relative: subdependency, absolute: file})
                        } else {
                            unfoundSubDependencies.push(subdependency)
                        }
                    })
				}))
            })

			mainFutures.push(Future.all(futures).then(function() {
	            dependencyMap[dependencyFile] = {   resolved: subdependencies,
	                                                unresolved: detectiveWork.expressions,
	                                                unfound: unfoundSubDependencies}
	
	            var newDependencies = subdependencies.map(function(subdependency) {
	                return subdependency.absolute
	            })
	
	            return traverse(newDependencies, dependencyMap, opts)
			}))
        }
    })
    
    var result = Future.all(mainFutures).then(function() {
        return Future(dependencyMap)
    })

    return result
}

// returns Future(<filename>) or Future(undefined)
function resolveDependencyFileName(directory, dependency, opts) {
	opts.basedir = directory
    return Future.wrap(resolve)(dependency, opts)
				.catch(function(e) {
					if(e.message.indexOf("Cannot find module") === 0) {
			            return Future(undefined)
			        } else {
						throw e // unknown error
			        }
				})

}