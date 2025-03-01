#!/bin/bash
# Build and start the production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
