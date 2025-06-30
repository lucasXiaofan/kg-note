# 🔥 Upload Knowledge Weaver Data to Firestore

Complete guide to upload your `knowledge-weaver-complete-2025-06-30.json` to Firestore database.

## ✅ Prerequisites

1. **Firebase project already initialized** (✅ You have this)
2. **JSON data file exists** (✅ You have this) 
3. **Python and pip installed**

## 🚀 Step-by-Step Upload Process

### Step 1: Install Python Dependencies
```bash
# Navigate to project directory
cd /mnt/c/kg-note

# Install Firestore library
pip install google-cloud-firestore

# Or install from requirements file
pip install -r scripts/requirements.txt
```

### Step 2: Set Up Firebase Authentication

**Option A: Use Firebase CLI (Recommended)**
```bash
# Make sure you're logged in to Firebase
firebase login

# Set your project (replace with your actual project ID)
firebase use your-project-id

# Check current project
firebase use
```

**Option B: Use Service Account (Alternative)**
```bash
# If you have a service account key file
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

### Step 3: Test Connection
```bash
# Test if everything is working
python3 scripts/test-firestore.py
```

You should see:
```
✅ google-cloud-firestore library imported successfully
✅ Firestore client initialized  
✅ Write test successful
✅ Cleanup successful
🎉 All tests passed! Ready to upload data.
```

### Step 4: Upload Your Data
```bash
# Run the upload script
python3 scripts/upload-to-firestore.py
```

The script will:
1. 📂 Load your JSON file (`knowledge-weaver-complete-2025-06-30.json`)
2. 🔄 Transform notes into knowledge graph entities
3. 📊 Show upload summary
4. ❓ Ask for confirmation
5. 📤 Upload to Firestore in batches

**Example output:**
```
📂 Loading data from knowledge-weaver-complete-2025-06-30.json...
📊 Data loaded: 13 notes, 0 categories
📝 Processing 13 notes...
⏰ Creating temporal relationships...

📊 Upload Summary:
Entities:
  note: 13
  category: 3  
  domain: 6
  url_context: 8

Relationships:
  TAGGED_AS: 25
  CREATED_FROM: 13
  FROM_DOMAIN: 13
  BELONGS_TO: 8
  TEMPORAL_NEAR: 15

❓ Do you want to upload this data to Firestore? (y/N): y
```

### Step 5: Deploy Firestore Indexes
```bash
# Deploy the optimized indexes for better query performance
firebase deploy --only firestore:indexes
```

## 🎯 What Gets Created

### Firestore Collections

**`kg_entities`** - All knowledge graph entities:
- **Notes**: Your actual notes with content and metadata
- **Categories**: Topics like "Machine Learning", "Web Development"  
- **Domains**: Websites like "youtube.com", "github.com"
- **URL Contexts**: Specific pages where notes were created

**`kg_relationships`** - Connections between entities:
- Note → Category relationships (your tags)
- Note → URL Context (where note was created)
- Note → Domain (website relationships)
- Temporal relationships (notes created close in time)

### Example Data Structure

```javascript
// Entity example
kg_entities/note-1751160402733: {
  type: "note",
  name: "after knowing their paying, the enginnering...",
  data: {
    content: "Full note content here...",
    categories: ["Career Development", "Learning Strategies"],
    metadata: { url: "https://cluely.com/careers", domain: "cluely.com" }
  },
  observations: [
    "Created on 2025-06-29 01:26",
    "Captured from: cluely.com", 
    "Categorized as: Career Development, Learning Strategies"
  ]
}

// Relationship example  
kg_relationships/rel-123: {
  from_id: "note-1751160402733",
  to_id: "category-career", 
  type: "TAGGED_AS",
  strength: 1.0
}
```

## 🔍 Verify Upload Success

### Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database**
4. You should see `kg_entities` and `kg_relationships` collections

### Query Examples
```javascript
// Get all notes
kg_entities where type == "note"

// Get notes about Machine Learning  
kg_relationships where to_id == "category-ml" and type == "TAGGED_AS"

// Get notes from YouTube
kg_entities where type == "note" and data.metadata.domain == "www.youtube.com"
```

## 🛠️ Troubleshooting

### "Permission denied"
```bash
# Check Firebase rules allow access
cat firestore.rules

# Make sure you're authenticated
firebase login
gcloud auth list
```

### "Project not found"
```bash
# List available projects
firebase projects:list

# Set correct project
firebase use your-actual-project-id
```

### "Module not found"
```bash
# Install dependencies
pip install google-cloud-firestore

# Check Python version (needs 3.7+)
python3 --version
```

### "No default project"
```bash
# Set project explicitly
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Or use service account
export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
```

## 🎨 Next: Update Visualization

After uploading, you can modify your visualization to read from Firestore instead of JSON files:

```javascript
// Add to your visualization
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Initialize Firebase (use your config)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load data from Firestore
async function loadKnowledgeGraphFromFirestore() {
  const entitiesSnap = await getDocs(collection(db, 'kg_entities'));
  const relationshipsSnap = await getDocs(collection(db, 'kg_relationships'));
  
  const entities = entitiesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const relationships = relationshipsSnap.docs.map(doc => ({
    id: doc.id, 
    ...doc.data()
  }));
  
  return { entities, relationships };
}
```

## 📊 Benefits of Firestore Storage

✅ **Real-time sync** across devices  
✅ **Powerful queries** for finding related notes  
✅ **Scalable** - handles thousands of notes  
✅ **Secure** - controlled access with rules  
✅ **Fast** - optimized indexes for graph queries  
✅ **Collaborative** - multiple users can access  

Your knowledge graph is now ready for advanced querying and real-time collaboration! 🚀