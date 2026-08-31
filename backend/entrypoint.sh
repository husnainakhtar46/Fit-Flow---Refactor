#!/bin/sh
set -e

echo "Starting Fit-Flow QMS Backend..."

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files for WhiteNoise
echo "Collecting static assets..."
python manage.py collectstatic --noinput --clear

# Start Gunicorn server
echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn quality_check.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -