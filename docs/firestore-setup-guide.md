# Complete Firestore Database Setup Guide

## Overview: Firebase vs Google Cloud Console

**Important**: Firestore can be managed through **both** Firebase Console and Google Cloud Console. They're the **same database** accessed through different interfaces.

### Firebase Console vs Google Cloud Console

| Feature | Firebase Console | Google Cloud Console |
|---------|------------------|---------------------|
| **URL** | https://console.firebase.google.com | https://console.cloud.google.com |
| **Focus** | Developer-friendly, app-centric | Enterprise, infrastructure-focused |
| **Database View** | Simplified, real-time updates | Advanced, detailed configuration |
| **Billing** | Basic usage tracking | Detailed cost analysis and budgets |
| **Authentication** | Easy social login setup | Advanced IAM and security |
| **Best For** | Development, testing, small apps | Production, enterprise, cost management |

**Recommendation**: Use **Firebase Console** for development and initial setup, **Google Cloud Console** for production management and billing.

## Method 1: Firebase Console Setup (Recommended for Development)

### Step 1: Create Firebase Project

1. **Visit Firebase Console**: https://console.firebase.google.com
2. **Click "Create a project"** or **"Add project"**
3. **Enter project name**: `knowledge-weaver` (or your choice)
4. **Enable Google Analytics**: Optional but recommended
5. **Select Analytics account**: Default or create new
6. **Click "Create project"**

### Step 2: Setup Firestore Database

1. **In Firebase Console**, click **"Firestore Database"** in left sidebar
2. **Click "Create database"**
3. **Choose production mode** (recommended) or test mode
4. **Select location**: 
   - `us-central1` (Iowa) - Good for US users
   - `europe-west1` (Belgium) - Good for EU users
   - `asia-northeast1` (Tokyo) - Good for Asia users
5. **Click "Done"**

### Step 3: Get Configuration

1. **Click gear icon** → **"Project settings"**
2. **Scroll to "Your apps"** section
3. **Click "</>" (Web app icon)**
4. **Register app name**: `kg-note-web`
5. **Copy the config object**:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Step 4: Service Account for Backend

1. **Click gear icon** → **"Project settings"**
2. **Click "Service accounts" tab**
3. **Click "Generate new private key"**
4. **Download JSON file** (keep secure!)
5. **Rename to**: `service-account-key.json`

## Method 2: Google Cloud Console Setup (Production)

### Step 1: Create Google Cloud Project

1. **Visit**: https://console.cloud.google.com
2. **Click project dropdown** → **"New Project"**
3. **Enter project name**: `knowledge-weaver`
4. **Select billing account** (required for Firestore)
5. **Click "Create"**

### Step 2: Enable APIs

```bash
# Enable required APIs
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com
```

### Step 3: Create Firestore Database

**Option A: Command Line**
```bash
# Create Firestore database
gcloud firestore databases create --location=us-central1
```

**Option B: Console UI**
1. **Navigate to**: Firestore → Native mode
2. **Click "Create database"**
3. **Select location**: `us-central1`
4. **Click "Create"**

### Step 4: Service Account Setup

```bash
# Create service account
gcloud iam service-accounts create firestore-service \
    --display-name="Firestore Service Account"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:firestore-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Create and download key
gcloud iam service-accounts keys create service-account-key.json \
    --iam-account=firestore-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Database Management Locations

### Firebase Console Management
**URL**: https://console.firebase.google.com/project/YOUR_PROJECT_ID

**Features**:
- **Real-time database viewer** with live updates
- **Easy data browsing** and editing
- **Simple security rules** editor
- **Usage analytics** and performance monitoring
- **Authentication setup** for users

**Screenshots Navigation**:
```
Firebase Console → Your Project → Firestore Database
├── Data tab - Browse and edit documents
├── Rules tab - Security configuration  
├── Indexes tab - Query optimization
├── Usage tab - Storage and operations metrics
└── Settings - Database configuration
```

### Google Cloud Console Management
**URL**: https://console.cloud.google.com/firestore

**Features**:
- **Advanced configuration** and regional settings
- **Detailed billing** and cost analysis
- **Enterprise IAM** and security policies
- **Backup and restore** operations
- **Multi-database** management
- **Advanced monitoring** and alerting

**Navigation Path**:
```
Google Cloud Console → Your Project → Firestore
├── Entities - Data browser (more technical)
├── Databases - Multi-database management
├── Import/Export - Backup operations
├── Monitoring - Performance metrics
└── IAM - Access control management
```

## Billing and Pricing Management

### Where to Manage Billing

**Primary Location**: Google Cloud Console Billing
- **URL**: https://console.cloud.google.com/billing
- **Path**: Hamburger menu → Billing → Your billing account

**Firebase Console Billing**:
- **URL**: https://console.firebase.google.com/project/YOUR_PROJECT/usage
- **Limited**: Basic usage display, redirects to Google Cloud for detailed billing

### Cost Monitoring Setup

1. **Create Budget Alerts**:
```bash
# Set up budget alert for $10/month
gcloud billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="Firestore Budget" \
    --budget-amount=10USD \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90
