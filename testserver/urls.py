from hashlib import sha1 as sha
import json
import os
from django.conf.urls.defaults import patterns, include, url
from django.http import HttpResponse


def template_view(request, template):
    data = {
        'hash': sha(template).hexdigest(),
        'template': template,
    }
    data = json.dumps(data)
    return HttpResponse(data, mimetype='application/json')

def test_view(request):
    path = os.path.join(os.path.dirname(__file__), *["..", "tests", "tests.html"])
    with open(path) as f:
        template = f.read()
    return HttpResponse(template, mimetype="text/html")

urlpatterns = patterns('',
    url(r'^template/(?P<template>.*)$', template_view),
    url(r'^$', test_view),
    url(r'^placemat.js', 'django.contrib.staticfiles.views.serve', {'path': 'placemat.js'}),
    url(r'^tests/lib/plate.js', 'django.contrib.staticfiles.views.serve', {'path': 'tests/lib/plate.js'}),
    url(r'^tests/placemat.js$', 'django.contrib.staticfiles.views.serve', {'path': 'tests/placemat.js'}),
)
