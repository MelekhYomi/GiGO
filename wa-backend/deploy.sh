#!/bin/bash
gcloud builds submit --tag us-central1-docker.pkg.dev/project-1827db43-f913-4a0e-978/wa-platform/wa-backend:latest
gcloud run deploy wa-backend --image us-central1-docker.pkg.dev/project-1827db43-f913-4a0e-978/wa-platform/wa-backend:latest --platform managed --region us-central1 --allow-unauthenticated
