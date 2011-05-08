import os
from posixpath import normpath

ROOT_URLCONF = 'testserver.urls'

path = os.path.join(os.path.dirname(__file__), "..")
path = normpath(path)

STATICFILES_DIRS = (path,)

TEMPLATE_DIRS = (
    os.path.join(os.path.dirname(__file__), "templates"),
)

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
)

TEMPLATE_DEBUG = DEBUG = True
