#!/usr/local/bin/node

var fs = require('fs')

var placematJS = fs.readFileSync(__dirname + '/src/placemat.js').toString(),
	jsonJS = fs.readFileSync(__dirname + '/lib/json.js').toString(),
    storeJS = fs.readFileSync(__dirname + '/lib/store.js').toString(),
    xregexpJS = fs.readFileSync(__dirname + '/lib/xregexp.js').toString(),
	copy = '/* Copyright (c) 2011-2012 Sean Bleier */'

console.log('building...')
buildFile([jsonJS, storeJS, xregexpJS, placematJS].join('\n\n'), 'placemat.js')
console.log('done')

function buildFile(js, name) {
	fs.writeFile(__dirname + '/' + name, copy + '\n' + js)
}

