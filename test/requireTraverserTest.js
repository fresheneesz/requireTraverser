"use strict";

var path = require("path")
var Unit = require('deadunit')
var Future = require('async-future')
Future.debug = true

var futures = []
var test = Unit.test("Testing requireTraverser", function() {
    var tr = require('../requireTraverser')

    this.test("unfound dependency", function() {
        var t = this
        var f = new Future
        //futures.push(f)
		tr(__dirname, 'nonexistant', function(e,files) {
			f.return()
            t.ok(e.message === "Can't find modules: nonexistant", e.message)
		});
    })

    this.test("one module", function() {
        var t = this
        var f = new Future
        futures.push(f)
		tr(__dirname, './testFiles/inner/analyzeThis.js', function(e,files) {
			//console.dir(files)
			//console.dir(e)
			testCallback(t, e,files)
			f.return()
		});
    })
    this.test("multiple module", function() {
        var t = this
        var f = new Future
        futures.push(f)
        tr([{dir:__dirname, module:'./testFiles/inner/analyzeThis.js'},
            {dir:__dirname, module:'./testFiles/node_modules/doom.js'}
            ], function(e,files) {
				testCallback(t, e,files)
				f.return()
		});
    })
    this.test("one module with options", function() {
        var t = this
        var f = new Future
        futures.push(f)
        tr(__dirname, './testFiles/inner/analyzeThis.js', {isFile: isFile, readFile: readFile}, function(e, files) {
            t.log("files" +files)
            f.return()
        });
    })

    function isFile(filepath, errback) {
		var analyzeThisPath = path.resolve('testFiles/inner/analyzeThis.js')
        if(filepath === analyzeThisPath) {
            return errback(undefined, true)
        } else {
            return errback(undefined, false)
        }
    }

    function readFile(filepath, errback) {
		if(module === 'test') {
            return "var x = 5"
        } else {
            throw new Error('File not "found"')
        }
    }

    function testCallback(t, e, files) {
        if(e) throw e

        var r = resolveRelativePath


        var keys = []
        for(var n in files) {
            keys.push(n)
        }

        t.ok(keys.length === 7)

        var analyzeThis = r('inner/analyzeThis.js')
        var dependencyA = r('inner/dependencyA.js')
        var doom = r('node_modules/doom.js')
        var a = r('inner/node_modules/a.js')
        var c = r('inner/node_modules/c.js')
        var d = r('inner/node_modules/d.js')
        var moose = r('inner/node_modules/moose.js')
        var curl = r('../../../node_modules/curl/src/curl.js')

        function basicTest(filePath, resolved, unresolved, unfound) {
            var info = files[filePath]
            this.ok(info)

            this.ok(info.resolved.length === resolved, info.resolved.length)
            this.ok(info.unresolved.length === unresolved)
            this.ok(info.unfound.length === unfound)

            return info
        }

        t.test("analyzeThis.js", function() {
            var info = basicTest.call(this, analyzeThis, 5, 2, 3)
            var resolved = info.resolved

            var moduleToIndex = {} // maps from module  name to its index in the array 'resolved'
            resolved.forEach(function(v, n) {
                moduleToIndex[v.relative] = n
            })

            // check if each dependency exists, and has the right absolute path
            var dep = './dependencyA'
            this.ok(dep in moduleToIndex)
            this.ok(resolved[moduleToIndex[dep]].absolute === dependencyA)
            dep = 'c'
            this.ok(dep in moduleToIndex)
            this.ok(resolved[moduleToIndex[dep]].absolute === c)
            dep = 'moose'
            this.ok(dep in moduleToIndex)
            this.ok(resolved[moduleToIndex[dep]].absolute === moose)
            dep = 'doom'
            this.ok(dep in moduleToIndex)
            this.ok(resolved[moduleToIndex[dep]].absolute === doom)
            dep = 'a'
            this.ok(dep in moduleToIndex)
            this.ok(resolved[moduleToIndex[dep]].absolute === a)

            this.ok(info.unresolved[0] === "'dep' + 'endency'")
            this.ok(info.unresolved[1] === 'x')

            this.ok(info.unfound[0] === 'util')
            this.ok(info.unfound[1] === 'fs')
            this.ok(info.unfound[2] === 'curl')

        })

        t.test("dependencyA.js", function() {
            var info = basicTest.call(this, dependencyA, 0, 0, 0)
        })

        t.test("c.js", function() {
            var info = basicTest.call(this, c, 1, 0, 0)
            var resolved = info.resolved

            this.ok(resolved[0].relative === './d')
            this.ok(resolved[0].absolute === d)
        })

        t.test("doom.js", function() {
            var info = basicTest.call(this, doom, 0, 0, 0)
        })

        t.test("moose.js", function() {
            var info = basicTest.call(this, moose, 0, 0, 0)
        })

        t.test("a.js", function() {
            var info = basicTest.call(this, a, 1, 0, 0)

            this.ok(info.resolved[0].relative === 'c')
            this.ok(info.resolved[0].absolute === c)
        })
    }

})

Future.all(futures).then(function() {
	test.writeConsole()	
})

function resolveRelativePath(relativePath) {
    return path.resolve(__dirname, 'testFiles/', relativePath)
}

