(function() {
    var require = function(what) {
        what = what.split('/');
        var where = window;
        while(what.length) {
            where = where[what.shift()];
        };
        return where;
    };
    var getExports = function(file) {
        var where = window,
            what = file == 'index' ? [] : file.split('/'),
            incoming;
        what.unshift('plate');
        while(what.length) {
            incoming = what.shift();
            if(!where[incoming]) {
                where[incoming] = {};
            }
            where = where[incoming];
        }
        return where;
    };


        (function(exports) {
            var SafeString = function(str) {
    this.str = str;
    this.isSafe = true;
};

SafeString.prototype.toString = function() {
    return this.str;
};

var escapeHTML = function(data) {
    var html = data.toString();
    html = html.replace(/\&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;').
        replace(/"/g, '&quot;').
        replace(/'/g, '&#39;');
    html.isSafe = true;
    return html;
};

exports.escapeHTML = escapeHTML;
exports.SafeString = SafeString;

        })(getExports('utils'));

        (function(exports) {
            var utils = require('plate/utils');

var Node = function() {
    this.init.apply(this, Array.prototype.slice.call(arguments));
};

Node.prototype.toString = function() {
    return this.name;
};

Node.subclass = function(name, opts) {
    var F = function(){},
        SC = function() {
            Node.apply(this, Array.prototype.slice.call(arguments));
        };
    F.prototype = Node.prototype;
    SC.prototype = new F();
    for(var name in opts) if(opts.hasOwnProperty(name)) {
        SC.prototype[name] = opts[name];
    }
    return SC;
};

var FilterNode = Node.subclass('FilterNode', {
    init:function(filtervar) {
        this.filtervar = filtervar;
    },
    render:function(context, callback) {
        this.filtervar(context, function(err, data) {
            if(err) {
                // swallow filternode errors
                callback(null, '');
            } else {
                var isSafe = data.isSafe;
                data = data === undefined || data === null ? '' : data.toString();
                if(!isSafe) {
                    data = utils.escapeHTML(data);
                }
                callback(null, data);
            }
        });
    }
});

var NodeList = function(nodes) {
    this.nodes = nodes;
};

NodeList.prototype.getNodesByType = function(type) {
    var output = [];
    for(var i = 0, len = this.nodes.length; i < len; ++i) {
        if(this.nodes[i] instanceof type) {
            output.push(this.nodes[i]);
        }
    }
    return output;
};

NodeList.prototype.render = function(context, callback) {
    var length = this.nodes.length,
        nodes = this.nodes,
        index = -1,
        output = [],
        eterator = function(err, data) {
            var callee = arguments.callee;
            if(err) {
                callback(err, null);
            } else {
                output.push(data);
                ++index;
                if(index < length) {
                    try {
                        nodes[index].render(context._copy(), callee);
                    } catch(err) {
                        callback(err, null);
                    }
                } else {
                    callback(null, output.slice(1).join(''));
                }
            }
        };
    eterator();
};

exports.Node = Node;
exports.FilterNode = FilterNode;
exports.NodeList = NodeList;

        })(getExports('nodes'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var BLOCK_CONTEXT_KEY = 'block_context';

var BlockContext = function() {
    this.blocks = {};
};

BlockContext.prototype.addBlocks = function(blocks) {
    var self = this,
        pushOrCreate = function(name, block) {
        if(self.blocks[name]) {
            self.blocks[name].unshift(block);
        } else {
            self.blocks[name] = [block];
        }
    };

    for(var name in blocks) if(blocks.hasOwnProperty(name)) {
        pushOrCreate(name, blocks[name]);
    }
};

BlockContext.prototype.pop = function(name) {
    if(this.blocks[name]) {
      return this.blocks[name].pop();
    } else return null;
};

BlockContext.prototype.push = function(name, block) {
    this.blocks[name].push(block);
};

BlockContext.prototype.getBlock = function(name) {
    if(this.blocks[name]) {
        return this.blocks[name].slice(-1)[0];
    }
    return null;
};

var BlockNode = Node.subclass('BlockNode', {
    init:function(name, nodelist) {
        this.name = name;
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        var self = this,
            blockContext = context[BLOCK_CONTEXT_KEY];
        if(blockContext) {
            var block, push;
            push = block = blockContext.pop(this.name);
            if(!block) {
                block = this;
            }
            block = new BlockNode(block.name, block.nodelist);
            block.context = context;
            block.context['block'] = block;
            context.block = block;
            block.nodelist.render(context, function(err, data) {
                if(push) {
                    blockContext.push(self.name, push);
                }
                callback(err, data);
            });
        } else {
            context.block = this;
            this.nodelist.render(context, callback);
        }
    },
    _super:function(callback) {
        if(this.context[BLOCK_CONTEXT_KEY] && this.context[BLOCK_CONTEXT_KEY].getBlock(this.name)) {
            this.context[BLOCK_CONTEXT_KEY].getBlock(this.name).render(this.context, callback);
        } else {
            callback(null, '');
        }
    }
});

BlockNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        blockName = bits[1],
        loadedBlocks = parser.__loadedBlocks || [];

    for(var i = 0, len = loadedBlocks.length; i < len; ++i) {
        if(loadedBlocks[i] === blockName) {
            throw new Error("block tag with name '"+blockName+"' appears more than once");
        }
    }
    loadedBlocks.push(blockName);
    parser.__loadedBlocks = loadedBlocks;

    var nodeList = parser.parse(['endblock']);
    parser.tokens.shift();

    return new BlockNode(blockName, nodeList);
};

exports.BlockNode = BlockNode;
exports.BlockContext = BlockContext;
exports.BLOCK_CONTEXT_KEY = BLOCK_CONTEXT_KEY;

        })(getExports('tags/block'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node,
    blocktag = require('plate/tags/block'),
    BlockContext = blocktag.BlockContext,
    BlockNode = blocktag.BlockNode,
    BLOCK_CONTEXT_KEY = blocktag.BLOCK_CONTEXT_KEY;

var ExtendsNode = Node.subclass('ExtendsNode', {
    init:function(parent_expr, nodelist, loader_plugin) {
        this.parent_expr = parent_expr;
        this.nodelist = nodelist;
        this.loader_plugin = loader_plugin;
        var blocks = this.nodelist.getNodesByType(BlockNode),
            outblocks = {};
        for(var i = 0, len = blocks.length; i < len; ++i) {
            outblocks[blocks[i].name] = blocks[i];
        }
        this.blocks = outblocks;
    },
    render:function(context, callback) {
        var self = this,
            plate = require('plate');
        self.parent_expr(context, function(err, tpl) {
            if(err) {
                callback(err, null);
            } else {
                var fn = tpl instanceof plate.Template ? function(tpl, callback) { callback(null, tpl); } :
                         function(tpl, callback) { self.loader_plugin(tpl, callback); };
                fn(tpl, function(err, template) {
                    if(!context[BLOCK_CONTEXT_KEY]) {
                        context[BLOCK_CONTEXT_KEY] = new BlockContext();
                    }
                    var blockContext = context[BLOCK_CONTEXT_KEY];
                    blockContext.addBlocks(self.blocks);
                    var blocks = {},
                        nodeList = template.getNodeList();
                    for(var i = 0, len = nodeList.nodes.length; i < len; ++i) {
                        var node = nodeList.nodes[i];
                        if(!(node instanceof ExtendsNode)) {
                            var nodes = nodeList.getNodesByType(BlockNode),
                                outnodes = {};
                            for(var j = 0, jlen = nodes.length; j < jlen; ++j) {
                                outnodes[nodes[j].name] = nodes[j];
                            }
                            blockContext.addBlocks(outnodes);
                            break;
                        }
                    }
                    template.render(context, callback);
                });
            }
        });
    }
});

ExtendsNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        parent = parser.compileFilter(bits[1]),
        nodelist = parser.parse();
    var loader = null;
    try {
        loader = parser.pluginLibrary.lookup('loader');
    } catch(err) {}

    return new ExtendsNode(parent, nodelist, loader);
};

exports.ExtendsNode = ExtendsNode;

        })(getExports('tags/extends'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var ForNode = Node.subclass('ForNode', {
    init:function(from, to, inner, outer, reversed) {
        this.from = from;
        this.to = to;
        this.inner = inner;
        this.outer = outer;
        this.reversed = reversed;
    },
    render:function(context, callback) {
        var self = this,
            parentloop = {};

        if(context.forloop) {
            for(var name in context.forloop) if(context.forloop.hasOwnProperty(name)) {
                parentloop[name] = context.forloop[name];
            }
        }

        self.from(context, function(err, values) {
            if(err) {
                callback(err, null);
            } else {
                if(self.reversed) {
                    values = Array.prototype.reverse.call(
                        Array.prototype.slice.call(values)
                    );
                }
                if(values && values.length) {
                    var index = -1,
                        accum = [],
                        length = values.length,
                        eterator = function(err, data) {
                            var callee = arguments.callee;

                            if(err) {
                                callback(err, null);
                            } else {
                                accum.push(data);
                                ++index;
                                if(index < length) {
                                    var ctxt = self.createContext(
                                        context,
                                        parentloop,
                                        values[index],
                                        index,
                                        length
                                    );
                                    self.inner.render(ctxt, callee);
                                } else {
                                    callback(null, accum.slice(1).join(''));
                                }
                            }
                        };
                    eterator(null, null);
                } else {
                    self.outer.render(context, callback);
                }
            }
        });
    },
    createContext:function(ctxt, parentloop, values, index, length) {
        var output = ctxt._copy();
        if(this.to.length > 1) {
            for(var i = 0, len = this.to.length; i < len; ++i) {
                ctxt[this.to[i]] = values[i];
            }
        } else {
            ctxt[this.to[0]] = values;
        }

        var forLoop = {
                counter:index+1,
                counter0:index,
                revcounter:length-index,
                revcounter0:length-(index+1),
                first:index == 0,
                last:index == (length-1),
                parentloop:parentloop
            };
        ctxt.forloop = forLoop;
        return ctxt;
    }
});

// {% for (x | x, y...) in (var) [reversed] %}
ForNode.parse = function(contents, parser) {
    var bits = contents.replace(/\s*$/,'').split(/\s+/g),
        reversed = bits.slice(-1)[0] === 'reversed',
        in_index = (function() {
            for(var i = 0, len = bits.length; i < len; ++i) {
                if(bits[i] == 'in') { return i; }
            }
            throw new Error("for tag must include 'in'");
        })(),
        variable_bits = bits.slice(1, in_index),
        unpack = [],
        arrayVar = parser.compileFilter(bits[in_index+1]),
        nodelist = parser.parse(['empty', 'endfor']),
        empty = new NodeList([]);


    if(parser.tokens.shift().isOneOf(['empty'])) {
        empty = parser.parse(['endfor']);
        parser.tokens.shift();
    }

    for(var i = 0, len = variable_bits.length; i < len; ++i) {
        var innerbits = variable_bits[i].split(',');

        for(var j = 0, jlen = innerbits.length; j < jlen; ++j) {
            if(innerbits[j].length > 0) {
                unpack.push(innerbits[j]);
            }
        }
    }

    return new ForNode(arrayVar, unpack, nodelist, empty, reversed);
};

exports.ForNode = ForNode;

        })(getExports('tags/for'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var keys = Object.keys instanceof Function ?
                function(obj) { return Object.keys(obj); } :
                function(obj) {
                    var accum = [];
                    for(var n in obj) if(obj.hasOwnProperty(n)) {
                        accum.push(n);
                    }
                    return accum;
                };

var InfixOperator = function(bp, cmp) {
    this.lbp = bp;
    this.cmp = cmp;
};

InfixOperator.prototype.nud = function(parser) {
    throw new Error("Unexpected token");
};

InfixOperator.prototype.led = function(lhs, parser) {
    this.first = lhs;
    this.second = parser.expression(this.lbp);
    return this;
};

InfixOperator.prototype.evaluate = function(context, callback) {
    var self = this;
    self.first.evaluate(context, function(err, x) {
        self.second.evaluate(context, function(err, y) {
            callback(err, self.cmp(x, y));
        });
    });
};

var PrefixOperator = function(bp, cmp) {
    this.lbp = bp;
    this.cmp = cmp;
};

PrefixOperator.prototype.nud = function(parser) {
    this.first = parser.expression(this.lbp);
    this.second = null;
    return this;
};

PrefixOperator.prototype.led = function(first, parser) {
    throw new Error("Unexpected token");
};

PrefixOperator.prototype.evaluate = function(context, callback) {
    var self = this;
    self.first.evaluate(context, function(err, x) {
        callback(err, self.cmp(x));
    });
};

var LiteralToken = function(value, original) {
    this.lbp = 0;
    this.value = value;
    this.original = original;
};

LiteralToken.prototype.toString = function() {
    return '<LiteralToken: "'+this.original+'">';
};

LiteralToken.prototype.nud = function(parser) {
    return this;
};

LiteralToken.prototype.led = function() {
    throw new Error();
};

LiteralToken.prototype.evaluate = function(context, callback) {
    this.value(context, callback);
};

var EndToken = function() {
    this.lbp = 0;
};

EndToken.prototype.nud = EndToken.prototype.led = function() { throw new Error(); }

var operators = {
    or: function() {
        return new InfixOperator(6, function(x, y) {
                return x || y;
        });
    },
    and: function() {
        return new InfixOperator(7, function(x, y) {
                return x && y;
        });
    },
    not: function() {
        return new PrefixOperator(8, function(x) {
            return !x;
        });
    },
    'in': function() {
        return new InfixOperator(9, function(x, y) {
            if(!(x instanceof Object) && y instanceof Object) {
                y = keys(y);
            }

            if(typeof(x) == 'string' && typeof(y) =='string') {
                return y.indexOf(x) !== -1;
            }

            for(var found = false, i = 0, len = y.length; i < len && !found; ++i) {
                var rhs = y[i];
                if(x instanceof Array) {
                    for(var idx = 0,
                        equal = x.length == rhs.length,
                        xlen = x.length;
                        idx < xlen && equal; ++idx) {

                        equal = (x[idx] === rhs[idx]);
                    }
                    found = equal;
                } else if(x instanceof Object) {
                    if(x === rhs) {
                        return true;
                    }
                    var xkeys = keys(x),
                        rkeys = keys(rhs);

                    if(xkeys.length === rkeys.length) {
                        for(var i = 0, len = xkeys.length, equal = true;
                            i < len && equal;
                            ++i) {
                            equal = xkeys[i] === rkeys[i] &&
                                    x[xkeys[i]] === rhs[rkeys[i]];
                        }
                        found = equal;
                    }
                } else {
                    found = x == rhs;
                }
            }
            return found;
        });
    },
    'not in': function() {
        return new InfixOperator(9, function(x, y) {
            return !operators['in']().cmp(x,y);
        });
    },
    '=': function() {
        return new InfixOperator(10, function(x, y) {
            return x == y;
        });
    },
    '==': function() {
        return new InfixOperator(10, function(x, y) {
            return x == y;
        });
    },
    '!=': function() {
        return new InfixOperator(10, function(x, y) {
            return x !== y;
        });
    },
    '>': function() {
        return new InfixOperator(10, function(x, y) {
            return x > y;
        });
    },
    '>=': function() {
        return new InfixOperator(10, function(x, y) {
            return x >= y;
        });
    },
    '<': function() {
        return new InfixOperator(10, function(x, y) {
            return x < y;
        });
    },
    '<=': function() {
        return new InfixOperator(10, function(x, y) {
            return x <= y;
        });
    }
};

var IfParser = function(tokens, parser) {
    this.createVariable = function(token) {
        return new LiteralToken(parser.compileFilter(token), token);
    };

    var len = tokens.length,
        i = 0,
        mappedTokens = [],
        token;
    while(i < len) {
        token = tokens[i];
        if(token == 'not' && tokens[i+1] == 'in') {
            ++i;
            token = 'not in';
        }
        mappedTokens.push(this.translateToken(token));
        ++i;
    }
    this.tokens = mappedTokens;
    this.pos = 0;
    this.currentToken = this.next();
};

IfParser.prototype.translateToken = function(token) {
    var op = operators[token];
    if(op === undefined) {
        return this.createVariable(token);
    } else {
        return op();
    }
};

IfParser.prototype.next = function() {
    if(this.pos >= this.tokens.length) {
        return new EndToken();
    }
    return this.tokens[this.pos++];
};

IfParser.prototype.parse = function() {
    var retval = this.expression();
    if(!(this.currentToken instanceof EndToken)) {
        throw new Error("Unused "+this.currentToken+" at end of if expression.");
    }
    return retval;
};

IfParser.prototype.expression = function(rbp) {
    rbp = rbp || 0;
    var t = this.currentToken,
        left;
    this.currentToken = this.next();

    left = t.nud(this);
    while(rbp < this.currentToken.lbp) {
        t = this.currentToken;
        this.currentToken = this.next();
        left = t.led(left, this);
    }
    return left;
};

var IfNode = Node.subclass('IfNode', {
    init:function(predicate, ifTrue, ifFalse) {
        this.predicate = predicate;
        this.ifTrue = ifTrue;
        this.ifFalse = ifFalse;
    },
    render:function(context, callback) {
        var self = this;
        self.predicate.evaluate(context, function(err, data) {
            if(err) {
                callback(err, null);
            } else {
                var which = data ? self.ifTrue : self.ifFalse;
                which.render(context._copy(), callback);
            }
        });
    }
});

IfNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g).slice(1),
        ifparser = new IfParser(bits, parser),
        variable = ifparser.parse(),
        ifTrue = parser.parse(['else', 'endif']),
        nextToken = parser.tokens.shift(),
        ifFalse = nextToken.isOneOf(['else']) ? (function() {
            var ret = parser.parse(['endif']);
            parser.tokens.shift();
            return ret;
        })() : new NodeList([]);
    return new IfNode(variable, ifTrue, ifFalse);
};

exports.IfNode = IfNode;

        })(getExports('tags/if'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var IncludeNode = Node.subclass('IncludeNode', {
    init:function(templatevar, loader) {
        this.templatevar = templatevar;
        this.loader = loader;
    },
    render:function(context, callback) {
        var self = this,
            plate = require('plate');
        self.templatevar(context, function(ctxt, tpl) {
            var fn = tpl instanceof plate.Template ?
                function(tpl, callback) { callback(null, tpl); } :
                self.loader;

            fn(tpl, function(err, template) {
                template.render(context, callback);
            });
        });
    }
});

IncludeNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        templatevar = parser.compileFilter(bits[1]),
        loader;
    try {
        loader = parser.pluginLibrary.lookup('loader');
    } catch(err){}

    return new IncludeNode(templatevar, loader);
};

exports.IncludeNode = IncludeNode;

        })(getExports('tags/include'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var WithNode = Node.subclass('WithNode', {
    init:function(withvar, asvar, nodelist) {
        this.withvar = withvar;
        this.asvar = asvar;
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        var self = this;
        self.withvar(context, function(err, data) {
            if(err) {
                callback(err, null);
            } else {
                context[self.asvar] = data;

                self.nodelist.render(context, callback);
            }
        });
    }
});

WithNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        withvar = parser.compileFilter(bits[1]),
        asvar = bits[3],
        nodelist = parser.parse(['endwith']);

    parser.tokens.shift();
    return new WithNode(withvar, asvar, nodelist);
};

exports.WithNode = WithNode;

        })(getExports('tags/with'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var CommentNode = Node.subclass('CommentNode', {
    init:function(nodelist) {
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        callback(null, '');
    }
});

CommentNode.parse = function(contents, parser) {
    var nodelist = parser.parse(['endcomment']);

    parser.tokens.shift();
    return new CommentNode(nodelist);
};

exports.CommentNode = CommentNode;

        })(getExports('tags/comment'));

        (function(exports) {
            exports.add = function(callback, input, value) {
    callback(null, parseInt(input, 10) + parseInt(value, 10));
};

        })(getExports('filters/add'));

        (function(exports) {
            exports.addslashes = function(callback, input) {
    callback(null, input.toString().replace(/'/g, "\\'"));
};

        })(getExports('filters/addslashes'));

        (function(exports) {
            exports.capfirst = function(callback, input) {
    var str = input.toString();
    callback(null, [str.slice(0,1).toUpperCase(), str.slice(1)].join(''));
};

        })(getExports('filters/capfirst'));

        (function(exports) {
            exports.center = function(callback, input, len, value) {
    var str = input.toString();
    value = value || ' ';
    len -= str.length;
    if(len < 0) {
        callback(null, str);
    } else {
        var len_half = len/2.0,
            arr = [],
            idx = Math.floor(len_half);
        while(idx-- > 0) {
            arr.push(value);
        }
        arr = arr.join('');
        str = arr + str + arr;
        if((len_half - Math.floor(len_half)) > 0) {
            str = input.toString().length % 2 == 0 ? value + str : str + value;
        }
        callback(null, str);
    }
};

        })(getExports('filters/center'));

        (function(exports) {
            exports.cut = function(callback, input, value) {
    var str = input.toString();
    callback(null, str.replace(new RegExp(value, "g"), ''));
};

        })(getExports('filters/cut'));

        (function(exports) {
            exports._default = function(callback, input, def) {
    input ? callback(null, input) : callback(null, def);
};

        })(getExports('filters/default'));

        (function(exports) {
            exports.dictsort = function(callback, input, key) {
    callback(null, input.sort(function(x, y) {
        if(x[key] > y[key]) return 1;
        if(x[key] == y[key]) return 0;
        if(x[key] < y[key]) return -1;
    }));
};

        })(getExports('filters/dictsort'));

        (function(exports) {
            var dictsort = require('plate/filters/dictsort').dictsort;

exports.dictsortreversed = function(callback, input, key) {
    dictsort(function(err, result) {
        if(err) {
            callback(err, null);
        } else {
            callback(null, result.reverse());
        }
    }, input, key);
};

        })(getExports('filters/dictsortreversed'));

        (function(exports) {
            exports.divisibleby = function(callback, input, num) {
    callback(null, input % parseInt(num, 10) == 0);
};

        })(getExports('filters/divisibleby'));

        (function(exports) {
            exports.filesizeformat = function(callback, input) {
    var num = (new Number(input)).valueOf(),
        singular = num == 1 ? '' : 's',
        value = num < 1024 ? num + ' byte'+singular :
                num < (1024*1024) ? (num/1024)+' KB' :
                num < (1024*1024*1024) ? (num / (1024*1024)) + ' MB' :
                num / (1024*1024*1024) + ' GB';
    callback(null, value);
};

        })(getExports('filters/filesizeformat'));

        (function(exports) {
            exports.first = function(callback, input) {
    callback(null, input[0]);
};

        })(getExports('filters/first'));

        (function(exports) {
            exports.floatformat = function(callback, input, val) {
    val = val || -1;
    val = parseInt(val, 10);

    var isPositive = val > 0.0,
        asNumber = (new Number(input)).valueOf(),
        absValue = isPositive ? val : val * -1.0,
        pow = Math.pow(10, val),
        asString;

    // basically shift the number left val digits, chop off decimal, shift back
    asNumber = parseInt(pow * asNumber) / pow;
    asString = asNumber.toString();

    if(isPositive) {
        var split = asString.split('.'),
            decimal = split.length > 1 ? split[1] : '';

        while(decimal.length <= val) {
            decimal += '0';
        }
        asString = [split[0], decimal].join('.');
    }
    callback(null, asString);
};

        })(getExports('filters/floatformat'));

        (function(exports) {
            exports.get_digit = function(callback, input, digit) {
  var isNum = !isNaN(parseInt(input, 10)),
      str = input.toString(),
      len = str.split('').length;

  digit = parseInt(digit, 10);
  if(isNum && !isNaN(digit) && digit <= len) {
    callback(null, str.charAt(len - digit));
  } else {
    callback(null, input);
  }
};

        })(getExports('filters/get_digit'));

        (function(exports) {

        })(getExports('filters/index'));

        (function(exports) {
            exports.iteritems = function(callback, input) {
  var output = [];
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]]);
  }
  callback(null, output);
};

        })(getExports('filters/iteritems'));

        (function(exports) {
            exports.iriencode = function(callback, input) {
  callback(null, input);
};

        })(getExports('filters/iriencode'));

        (function(exports) {
            exports.join = function(callback, input, glue) {
  input = input instanceof Array ? input : input.toString().split('');
  callback(null, input.join(glue));
};

        })(getExports('filters/join'));

        (function(exports) {
            exports.last = function(callback, input) {
  var cb = input.charAt || function(ind) { return input[ind]; };
  callback(null, cb.call(input, input.length-1));
};

        })(getExports('filters/last'));

        (function(exports) {
            exports.length = function(callback, input) {
  var cb = input.length instanceof Function ? input.length : function(lambda) {
    lambda(null, input.length);
  };
  cb.apply(input, [function(err, len) {
    callback(null, len);
  }]);
};

        })(getExports('filters/length'));

        (function(exports) {
            var length = require('plate/filters/length').length;

exports.length_is = function(callback, input, expected) {
  length(function(err, val) {
    callback(err, parseInt(val, 10) === parseInt(expected, 10));
  }, input);
};

        })(getExports('filters/length_is'));

        (function(exports) {
            var utils = require('plate/utils');

exports.linebreaks = function(callback, input) {
  var str = input.toString(),
      paras = str.split('\n\n'),
      out = [];

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'));
  }
  callback(null, new utils.SafeString('<p>'+out.join('</p><p>')+'</p>'));
};

        })(getExports('filters/linebreaks'));

        (function(exports) {
            var utils = require('plate/utils');

exports.linebreaksbr = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/\n/g, '<br />')));
};

        })(getExports('filters/linebreaksbr'));

        (function(exports) {
            exports.linenumbers = function(callback, input) {
  var str = input.toString(),
      bits = str.split('\n'),
      out = [],
      len = bits.length;

  while(bits.length) out.unshift(len - out.length + '. ' + bits.pop());

  callback(null, out.join('\n'));
};

        })(getExports('filters/linenumbers'));

        (function(exports) {
            exports.ljust = function(callback, input, num) {
  var bits = input.toString().split(''),
      difference = num - bits.length;

  // push returns new length of array.
  while(difference > 0) difference = num - bits.push(' ');

  callback(null, bits.join(''));
};

        })(getExports('filters/ljust'));

        (function(exports) {
            exports.lower = function(callback, input) {
  callback(null, input.toString().toLowerCase());
};

        })(getExports('filters/lower'));

        (function(exports) {
            exports.make_list = function(callback, input) {
  input = input instanceof Array ? input : input.toString().split('');

  callback(null, input);
};

        })(getExports('filters/make_list'));

        (function(exports) {

var LETTERS = {
'a': '2', 'b': '2', 'c': '2', 'd': '3', 'e': '3',
'f': '3', 'g': '4', 'h': '4', 'i': '4', 'j': '5', 'k': '5', 'l': '5',
'm': '6', 'n': '6', 'o': '6', 'p': '7', 'q': '7', 'r': '7', 's': '7',
't': '8', 'u': '8', 'v': '8', 'w': '9', 'x': '9', 'y': '9', 'z': '9'
};

exports.phone2numeric = function(callback, input) {
  var str = input.toString().toLowerCase().split(''),
      out = [],
      ltr;

  while(str.length) {
    ltr = str.pop();
    out.unshift(LETTERS[ltr] ? LETTERS[ltr] : ltr);
  }

  callback(null, out.join(''));
};

        })(getExports('filters/phone2numeric'));

        (function(exports) {
            var length = require('plate/filters/length').length;

exports.pluralize = function(callback, input, plural) {
  plural = (plural || 's').split(',');
  var suffix,
      val = Number(input);

  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';
  } else {
    suffix = plural[plural.length-1];
  }
  callback(null, suffix);
};

        })(getExports('filters/pluralize'));

        (function(exports) {
            var length = require('plate/filters/length').length;

exports.random = function(callback, input) {
  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  length(function(err, val) {
      callback(null, cb.apply(input, [Math.floor(Math.random() * val)]));
  }, input);
};

        })(getExports('filters/random'));

        (function(exports) {
            exports.rjust = function(callback, input, num) {
  var bits = input.toString().split(''),
      difference = num - bits.length;

  // push returns new length of array.
  while(difference > 0) difference = num - bits.unshift(' ');

  callback(null, bits.join(''));
};


        })(getExports('filters/rjust'));

        (function(exports) {
            var utils = require('plate/utils');

exports.safe = function(callback, input) {
    callback(null, new utils.SafeString(input));
};

        })(getExports('filters/safe'));

        (function(exports) {
            exports.slice = function(callback, input, by) {
  by = by.toString();
  if(by.charAt(0) === ':') {
    by = '0'+by;
  }
  if(by.charAt(by.length-1) === ':') {
    by = by.slice(0, -1);
  }

  var splitBy = by.split(':'),
    slice = input.slice || (function() {
      input = this.toString();
      return input.slice;
    })();

  callback(null, slice.apply(input, splitBy));
};

        })(getExports('filters/slice'));

        (function(exports) {
            exports.slugify = function(callback, input) {
  input = input.toString();
  callback(null, input.replace(/[^\w\s\d\-]/g, '').replace(/^\s*/, '').replace(/\s*$/, '').replace(/[\-\s]+/g, '-').toLowerCase());
};

        })(getExports('filters/slugify'));

        (function(exports) {
            exports.striptags = function(callback, input) {
  var str = input.toString();
  callback(null, str.replace(/<[^>]*?>/g, ''));
};

        })(getExports('filters/striptags'));

        (function(exports) {
            exports.title = function(callback, input) {
  var str = input.toString(),
      bits = str.split(/\s{1}/g),
      out = [];

  while(bits.length) {
    var word = bits.pop();
    word = word.charAt(0).toUpperCase() + word.slice(1);
    out.push(word);
  }
  out = out.join(' ');
  callback(null, out.replace(/([a-z])'([A-Z])/g, function() { return arguments[2].toLowerCase(); }));
};

        })(getExports('filters/title'));

        (function(exports) {
            exports.truncatewords = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) callback(null, input);
  callback(null, input.split(/\s+/).slice(0, num).join(' ')+'...');
};

        })(getExports('filters/truncatewords'));

        (function(exports) {
            var utils = require('plate/utils');

var ulparser = function(list) {
  var out = [],
      l = list.slice(),
      item;

  while(l.length) {
    item = l.pop();
    if(item instanceof Array) out.unshift('<ul>'+ulparser(item)+'</ul>');
    else out.unshift('</li><li>'+item);
  }

  // get rid of the leading </li>, if any. add trailing </li>.
  return out.join('').replace(/^<\/li>/, '') + '</li>';
};

exports.unordered_list = function(callback, input) {
  callback(null, input instanceof Array ? new utils.SafeString(ulparser(input)) : input);
};

        })(getExports('filters/unordered_list'));

        (function(exports) {
            exports.upper = function(callback, input) {
  callback(null, input.toString().toUpperCase());
};

        })(getExports('filters/upper'));

        (function(exports) {
            exports.urlencode = function(callback, input) {
  callback(null, escape(input.toString()));
};

        })(getExports('filters/urlencode'));

        (function(exports) {
            var utils = require('plate/utils');

exports.urlize = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/])+)/g, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>';
  })));
};

        })(getExports('filters/urlize'));

        (function(exports) {
            var utils = require('plate/utils');

exports.urlizetrunc = function(callback, input, len) {
  var str = input.toString();
  len = parseInt(len, 10) || 1000;
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@])+)/g, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>';
  })));
};


        })(getExports('filters/urlizetrunc'));

        (function(exports) {
            exports.wordcount = function(callback, input) {
  var str = input.toString(),
      bits = str.split(/\s+/g);
  callback(null, bits.length);
};

        })(getExports('filters/wordcount'));

        (function(exports) {
            exports.wordwrap = function(callback, input, len) {
  var words = input.toString().split(/\s+/g),
      out = [],
      len = parseInt(len, 10) || words.length;

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '));
  };
  callback(null, out.join('\n'));
};

        })(getExports('filters/wordwrap'));

        (function(exports) {
            exports.yesno = function(callback, input, map) {
  var ourMap = map.toString().split(','),
      value;

  ourMap.length < 3 && ourMap.push(ourMap[1]);

  value = ourMap[input ? 0 :
                 input === false ? 1 :
                 2];

  callback(null, value);
};

        })(getExports('filters/yesno'));

        (function(exports) {
            var Library = function() {
    this.registry = {};
};

Library.prototype.lookup = function(name) {
    if(this.registry[name]) {
        return this.registry[name];
    }
    throw new Error("Could not find " + name + " !");
};

Library.prototype.register = function(name, item) {
    if(this.registry[name]) {
        throw new Error(name + " is already registered!");
    }
    this.registry[name] = item;
};

var DefaultTagLibrary = function() {
    this.registry = {};

    this.register('with', require('plate/tags/with').WithNode.parse);
    this.register('for', require('plate/tags/for').ForNode.parse);
    this.register('if', require('plate/tags/if').IfNode.parse);

    this.register('extends', require('plate/tags/extends').ExtendsNode.parse);
    this.register('block', require('plate/tags/block').BlockNode.parse);
    this.register('include', require('plate/tags/include').IncludeNode.parse);
    this.register('comment', require('plate/tags/comment').CommentNode.parse);
};

DefaultTagLibrary.prototype = new Library();

var DefaultFilterLibrary = function() {
    this.registry = {};

    var filters = [
      'add',
      'addslashes',
      'capfirst',
      'center',
      'cut',
      ['default', '_default'],
      'dictsort',
      'dictsortreversed',
      'divisibleby',
      'filesizeformat',
      'first',
      'floatformat',
      'get_digit',
      'index',
      'iteritems',
      'iriencode',
      'join',
      'last',
      'length',
      'length_is',
      'linebreaks',
      'linebreaksbr',
      'linenumbers',
      'ljust',
      'lower',
      'make_list',
      'phone2numeric',
      'pluralize',
      'random',
      'rjust',
      'safe',
      'slice',
      'slugify',
      'striptags',
      'title',
      'truncatewords',
      'unordered_list',
      'upper',
      'urlencode',
      'urlize',
      'urlizetrunc',
      'wordcount',
      'wordwrap',
      'yesno'
    ];

    for(var i = 0, len = filters.length; i < len; ++i) {
      var item = filters[i],
          target = item;
      if(item instanceof Array) {
        target = item[1];
        item = item[0];
      }
      try {
      this.register(item, require('plate/filters/'+item)[target]);
      } catch(err) {
        console.log(err.stack);
      }
    }
};

DefaultFilterLibrary.prototype = new Library();

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;

        })(getExports('libraries'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList;

var Parser = function(tokens, tagLib, filterLib, pluginLib) {
    this.tokens = tokens;
    this.tagLibrary = tagLib;
    this.filterLibrary = filterLib;
    this.pluginLibrary = pluginLib;
};

Parser.prototype.parse = function(parse_until_these) {
    var nodes_out = [],
        token = null;

    while(this.tokens.length > 0) {
        token = this.tokens.shift();
        if(token) {
            if(parse_until_these && token.isOneOf(parse_until_these)) {
                this.tokens.unshift(token);
                return new NodeList(nodes_out);
            } else {
                nodes_out.push(token.createNode(this));
            }
        }
    };
    if(parse_until_these) {
        throw new Error("Expected one of '"+parse_until_these.join("', '")+"'");
    }
    return new NodeList(nodes_out);
};

var createBaseResolver = function(content) {
    if({'"':true, "'":true}[content.charAt(0)]) {
        return function(context) {
            return function(args, callback) {
                callback(null, content.slice(1, -1));
            };
        };
    } else if(/^[\d\.]*$/.test(content)) {
        return function(context) {
            return function(args, callback) {
                var asNum = new Number(content);
                callback(null, asNum.valueOf());
            };
        };
    } else {
        var pieces = content.split('.');
        return function(context) {
            return function(args, callback) {
                var index = -1,
                    length = pieces.length,
                    current = context,
                    eterator = function(err, data) {
                        var callee = arguments.callee;
                        if(err) {
                            callback(err, null);
                        } else try {
                            ++index;
                            current = data;
                            if(index < length) {
                                var piece = pieces[index] == 'super' ? '_super' : pieces[index];
                                var next = current[piece];
                                if(next !== undefined && next !== null) {
                                    if(typeof(next) === 'function') {
                                        next = Function.prototype.apply.call(next, current, [callback]);
                                        if(next !== undefined && typeof(next) !== 'function') {
                                            callee(null, next);
                                        }
                                    } else {
                                        callee(null, next);
                                    }
                                } else {
                                    callback(null, null);
                                }
                            } else {
                                callback(null, current);
                            }
                        } catch(e) {
                            callback(e, null);
                        }
                    };
                eterator(null, context);
            };
        };
    }
};

var createFilterResolver = function(filter_fn, args) {
    return function(context) {
        return function(input, callback) {
            // we have to iterate over all of the argument filters
            // and once we've done that, we can call the filter_fn
            var args_out = [];
            var length = args.length,
                index = -1,
                eterator = function(err, data) {
                    var callee = arguments.callee;
                    if(err) {
                        callback(err, null);
                    } else try {
                        args_out.push(data);
                        ++index;
                        if(index < length) {
                            args[index](context, callee);
                        } else {
                            args_out.unshift(callback);
                            filter_fn.apply({}, args_out);
                        }
                    } catch(e) {
                        callback(e, null);
                    }
                };
            eterator(null, input);
        };
    };
};

Parser.prototype.compileFilter = function(content) {
    content = content.replace(/^\s*/g,'').replace(/\s*$/g, '');
    var self = this;
    var pipe_split = content.split('|'),
        filter_chain = (function (items) {
            var output = [],
                item_split = [];
            for(var i = 0, len = items.length; i < len; ++i) {
                item_split = items[i].split(':');
                for(var j = 1, arglen = item_split.length; j < arglen; ++j) {
                    item_split[j] = self.compileFilter(item_split[j]);
                }
                output.push(i == 0 ?
                            createBaseResolver(item_split[0]) :
                            createFilterResolver(
                                self.filterLibrary.lookup(item_split[0]),
                                item_split.slice(1)
                            )
                );
            }
            return output;
        })(pipe_split),
        resolve = function(context, callback) {
            var index = -1,
                length = filter_chain.length,
                eterator = function(err, data) {
                    var callee = arguments.callee;
                    if(err) {
                        callback(err, null);
                    } else {
                        ++index;

                        if(index < length) {
                            filter_chain[index](context)(data, callee);
                        } else {
                            callback(null, data);
                        }
                    }
                };
            eterator(null, null);
        };
    return resolve;
};

exports.Parser = Parser;

        })(getExports('parsers'));

        (function(exports) {
            var nodes = require('plate/nodes'),
    FilterNode = nodes.FilterNode;

var Token = function(content, lineNumber) {
    this.content = content;
    this.lineNumber = lineNumber;
    this.name = this.content.split(/\s+/g)[0];
};

Token.prototype.toString = function() {
    return '<'+this.repr+': "'+this.content.slice(0,20)+'">';
};

Token.prototype.isOneOf = function(names) {
    if(this.isTag()) {
        for(var i = 0, len = names.length; i < len; ++i) {
            if(this.name == names[i]) {
                return true;
            }
        }
    }
    return false;
};

Token.prototype.createNode = function(parser) {
    return this.creationFunction(this.content, parser);
};

Token.prototype.isTag = function() { return false; };

Token.subclass = function(proto) {
    var F = function() {},
        SC = function() {
            Token.apply(this, Array.prototype.slice.call(arguments));
        };
    F.prototype = Token.prototype;
    SC.prototype = new F();
    for(var name in proto) if(proto.hasOwnProperty(name)) {
        SC.prototype[name] = proto[name];
    }
    return SC;
};

var TextToken = Token.subclass({
    creationFunction:function(content, parser) {
        return {
            render:function(context, callback) {
                callback(null, content);
            }
        };
    },
    repr:'TextToken'
});

var TagToken = Token.subclass({
    creationFunction:function(content, parser) {
        return parser.tagLibrary.lookup(this.name)(content.replace(/^\s*/, '').replace(/\s*$/, ''), parser);
    },
    isTag:function() { return true; },
    repr:'TagToken'
});

var FilterToken = Token.subclass({
    creationFunction:function(content, parser) {
        var filtervar = parser.compileFilter(content);
        return new FilterNode(filtervar);
    },
    repr:'FilterToken'
});

var CommentToken = Token.subclass({
    creationFunction:function(content, parser) {
        return {
            render:function(context, callback) {
                callback(null, '');
            }
        };
    },
    repr:'CommentToken'
});

exports.CommentToken = CommentToken;
exports.FilterToken = FilterToken;
exports.TagToken = TagToken;
exports.TextToken = TextToken;
exports.Token = Token;

        })(getExports('tokens'));

        (function(exports) {
            var tokens = require('plate/tokens'),
    parsers = require('plate/parsers'),
    libraries = require('plate/libraries');

var Context = function(dict) {
    for(var name in dict) if(dict.hasOwnProperty(name)) {
        this[name] = dict[name];
    }
    this._original = dict;
    this._copy = function() {
        return Context.copy(this);
    };
};

Context.copy = function(ctxt) {
    var toCopy = {};
    for(var name in ctxt._original) if (ctxt._original.hasOwnProperty(name)) {
        toCopy[name] = ctxt._original[name];
    }
    for(var name in ctxt) if (ctxt.hasOwnProperty(name) && name !== '_original' && name !== '_copy') {
        toCopy[name] = ctxt[name];
    }
    return new Context(toCopy);
};

var Template = function(raw, libs, parser) {
    if(typeof(raw) !== 'string') {
        throw new TypeError("You must pass in a string to render the template.");
    }
    this.raw = raw;
    libs = libs || {};
    this.tag_library = libs.tag_library || new libraries.DefaultTagLibrary();
    this.filter_library = libs.filter_library || new libraries.DefaultFilterLibrary();
    this.plugin_library = libs.plugin_library || new libraries.DefaultPluginLibrary();
    this.parser = parser || parsers.Parser;
};

Template.prototype.getNodeList = function() {
    if(!this.tokens) {
        this.tokens = Template.tokenize(this.raw);
    }

    if(!this.nodelist) {
        var parser = new this.parser(
            this.tokens,
            this.tag_library,
            this.filter_library,
            this.plugin_library,
            this);
        this.nodelist = parser.parse();
    }

    return this.nodelist;
};

Template.prototype.render = function(context, callback) {
    if(typeof(context) !== 'object') {
        throw new TypeError("You must pass in an instance of Object or plate.Context");
    }

    try {
        if(!(context instanceof Context)) {
            context = new Context(context);
        }
        this.getNodeList();
        this.nodelist.render(context, callback);
    } catch(err) {
        callback(err, null);
    }
};


var MATCH_RE = /\{[%#\{](.*?)[\}#%]\}/g;

Template.tokenize = function(original) {
    var raw = original.slice(),
        match = null,
        map = {
            '%':tokens.TagToken,
            '#':tokens.CommentToken,
            '{':tokens.FilterToken
        },
        tokens_out = [],
        lineNo = 1,
        incLineNo = function(str) {
            var count = 0;
            for(var i = 0, len = str.length; i < len; ++i) {
                if(str.charAt(i) == '\n') {
                    ++count;
                }
            }
            lineNo += count;
        };

    do {
        MATCH_RE.lastIndex = 0;
        match = MATCH_RE.exec(raw);
        if(match) {
            incLineNo(raw.slice(0, match.index));
            if(match.index > 0) {
                tokens_out.push(new tokens.TextToken(raw.slice(0, match.index)));
            }
            tokens_out.push(new map[match[0].charAt(1)](match[1].replace(/^\s+/g,'').replace(/^\s+$/g, ''), lineNo));
            raw = raw.slice(match.index+match[0].length);
        }
    } while(match);
    if(raw) {
        tokens_out.push(new tokens.TextToken(raw));
    }
    return tokens_out;
};

exports.Context = Context;
exports.Template = Template;

        })(getExports('index'));

})();
