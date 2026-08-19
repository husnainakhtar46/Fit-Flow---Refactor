import os

# Default to local settings if not specified
if os.getenv("DJANGO_SETTINGS_MODULE") == "quality_check.settings" or not os.getenv("DJANGO_ENV"):
    from .local import *
else:
    from .base import *
