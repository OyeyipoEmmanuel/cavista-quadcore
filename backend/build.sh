#!/usr/bin/env bash
# exit on error
set -o errexit

cd backend

# Install dependencies
pip install -r requirements/base.txt

# Create static directory if it doesn't exist
mkdir -p staticfiles

# Collect static files
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Seed the clinicians database
python manage.py seed_clinicians
