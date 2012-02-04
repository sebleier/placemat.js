from hashlib import sha1 as sha
import json
import os
from posixpath import normpath
from django.conf.urls.defaults import patterns, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.template import Template, Context
from django.http import HttpResponse


def template_view(request, template):
    base_path = normpath(os.path.dirname(__file__))
    path = os.path.join(base_path, 'templates', template)
    with open(path) as f:
        template = f.read()
    data = {
        'hash': sha(template).hexdigest(),
        'template': template,
    }
    return HttpResponse(json.dumps(data), mimetype='application/json')


def test_view(request):
    base_path = normpath(os.path.dirname(__file__))
    path = os.path.join(base_path, 'templates/tests.html')
    with open(path) as f:
        t = Template(f.read())
    c = Context({})
    return HttpResponse(t.render(c))


urlpatterns = patterns('',
    url(r'^template/(?P<template>.*)$', template_view),
    url(r'^$', test_view),

)
urlpatterns += staticfiles_urlpatterns()

