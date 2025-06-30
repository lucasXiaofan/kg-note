# Cloud Deployment Plan: FastAPI + Firestore Knowledge Graph

## Architecture Overview
```
Chrome Extension → Cloud Run (FastAPI) → Firestore Database
                         ↓
                    DeepSeek API
```

## Knowledge Graph Schema Design for Firestore

### Core Collections Structure
```
/notes
  - noteId: {
      content: string,
      metadata: {
        title: string,
        url: string,
        domain: string,
        summary: string
      },
      categories: string[],
      timestamp: number,
      relationships: {
        related_notes: string[],  // note IDs
        domains: string[],        // domain relationships
        concepts: string[]        // extracted concepts
      }
    }

/domains
  - domainId: {
      name: string,
      note_count: number,
      last_updated: timestamp,
      categories: string[]
    }

/concepts
  - conceptId: {
      name: string,
      frequency: number,
      related_concepts: string[],
      note_ids: string[]
    }

/relationships
  - relationshipId: {
      source_id: string,
      target_id: string,
      relationship_type: string, // 'domain', 'concept', 'temporal'
      strength: number           // 0-1 confidence score
    }
```

## Step-by-Step Deployment Plan

### Phase 1: Google Cloud Setup

**1. Create Google Cloud Project**
- Visit: https://console.cloud.google.com/
- Create new project or select existing
- Enable billing (required for non-default Firestore databases)

**2. Enable Required APIs**
```bash
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

**3. Install Google Cloud CLI**
- Download: https://cloud.google.com/sdk/docs/install
- Authenticate: `gcloud auth login`
- Set project: `gcloud config set project YOUR_PROJECT_ID`

### Phase 2: Firestore Database Setup

**4. Create Firestore Database**
```bash
gcloud firestore databases create --location=us-central1
```

**5. Set up Service Account**
```bash
gcloud iam service-accounts create firestore-api
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:firestore-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=firestore-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Phase 3: FastAPI Application Setup

**6. Update requirements.txt**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
google-cloud-firestore==2.13.1
python-dotenv==1.0.0
openai==1.3.5
```

**7. Create Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "src.api.api:app", "--host", "0.0.0.0", "--port", "8080"]
```

**8. Update FastAPI app with Firestore integration**
```python
from google.cloud import firestore
from google.auth import default
import os

# Initialize Firestore
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    db = firestore.Client()
else:
    # For Cloud Run deployment
    credentials, project = default()
    db = firestore.Client(credentials=credentials, project=project)
```

### Phase 4: Knowledge Graph Implementation

**9. Create knowledge graph service**
```python
class KnowledgeGraphService:
    def __init__(self, db: firestore.Client):
        self.db = db
    
    async def add_note_with_relationships(self, note_data):
        # Extract concepts using AI
        # Create relationships
        # Update domain statistics
        # Store in Firestore collections
        pass
    
    async def find_related_notes(self, note_id):
        # Query relationships collection
        # Return related notes with confidence scores
        pass
```

### Phase 5: Cloud Run Deployment

**10. Create Artifact Registry repository**
```bash
gcloud artifacts repositories create fastapi-repo \
  --repository-format=docker \
  --location=us-central1
```

**11. Build and push container**
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/fastapi-repo/kg-api
```

**12. Deploy to Cloud Run**
```bash
gcloud run deploy kg-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/fastapi-repo/kg-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DEEPSEEK_API_KEY=your_key
```

## Key Configuration Links

### Official Documentation
- **Cloud Run FastAPI**: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-service
- **Firestore Python SDK**: https://cloud.google.com/firestore/docs/quickstart-servers#python
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/cloud/

### Tutorials & Examples
- **FastAPI + Cloud Run**: https://towardsdatascience.com/how-to-deploy-and-test-your-models-using-fastapi-and-google-cloud-run-82981a44c4fe/
- **Firestore Data Modeling**: https://fireship.io/lessons/advanced-firestore-nosql-data-structure-examples/
- **GitHub Example**: https://github.com/sekR4/FastAPI-on-Google-Cloud-Run

## Free Tier Limits
- **Firestore**: 1GB storage, 50K reads, 20K writes/month
- **Cloud Run**: 2M requests, 400K GB-seconds/month
- **Total Cost**: $0/month for small projects

## Estimated Monthly Costs
- **Under free tier**: $0
- **Small usage**: $2-5/month
- **Medium usage**: $10-15/month

## Migration Strategy

### Database Architecture Decision
- **Recommendation**: Keep database separate from LLM API
- **Benefits**: Better scalability, security, maintainability, and cost optimization
- **Pattern**: Chrome Extension → FastAPI Server → Firestore Database

### Implementation Steps
1. Start with local Firestore emulator for testing
2. Implement knowledge graph schema incrementally
3. Deploy to Cloud Run with minimal viable features
4. Gradually migrate from local storage to Firestore
5. Optimize query patterns based on usage

## Next Steps
1. Set up Google Cloud project and enable APIs
2. Create Firestore database structure
3. Implement basic FastAPI-Firestore integration
4. Test locally with Firestore emulator
5. Deploy to Cloud Run
6. Update Chrome extension to use cloud API