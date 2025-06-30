# Knowledge Graph Deployment Guide

## Overview

Complete guide for deploying the Knowledge Weaver API with integrated knowledge graph to Google Cloud Run with Firestore backend.

## Prerequisites

### 1. Local Development Setup
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud auth application-default login

# Install dependencies
cd backend
pdm install
```

### 2. Environment Variables
Create `.env` file in backend directory:
```
DEEPSEEK_API_KEY=your_deepseek_api_key
GOOGLE_CLOUD_PROJECT=your-project-id
```

## Google Cloud Setup

### 1. Create and Configure Project
```bash
# Create new project (or use existing)
gcloud projects create your-project-id --name="Knowledge Weaver"

# Set active project
gcloud config set project your-project-id

# Enable billing (required for Firestore)
# Visit: https://console.cloud.google.com/billing

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Create Firestore Database
```bash
# Create Firestore database in Native mode
gcloud firestore databases create --location=us-central1

# Verify database creation
gcloud firestore databases list
```

### 3. Set up Service Account (for local development)
```bash
# Create service account
gcloud iam service-accounts create kg-api-service \
    --display-name="Knowledge Graph API Service Account"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:kg-api-service@your-project-id.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Create and download key (for local development only)
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=kg-api-service@your-project-id.iam.gserviceaccount.com

# Set environment variable for local development
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

## Local Testing with Firestore

### 1. Test Firestore Connection
```bash
cd backend
pdm run python -c "
from google.cloud import firestore
db = firestore.Client()
print('Firestore connection successful!')
doc_ref = db.collection('test').document('test')
doc_ref.set({'message': 'Hello Firestore!'})
print('Test document created successfully!')
"
```

### 2. Run API Server Locally
```bash
cd backend
pdm run python src/api/api.py
```

### 3. Test Knowledge Graph Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Add a test note
curl -X POST http://localhost:8000/kg/notes \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Docker deployment guide for FastAPI applications",
    "metadata": {
      "title": "FastAPI Docker Guide",
      "url": "https://fastapi.tiangolo.com/deployment/docker/",
      "domain": "fastapi.tiangolo.com"
    },
    "categories": ["DevOps", "Docker"]
  }'

# Get knowledge graph overview
curl http://localhost:8000/kg/overview

# Search knowledge graph
curl -X POST http://localhost:8000/kg/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "docker",
    "limit": 10
  }'
```

## Cloud Deployment

### 1. Create Artifact Registry Repository
```bash
# Create Docker repository
gcloud artifacts repositories create kg-api-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Knowledge Graph API container repository"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 2. Build and Push Container
```bash
cd backend

# Build and push using Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api:latest

# Alternative: Build and push manually
docker build -t us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api:latest .
docker push us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api:latest
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy kg-api \
    --image us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars DEEPSEEK_API_KEY=your_deepseek_api_key \
    --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id
```

### 4. Verify Deployment
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe kg-api --region us-central1 --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health

# Test knowledge graph
curl $SERVICE_URL/kg/overview
```

## Update Chrome Extension

### 1. Update API Endpoint
Edit `frontend/src/popup/popup.js`:
```javascript
// Replace localhost URL
const API_BASE_URL = 'https://kg-api-xxxx-uc.a.run.app'; // Your Cloud Run URL

// Update all API calls to use new base URL
async function categorizeNote(noteContent, metadata) {
    const response = await fetch(`${API_BASE_URL}/categorize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: noteContent,
            metadata: metadata
        })
    });
    return response.json();
}
```

### 2. Update Manifest Permissions
Edit `frontend/manifest.json`:
```json
{
  "host_permissions": [
    "https://kg-api-xxxx-uc.a.run.app/*"
  ]
}
```

### 3. Add Knowledge Graph Features
```javascript
// Add related notes functionality
async function getRelatedNotes(noteId) {
    const response = await fetch(`${API_BASE_URL}/kg/notes/${noteId}/related`);
    return response.json();
}

// Add knowledge search
async function searchKnowledgeGraph(query) {
    const response = await fetch(`${API_BASE_URL}/kg/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            limit: 10
        })
    });
    return response.json();
}
```

## Continuous Deployment

### 1. GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

env:
  PROJECT_ID: your-project-id
  SERVICE_NAME: kg-api
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Build and Deploy'
      run: |
        cd backend
        gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
        gcloud run deploy $SERVICE_NAME \
          --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
          --region $REGION \
          --platform managed \
          --allow-unauthenticated \
          --set-env-vars DEEPSEEK_API_KEY=${{ secrets.DEEPSEEK_API_KEY }}
```

### 2. Required GitHub Secrets
- `GCP_SA_KEY`: Service account JSON key
- `DEEPSEEK_API_KEY`: DeepSeek API key

## Monitoring and Maintenance

### 1. Cloud Run Metrics
```bash
# View service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kg-api" --limit 50

# Monitor performance
gcloud run services describe kg-api --region us-central1
```

### 2. Firestore Usage
```bash
# Check Firestore usage
gcloud firestore databases describe --database='(default)'

# Export data (backup)
gcloud firestore export gs://your-backup-bucket/firestore-backup
```

### 3. Cost Optimization
- **Cloud Run**: Use minimum instances = 0 for development
- **Firestore**: Monitor read/write operations
- **Container Registry**: Clean up old images regularly

```bash
# Clean up old container images
gcloud artifacts docker images list \
    us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api

gcloud artifacts docker images delete \
    us-central1-docker.pkg.dev/your-project-id/kg-api-repo/kg-api:old-tag
```

## Troubleshooting

### Common Issues

1. **Firestore Permission Denied**
   ```bash
   # Check IAM permissions
   gcloud projects get-iam-policy your-project-id
   
   # Re-add datastore.user role
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:your-project-id@appspot.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

2. **Container Build Fails**
   ```bash
   # Check Cloud Build logs
   gcloud builds list --limit=5
   
   # View specific build
   gcloud builds log BUILD_ID
   ```

3. **API Timeout Issues**
   ```bash
   # Increase timeout for Cloud Run
   gcloud run services update kg-api \
     --region us-central1 \
     --timeout 300
   ```

4. **CORS Issues**
   - Ensure Chrome extension URL is in CORS allowed origins
   - Check Cloud Run allows unauthenticated requests

### Health Monitoring
```bash
# Create uptime check
gcloud alpha monitoring uptime-checks create \
    --display-name="KG API Health Check" \
    --http-resource-labels=host=$SERVICE_URL,port=443,path=/health
```

## Security Considerations

1. **API Authentication**: Consider adding API keys for production
2. **CORS Policy**: Restrict origins to your extension only
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Data Privacy**: Ensure user data is properly protected in Firestore
5. **Secret Management**: Use Google Secret Manager for sensitive data

```bash
# Store secrets in Secret Manager
echo -n "your-deepseek-api-key" | gcloud secrets create deepseek-api-key --data-file=-

# Update Cloud Run to use secrets
gcloud run services update kg-api \
    --region us-central1 \
    --set-env-vars DEEPSEEK_API_KEY="placeholder" \
    --set-secrets DEEPSEEK_API_KEY=deepseek-api-key:latest
```

## Next Steps

1. **Enhanced Analytics**: Add usage analytics and user behavior tracking
2. **Advanced Search**: Implement vector search for semantic note discovery
3. **Collaboration**: Add multi-user support with proper data isolation
4. **Mobile App**: Create mobile companion app using same API
5. **AI Improvements**: Fine-tune concept extraction and relationship building