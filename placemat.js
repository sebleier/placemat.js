/*
Backends are responsible for providing a compatibility layer between Placemat
and their template engine.  They need to provide two important functions. First,
they need to be able to create a ``Template`` object that is stored in the
session cache, i.e. ``Placemat.Templates``.  They also need to be able to take
one of their templates and render it using a object mapping variable names to
values.
*/


window.PlateBackend = function(placemat) {
  var self = this;
  self.placemat = placemat;

  this.Template = function(raw, libraries, parser) {
    // grab the new plugin library with our loader
    var plugin_library = self.getDefaultPluginLibrary();
    libraries = libraries || {};

    // override the plugin library with our new plugin library.
    libraries.plugin_library = plugin_library;

    // return the plate template.
    var template = new plate.Template(raw, libraries, parser);

    return template;
  };

  // this is just a nice way of creating the ``plate.libraries.Library`` object
  // with our loader.
  this.getDefaultPluginLibrary = function() {

    // memoize the function call.
    if(arguments.callee._loaded) {
      return arguments.callee._loaded;
    }
    var library = new plate.libraries.Library(),
        loader = self.loader;

    // ``include``, ``extend``, etc, all look for the 'loader' plugin.
    library.register('loader', loader.getPlugin());

    // store the memoized value.
    arguments.callee._loaded = library;
    return library;
  };

  this.render = function(template, context, callback) {
    /*
    Template is an instance of ``PlateBackend.Template``
    */
    return template.render(context, callback);
  };

  this.loader = {
    "getPlugin": function() {
      // plugins are functions that take a ``name`` and a ``callback`` (err, data) to call
      // when the target is either found or not found.
      var _self = this;
      return function(name, callback) {
        _self.lookup(name, callback);
      };
    },

    "lookup": function(name, callback) {
      var template = self.placemat.getTemplate(name);
      if(template !== undefined) {
        callback(null, template);
      } else {
        callback(new Error("Could not find '"+name+"'"));
      }
    }
  };
};

/**********
* PLACEMAT
**********/

