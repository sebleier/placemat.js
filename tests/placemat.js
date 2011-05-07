var platoon = require('platoon');

exports.ExampleTest = platoon.unit({
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
    backend = new SomeBackend();
    placemat = new Placemat(backend);
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
    placemat = new Placemat((new PlateBackend()), {'prefix': 'http://templates.example.com'});
    assert.notEqual(typeof(placemat.prefix), "undefined");
    assert.equal(placemat.prefix, 'http://templates.example.com');
  },
  function(assert) {
    "Test trying to initialize Placemat with bogus values doesn't add to the attributes"
    placemat = new Placemat((new PlateBackend()), {'cookieMonster': 'OmNomNom'});
    assert.equal(typeof(placemat.cookieMonster), "undefined");
  }
);
