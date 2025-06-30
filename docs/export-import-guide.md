# Export/Import Guide for Knowledge Graph Data

## Overview

The enhanced Knowledge Weaver export/import system provides comprehensive data portability with full metadata preservation, enabling complete database restoration and knowledge graph reconstruction.

## Export Formats

### 1. Complete JSON (Recommended for Backup)

**Purpose**: Full database backup with complete metadata and relationship data
**File**: `knowledge-weaver-complete-YYYY-MM-DD.json`

**Structure**:
```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "version": "2.0.0",
    "totalNotes": 150,
    "totalCategories": 12,
    "source": "Knowledge Weaver Chrome Extension"
  },
  "categories": [
    {
      "category": "Web Development",
      "definition": "Technologies and practices for building web applications"
    }
  ],
  "notes": [
    {
      "id": "note-1704567890123",
      "content": "Docker containers provide isolated environments...",
      "timestamp": 1704567890123,
      "categories": ["DevOps", "Docker"],
      "metadata": {
        "title": "Docker Guide",
        "url": "https://docs.docker.com/get-started/",
        "domain": "docs.docker.com",
        "summary": "Complete Docker documentation"
      },
      "context": {
        "pageTitle": "Docker Guide",
        "sourceUrl": "https://docs.docker.com/get-started/",
        "websiteDomain": "docs.docker.com",
        "captureDate": "2024-01-15T10:30:00.000Z",
        "contentLength": 156,
        "wordCount": 28
      }
    }
  ],
  "knowledgeGraph": {
    "domains": ["docs.docker.com", "github.com"],
    "urls": ["https://docs.docker.com/get-started/"],
    "categoryUsage": [
      {
        "category": "DevOps",
        "definition": "Development and Operations practices",
        "noteCount": 25
      }
    ],
    "relationships": [
      {
        "from": "note-1704567890123",
        "to": "note-1704567891456",
        "type": "same_category",
        "strength": 0.8
      }
    ]
  }
}
```

### 2. Enhanced Markdown

**Purpose**: Human-readable format with full metadata for documentation
**File**: `knowledge-weaver-notes-YYYY-MM-DD.md`

**Structure**:
```markdown
# Knowledge Weaver Export

**Export Date:** 2024-01-15T10:30:00.000Z
**Total Notes:** 150
**Total Categories:** 12

## Categories

### Web Development
Technologies and practices for building web applications

### DevOps
Development and Operations practices

---

## Notes

### Note 1

**Created:** 2024-01-15T10:30:00.000Z
**Categories:** DevOps, Docker
**Page Title:** Docker Guide
**Source URL:** https://docs.docker.com/get-started/
**Domain:** docs.docker.com
**Page Summary:** Complete Docker documentation

**Content:**
Docker containers provide isolated environments...

---
```

### 3. CSV Spreadsheet

**Purpose**: Tabular data for analysis and filtering in spreadsheet applications
**File**: `knowledge-weaver-notes-YYYY-MM-DD.csv`

**Columns**:
- ID, Content, Timestamp, Created Date, Categories, Page Title, URL, Domain, Summary, Word Count

## Export Access Points

### Chrome Extension Popup
1. Click **📤 Export** dropdown button
2. Select desired format:
   - **📄 Complete JSON (Database backup)** - Full restoration data
   - **📝 Enhanced Markdown** - Human-readable with metadata
   - **📊 CSV Spreadsheet** - Tabular analysis format

### Notes Management Page
1. Navigate to **📋 View Notes**
2. Click **📤 Export All** dropdown
3. Choose format from same options

## Import/Restoration Process

### Using API (Cloud Deployment)

**Import JSON backup to knowledge graph:**
```bash
curl -X POST https://your-api-url/kg/import \
  -H "Content-Type: application/json" \
  -d @knowledge-weaver-complete-2024-01-15.json
```

**Response:**
```json
{
  "message": "Import completed",
  "imported_notes": 150,
  "imported_categories": 12,
  "errors": [],
  "total_notes": 150
}
```

### Chrome Extension Local Restoration

**For Local Storage restoration** (when using Chrome extension):

