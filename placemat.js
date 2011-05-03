window.PlateBackend = function() {};

PlateBackend.prototype.render = function(template, context){
  var t = new plate.Template(template);
  return t.render(context);
};

(function(global, $) {

  placemat = function(backend, opts) {
    var opt;
    if (typeof backend === "undefined") {
      backend = new PlateBackend();
    }
    this.backend = backend;

    // Optional keyword arguments
    if (typeof opts === "undefined") {
      opts = {};
    }
    var options = {
      'prefix': '/templates/'
    };
    for (opt in options) {
      if (options.hasOwnProperty(opt)) {
        this[opt] = opts[opt] || options[opt];
      }
    }

    // Other Setup
    this.totalTemplates = 0;
    this.templatesLoaded = 0;
    this._fetch_templates = [];
    this.Templates = {};
    this.Contexts = {};

    $(document).bind('placemat.templates.loaded', this.renderTemplates);
  };

  placemat.prototype.register = function(obj, deferLoading) {
    /*
    Registers either template path, list of template paths, or a object with
    keys being template hashes and values being the templates path.

    Optional deferLoading parameter allows templates to be fetched during the
    rendering stage rather than the registering stage.  NOTE: I'm not sure if
    this is useful, but I though I'd leave it in there in case there's a
    use-case I haven't thought of.
    */
    var self = this;
    var defer = typeof deferLoading === "undefined" ? false : deferLoading;
    this.totalTemplates++;
    var handleTemplate, i, hash;
    if (defer) {
      handleTemplate = function(template) {
        self._fetch_templates.push(template);
      };
    } else {
      handleTemplate = this.fetchTemplate;
    }

    if ($.isArray(obj)) {
      for (i = 0; i < obj.length; i++) {
        handleTemplate(obj[i]);
      }
    } else if ($.isPlainObject(obj)) {
      for (hash in obj) {
        if (obj.hasOwnProperty(hash)) {
          this.checkAndSet(obj[hash], hash, handleTemplate);
        }
      }
    } else if (typeof obj === "string") {
      handleTemplate(obj);
    }
  };

  placemat.prototype.updateStatus = function() {
    this.templatesLoaded++;
    if (this.templatesLoaded === this.totalTemplates) {
      $(document).trigger('placemat.templates.loaded');
    }
  };

  placemat.prototype.fetchTemplate = function(path) {
    /*
     Uses the predefined path prefix with the path provided to fetch the template
     from the server.
    */
    url = this.prefix + path;
    var self = this;
    $.get(url, function(data) {
      /*
      fetches the template from the server.  The server should response with
      either a string template or an object that contains a hash of the template
      along with the template contents.
      */
      store.set(path, data);
      if (typeof data === "string") {
        self.Templates[path] = {'template': data};
      } else {
        self.template_hashes[data.hash] = path;
        self.Templates[path] = {
          'hash': data.hash,
          'template': data.template
        };
      }
      self.updateStatus();
    });
  };

  placemat.prototype.checkAndSet = function(path, hash, handleTemplate) {
    /*
    Checks to see if the template exists in the store cache.

    If it doesn't exist in the cache, we fetch it and place it in there. If it
    exists in the cache, but it doesn't matched the hash, then evict the old
    template with the new one.  If the template does exist in the cache, then
    load the template and check to make sure if all the templates have loaded.
    */
    var template = store.get(path);
    if (typeof template === "undefined") { // Cache miss
      handleTemplate(path);
    } else if (template.hash !== hash) { // Template has changed
      handleTemplate(path);
    } else {
      this.Templates[path] = template.content;
      this.updateStatus();
    }
  };

  placemat.prototype.render = function() {
    /*
    Fetches any deferred templates and therefore causes the
    ``plate.templates.loaded`` event to fire when they all come back.
    */
    var i, count = this._fetch_templates.length;
    if (count > 0) {
      for (i = 0; i < count; i++) {
        this.fetchTemplate(this._fetch_templates[i]);
      }
    }
  };

  placemat.prototype.add_context = function(target, template, data) {
    this.Contexts[target] = {
      'template': template,
      'data': data
    };
  };

  placemat.prototype.renderTemplates = function() {
    var key, template;
    for (key in window.Contexts) {
      if (window.Contexts.hasOwnProperty(key)) {
        context = window.Contexts[key];
        template = this.Templates[context.template];
        $(target).html(this.backend.render(template, context.data));
      }
    }
  };

  global.placemat = placemat;

}(window, jQuery));

