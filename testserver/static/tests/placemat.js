var platoon = require('platoon');

exports.PlacematTests = platoon.unit({
    setUp:function(callback) {
        store.clear();
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
    placemat = new Placemat({'backend': SomeBackend});
    assert.notEqual(typeof(placemat.backend), "undefined");
    assert.isInstance(placemat.backend, SomeBackend);
  },
  function(assert) {
    "Initial Placemat with default prefix"
    placemat = new Placemat();
    assert.notEqual(typeof(placemat.prefix), "undefined");
    assert.equal(placemat.prefix, '');
  },
  function(assert) {
    "Initial Placemat with custom prefix"
    placemat = new Placemat({'prefix': 'http://templates.example.com'});
    assert.notEqual(typeof(placemat.prefix), "undefined");
    assert.equal(placemat.prefix, 'http://templates.example.com');
  },
  function(assert) {
    "Test trying to initialize Placemat with bogus values doesn't add to the attributes"
    placemat = new Placemat({'cookieMonster': 'OmNomNom'});
    assert.equal(typeof(placemat.cookieMonster), "undefined");
  }
);


exports.fetchTests = platoon.unit({
    setUp:function(callback) {
        store.clear();
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
    placemat.fetch("/timeline/item.html");
    assert.equal(callCount, 1);
    callCount = 0;
    placemat.fetch(["/timeline/item.html", "timeline/item_photo.html"]);
    assert.equal(callCount, 2);
    callCount = 0;
    placemat.fetch({
        '77f1dd49b49dc267a2c6f872f640df46688a5a54': 'timeline/item.html',
        'b8330f5a1065f3916946d80c5ba109f0d0c653e6': 'timeline/item_photo.html'
    });
    assert.equal(callCount, 2);
  },
  function(assert) {
    " Test that fetching templates caches the Template for for this session and stores it in the cross-session cache. "

    var i, count = 0;
    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.fetch({
        '8da5b2c83f835527a6ef7deccaa932fcacc8a29c': 'template/Gary',
        'e2f6ebfc44433cd4d270673127e0e8efd8cdbc46': 'template/Busey'
    }, function() {
        for(path in placemat.Templates) {
            if(placemat.Templates.hasOwnProperty(path)) {
                count++;
            }
        }
        assert.equal(count, 2);
    });

    // Fetch the templates again, this shouldn't change the template count
    count = 0;
    placemat.fetch({
        '8da5b2c83f835527a6ef7deccaa932fcacc8a29c': 'template/Gary',
        'e2f6ebfc44433cd4d270673127e0e8efd8cdbc46': 'template/Busey'
    }, function() {
        for(path in placemat.Templates) {
            if(placemat.Templates.hasOwnProperty(path)) {
                count++;
            }
        }
        assert.equal(count, 2);
    });
  }
);

exports.fetchTemplateTests = platoon.unit({
    setUp:function(callback) {
        store.clear()
        callback();
    },
    tearDown:function(callback) {
        callback();
    },
  },
  function(assert) {
    "Testing the fetchTemplate method"
    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    var path = "template/test";
    placemat.fetchTemplate(path, function() {
        var template = placemat.Templates[path].get();
        assert.isInstance(template, plate.Template);
    });
  },
  function(assert) {
    "Test when a template does not exist on server"
    placemat = new Placemat();
    var path = "path/that/does/not/exist";
    placemat.fetchTemplate(path, function() {
        var template = placemat.Templates[path].get();
        assert.isInstance(template, placemat.TemplateDoesNotExist);
        assert.equal(template.message, "path/that/does/not/exist template not found")
    });
  },
  function(assert) {
    "Test when referencing a template that does not exist locally"
    placemat = new Placemat();
    assert.throws(placemat.TemplateDoesNotExist, function() {
        placemat.render("#some-id", "template/that/does/not/exist", [{}]);
    })
  }
);


exports.renderTests = platoon.unit({
    setUp: function(callback) {
        store.clear();
        $("#dom-tests").empty();
        callback();
    },
    tearDown: function(callback) {
        $("dom-tests").removeAttr("data-render");
        $("dom-tests").removeAttr("data-sort-on");
        $("dom-tests").removeAttr("data-sort-order");
        $("#dom-tests").empty();
        callback();
    },
  },
  function(assert) {
    "Test simple rendering using the Plate backend"
    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    var template = new placemat.backend.Template("{{ name }}")
    placemat.backend.render(template, {'name': "Gary Busey"}, function(err, data) { assert.equal("Gary Busey", data)});
  },
  function(assert) {
    "Test targeting dom element using the replace method"
    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['person'] = new placemat.backend.Template("{{ name }}");

    placemat.render("#dom-tests", 'person', {'name': "Thomas Edison"}, {
        callback: function() {
            assert.equal($("#dom-tests").html(), "Thomas Edison");
        }
    });


    placemat.render("#dom-tests", 'person', {'name': "Nikola Tesla"}, {
        callback: function() {
            assert.equal($("#dom-tests").html(), "Nikola Tesla");
        }
    });

  },
  function(assert) {
    "Test targeting dom element using the prepend method"
    $("#dom-tests").empty();
    $("#dom-tests").data("render", "prepend");

    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['people'] = new placemat.backend.Template("<div>{{ name }}</div>");

    placemat.render("#dom-tests", 'people', [{'name': "Thomas Edison"}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div>Thomas Edison</div>");
        }
    });


    placemat.render("#dom-tests", 'people', [{'name': "Nikola Tesla"}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div>Nikola Tesla</div><div>Thomas Edison</div>");
        }
    });

  },
  function(assert) {
    "Test targeting dom element using the append method"
    $("#dom-tests").empty();
    $("#dom-tests").data("render", "append");

    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['people'] = new placemat.backend.Template("<div>{{ name }}</div>");

    placemat.render("#dom-tests", 'people', [{'name': "Thomas Edison"}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div>Thomas Edison</div>");
        }
    });


    placemat.render("#dom-tests", 'people', [{'name': "Nikola Tesla"}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div>Thomas Edison</div><div>Nikola Tesla</div>");
        }
    });
  },
  function(assert) {
    "Test targeting dom element using the sorted method on the time element ascending order"
    $("#dom-tests").empty();
    $("#dom-tests").data("render", "sorted");
    $("#dom-tests").data('sortOn', "> time");
    $("#dom-tests").data('sortOrder', "asc");

    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['people'] = new placemat.backend.Template("<div><h3>{{ name }}</h3><time>{{ time }}</time></div>");

    placemat.render("#dom-tests", 'people', [{'name': "Thomas Edison", 'time': 1}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Thomas Edison</h3><time>1</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Nikola Tesla", 'time': 3}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Thomas Edison</h3><time>1</time></div><div><h3>Nikola Tesla</h3><time>3</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Stephen Hawking", 'time': 2}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Thomas Edison</h3><time>1</time></div><div><h3>Stephen Hawking</h3><time>2</time></div><div><h3>Nikola Tesla</h3><time>3</time></div>");
        }
    });
  },
  function(assert) {
    "Test targeting dom element using the sorted method on the time element descending order"
    $("#dom-tests").empty();
    $("#dom-tests").data("render", "sorted");
    $("#dom-tests").data('sortOn', "> time");
    $("#dom-tests").data('sortOrder', "desc");

    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['people'] = new placemat.backend.Template("<div><h3>{{ name }}</h3><time>{{ time }}</time></div>");

    placemat.render("#dom-tests", 'people', [{'name': "Thomas Edison", 'time': 1}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Thomas Edison</h3><time>1</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Nikola Tesla", 'time': 3}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Nikola Tesla</h3><time>3</time></div><div><h3>Thomas Edison</h3><time>1</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Stephen Hawking", 'time': 2}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Nikola Tesla</h3><time>3</time></div><div><h3>Stephen Hawking</h3><time>2</time></div><div><h3>Thomas Edison</h3><time>1</time></div>");
        }
    });
  },
  function(assert) {
    "Test targeting dom element using the sorted method on the string element ascending order"
    $("#dom-tests").empty();
    $("#dom-tests").data("render", "sorted");
    $("#dom-tests").data('sortOn', "> h3");
    $("#dom-tests").data('sortOrder', "asc");

    var placemat = new Placemat({'prefix': 'http://127.0.0.1:8001/'});
    placemat.Templates['people'] = new placemat.backend.Template("<div><h3>{{ name }}</h3><time>{{ time }}</time></div>");

    placemat.render("#dom-tests", 'people', [{'name': "Stephen Hawking", 'time': 1}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Stephen Hawking</h3><time>1</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Thomas Edison", 'time': 2}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Stephen Hawking</h3><time>1</time></div><div><h3>Thomas Edison</h3><time>2</time></div>");
        }
    });

    placemat.render("#dom-tests", 'people', [{'name': "Nikola Tesla", 'time': 3}], {
        callback: function() {
            assert.equal($("#dom-tests").html(), "<div><h3>Nikola Tesla</h3><time>3</time></div><div><h3>Stephen Hawking</h3><time>1</time></div><div><h3>Thomas Edison</h3><time>2</time></div>");
        }
    });
});

exports.cacheTests = platoon.unit({
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    }
},
function(assert) {
    "Test cache set no timeout"
    var placemat = new Placemat();
    placemat.cache.set('foo', 'bar')
    assert.equal(placemat.cache.get('foo'), 'bar')
},
function(assert) {
    "Test cache set -1 timeout"
    var placemat = new Placemat();
    placemat.cache.set('foo', 'bar', -1)
    assert.equal(placemat.cache.get('foo'), 'bar')
},
function(assert) {
    "Test cache set 0 timeout"
    store.clear();
    var placemat = new Placemat();
    placemat.cache.set('foo', 'bar', 0)
    assert.equal(placemat.cache.get('foo'), undefined)
},
function(assert) {
    "Test cache normal timeout"
    store.clear();
    var placemat = new Placemat();
    placemat.cache.set('foo', 'bar', 1)

    setTimeout(assert.async(function() {
        console.log(placemat.cache.get('foo'))
        assert.equal(placemat.cache.get('foo'), 'bar')
    }), 100);

    setTimeout(assert.async(function() {
        assert.equal(placemat.cache.get('foo'), undefined)
    }), 1200);
}
);
