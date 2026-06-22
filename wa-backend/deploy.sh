#!/bin/bash
gcloud builds submit --tag us-central1-docker.pkg.dev/project-ce78d47a-1bfa-42ef-8ae/wa-platform/wa-backend:latest
gcloud run deploy wa-backend --image us-central1-docker.pkg.dev/project-ce78d47a-1bfa-42ef-8ae/wa-platform/wa-backend:latest --platform managed --region us-central1 --allow-unauthenticated
