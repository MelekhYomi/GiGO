#!/bin/bash
gcloud builds submit --tag us-central1-docker.pkg.dev/project-ce78d47a-1bfa-42ef-8ae/gigo-platform/gigo-backend:latest
gcloud run deploy gigo-backend --image us-central1-docker.pkg.dev/project-ce78d47a-1bfa-42ef-8ae/gigo-platform/gigo-backend:latest --platform managed --region us-central1 --allow-unauthenticated