(function(global, $) {
  function noop() {}

  Placemat = function(opts) {
    var opt;
    var self = this;
    // Optional keyword arguments
    var opts = opts || {};

    this.VERSION = [0, 2, 3];
    this.VERSION_STRING = this.VERSION.join(".");

    // Defaults
    var options = {
      'prefix': '',
      'backend': PlateBackend
    };

    for (opt in options) {
      if (options.hasOwnProperty(opt)) {
        this[opt] = opts[opt] === undefined ? options[opt] : opts[opt];
      }
    }

    this.backend_cls = this.backend;
    this.backend = new this.backend_cls(this)

    // Other Setup
    this.Templates = {};
    this.Contexts = {};

    // Add support for python style named groups
    XRegExp.addToken(
        /\(\?P<([$\w]+)>/,
        function (match) {
            this.captureNames.push(match[1]);
            this.hasNamedCapture = true;
            return "(";
        }
    );

    this.TemplateDoesNotExist = function(message) {
      this.message = message;
    }
  };

  var proto = Placemat.prototype;

  proto.cache = {
    set: function(key, value, timeout) {
      var timeout = timeout === undefined ? -1 : timeout;
      var self = this;
      this.handles = this.handles || {};

      if (key in this.handles) {
        clearTimeout(this.handles[key]);
      }

      if (timeout === -1) {
        store.set(key, value);
      } else if (timeout !== 0) {
        store.set(key, value);
        this.handles[key] = setTimeout(function() {
          if (key in self.handles) {
            delete self.handles[key];
          }
          store.remove(key);
        }, timeout * 1000);
      }
    },
    get: function(key) {
      return store.get(key);
    }
  }

  proto.fetch = function(obj) {
    /*
    Fetches templates based on their path, list of template paths, or a object
    with keys being template hashes and values being the template paths.
    */
    var i, hash;
    if ($.isArray(obj)) {
      for (i = 0; i < obj.length; i++) {
        this.fetchTemplate(obj[i]);
      }
    } else if ($.isPlainObject(obj)) {
      for (hash in obj) {
        if (obj.hasOwnProperty(hash)) {
          this.checkAndSet(obj[hash], hash);
        }
      }
    } else if (typeof(obj) === "string") {
      this.fetchTemplate(obj);
    }
  };

  proto.fetchTemplate = function(path, callback) {
    /*
    Uses the predefined path prefix with the path provided to fetch the template
    from the server.

    fetches the template from the server.  The server should respond with
    either a string template or an object that contains a hash of the template
    along with the template contents.
    */

    var url = this.prefix + path;
    var self = this;
    $.ajax({
      'url': url,
      'type': 'GET',
      'async': false,
      'success': function(data, textStatus) {
        /*
        ``data`` may be a string, in which case we're interpreting ``data`` as
        an html template.  If data it is an object, it is interpreted as an
        object,
        */
        if (typeof(data) === "string") {
          self.Templates[path] = new self.backend.Template(data);
        } else {
          self.Templates[path] = new self.backend.Template(data.template);
          this.cache.set(path, data);
        }
        if (typeof(callback) === "function") {
          callback();
        }
      },
      'statusCode': {
        404: function() {
          self.Templates[path] = new self.TemplateDoesNotExist(path + " template not found");
        }
      }
    });
  };

  proto.checkAndSet = function(path, hash) {
    /*
    Checks to see if the template exists in the placemat cache and then the
    store cache.

    If it doesn't exist in the cache, we fetch it and place it in there. If it
    exists in the cache, but it doesn't matched the hash, then evict the old
    template with the new one.  If the template does exist in the cache, then
    load the template and check to make sure if all the templates have loaded.
    */

    // Check Session cache to see if template has already been loaded
    var template = this.Templates[path];
    if (template === undefined) {
      // Check the cross-session cache if template exists
      template = this.cache.get(path);
      if (template === undefined) { // Cache miss
        this.fetchTemplate(path);
      } else if (template.hash !== hash) { // Template has changed
        this.fetchTemplate(path);
      } else {
        this.Templates[path] = new this.backend.Template(template.template);
      }
    }
  };

  proto.getTemplate = function(path, hash) {
    /*
    Synchronously retreives a template.
    */
    this.checkAndSet(path, hash);
    return this.Templates[path];
  };

  proto.render = function(target, template, context, opts) {
    var context = context || [{}];
    context = $.isArray(context) ? context : [context];
    var opts = opts || {};
    var html, method;
    var i = 0;
    var obj = $(target);
    var render = opts.render || obj.data('render') || 'replace';

    // Callbacks
    var postRender = opts.postRender || noop;
    var finished = opts.finished || noop;
    var error = opts.error || noop

    var tpl = this.Templates[template];
    if (tpl === undefined) {
      throw new this.TemplateDoesNotExist("'"+template+'"" is the stuff of dreams and fancy; template does not exist');
    }
    var completed = 0;
    function processCallbacks(err) {
      if (err) {
        error(err);
      } else {
        postRender();
        if (++completed === context.length) {
          finished();
        }
      }
    }

    for (i = 0; i < context.length; i++) {
      method = "render_"+render;
      if (this[method] !== undefined) {
        this[method](obj, tpl, context[i], processCallbacks);
      }
    }
  };

  proto.render_replace = function(obj, tpl, context, callback) {
    this.backend.render(tpl, context, function(err, data) {
      if(err) {
        callback(err);
      }
      obj.html(data);
      callback()
    });
  }

  proto.render_prepend = function(obj, tpl, context, callback) {
    this.backend.render(tpl, context, function(err, data) {
      if (err) {
        return callback(err)
      }
      obj.prepend($(data));
      callback();
    });
  }

  proto.render_append = function(obj, tpl, context, callback) {
    this.backend.render(tpl, context, function(err, data) {
      if (err) {
        return callback(err)
      }
      obj.append($(data));
      callback()
    });
  }

  proto.render_sorted = function(obj, tpl, context, callback) {
    var self = this;
    var item;
    var sortOn = obj.data('sortOn');
    var sortOrder = obj.data('sortOrder');
    var dataType = obj.data('dataType');

    if (sortOrder === undefined) {
      sortOrder = "desc"
    } else {
      sortOrder = sortOrder.toLowerCase();
    }

    this.backend.render(tpl, context, function(err, data) {
      if (err) {
        return callback(err)
      }
      var element = $(data);
      var item, items = obj.children();
      var value;
      var comparable = element.find(sortOn);
      var new_value = self.getElementValue(comparable, dataType);

      if (items.length === 0) {
        obj.append(element);
      }
      for(var i = 0, n = items.length; i < n; i++) {
        item = $(items[i]);
        comparable = item.find(sortOn);
        value = self.getElementValue(comparable, dataType);
        if (sortOrder === 'asc') {
          if (new_value < value) {
            element.insertBefore(item);
            break;
          }
          if (i === items.length - 1) {
            element.insertAfter(item);
          }
        } else if (sortOrder === 'desc') {
          if (new_value > value) {
            element.insertBefore(item);
            break;
          }
          if (i === items.length - 1) {
            element.insertAfter(item);
          }
        }
      }
      callback();
    });
  }

  // Utility functions
  proto.getElementValue = function(element, dataType) {
    var element = $(element);
    var value, raw = element.text();
    switch (dataType) {
      case "integer":
        value = parseInt(raw);
      case "float":
        value = parseFloat(raw);
      case "date":
        value = Date.parse(raw);
      default:
        value = parseFloat(raw)
        value = isNaN(value) ? raw : value;
    }
    return value
  }

  global.Placemat = Placemat;

}(window, jQuery));
