# Knowledge Graph Schema Design for kg-note

## Overview
Knowledge Graph implementation for personal note-taking with webpage context, inspired by MCP patterns but optimized for LLM understanding and note discovery.

## Core Entity Types

### 1. Note Entity
```json
{
  "id": "note-{timestamp}",
  "type": "note",
  "name": "Note title (first 50 chars of content)",
  "content": "Full note content",
  "timestamp": 1234567890,
  "observations": [
    "Created from webpage: {title}",
    "Contains concepts: {extracted_concepts}",
    "User categorized as: {categories}"
  ]
}
```

### 2. URL Context Entity
```json
{
  "id": "url-{hash}",
  "type": "url_context", 
  "name": "Page title",
  "url": "https://example.com/page",
  "domain": "example.com",
  "observations": [
    "Visited on: {timestamp}",
    "Generated {count} notes",
    "Summary: {page_summary}"
  ]
}
```

### 3. Category Entity
```json
{
  "id": "category-{name}",
  "type": "category",
  "name": "Category name",
  "description": "Category description",
  "observations": [
    "Contains {count} notes",
    "Most active domain: {domain}",
    "Created: {timestamp}"
  ]
}
```

### 4. Concept Entity (AI-extracted)
```json
{
  "id": "concept-{name}",
  "type": "concept",
  "name": "Concept name",
  "frequency": 5,
  "observations": [
    "Appears in {count} notes",
    "Related to categories: {categories}",
    "First mentioned: {timestamp}"
  ]
}
```

### 5. Domain Entity
```json
{
  "id": "domain-{name}",
  "type": "domain",
  "name": "website.com",
  "note_count": 10,
  "observations": [
    "Most productive domain",
    "Categories: {primary_categories}",
    "Last activity: {timestamp}"
  ]
}
```

## Relationship Types

### Note-Centric Relationships
- `note -> CREATED_FROM -> url_context` (webpage source)
- `note -> TAGGED_AS -> category` (user categorization)  
- `note -> CONTAINS -> concept` (AI-extracted concepts)
- `note -> RELATES_TO -> note` (content similarity)
- `note -> TEMPORAL_NEAR -> note` (created within time window)

### Context Relationships
- `url_context -> BELONGS_TO -> domain`
- `url_context -> SPAWNED -> note` (reverse of CREATED_FROM)
- `domain -> ASSOCIATED_WITH -> category` (frequent co-occurrence)

### Concept Relationships
- `concept -> CO_OCCURS_WITH -> concept` (appear together)
- `concept -> IMPLIES -> concept` (semantic relationships)
- `category -> ENCOMPASSES -> concept` (category-concept mapping)

## LLM-Optimized Design Principles

### 1. Natural Language Observations
Each entity stores human-readable observations that provide context:
```
"Created from webpage: How to Deploy FastAPI to Google Cloud"
"Contains concepts: docker, deployment, cloud-run"
"User frequently takes notes from this domain"
```

### 2. Hierarchical Context
```
Domain (github.com)
  └── URL Context (github.com/user/repo)
      └── Notes (3 notes about this repository)
          └── Concepts (docker, api, deployment)
```

### 3. Strength-Based Relationships
All relationships include confidence scores (0.0-1.0):
- 1.0: Direct user action (tagging, creating)
- 0.8-0.9: Strong AI extraction confidence
- 0.5-0.7: Moderate similarity/co-occurrence
- 0.3-0.4: Weak temporal/contextual relationships

## Query Patterns for LLM

### 1. Find Related Notes
```
INPUT: "Show me notes about Docker deployment"
PROCESS: 
1. Search concept entities for "docker", "deployment"
2. Follow CONTAINS relationships to notes
3. Expand via RELATES_TO for similar notes
4. Include URL_CONTEXT for webpage source
```

### 2. Discover Knowledge Clusters
```
INPUT: "What topics do I research most?"
PROCESS:
1. Query concept entities by frequency
2. Follow relationships to categories and domains
3. Surface top patterns with observations
```

### 3. Context-Aware Suggestions
```
INPUT: Current webpage = "docs.docker.com"
PROCESS:
1. Find domain entity "docker.com"
2. Follow ASSOCIATED_WITH to relevant categories
3. Suggest notes via category relationships
4. Show temporal clusters of recent docker notes
```

## Firestore Collection Structure

### Collections
```
/kg_entities
  - entityId: {
      type: string,           // "note", "url_context", "category", etc.
      name: string,
      data: object,           // entity-specific data
      observations: string[], // human-readable context
      created: timestamp,
      updated: timestamp
    }

/kg_relationships  
  - relationshipId: {
      from_id: string,
      to_id: string,
      type: string,          // "CREATED_FROM", "TAGGED_AS", etc.
      strength: number,      // 0.0-1.0 confidence
      metadata: object,      // relationship-specific data
      created: timestamp
    }
```

### Composite Indexes Required
```
- entities: [type, name]
- entities: [type, created]  
- relationships: [from_id, type]
- relationships: [to_id, type]
- relationships: [type, strength]
```

## Implementation Benefits

### For Users
- **Contextual Discovery**: Find notes by webpage, topic, or time
- **Smart Suggestions**: AI-powered related note recommendations
- **Knowledge Patterns**: Understand your learning and research trends

### For LLM
- **Rich Context**: Observations provide natural language understanding
- **Flexible Queries**: Multiple relationship paths for note discovery
- **Semantic Understanding**: Concept extraction enables topic-based queries
- **Temporal Awareness**: Time-based relationships for recent context

### For System
- **Scalable**: Graph structure grows with user's knowledge
- **Efficient**: Firestore indexes optimize common query patterns
- **Maintainable**: Clear entity types and relationship semantics