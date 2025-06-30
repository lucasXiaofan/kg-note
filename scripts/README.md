# Firestore Data Upload Scripts

Scripts to upload Knowledge Weaver JSON data to Google Firestore database.

## Quick Start

### 1. Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# Or install directly
pip install google-cloud-firestore
```

### 2. Set Up Firebase Authentication

**Option A: Use Firebase CLI (Recommended for development)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set project (replace with your project ID)
firebase use your-project-id
```

**Option B: Use Service Account Key**
```bash
# Download service account key from Firebase Console
# Save as service-account-key.json in project root
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

### 3. Test Connection
```bash
# Test Firestore connection
python scripts/test-firestore.py
```

### 4. Upload Data
```bash
# Upload knowledge weaver data to Firestore
python scripts/upload-to-firestore.py
```

## Scripts Overview

### `test-firestore.py`
Tests Firestore connection and permissions.

**Features:**
- ✅ Verify library installation
- ✅ Test database connection
- ✅ Check read/write permissions
- ✅ Display existing collections
- 🔧 Troubleshooting guidance

**Usage:**
```bash
python scripts/test-firestore.py
```

### `upload-to-firestore.py`
Transforms and uploads JSON data to Firestore knowledge graph schema.

**Features:**
- 📊 Processes notes, categories, domains, URL contexts
- 🔗 Creates relationships between entities
- ⏰ Generates temporal relationships
- 📤 Batch uploads for performance
- 🗑️ Optional data clearing
- 📋 Upload summary report

**Usage:**
```bash
python scripts/upload-to-firestore.py
```

## Data Transformation

The script transforms your JSON data into a knowledge graph schema:

### Entities Created
- **Notes**: Each note becomes an entity with content, metadata, categories
- **Categories**: User-defined or auto-created categories
- **Domains**: Website domains (e.g., youtube.com, github.com)
- **URL Contexts**: Specific webpages where notes were created

### Relationships Created
- `note -> TAGGED_AS -> category` (user categorization)
- `note -> CREATED_FROM -> url_context` (webpage source)
- `note -> FROM_DOMAIN -> domain` (website relationship)
- `url_context -> BELONGS_TO -> domain` (URL to domain)
- `note -> TEMPORAL_NEAR -> note` (created within 1 hour)

### Example Transformation
```json
// Input: JSON note
{
  "id": "note-123",
  "content": "Vector databases are essential for AI",
  "categories": ["Machine Learning"],
  "metadata": {
    "title": "Vector DB Guide",
    "url": "https://example.com/vectors",
    "domain": "example.com"
  }
}

// Output: Firestore entities
kg_entities/note-123: {
  "type": "note",
  "name": "Vector databases are essential for AI...",
  "data": { "content": "...", "categories": [...] },
  "observations": ["Created on 2025-06-30", "Categorized as: Machine Learning"]
}

kg_entities/category-ml: {
  "type": "category", 
  "name": "Machine Learning",
  "data": { "note_count": 5 }
}

// Output: Firestore relationships
kg_relationships/rel-123: {
  "from_id": "note-123",
  "to_id": "category-ml", 
  "type": "TAGGED_AS",
  "strength": 1.0
}
```

## Firestore Collections

### `kg_entities`
Stores all knowledge graph entities.

**Fields:**
- `type`: Entity type (note, category, domain, url_context)
- `name`: Display name (truncated for notes)
- `data`: Type-specific data object
- `observations`: Human-readable context array
- `created`: Creation timestamp
- `updated`: Last update timestamp

### `kg_relationships`
Stores relationships between entities.

**Fields:**
- `from_id`: Source entity ID
- `to_id`: Target entity ID
- `type`: Relationship type (TAGGED_AS, CREATED_FROM, etc.)
- `strength`: Confidence score (0.0-1.0)
- `metadata`: Relationship-specific data
- `created`: Creation timestamp

## Configuration

### Environment Variables
```bash
# Optional: Explicit project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Optional: Service account key path
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

### Firestore Rules
Ensure your `firestore.rules` allows access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Required Indexes
The script creates data that benefits from these composite indexes:

```bash
# Create indexes via Firebase CLI
firebase deploy --only firestore:indexes

# Or create manually in Firebase Console:
# kg_entities: [type, created]
# kg_relationships: [from_id, type]
# kg_relationships: [to_id, type]
```

## Troubleshooting

### Common Issues

**"Permission denied"**
- Check firestore.rules allows read/write
- Verify authentication is working
- Ensure project has Firestore enabled

**"Project not found"**
- Run `firebase use your-project-id`
- Set GOOGLE_CLOUD_PROJECT environment variable
- Check project ID in firebase.json

**"Service account key not found"**
- Download key from Firebase Console → Project Settings → Service Accounts
- Set GOOGLE_APPLICATION_CREDENTIALS path
- Ensure file has proper permissions

**"Import errors"**
- Install dependencies: `pip install google-cloud-firestore`
- Check Python version (3.7+ required)
- Verify pip is using correct environment

### Debug Steps

1. **Test basic connection:**
   ```bash
   python scripts/test-firestore.py
   ```

2. **Check Firebase CLI:**
   ```bash
   firebase projects:list
   firebase use
   ```

3. **Verify project setup:**
   ```bash
   gcloud config get-value project
   gcloud firestore databases list
   ```

4. **Test authentication:**
   ```bash
   gcloud auth list
   gcloud auth application-default login
   ```

## Performance Notes

- **Batch uploads**: Uses 500-document batches for efficiency
- **Relationship generation**: Creates temporal relationships (may be many for large datasets)
- **Memory usage**: Loads all data into memory before upload
- **Upload time**: ~100-500 documents per second depending on complexity

## Safety Features

- **Confirmation prompt**: Asks before uploading to prevent accidents
- **Summary display**: Shows what will be uploaded before proceeding
- **Collection clearing**: Optional (commented by default)
- **Batch transactions**: Atomic operations for consistency

## Next Steps

After uploading:

1. **Verify data**: Check Firebase Console → Firestore
2. **Test queries**: Use Firestore query console
3. **Update visualization**: Modify viz scripts to read from Firestore
4. **Set up monitoring**: Configure usage alerts and budgets
5. **Optimize rules**: Restrict access for production use

## Integration with Visualization

The uploaded data is compatible with the knowledge graph visualization:

```javascript
// Example: Fetch entities from Firestore
const entities = await db.collection('kg_entities').get();
const relationships = await db.collection('kg_relationships').get();

// Transform for visualization
const nodes = entities.docs.map(doc => ({
  id: doc.id,
  type: doc.data().type,
  name: doc.data().name,
  ...doc.data()
}));

const links = relationships.docs.map(doc => ({
  source: doc.data().from_id,
  target: doc.data().to_id,
  type: doc.data().type,
  strength: doc.data().strength
}));
```

Ready to transform your notes into a searchable knowledge graph! 🚀