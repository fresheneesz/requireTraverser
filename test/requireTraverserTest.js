"use strict";

var path = require("path")
var Unit = require('deadunit')
var Future = require('asyncFuture')

var futures = []
var test = Unit.test("Testing requireTraverser", function() {
    var tr = require('../requireTraverser')
    var t = this

    this.test("one module", function() {
        t = this
        var f = new Future
        futures.push(f)
		tr(__dirname, './testFiles/inner/analyzeThis.js', function(e,files) {
			testCallback(e,files)
			f.return()
		});
    })
    this.test("multiple module", function() {
        t = this
        var f = new Future
        futures.push(f)
        tr([{dir:__dirname, module:'./testFiles/inner/analyzeThis.js'},
            {dir:__dirname, module:'./testFiles/node_modules/doom.js'}
            ], function(e,files) {
				testCallback(e,files)
				f.return()
		});
    })
    this.test("one module with options", function() {
        t = this
        var f = new Future
        futures.push(f)
        tr(__dirname, './testFiles/inner/analyzeThis.js', {isFile: isFile, readFile: readFile}, function(e, files) {
            t.log("files" +files)
            f.return()
        });
    })

    function isFile(filepath, errback) {
		var analyzeThisPath = path.resolve('testFiles/inner/analyzeThis.js')
		console.log("OMG: "+(filepath === analyzeThisPath))
        if(filepath === analyzeThisPath) {
            return errback(undefined, true)
        } else {
            return errback(undefined, false)
        }
    }

    function readFile(filepath, errback) {
        console.log("OMG2: "+filepath)
		if(module === 'test') {
            return "var x = 5"
        } else {
            throw new Error('File not "found"')
        }
    }

    function testCallback(e, files) {
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

        console.log('\n'+r('../../node_modules/curl/src/curl.js')+'\n')

        function basicTest(filePath, resolved, unresolved, unfound) {
            var info = files[filePath]
            this.ok(info)

            this.ok(info.resolved.length === resolved)
            this.ok(info.unresolved.length === unresolved)
            this.ok(info.unfound.length === unfound)

            return info
        }

        t.test("analyzeThis.js", function() {
            var info = basicTest.call(this, analyzeThis, 5, 2, 3)
            var resolved = info.resolved

            this.ok(resolved[0].relative === './dependencyA')
            this.ok(resolved[0].absolute === dependencyA)
            this.ok(resolved[1].relative === 'c')
            this.ok(resolved[1].absolute === c)
            this.ok(resolved[2].relative === 'doom')
            this.ok(resolved[2].absolute === doom)
            this.ok(resolved[3].relative === 'moose')
            this.ok(resolved[3].absolute === moose)
            this.ok(resolved[4].relative === 'a')
            this.ok(resolved[4].absolute === a)

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

        console.dir(files)

    }

})

console.log("FUTURES: "+futures)
console.log("io: "+(futures[0] instanceof Future))
futures[0].then(function() {
	console.log("WUT2")
})
Future.all(futures).then(function() {
	console.log("WUT")
	test.writeConsole()	
})

function resolveRelativePath(relativePath) {
    return path.resolve(__dirname, 'testFiles/', relativePath)
}

