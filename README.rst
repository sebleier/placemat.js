Placemat.js
===========

placemat.js is a template and context manager using template rendering engines
to place rendered html code into specific targets in the DOM.


How does it Work?
-----------------

placemat.js uses store.js for caching templates client-side. Then for each
request, your server declares what templates it wants to use.  If they don't
exist in the cache, then they are retrieved from the server. If they exist in
the cache, but the sha is different, they are also retrieved from the server.
Otherwise, the templates are loaded from the cache, saving a round trip from
the server.

placemat.js provides a template rendering backend with its own template loader
for plate.js so that templates can go through the caching/fetching process
transparently so that you can focus on writing templates.

placemat.js supports different type of template rendering which include
replacing content (default), prepending, appending, and sorted insert.  The last
three are for list type data rendering.

Requirements:
-------------

    * `jQuery`_ (For Dom manipulation)
    * `store.js`_ (For persistant client-side storage)
    * `plate.js`_ (For Template rendering, but can be swapped out for another template engine)

.. _`jQuery`: http://jquery.com
.. _`store.js`: http://github.com/marcuswestin/store.js
.. _`plate.js`: http://github.com/chrisdickinson/plate

Show me some code!
------------------

Example javascript::

    var templates = {
        '77f1dd49b49dc267a2c6f872f640df46688a5a54': 'timeline/item.html',
        'b8330f5a1065f3916946d80c5ba109f0d0c653e6': 'timeline/item_photo.html',
        '4c26c88f7bf94cce5aac2f1ff77e7c2d4329ca4c': 'timeline/item_video.html'
    }

    var mat = new placemat();

    mat.register(templates);

    // Get Some Data
    $.getJSON("/timeline.json", function(data) {
        mat.add_context("#timeline", "posts/item.html", data);
        mat.render();
    });

Example HTML::

    <!DOCTYPE html>
    <html>
        <head>
            ...
        </head>
        <body>
            <section id="timeline" data-render="sorted" data-sort-on="article > time" data-sort-order="desc"></section>
        </body>
    </html>


posts/item.html::

    <article>
        <time>item.created</time>
        {% if item.type == 'photo' %}
            {% include "timeline/item_photo.html" %}
        {% end}
        {% if item.type == 'video' %}
            {% include "timeline/item_video.html" %}
        {% endif %}
    </article>

posts/item_photo.html::

    <img src="{{ item.url }}" />

posts/item_video.html::

    <video src="{{ item.url }}" />


What is exactly going on?
-------------------------

First we have the javascript that instantiates a placemat instance and registers
the templates provided by the server app.  Templates may be registered as a
single string, which is a url relative to the where ever the ``prefix`` variable
is set.  You can define the ``prefix`` variabe to something like
``var mat = new placemat({'prefix': 'http://templates.example.com'});``.  You
can also register a list of paths or an object that maps templates to their
hash.  The later is the prefered method, since we want templates to be cached
client-side.  Registering a list or a single string will cause placemat to
fetch the template and bypass the cache.

The Second step is to get the data that will populate a ``Context``.  A
``Context`` is data that is assigned a target and template so we can find the
target in the DOM, determine what kind of rendering method to use, and then
proceed with rendering the template with the data.

As you can see from the example HTML, you can specifiy different rendering flags
on the target node.  In this instance, we specify ``data-render="sorted"``
, ``data-sorted-on="article > time"``, and ``data-sort-order="desc"`` on the
section element. ``data-render`` can either be ``append``, ``prepend``, or
``sorted`` so that new contexts that target that section element are inserted in
the right place.  The ``data-sorted-on`` flag is a jQuery selector that selects
the element that holds the value to be used for determining the place.  Finally,
the ``data-sort-order`` flag specifies the order in which the articles are
ordered.  Descending means that the articles would render latest on the top and
oldest on the bottom.