1. **Backup Current Data** (recommended):
   ```javascript
   chrome.storage.local.get(null, function(items) {
     console.log('Current data backed up:', items);
   });
   ```

2. **Clear Current Storage** (if needed):
   ```javascript
   chrome.storage.local.clear();
   ```

3. **Restore from Export**:
   ```javascript
   // Parse your exported JSON file
   const importData = JSON.parse(exportedJsonString);
   
   // Restore categories
   chrome.storage.local.set({ 
     categories: importData.categories 
   });
   
   // Restore notes
   chrome.storage.local.set({ 
     notes: importData.notes 
   });
   ```

## Knowledge Graph Reconstruction

### Automatic Relationship Building

When importing to the cloud knowledge graph, relationships are automatically reconstructed:

1. **Domain Relationships**: Notes from the same website are connected
2. **Category Relationships**: Notes sharing categories are linked
3. **Temporal Relationships**: Notes created in time proximity
4. **Concept Relationships**: AI-extracted concepts create semantic links

### Manual Relationship Enhancement

After import, you can enhance relationships using:

```bash
# Search for related content
curl -X POST https://your-api-url/kg/search \
  -H "Content-Type: application/json" \
  -d '{"query": "docker deployment", "limit": 20}'

# Get related notes
curl https://your-api-url/kg/notes/note-123/related?limit=10

# Get knowledge overview
curl https://your-api-url/kg/overview
```

## Export Data Uses

### 1. Complete Database Backup
- **JSON Export** contains everything needed to restore your knowledge base
- Preserves all relationships and metadata
- Compatible with knowledge graph reconstruction

### 2. Data Analysis
- **CSV Export** enables spreadsheet analysis
- Filter notes by domain, category, date
- Analyze content patterns and productivity metrics

### 3. Documentation Generation
- **Markdown Export** creates readable documentation
- Preserve webpage context and categorization
- Share knowledge with teams or publish

### 4. Migration Between Systems
- **JSON Format** is platform-agnostic
- Import into other note-taking systems
- Migrate between local and cloud deployments

## Migration Scenarios

### Local to Cloud Migration

1. **Export from Chrome Extension** (JSON format)
2. **Deploy API server** following deployment guide
3. **Import via API** using `/kg/import` endpoint
4. **Update extension** to point to cloud API
5. **Verify data** using `/kg/overview` endpoint

### Cloud to Local Migration

1. **Export from API** using `/kg/export` endpoint
2. **Transform data format** to Chrome extension structure
3. **Import to local storage** using Chrome APIs
4. **Update extension** to use local storage

### Cross-Platform Migration

1. **Export as JSON** from current system
2. **Transform data structure** to match target format
3. **Import using appropriate method** for target system

## Best Practices

### Regular Backups
- **Weekly JSON exports** for complete backup
- **Monthly CSV exports** for analysis
- **Store backups externally** (cloud storage, version control)

### Data Validation
- **Verify export completeness** by checking note counts
- **Test import process** in staging environment
- **Validate relationships** after knowledge graph reconstruction

### Performance Optimization
- **Large datasets** (>1000 notes): Use API import in batches
- **Network limits**: Compress JSON exports before transfer
- **Storage limits**: Use CSV for analysis, JSON for backup

### Security Considerations
- **Sensitive content**: Review exports before sharing
- **URL privacy**: Consider removing personal URLs from exports
- **Access control**: Secure API endpoints for import/export

## Troubleshooting

### Export Issues
- **Empty exports**: Check Chrome storage permissions
- **Large file downloads**: Increase browser download timeout
- **Format errors**: Verify note data integrity

### Import Issues
- **API timeouts**: Import in smaller batches
- **Format mismatches**: Validate JSON structure
- **Relationship errors**: Check entity ID consistency

### Data Integrity
- **Missing relationships**: Re-run knowledge graph analysis
- **Category mismatches**: Verify category definitions
- **Timestamp issues**: Check date format consistency

## Future Enhancements

### Planned Features
- **Incremental exports**: Export only changed data
- **Selective imports**: Import specific categories or date ranges
- **Relationship validation**: Automated consistency checking
- **Export scheduling**: Automated backup generation
- **Version control**: Track export history and changes