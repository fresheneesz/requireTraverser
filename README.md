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
```
var rt = require('require-traverser')
```

Two ways to call `rt`:

* one module: `<directory>`, `<module>`, [`<opts>`,] `<errback>`
* multiple modules: `<moduleList>`, [`<opts>`,] `<errback>`

where
	
* `<directory>` is the directory path from which to search for the module
* `<module>` is the module to get dependencies from
* `<moduleList>` is an array of objects like: {dir: <directory>, module: <module>}
* `<errback>` is a standard node.js errback
* `<opts>` is optional, and can have any of the parameters:
    * isFile - function to asynchronously test whether a file exists. Takes the same parameters as fs.isFile.
    * readFile - function to read files asynchronously. Takes the same parameters as fs.readFile.

`rt` returns (to the errback) an object like:
```
{<filename>:
  {resolved: <dependencies>,
   unresolved: <require expressions that couldn't be resolved>,
   unfound: <require dependencies that couldn't be found>
  }
}
```

`rt` doesn't resolve node.js native libraries (returns them as 'unfound').

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT