
(function() {
    var get_exports = function(file) {
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

    (function(exports){try { plate.tz } catch(e) { }

var SafeString = function(str) {
  this.str = str
  this.isSafe = true
}

SafeString.prototype.toString = function() {
  return this.str
}

var escapeHTML = function(data) {
  if(data.isSafe) return data

  var html = data.toString()
  html = html.replace(/\&/g, '&amp;').
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;').
    replace(/"/g, '&quot;').
    replace(/'/g, '&#39;')

  return new SafeString(html)
}

exports.escapeHTML = escapeHTML
exports.SafeString = SafeString
exports.format = format
exports.time_format = time_format
exports.Formatter = Formatter
exports.DateFormat = DateFormat
exports.TimeFormat = TimeFormat

function capfirst (str) {
  return str.replace(/^(.{1})/, function(a, m) { return m.toUpperCase() })
}

function map (arr, iter) {
  var out = []
  for(var i = 0, len = arr.length; i < len; ++i)
    out.push(iter(arr[i], i, arr))
  return out
}

function reduce(arr, iter, start) {
  arr = arr.slice()
  if(start !== undefined)
    arr.unshift(start)

  if(arr.length === 0)
    throw new Error('reduce of empty array')

  if(arr.length === 1)
    return arr[0]

  var out = arr.slice()
    , item = arr.shift()

  do {
    item = iter(item, arr.shift())
  } while(arr.length)

  return item
}

function strtoarray(str) {
  var arr = []
  for(var i = 0, len = str.length; i < len; ++i)
    arr.push(str.charAt(i))
  return arr
}

var WEEKDAYS = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
  , WEEKDAYS_ABBR = map(WEEKDAYS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , WEEKDAYS_REV = reduce(map(WEEKDAYS, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
  , MONTHS_3 = map(MONTHS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , MONTHS_3_REV = reduce(map(MONTHS_3, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS_AP = [
    'Jan.'
  , 'Feb.'
  , 'March'
  , 'April'
  , 'May'
  , 'June'
  , 'July'
  , 'Aug.'
  , 'Sept.'
  , 'Oct.'
  , 'Nov.'
  , 'Dec.'
  ]


var MONTHS_ALT = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
}

function Formatter(t) {
  this.data = t
}

Formatter.prototype.format = function(str) {
  var bits = strtoarray(str)
  , esc = false
  , out = []
  , bit

  while(bits.length) {
    bit = bits.shift()

    if(esc) {
      out.push(bit)
      esc = false
    } else if(bit === '\\') {
      esc = true
    } else if(this[bit]) {
      out.push(this[bit]())
    } else {
      out.push(bit)
    }
  }

  return out.join('')
}

function TimeFormat(t) {
  Formatter.call(this, t)
}

var proto = TimeFormat.prototype = new Formatter()

proto.a = function() {
  // 'a.m.' or 'p.m.'
  if (this.data.getHours() > 11)
    return 'p.m.'
  return 'a.m.'
}

proto.A = function() {
  // 'AM' or 'PM'
  if (this.data.getHours() > 11)
    return 'PM'
  return 'AM'
}

proto.f = function() {
  /*
  Time, in 12-hour hours and minutes, with minutes left off if they're
  zero.
  Examples: '1', '1:30', '2:05', '2'
  Proprietary extension.
  */
  if (this.data.getMinutes() == 0)
    return this.g()
  return this.g() + ":" + this.i()
}

proto.g = function() {
  // Hour, 12-hour format without leading zeros i.e. '1' to '12'
  var h = this.data.getHours()

  return this.data.getHours() % 12 || 12
}

proto.G = function() {
  // Hour, 24-hour format without leading zeros i.e. '0' to '23'
  return this.data.getHours()
}

proto.h = function() {
  // Hour, 12-hour format i.e. '01' to '12'
  return ('0'+this.g()).slice(-2)
}

proto.H = function() {
  // Hour, 24-hour format i.e. '00' to '23'
  return ('0'+this.G()).slice(-2)
}

proto.i = function() {
  // Minutes i.e. '00' to '59'
  return ('0' + this.data.getMinutes()).slice(-2)
}

proto.P = function() {
  /*
  Time, in 12-hour hours, minutes and 'a.m.'/'p.m.', with minutes left off
  if they're zero and the strings 'midnight' and 'noon' if appropriate.
  Examples: '1 a.m.', '1:30 p.m.', 'midnight', 'noon', '12:30 p.m.'
  Proprietary extension.
  */
  var m = this.data.getMinutes()
    , h = this.data.getHours()

  if (m == 0 && h == 0)
    return 'midnight'
  if (m == 0 && h == 12)
    return 'noon'
  return this.f() + " " + this.a()
}

proto.s = function() {
  // Seconds i.e. '00' to '59'
  return ('0'+this.data.getSeconds()).slice(-2)
}

proto.u = function() {
  // Microseconds
  return this.data.getMilliseconds()
}

// DateFormat

function DateFormat(t) {
  this.data = t
  this.year_days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
}

proto = DateFormat.prototype = new TimeFormat()

proto.contructor = DateFormat

proto.b = function() {
  // Month, textual, 3 letters, lowercase e.g. 'jan'
  return MONTHS_3[this.data.getMonth()]
}

proto.c= function() {
  /*
  ISO 8601 Format
  Example : '2008-01-02T10:30:00.000123'
  */
  return this.data.toISOString ? this.data.toISOString() : ''
}

proto.d = function() {
  // Day of the month, 2 digits with leading zeros i.e. '01' to '31'
  return ('0'+this.data.getDate()).slice(-2)
}

proto.D = function() {
  // Day of the week, textual, 3 letters e.g. 'Fri'
  return capfirst(WEEKDAYS_ABBR[this.data.getDay()])
}

proto.E = function() {
  // Alternative month names as required by some locales. Proprietary extension.
  return MONTHS_ALT[this.data.getMonth()+1]
}

proto.F= function() {
  // Month, textual, long e.g. 'January'
  return capfirst(MONTHS[this.data.getMonth()])
}

proto.I = function() {
  // '1' if Daylight Savings Time, '0' otherwise.
  return this.data.isDST() ? '1' : '0'
}

proto.j = function() {
  // Day of the month without leading zeros i.e. '1' to '31'
  return this.data.getDate()
}

proto.l = function() {
  // Day of the week, textual, long e.g. 'Friday'
  return capfirst(WEEKDAYS[this.data.getDay()])
}

proto.L = function() {
  // Boolean for whether it is a leap year i.e. True or False
  // Selects this year's February 29th and checks if the month
  // is still February.
  return (new Date(this.data.getFullYear(), 1, 29).getMonth()) === 1
}

proto.m = function() {
  // Month i.e. '01' to '12'"
  return ('0'+(this.data.getMonth()+1)).slice(-2)
}

proto.M = function() {
  // Month, textual, 3 letters e.g. 'Jan'
  return capfirst(MONTHS_3[this.data.getMonth()])
}

proto.n = function() {
  // Month without leading zeros i.e. '1' to '12'
  return this.data.getMonth() + 1
}

proto.N = function() {
  // Month abbreviation in Associated Press style. Proprietary extension.
  return MONTHS_AP[this.data.getMonth()]
}

proto.O = function() {
  // Difference to Greenwich time in hours e.g. '+0200'

  var tzoffs = this.data.getTimezoneOffset()
    , offs = ~~(tzoffs / 60)
    , mins = ('00' + ~~Math.abs(tzoffs % 60)).slice(-2)
  
  return ((tzoffs > 0) ? '-' : '+') + ('00' + Math.abs(offs)).slice(-2) + mins
}

proto.r = function() {
  // RFC 2822 formatted date e.g. 'Thu, 21 Dec 2000 16:01:07 +0200'
  return this.format('D, j M Y H:i:s O')
}

proto.S = function() {
  /* English ordinal suffix for the day of the month, 2 characters i.e. 'st', 'nd', 'rd' or 'th' */
  var d = this.data.getDate()

  if (d >= 11 && d <= 13)
    return 'th'
  var last = d % 10

  if (last == 1)
    return 'st'
  if (last == 2)
    return 'nd'
  if (last == 3)
    return 'rd'
  return 'th'
}

proto.t = function() {
  // Number of days in the given month i.e. '28' to '31'
  // Use a javascript trick to determine the days in a month
  return 32 - new Date(this.data.getFullYear(), this.data.getMonth(), 32).getDate()
}

proto.T = function() {
  // Time zone of this machine e.g. 'EST' or 'MDT'
  if(this.data.tzinfo) {
    return this.data.tzinfo().abbr || '???'
  }
  return '???'
}

proto.U = function() {
  // Seconds since the Unix epoch (January 1 1970 00:00:00 GMT)
  // UTC() return milliseconds frmo the epoch
  // return Math.round(this.data.UTC() * 1000)
  return ~~(this.data / 1000)
}

proto.w = function() {
  // Day of the week, numeric, i.e. '0' (Sunday) to '6' (Saturday)
  return this.data.getDay()
}

proto.W = function() {
  // ISO-8601 week number of year, weeks starting on Monday
  // Algorithm from http://www.personal.ecu.edu/mccartyr/ISOwdALG.txt
  var jan1_weekday = new Date(this.data.getFullYear(), 0, 1).getDay() 
    , weekday = this.data.getDay()
    , day_of_year = this.z()
    , week_number
    , i = 365

  if(day_of_year <= (8 - jan1_weekday) && jan1_weekday > 4) {
    if(jan1_weekday === 5 || (jan1_weekday === 6 && this.L.call({data:new Date(this.data.getFullYear()-1, 0, 1)}))) {
      week_number = 53
    } else {
      week_number = 52
    }
  } else {
    if(this.L()) {
      i = 366
    }
    if((i - day_of_year) < (4 - weekday)) {
      week_number = 1
    } else {
      week_number = ~~((day_of_year + (7 - weekday) + (jan1_weekday - 1)) / 7)
      if(jan1_weekday > 4)
        week_number -= 1
    }
  }
  return week_number
}

proto.y = function() {
  // Year, 2 digits e.g. '99'
  return (''+this.data.getFullYear()).slice(-2)
}

proto.Y = function() {
  // Year, 4 digits e.g. '1999'
  return this.data.getFullYear()
}

proto.z = function() {
  // Day of the year i.e. '0' to '365'

  doy = this.year_days[this.data.getMonth()] + this.data.getDate()
  if (this.L() && this.data.getMonth() > 1)
    doy += 1
  return doy
}

proto.Z = function() {
  /*
  Time zone offset in seconds (i.e. '-43200' to '43200'). The offset for
  timezones west of UTC is always negative, and for those east of UTC is
  always positive.
  */
  return this.data.getTimezoneOffset() * -60
}


function format(value, format_string) {
  var df = new DateFormat(value)
  return df.format(format_string)
}


function time_format(value, format_string) {
  var tf = new TimeFormat(value)
  return tf.format(format_string)
}
})(get_exports("utils"));
(function(exports){var clear_stack = function(fn) {
  setTimeout(fn, 0);
};

if(typeof(window) !== 'undefined') {

  var setZeroTimeout = function(fn) {
    window.addEventListener('message', function event_listener(ev) {
      window.removeEventListener('message', event_listener, true);

      if(ev.source === window && ev.data === 'zero-timeout') {
        ev.stopPropagation();
        try{ fn(); } catch(err) {}
      }
    }, true);

    window.postMessage('zero-timeout', '*'); 
  };

  if('postMessage' in window && 'addEventListener' in window)
    clear_stack = setZeroTimeout;
}

exports.eterator = function eterator (list) {
  var _l = list.slice();
  var ret = function(block) {
    block.next = function() {
      if(_l.length) {
        var next = _l.shift();
        exports.eterator.clear_stack(function() {
          block(next);   
        });
      } else {
        block.done();
      }
    };
    block.done = function() {
      ret.finish();
    };

    exports.eterator.clear_stack(block.next);
  };
  ret.on_ready = function(ready) {
    ret.finish = ready;
  };
  return ret;
};

exports.eterator.clear_stack = clear_stack

exports.parallel = function(list, ready) {
  var _l = list.slice(),
      expecting = _l.length,
      accum = [],
      seen = 0;

  var collect = function(idx, err, data) {
    if(err) {
      // quit the second an error occurs
      // prevent error events from recalling `ready`
      ready(err);
      collect = function(){}
    } else {
      ++seen;
      accum[idx] = data;
      if(seen === expecting) {
        ready(null, accum)
      }
    }
  };

  return function(fn) {
    for(var i = 0, len = _l.length; i < len; ++i) {
      (function(node, idx) {
        fn(node, function(err, data) {
          collect(idx, err, data);
        }); 
      })(_l[i], i) 
    }
    if(_l.length === 0)
      ready(null, [])
  };
};
})(get_exports("eterator"));
(function(exports){var utils = plate.utils,
    eterator = plate.eterator,
    parallel = eterator.parallel,
    eterator = eterator.eterator,
    slice = [].slice;

var Node = function() {
    this.init && this.init.apply(this, slice.call(arguments));
};

Node.prototype.toString = function() {
    return this.__name__;
};

var FilterNode = function(filtervar) {
    this.filtervar = filtervar;  
};

FilterNode.prototype.__name__ = 'FILTER';

FilterNode.prototype = new Node;

FilterNode.prototype.render = function(context, ready) {
  this.filtervar(context, function(err, data) {
    if(err) { ready(null, ''); } else {
      data = data === undefined || data === null ? '' : data;
      data = !data.isSafe ? 
          utils.escapeHTML(data+'') :
          data+'';
      ready(null,data);
    }
  });
};

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
    var list = parallel(this.nodes, function(err, output) {
        err ?
          callback(err) :
          callback(null, output.join(''));
    })

    list(function(node, done) {
      node.render(context.copy(), done);
    });

};

exports.Node = Node;
exports.FilterNode = FilterNode;
exports.NodeList = NodeList;
})(get_exports("nodes"));
(function(exports){var nodes = plate.nodes,
    utils = plate.utils,
    NodeList = nodes.NodeList,
    Node = nodes.Node,
    BLOCK_CONTEXT_KEY = 'block_context';

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

    for(var name in blocks) {
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

var BlockNode = function(name, nodelist) {
  this.name = name;
  this.nodelist = nodelist;  
};

BlockNode.prototype = new Node;
BlockNode.prototype.render = function(context, ready) {
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
            ready(err, data);
        });
    } else {
        context.block = this;
        this.nodelist.render(context, ready);
    }
};

BlockNode.prototype._super = function(ready) {
    if(this.context[BLOCK_CONTEXT_KEY] && this.context[BLOCK_CONTEXT_KEY].getBlock(this.name)) {
        this.context[BLOCK_CONTEXT_KEY].getBlock(this.name).render(this.context, function(err, data) {
          err ?
            ready(err) :
            ready(null, new utils.SafeString(data))
        })
    } else {
        ready(null, '');
    }
};

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
})(get_exports("tags/block"));
(function(exports){var nodes = plate.nodes,
    Node = nodes.Node,
    blocktag = plate.tags.block,
    BlockContext = blocktag.BlockContext,
    BlockNode = blocktag.BlockNode,
    BLOCK_CONTEXT_KEY = blocktag.BLOCK_CONTEXT_KEY;

var ExtendsNode = function(parent_expr, nodelist, loader_plugin) {
    this.parent_expr = parent_expr;
    this.nodelist = nodelist;
    this.loader_plugin = loader_plugin;
    var blocks = this.nodelist.getNodesByType(BlockNode),
        outblocks = {};
    for(var i = 0, len = blocks.length; i < len; ++i) {
        outblocks[blocks[i].name] = blocks[i];
    }
    this.blocks = outblocks;
};

ExtendsNode.prototype = new Node;
ExtendsNode.prototype.render = function(context, callback) {
    var self = this,
        platelib = plate;
    self.parent_expr(context, function(err, tpl) {
        if(err) {
            callback(err, null);
        } else {
            var fn = tpl instanceof platelib.Template ? function(tpl, callback) { callback(null, tpl); } :
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
};

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
})(get_exports("tags/_extends"));
(function(exports){var nodes = plate.nodes,
    eterator = plate.eterator.eterator,
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var ForNode = function(from, to, inner, outer, reversed) {
    this.from = from;
    this.to = to;
    this.inner = inner;
    this.outer = outer;
    this.reversed = reversed;
};

ForNode.prototype = new Node;
ForNode.prototype.render = function(context, callback) {
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
                values = [].reverse.call([].slice.call(values));
            }
            if(values && values.length) {

                var eter = eterator(values),
                    accum = [],
                    error,
                    it;

                eter.on_ready(function() {
                    error ?
                        callback(error, null) :
                        callback(null, accum.join(''));
                });

                eter(it=function(value) {
                    var ctxt = self.createContext(context, parentloop, value, accum.length, values.length);
                    self.inner.render(ctxt, function(err, data) {
                        if(err) {
                            error = err;
                            it.done();
                        } else {
                            accum.push(data);
                            it.next();
                        }
                    });
                });
            } else {
                self.outer.render(context, callback); 
            }
        }
    });
};

ForNode.prototype.createContext = function(ctxt, parentloop, values, index, length) {
    var output = ctxt.copy();
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
};

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
})(get_exports("tags/_for"));
(function(exports){var nodes = plate.nodes,
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

var IfNode = function(predicate, ifTrue, ifFalse) {
    this.predicate = predicate;
    this.ifTrue = ifTrue;
    this.ifFalse = ifFalse;
};

IfNode.prototype = new Node;
IfNode.prototype.render = function(context, callback) {
    var self = this;
    self.predicate.evaluate(context, function(err, data) {
        if(err) {
            callback(err, null);
        } else {
            var which = data ? self.ifTrue : self.ifFalse;
            which.render(context.copy(), callback);
        }
    });
};

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
})(get_exports("tags/_if"));
(function(exports){var nodes = plate.nodes,
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var IncludeNode = function(templatevar, loader) {
    this.templatevar = templatevar;
    this.loader = loader;
};
IncludeNode.prototype = new Node;
IncludeNode.prototype.render = function(context, callback) {
    var self = this,
        platelib = plate;
    self.templatevar(context, function(ctxt, tpl) {
        var fn = tpl instanceof platelib.Template ? 
            function(tpl, callback) { callback(null, tpl); } :
            self.loader;

        fn(tpl, function(err, template) {
            template.render(context, callback);
        });
    });
};

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
})(get_exports("tags/include"));
(function(exports){var nodes = plate.nodes,
    format = plate.utils.format,
    Node = nodes.Node;

var NowNode = function(str) {
  this.format = str
};
NowNode.prototype = new Node;
NowNode.prototype.newDate = function() { return new Date }

NowNode.prototype.render = function(context, ready) {
  ready(null, format(this.newDate(), this.format))
};

NowNode.parse = function(contents, parser) {
    var bits = contents.split(' '),
        fmt = bits.slice(1).join(' ')

    fmt = fmt.replace(/^\s*/, '')
             .replace(/\s*$/, '')

    fmt.charAt(0) in {'"':1, "'":1} && 
      (fmt = fmt.slice(1));

    fmt.charAt(fmt.length-1) in {'"':1, "'":1} &&
      (fmt = fmt.slice(0, -1));

    return new NowNode(fmt || 'N j, Y')
};

exports.NowNode = NowNode;

})(get_exports("tags/now"));
(function(exports){var nodes = plate.nodes,
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var WithNode = function(withvar, asvar, nodelist) {
    this.withvar = withvar;
    this.asvar = asvar;
    this.nodelist = nodelist;
};
WithNode.prototype = new Node;
WithNode.prototype.render = function(context, callback) {
    var self = this;
    self.withvar(context, function(err, data) {
        if(err) {
            callback(err, null);
        } else {
            context[self.asvar] = data;

            self.nodelist.render(context, callback);
        }
    });
};

WithNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        withvar = parser.compileFilter(bits[1]),
        asvar = bits[3],
        nodelist = parser.parse(['endwith']);

    parser.tokens.shift();
    return new WithNode(withvar, asvar, nodelist);
};

exports.WithNode = WithNode;
})(get_exports("tags/_with"));
(function(exports){var nodes = plate.nodes,
    Node = nodes.Node;

var CommentNode = function(nodelist) {
    this.nodelist = nodelist;
};

CommentNode.prototype = new Node;
CommentNode.prototype.render = function(context, callback) { callback(null, ''); };

CommentNode.parse = function(contents, parser) {
    var nodelist = parser.parse(['endcomment']);

    parser.tokens.shift();
    return new CommentNode(nodelist);
};

exports.CommentNode = CommentNode;
})(get_exports("tags/comment"));
(function(exports){exports.add = function(callback, input, value) {
    callback(null, parseInt(input, 10) + parseInt(value, 10));
};
})(get_exports("filters/add"));
(function(exports){exports.addslashes = function(callback, input) {
    callback(null, input.toString().replace(/'/g, "\\'"));
};
})(get_exports("filters/addslashes"));
(function(exports){exports.capfirst = function(callback, input) {
    var str = input.toString();
    callback(null, [str.slice(0,1).toUpperCase(), str.slice(1)].join(''));
};
})(get_exports("filters/capfirst"));
(function(exports){exports.center = function(callback, input, len, value) {
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
})(get_exports("filters/center"));
(function(exports){exports.cut = function(callback, input, value) {
    var str = input.toString();
    callback(null, str.replace(new RegExp(value, "g"), ''));
};
})(get_exports("filters/cut"));
(function(exports){var format = plate.utils.format
  
exports.date = function(callback, input, value) {
    if (value === undefined)
        value = 'N j, Y';
    callback(null, format(input.getFullYear ? input : new Date(input), value));
}
})(get_exports("filters/date"));
(function(exports){exports._default = function(callback, input, def) {
    input ? callback(null, input) : callback(null, def);
};
})(get_exports("filters/_default"));
(function(exports){exports.dictsort = function(callback, input, key) {
    callback(null, input.sort(function(x, y) {
        if(x[key] > y[key]) return 1;
        if(x[key] == y[key]) return 0;
        if(x[key] < y[key]) return -1;
    }));
};
})(get_exports("filters/dictsort"));
(function(exports){var dictsort = plate.filters.dictsort.dictsort;

exports.dictsortreversed = function(callback, input, key) {
    dictsort(function(err, result) {
        if(err) { 
            callback(err, null);
        } else {
            callback(null, result.reverse()); 
        }
    }, input, key);
};
})(get_exports("filters/dictsortreversed"));
(function(exports){exports.divisibleby = function(callback, input, num) {
    callback(null, input % parseInt(num, 10) == 0);
};
})(get_exports("filters/divisibleby"));
(function(exports){var utils = plate.utils;

exports.escape = function(callback, input) {
    callback(null, utils.escapeHTML(input))
};
})(get_exports("filters/escape"));
(function(exports){var utils = plate.utils;

exports.force_escape = function(callback, input) {
    callback(null, utils.escapeHTML(''+input))
};
})(get_exports("filters/_force_escape"));
(function(exports){exports.filesizeformat = function(callback, input) {
    var num = (new Number(input)).valueOf(),
        singular = num == 1 ? '' : 's',
        value = num < 1024 ? num + ' byte'+singular :
                num < (1024*1024) ? (num/1024)+' KB' :
                num < (1024*1024*1024) ? (num / (1024*1024)) + ' MB' :
                num / (1024*1024*1024) + ' GB';
    callback(null, value);
};
})(get_exports("filters/filesize_format"));
(function(exports){exports.first = function(callback, input) {
    callback(null, input[0]);
};
})(get_exports("filters/first"));
(function(exports){exports.floatformat = function(callback, input, val) {
    val = parseInt(val, 10);
    val = isNaN(val) ? -1 : val;

    var isPositive = val >= 0,
        asNumber = parseFloat(input),
        absValue = Math.abs(val),
        pow = Math.pow(10, absValue),
        pow_minus_one = Math.pow(10, Math.max(absValue-1, 0)),
        asString;

    asNumber = Math.round((pow * asNumber) / pow_minus_one);
    if(val !== 0)
      asNumber /= 10;

    asString = asNumber.toString();

    if(isPositive) {
        var split = asString.split('.'),
            decimal = split.length > 1 ? split[1] : '';

        while(decimal.length < val) {
            decimal += '0';
        }

        asString = decimal.length ? [split[0], decimal].join('.') : split[0];
    }

    callback(null, asString);
};
})(get_exports("filters/float_format"));
(function(exports){exports.get_digit = function(callback, input, digit) {
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
})(get_exports("filters/get_digit"));
(function(exports){})(get_exports("filters/index"));
(function(exports){exports.iteritems = function(callback, input) {
  var output = [];
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]]);
  }
  callback(null, output);
};
})(get_exports("filters/iteritems"));
(function(exports){exports.iriencode = function(callback, input) {
  callback(null, input);
};
})(get_exports("filters/iriencode"));
(function(exports){exports.join = function(callback, input, glue) {
  input = input instanceof Array ? input : input.toString().split('');
  callback(null, input.join(glue));
};
})(get_exports("filters/join"));
(function(exports){exports.last = function(callback, input) {
  var cb = input.charAt || function(ind) { return input[ind]; };
  callback(null, cb.call(input, input.length-1));
};
})(get_exports("filters/last"));
(function(exports){exports.length = function(callback, input) {
  var cb = input.length instanceof Function ? input.length : function(lambda) {
    lambda(null, input.length);
  };
  cb.apply(input, [function(err, len) {
    callback(null, len);
  }]);
};
})(get_exports("filters/length"));
(function(exports){var length = plate.filters.length.length;

exports.length_is = function(callback, input, expected) {
  length(function(err, val) {
    callback(err, parseInt(val, 10) === parseInt(expected, 10));
  }, input);
};
})(get_exports("filters/length_is"));
(function(exports){var utils = plate.utils;

exports.linebreaks = function(callback, input) {
  var str = input.toString(),
      paras = str.split('\n\n'),
      out = [];

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'));
  }
  callback(null, new utils.SafeString('<p>'+out.join('</p><p>')+'</p>')); 
};
})(get_exports("filters/linebreaks"));
(function(exports){var utils = plate.utils;

exports.linebreaksbr = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/\n/g, '<br />')));
};
})(get_exports("filters/linebreaksbr"));
(function(exports){exports.linenumbers = function(callback, input) {
  var str = input.toString(),
      bits = str.split('\n'),
      out = [],
      len = bits.length;

  while(bits.length) out.unshift(len - out.length + '. ' + bits.pop());

  callback(null, out.join('\n'));
};
})(get_exports("filters/linenumbers"));
(function(exports){exports.ljust = function(callback, input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split(''),
      difference = num - bits.length;

  // push returns new length of array.
  while(difference > 0) difference = num - bits.push(' ');

  callback(null, bits.join(''));
};
})(get_exports("filters/ljust"));
(function(exports){exports.lower = function(callback, input) {
  callback(null, input.toString().toLowerCase());
};
})(get_exports("filters/lower"));
(function(exports){exports.make_list = function(callback, input) {
  input = input instanceof Array ? input : input.toString().split('');

  callback(null, input);
};
})(get_exports("filters/make_list"));
(function(exports){
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
})(get_exports("filters/phone2numeric"));
(function(exports){var length = plate.filters.length.length;

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
})(get_exports("filters/pluralize"));
(function(exports){var length = plate.filters.length.length;

exports.random = function(callback, input) {
  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  length(function(err, val) {
      callback(null, cb.apply(input, [Math.floor(Math.random() * val)]));
  }, input);
};
})(get_exports("filters/random"));
(function(exports){exports.rjust = function(callback, input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split(''),
      difference = num - bits.length;

  // push returns new length of array.
  // NB: [].unshift returns `undefined` in IE<9.
  while(difference > 0) difference = (bits.unshift(' '), num - bits.length);

  callback(null, bits.join(''));
};

})(get_exports("filters/rjust"));
(function(exports){var utils = plate.utils;

exports.safe = function(callback, input) {
    callback(null, new utils.SafeString(input));
};
})(get_exports("filters/safe"));
(function(exports){exports.slice = function(callback, input, by) {
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
})(get_exports("filters/slice"));
(function(exports){exports.slugify = function(callback, input) {
  input = input.toString();
  callback(null, input.replace(/[^\w\s\d\-]/g, '').replace(/^\s*/, '').replace(/\s*$/, '').replace(/[\-\s]+/g, '-').toLowerCase());
};
})(get_exports("filters/slug_ify"));
(function(exports){exports.striptags = function(callback, input) {
  var str = input.toString();
  callback(null, str.replace(/<[^>]*?>/g, ''));
};
})(get_exports("filters/striptags"));
(function(exports){exports.title = function(callback, input) {
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
})(get_exports("filters/title"));
(function(exports){exports.timesince = function(callback, input, n) {
  var input = new Date(input)
    , now   = n ? new Date(n) : new Date()
    , diff  = input - now
    , since = Math.abs(diff)

  if(diff > 0)
    return callback(null, '0 minutes')

  // 365.25 * 24 * 60 * 60 * 1000 === years
  var years =   ~~(since / 31557600000)
    , months =  ~~((since - (years*31557600000)) / 2592000000)
    , days =    ~~((since - (years * 31557600000 + months * 2592000000)) / 86400000)
    , hours =   ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000)) / 3600000)
    , minutes = ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000 + hours * 3600000)) / 60000)
    , result = [
        years   ? pluralize(years,    'year') : null
      , months  ? pluralize(months,   'month') : null
      , days    ? pluralize(days,     'day') : null
      , hours   ? pluralize(hours,    'hour') : null
      , minutes ? pluralize(minutes,  'minute') : null
    ]
    , out = []

  for(var i = 0, len = result.length; i < len; ++i) {
    result[i] !== null && out.push(result[i])
  }

  if(!out.length) {
    return callback(null, '0 minutes')
  }

  return callback(null, out[0] + (out[1] ? ', ' + out[1] : ''))

  function pluralize(x, str) {
    return x + ' ' + str + (x === 1 ? '' : 's')
  }
}
})(get_exports("filters/timesince"));
(function(exports){
var timesince = plate.filters.timesince.timesince

exports.timeuntil = function(callback, input, n) {
  var now = n ? new Date(n) : new Date()
  return timesince(callback, now, input)

}
})(get_exports("filters/timeuntil"));
(function(exports){exports.truncatewords = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) return callback(null, input);
  callback(null, input.split(/\s+/).slice(0, num).join(' ')+'...');
};
})(get_exports("filters/truncatewords"));
(function(exports){exports.truncatechars = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) return callback(null, input);
  callback(null, input.slice(0, num)+'...');
};
})(get_exports("filters/truncatechars"));
(function(exports){var utils = plate.utils;

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
})(get_exports("filters/unordered_list"));
(function(exports){exports.upper = function(callback, input) {
  callback(null, input.toString().toUpperCase());
};
})(get_exports("filters/upper"));
(function(exports){exports.urlencode = function(callback, input) {
  callback(null, escape(input.toString()));
};
})(get_exports("filters/urlencode"));
(function(exports){var utils = plate.utils;

exports.urlize = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/])+)/g, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>'; 
  })));
};
})(get_exports("filters/urlize"));
(function(exports){var utils = plate.utils;

exports.urlizetrunc = function(callback, input, len) {
  var str = input.toString();
  len = parseInt(len, 10) || 1000;
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@])+)/g, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>'; 
  })));
};

})(get_exports("filters/urlizetrunc"));
(function(exports){exports.wordcount = function(callback, input) {
  var str = input.toString(),
      bits = str.split(/\s+/g);
  callback(null, bits.length);
};
})(get_exports("filters/wordcount"));
(function(exports){exports.wordwrap = function(callback, input, len) {
  var words = input.toString().split(/\s+/g),
      out = [],
      len = parseInt(len, 10) || words.length;

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '));
  };
  callback(null, out.join('\n'));
};
})(get_exports("filters/wordwrap"));
(function(exports){exports.yesno = function(callback, input, map) {
  var ourMap = map.toString().split(','),
      value;

  ourMap.length < 3 && ourMap.push(ourMap[1]);

  value = ourMap[input ? 0 :
                 input === false ? 1 :
                 2];

  callback(null, value);
};
})(get_exports("filters/yesno"));
(function(exports){var Library = function() {
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
    this.registry = (function() {
        var F = function(){};
        F.prototype = DefaultTagLibrary.default_library;
        return new F;
    })();
};

DefaultTagLibrary.prototype = new Library();

DefaultTagLibrary.default_library = {
    'with':plate.tags._with.WithNode.parse,
    'for':plate.tags._for.ForNode.parse,
    'if':plate.tags._if.IfNode.parse,
    'extends':plate.tags._extends.ExtendsNode.parse,
    'block':plate.tags.block.BlockNode.parse,
    'include':plate.tags.include.IncludeNode.parse,
    'now':plate.tags.now.NowNode.parse,
    'comment':plate.tags.comment.CommentNode.parse
};

var DefaultFilterLibrary = function() {
    this.registry = (function() {
        var F = function(){};
        F.prototype = DefaultFilterLibrary.default_library;
        return new F;
    })();
};

DefaultFilterLibrary.prototype = new Library();

DefaultFilterLibrary.default_library = {
    'add':plate.filters.add.add,
    'addslashes':plate.filters.addslashes.addslashes,
    'capfirst':plate.filters.capfirst.capfirst,
    'center':plate.filters.center.center,
    'cut':plate.filters.cut.cut,
    'date':plate.filters.date.date,
    'default':plate.filters._default._default,
    'dictsort':plate.filters.dictsort.dictsort,
    'dictsortreversed':plate.filters.dictsortreversed.dictsortreversed,
    'divisibleby':plate.filters.divisibleby.divisibleby,
    'escape':plate.filters.escape.escape,
    'filesizeformat':plate.filters.filesize_format.filesizeformat,
    'first':plate.filters.first.first,
    'floatformat':plate.filters.float_format.floatformat,
    'force_escape':plate.filters._force_escape.force_escape,
    'get_digit':plate.filters.get_digit.get_digit,
    'index':plate.filters.index.index,
    'iteritems':plate.filters.iteritems.iteritems,
    'iriencode':plate.filters.iriencode.iriencode,
    'join':plate.filters.join.join,
    'last':plate.filters.last.last,
    'length':plate.filters.length.length,
    'length_is':plate.filters.length_is.length_is,
    'linebreaks':plate.filters.linebreaks.linebreaks,
    'linebreaksbr':plate.filters.linebreaksbr.linebreaksbr,
    'linenumbers':plate.filters.linenumbers.linenumbers,
    'ljust':plate.filters.ljust.ljust,
    'lower':plate.filters.lower.lower,
    'make_list':plate.filters.make_list.make_list,
    'phone2numeric':plate.filters.phone2numeric.phone2numeric,
    'pluralize':plate.filters.pluralize.pluralize,
    'random':plate.filters.random.random,
    'rjust':plate.filters.rjust.rjust,
    'safe':plate.filters.safe.safe,
    'slice':plate.filters.slice.slice,
    'slugify':plate.filters.slug_ify.slugify,
    'striptags':plate.filters.striptags.striptags,
    'timesince':plate.filters.timesince.timesince,
    'timeuntil':plate.filters.timeuntil.timeuntil,
    'title':plate.filters.title.title,
    'truncatechars':plate.filters.truncatechars.truncatechars,
    'truncatewords':plate.filters.truncatewords.truncatewords,
    'unordered_list':plate.filters.unordered_list.unordered_list,
    'upper':plate.filters.upper.upper,
    'urlencode':plate.filters.urlencode.urlencode,
    'urlize':plate.filters.urlize.urlize,
    'urlizetrunc':plate.filters.urlizetrunc.urlizetrunc,
    'wordcount':plate.filters.wordcount.wordcount,
    'wordwrap':plate.filters.wordwrap.wordwrap,
    'yesno':plate.filters.yesno.yesno
};

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;
})(get_exports("libraries"));
(function(exports){var nodes = plate.nodes,
    NodeList = nodes.NodeList,
    eterator = plate.eterator.eterator;

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

var createStringResolver = function(content) {
    return function(context) { return function(args, callback) { callback(null, content); }; };
};

var createNumberResolver = function(content) {
    return function(context) { return function(args, callback) { callback(null, new Number(content).valueOf()); }; };
};

var createContextResolver = function(pieces) {
    return function(context) {
        return function(args, ready) {
            var okay = function(x) { return x !== undefined && x !== null; },
                callable = function(fn) {
                    return typeof(fn) === 'function';
                },
                eter = eterator(pieces),
                current = context,
                error,
                it;

            eter.on_ready(function() {
                error ?
                    ready(error, null) :
                    ready(null, current);
            });

            eter(it=function(piece) {
              try {
                  var prev = current;

                  piece = piece === 'super' ? '_super' : piece;
                  current = current[piece];

                  if(!okay(current)) {
                      // this attribute ended up being undefined or null, we're out
                      it.done();
                  } else {
                      // if this attribute is okay, we check to see if it's callable or a straight-up value.
                      var okay_continue = !callable(current);

                      // it's not okay to automatically continue if we're a callable.
                      if(!okay_continue) {
                          var tmp;
                          var ret = current.call(prev, tmp=function(err, data) {
                              if(err) {
                                  // the callable emitted an error, so we store it and exit.
                                  error = err;
                                  it.done(); 
                              } else {
                                  // otherwise we get this show on the road.
                                  current = data;
                                  it.next();
                              }  
                          });

                          // if it didn't return undefined or null, it's okay to continue, and we store the return value in ``current``.
                          if(okay_continue=okay(ret)) {
                              current = ret;
                          }
                      }
                     
                      // it's okay to continue if ``current`` is scalar, or if the callable returned a scalar value.
                      if(okay_continue) {
                          it.next();
                      }
                  } 
              } catch(err) {
                  // trying to grab the next item off the list triggered an error
                  // OR calling a client callable context variable triggered an error
                  // so we store the error and exit.
                  error = err || new Error();
                  it.done();
              }
            });
        };
    };
};

var createBaseResolver = function(content) {
    if(content.charAt(0) in {'"':true, "'":true}) {
        return createStringResolver(content.slice(1,-1));
    } else if(/^[\d\.]*$/.test(content)) {
        return createNumberResolver(content);
    } else {
        return createContextResolver(content.split('.'));
    }
};

var createFilterResolver = function(filter_fn, args) {
    return function(context) {
        return function(input, ready) {
            var eter = eterator(args),
                values = [],
                error,
                it;

            eter.on_ready(function() {
              if(error) ready(error, null)
              else {
                  values = [ready, input].concat(values);
                  filter_fn.apply({}, values);
              }
            });
          
            eter(it=function(filtervar) {
                filtervar(context, function(err, data) {
                    if(err) {
                        error = err;
                        it.done();
                    } else {
                        values.push(data);
                        it.next();
                    }
                });
            });
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
            var eter = eterator(filter_chain),
                error,
                value,
                it;

            eter.on_ready(function() {
                error ? 
                    callback(error, null) :
                    callback(null, value);
            });

            eter(it=function(filtervar) {
                filtervar(context)(value, function(err, data) {
                    if(err) {
                        error = err;
                        it.done();
                    } else {
                        value = data;
                        it.next();
                    }
                });
            });
        };

    resolve.original = content;
    return resolve;
};

exports.Parser = Parser;
})(get_exports("parsers"));
(function(exports){var nodes = plate.nodes,
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
        var ttag = parser.tagLibrary.lookup(this.name)(content.replace(/^\s*/, '').replace(/\s*$/, ''), parser);
        ttag.__name__ = this.name;
        return ttag;
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
})(get_exports("tokens"));
(function(exports){var tokens = plate.tokens,
    parsers = plate.parsers,
    libraries = plate.libraries;

var Context = function(dict) {
    if(dict) {
        for(var name in dict) if(dict.hasOwnProperty(name)) {
            this[name] = dict[name];
        }
    }
};

Context.prototype.copy = function() {
    var sup = function(){},
        cpy;

    sup.prototype = this;
    return new sup; 
};

var Template = function(raw, libs, parser) {
    if(typeof(raw) !== 'string') {
        throw new TypeError("You must pass in a string to render the template.");
    }
    this.raw = raw;
    libs = libs || {};
    this.tag_library = libs.tag_library || Template.Meta.createTagLibrary();
    this.filter_library = libs.filter_library || Template.Meta.createFilterLibrary();
    this.plugin_library = libs.plugin_library || Template.Meta.createPluginLibrary();
    this.parser = parser || parsers.Parser;
};

Template.Meta = {
  _autoregister:{plugin:{}, tag:{}, filter:{}},
  _classes:{plugin:libraries.DefaultPluginLibrary,tag:libraries.DefaultTagLibrary,filter:libraries.DefaultFilterLibrary},
  _cache:{}
};

var createGetLibraryMethod = function(name) {
  return function() {
    if(this._cache[name])
      return this._cache[name]; 

    var lib = new this._classes[name];
    for(var key in this._autoregister[name]) if(this._autoregister[name].hasOwnProperty(key)) {
      lib.register(key, this._autoregister[name][key]);
    }

    this._cache[name] = lib;
    return lib;
  };
};

var createSetAutoregisterMethod = function(name) {
  return function(key, item) {
    if(this._cache[name])
      this._cache[name].register(key, item);
    else
      this._autoregister[name][key] = item;
  };
};

Template.Meta.createPluginLibrary = createGetLibraryMethod('plugin');
Template.Meta.createFilterLibrary = createGetLibraryMethod('filter');
Template.Meta.createTagLibrary = createGetLibraryMethod('tag');
Template.Meta.registerPlugin = createSetAutoregisterMethod('plugin');
Template.Meta.registerFilter = createSetAutoregisterMethod('filter');
Template.Meta.registerTag = createSetAutoregisterMethod('tag');
  
Template.createPluginLibrary = function() {
  return new libraries.DefaultPluginLibrary();
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
        repl_re = /[^\n]*/gm,
        incLineNo = function(str) {
            lineNo += str.replace(repl_re, '').length;
        };

    do {
        MATCH_RE.lastIndex = 0;
        match = MATCH_RE.exec(raw);
        if(match) {
            var str = raw.slice(0, match.index);
            incLineNo(str);
            if(match.index > 0) {
                tokens_out.push(new tokens.TextToken(str));
            }

            var token_data = match[1].replace(/^\s+/g, '').replace(/\s+$/g, ''),
                token_cls = map[match[0].charAt(1)];

            tokens_out.push(new token_cls(token_data, lineNo));
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
})(get_exports("index"));
})();
