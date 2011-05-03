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

    * jQuery (For Dom manipulation)
    * store.js (For persistant client-side storage)
    * plate.js (For Template rendering, but can be swapped out for another template engine)


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
            <section id="timeline" data-render="sorted" data-sort-on="article > time"></section>
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
