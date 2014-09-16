**Status**: API finalized, needs testing

requireTraverser
=============

A library for finding all the nested dependencies of a commonJS/node.js module. Uses 'detective' to traverse files.

Install
=======

```
npm install require-traverser
```

Usage
=====
```javascript
var rt = require('require-traverser')
```

Two ways to call `rt`:

* one module: `<directory>`, `<module>`, [`<opts>`,] `<errback>`
* multiple modules: `<moduleList>`, [`<opts>`,] `<errback>`

where

* `<directory>` is the directory path from which to search for the module
* `<module>` is the module to get dependencies from
* `<moduleList>` is an array of objects like: {dir: <directory>, module: <module>}
* `<errback>` is a standard node.js errback (where the first parameter is the error, undefined if there was none, and the second parameter is the return value)
* `<opts>` is optional, and can have any of the parameters:
    * isFile - function to asynchronously test whether a file exists. Takes the same parameters as fs.isFile.
    * readFile - function to read files asynchronously. Takes the same parameters as fs.readFile.

`rt` returns (to the errback) an object like:
```
{<filename>:
  {resolved: [
     {relative: <modulePath>, absolute: <absolute filesystem path>},
     ...
   ],
   unresolved: <require expressions that couldn't be resolved>,
   unfound: <require dependencies that couldn't be found>
  }
}
```

Example traversed module:
```
require("./testModule/")
var x = "whatever"
require(x)
require('dep'+'endency')
require("http")
require("url")
```

Example result:
```
{"/home/vagrant/temporaryPackageFolder/node_modules/http-proxy/lib/http-proxy.js":
    {"resolved":[
        {"relative":"./testModule/","absolute":"/home/vagrant/temporaryPackageFolder/node_modules/testModule/lib/testModule.js"}
     ],
     "unresolved":["'dep'+'endency'", "x"],
     "unfound":["http","url"]
    }
}
```

`rt` doesn't resolve node.js native libraries (returns them as 'unfound').

Todo
========

* When node-resolve accepts my pull request, switch back to the main repo

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/requireTraverserTest.js) to verify that your change
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request

Change Log
==========

* 0.1.8 - fixed a bug resolving modules where there is a folder and javascript file with the same name in the same location
* 0.1.6 - fixed a bug in error handling when initial modules can't be found

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
