var AsyncResult;
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
    // wrap the plate template object. anything returned from a function called with ``new FN()`` will
    // be assigned to the caller -- that is to say, you'll get an instance of ``plate.Template`` when you
    // call ``new PlateTemplate``, not the wrapped function. weird, huh?

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
      if(typeof template !== "undefined") {
        callback(null, template);
      } else {
        callback(new Error("Could not find '"+name+"'"));
      }
    }
  };
};

var TemplateDoesNotExist = function(message) {
  this.message = message;
};

// PLACEMAT


(function(global, $) {

  Placemat = function(backend, opts) {
    var opt;
    var self = this;
    if (typeof backend === "undefined") {
      backend = new PlateBackend(this);
    }
    this.backend = backend;

    // Optional keyword arguments
    if (typeof opts === "undefined") {
      opts = {};
    }
    var options = {
      'prefix': '/fragments/'
    };
    for (opt in options) {
      if (options.hasOwnProperty(opt)) {
        this[opt] = opts[opt] || options[opt];
      }
    }

    // Other Setup
    this.Templates = {};
    this.Contexts = {};

    this,AsyncResult = function(path, timeout) {
      this.path = path;
      this.startTime = new Date();

      this.get = function() {
        var endTime = new Date();
        while(((endTime - startTime) / 1000) < timeout) {
          if (typeof self.Templates[path] !== "undefined") {
            return self.Templates[path];
          }
        }
        throw new Error("Timeout error");
      };
    };
  };

  Placemat.prototype.fetch = function(obj) {
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
    } else if (typeof obj === "string") {
      this.fetchTemplate(obj);
    }
  };

  Placemat.prototype.fetchTemplate = function(path, async) {
    /*
    Uses the predefined path prefix with the path provided to fetch the template
    from the server.

    fetches the template from the server.  The server should respond with
    either a string template or an object that contains a hash of the template
    along with the template contents.
    */
    var url = this.prefix + path;
    var self = this;

    if (async) {
      self.Templates[path] = new AsyncResult(path, 30);
    }

    $.ajax({
      'url': url,
      'type': 'GET',
      'async': async,
      'success': function(data, textStatus) {
        /*
        ``data`` may be a string, in which case we're interpreting ``data`` as
        an html template.  If data it is an object, it is interpreted as an
        object,
        */
        if (typeof data === "string") {
          self.Templates[path] = new self.backend.Template(data);
        } else {
          self.Templates[path] = new self.backend.Template(data.template);
          store.set(path, data);
        }
      },
      'statusCode': {
        404: function() {
          self.Templates[path] = new TemplateDoesNotExist(path + " template not found");
        }
      }
    });
  };

  Placemat.prototype.checkAndSet = function(path, hash, async) {
    /*
    Checks to see if the template exists in the placemat cache and then the
    store cache.

    If it doesn't exist in the cache, we fetch it and place it in there. If it
    exists in the cache, but it doesn't matched the hash, then evict the old
    template with the new one.  If the template does exist in the cache, then
    load the template and check to make sure if all the templates have loaded.
    */
    async = typeof async === "undefined" ? true : async;

    // Check Session cache to see if template has already been loaded
    var template = this.Templates[path];
    if (typeof template === 'undefined') {
      // Check the cross-session cache if template exists
      template = store.get(path);
      if (typeof template === "undefined") { // Cache miss
        this.Templates[path] = this.fetchTemplate(path, async);
      } else if (template.hash !== hash) { // Template has changed
        this.Templates[path] = this.fetchTemplate(path, async);
      } else {
        this.Templates[path] = new this.backend.Template(template.template);
      }
    }
  };

  Placemat.prototype.getTemplate = function(path, hash) {
    /*
    Synchronously retreives a template.
    */
    this.checkAndSet(path, hash, async=false);
    return this.Templates[path];
  };

  Placemat.prototype.render = function(target, template, data) {
    var html;
    var tpl = this.Templates[template];
    if (tpl instanceof AsyncResult) {
      tpl = template.get();
    }
    this.backend.render(tpl, data, function(err, data) {
      $(target).html(data);
    });
  };

  global.Placemat = Placemat;

}(window, jQuery));
