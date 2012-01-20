import os

ROOT_URLCONF = 'testserver.urls'

base_path = os.path.dirname(__file__)


STATICFILES_DIRS = (os.path.join(base_path, 'static'),)
STATIC_URL = 'static'
TEMPLATE_DIRS = (
    os.path.join(base_path, "templates"),
)

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
)

TEMPLATE_DEBUG = DEBUG = True
