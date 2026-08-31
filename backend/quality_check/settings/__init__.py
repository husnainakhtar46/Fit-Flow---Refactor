import os

env = os.getenv("DJANGO_ENV", "").lower()
settings_module = os.getenv("DJANGO_SETTINGS_MODULE", "")

if env == "production" or "production" in settings_module:
    from .production import *
elif env == "base":
    from .base import *
else:
    from .local import *
