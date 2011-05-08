var platoon = require('platoon');

exports.PlacematTests = platoon.unit({
    setUp:function(callback) {
        callback();
    },
    tearDown:function(callback) {
        callback();
    },
  },
  function(assert) {
    "Testing that creating a Placemat instance, actually creates a Placemat instance";
    placemat = new Placemat();
    assert.isInstance(placemat, Placemat);
  },
  function(assert) {
    "Test the default backend was created";
    placemat = new Placemat();
    assert.notEqual(typeof(placemat.backend), "undefined");
    assert.isInstance(placemat.backend, PlateBackend)
  },
  function(assert) {
    "Test passing in a custom backend";
    var SomeBackend = function() {};
    placemat = new Placemat(SomeBackend);
    assert.notEqual(typeof(placemat.backend), "undefined");
    assert.isInstance(placemat.backend, SomeBackend);
  },
  function(assert) {
    "Initial Placemat with default prefix"
    placemat = new Placemat();
    assert.notEqual(typeof(placemat.prefix), "undefined");
    assert.equal(placemat.prefix, '/fragments/');
  },
  function(assert) {
    "Initial Placemat with custom prefix"
    placemat = new Placemat(PlateBackend, {'prefix': 'http://templates.example.com'});
    assert.notEqual(typeof(placemat.prefix), "undefined");
    assert.equal(placemat.prefix, 'http://templates.example.com');
  },
  function(assert) {
    "Test trying to initialize Placemat with bogus values doesn't add to the attributes"
    placemat = new Placemat(PlateBackend, {'cookieMonster': 'OmNomNom'});
    assert.equal(typeof(placemat.cookieMonster), "undefined");
  }
);


exports.fetchTests = platoon.unit({
    setUp:function(callback) {
        callback();
    },
    tearDown:function(callback) {
        callback();
    },
  },
  function(assert) {
    "Testing that the proper amount of templates are being fetched with all three object types"
    placemat = new Placemat();
    var callCount = 0;
    placemat.fetchTemplate = function(obj) {
      callCount++;
    };
    placemat.checkAndSet = function(path, hash) {
      assert.equal(hash.length, 40);
      callCount++;
    };
    placemat.fetch("/timeline/item.htm");
    assert.equal(callCount, 1);
    callCount = 0;
    placemat.fetch(["/timeline/item.htm", "timeline/item_photo.html"]);
    assert.equal(callCount, 2);
    callCount = 0;
    placemat.fetch({
        '77f1dd49b49dc267a2c6f872f640df46688a5a54': 'timeline/item.html',
        'b8330f5a1065f3916946d80c5ba109f0d0c653e6': 'timeline/item_photo.html'
    });
    assert.equal(callCount, 2);
  }
);


exports.fetchTemplateTests = platoon.unit({
    setUp:function(callback) {
        callback();
    },
    tearDown:function(callback) {
        callback();
    },
  },
  function(assert) {
    "Testing the fetchTemplate method"
    var placemat = new Placemat(PlateBackend, {'prefix': 'http://127.0.0.1:8001/'});
    var path = "template/test";
    placemat.fetchTemplate(path, true);
    assert.isInstance(placemat.Templates[path], placemat.AsyncResult);
    var template = placemat.Templates[path].get();

    assert.isInstance(template, plate.Template);
  }
);
