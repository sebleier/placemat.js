#!/usr/local/bin/node

var fs = require('fs'),
	uglify = require('uglify-js')

var placematJS = fs.readFileSync(__dirname + '/placemat.js').toString(),
	jsonJS = fs.readFileSync(__dirname + '/lib/json.js').toString(),
    storeJS = fs.readFileSync(__dirname + '/lib/store.js').toString(),
    xregexpJS = fs.readFileSync(__dirname + '/lib/xregexp.js').toString(),
	copy = '/* Copyright (c) 2011-2012 Sean Bleier */'

console.log('building and minifying...')
buildFile([copy, jsonJS, storeJS, xregexpJS, placematJS].join(''), 'placemat.min.js')
console.log('done')

function buildFile(js, name) {
	var ast = uglify.parser.parse(js)
	ast = uglify.uglify.ast_mangle(ast)
	ast = uglify.uglify.ast_squeeze(ast)
	var minifiedJS = uglify.uglify.gen_code(ast)
	fs.writeFile(__dirname + '/' + name, copy + '\n' + minifiedJS)
}