```

2. **Enable Billing Export**:
   - Go to **Billing → Billing export**
   - **Create BigQuery export** for detailed analysis
   - **Create Cloud Storage export** for historical data

### Firestore Pricing Tiers

#### Free Tier (Always Free)
- **Storage**: 1 GB
- **Document reads**: 50,000/day
- **Document writes**: 20,000/day
- **Document deletes**: 20,000/day

#### Pay-as-you-go Pricing
- **Storage**: $0.18/GB/month
- **Document reads**: $0.06 per 100,000 operations
- **Document writes**: $0.18 per 100,000 operations
- **Document deletes**: $0.02 per 100,000 operations

## VSCode Extensions for Firestore

### 1. Firebase Explorer
**Extension ID**: `toba.vsfire`
**Features**:
- Browse Firestore collections and documents
- Edit documents directly in VSCode
- Real-time database synchronization
- Firebase project management

**Installation**:
```bash
code --install-extension toba.vsfire
```

### 2. Firestore Rules
**Extension ID**: `toba.firebase-rules`
**Features**:
- Syntax highlighting for Firestore security rules
- Auto-completion for rule functions
- Error detection and validation

### 3. Google Cloud Code
**Extension ID**: `GoogleCloudTools.cloudcode`
**Features**:
- Cloud Run deployment from VSCode
- Firestore emulator integration
- Google Cloud project management
- Integrated terminal for gcloud commands

### Setup VSCode for Firestore Development

1. **Install Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Login and initialize**:
```bash
firebase login
firebase init firestore
```

3. **VSCode Settings** (`.vscode/settings.json`):
```json
{
  "firebase.path": "/usr/local/bin/firebase",
  "firestore.rules": "firestore.rules",
  "firestore.indexes": "firestore.indexes.json"
}
```

## Database Schema Setup

### Collections Structure for kg-note

```javascript
// Initialize collections in Firebase Console or code
const collections = {
  'kg_entities': {
    // Document ID: entityId
    fields: {
      type: 'string',        // 'note', 'url_context', 'category', etc.
      name: 'string',        // Display name
      data: 'map',           // Entity-specific data
      observations: 'array', // Human-readable context
      created: 'timestamp',
      updated: 'timestamp'
    }
  },
  'kg_relationships': {
    // Document ID: relationshipId
    fields: {
      from_id: 'string',     // Source entity ID
      to_id: 'string',       // Target entity ID
      type: 'string',        // Relationship type
      strength: 'number',    // 0.0-1.0 confidence
      metadata: 'map',       // Relationship-specific data
      created: 'timestamp'
    }
  }
};
```

### Indexes Setup

**Automatic Indexes** (created automatically):
- Single field indexes for all fields
- Collection group queries disabled by default

**Composite Indexes** (create manually):
```bash
# Create composite indexes
gcloud firestore indexes composite create \
    --collection-group=kg_entities \
    --field-config=field-path=type,order=ascending \
    --field-config=field-path=created,order=descending

gcloud firestore indexes composite create \
    --collection-group=kg_relationships \
    --field-config=field-path=from_id,order=ascending \
    --field-config=field-path=type,order=ascending
```

## Security Rules

### Development Rules (Permissive)
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Production Rules (Restrictive)
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Knowledge graph entities
    match /kg_entities/{entityId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Knowledge graph relationships
    match /kg_relationships/{relationshipId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Environment Configuration

### Backend Environment Setup

**Create `.env` file**:
```env
# Firestore Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# For Firebase SDK (alternative)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firestore-service@your-project-id.iam.gserviceaccount.com

# API Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### Frontend Configuration

**Create `firebase-config.js`**:
```javascript
// For web app (if using Firebase SDK directly)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

export default firebaseConfig;
```

## Testing and Development

### Local Firestore Emulator

**Setup**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize project
firebase init firestore

# Start emulator
firebase emulators:start --only firestore
```

**Connect to Emulator**:
```javascript
// In your app
import { connectFirestoreEmulator } from 'firebase/firestore';

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Data Import/Export

**Export Production Data**:
```bash
gcloud firestore export gs://your-bucket/firestore-backup
```

**Import to Emulator**:
```bash
firebase emulators:start --import=./firestore-backup --export-on-exit
```

## Monitoring and Maintenance

### Firebase Console Monitoring
- **Usage tab**: Real-time usage metrics
- **Performance**: Query performance insights
- **Alerts**: Unusual activity notifications

### Google Cloud Console Monitoring
- **Cloud Monitoring**: Detailed metrics and alerting
- **Cloud Logging**: Query logs and error tracking
- **Cost analysis**: Detailed billing breakdown

### Regular Maintenance Tasks

1. **Monitor costs weekly**
2. **Review security rules monthly**
3. **Backup data regularly**
4. **Update indexes as queries evolve**
5. **Clean up old test data**

## Troubleshooting Common Issues

### Permission Errors
```bash
# Check current authentication
gcloud auth list

# Re-authenticate if needed
gcloud auth login
gcloud auth application-default login
```

### Connection Issues
- **Firewall**: Ensure port 443 is open
- **Service account**: Verify JSON key is valid
- **Project ID**: Double-check project ID matches

### Performance Issues
- **Indexes**: Create composite indexes for complex queries
- **Pagination**: Use cursors for large result sets
- **Caching**: Implement client-side caching

### Billing Surprises
- **Set up budgets**: Configure spending alerts
- **Monitor queries**: Expensive queries can increase costs
- **Optimize reads**: Use listeners efficiently

This comprehensive guide covers all aspects of Firestore setup and management. The database is the same whether accessed through Firebase Console or Google Cloud Console - choose the interface that best fits your workflow!