#!/usr/bin/env python3
"""
Upload Knowledge Weaver JSON data to Firestore
Transforms notes data into knowledge graph entities and relationships
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Set
import hashlib
import uuid

# Add backend src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src'))

try:
    from google.cloud import firestore
    print("✅ google-cloud-firestore is available")
except ImportError:
    print("❌ google-cloud-firestore not found. Installing...")
    os.system("pip install google-cloud-firestore")
    from google.cloud import firestore

class FirestoreUploader:
    def __init__(self, project_id: str = None):
        """Initialize Firestore client"""
        self.db = firestore.Client(project=project_id) if project_id else firestore.Client()
        self.entities = {}
        self.relationships = []
        
    def load_json_data(self, file_path: str) -> Dict:
        """Load JSON data from file"""
        print(f"📂 Loading data from {file_path}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📊 Data loaded: {data['metadata']['totalNotes']} notes, {len(data.get('categories', []))} categories")
        return data
    
    def create_entity_id(self, entity_type: str, identifier: str) -> str:
        """Create consistent entity ID"""
        # Use first 8 chars of hash for shorter IDs
        hash_str = hashlib.md5(f"{entity_type}-{identifier}".encode()).hexdigest()[:8]
        return f"{entity_type}-{hash_str}"
    
    def add_entity(self, entity_id: str, entity_type: str, name: str, data: Dict, observations: List[str] = None):
        """Add entity to collection"""
        entity = {
            'type': entity_type,
            'name': name[:100],  # Limit name length
            'data': data,
            'observations': observations or [],
            'created': datetime.utcnow(),
            'updated': datetime.utcnow()
        }
        self.entities[entity_id] = entity
        
    def add_relationship(self, from_id: str, to_id: str, rel_type: str, strength: float = 1.0, metadata: Dict = None):
        """Add relationship to collection"""
        relationship = {
            'from_id': from_id,
            'to_id': to_id,
            'type': rel_type,
            'strength': strength,
            'metadata': metadata or {},
            'created': datetime.utcnow()
        }
        self.relationships.append(relationship)
    
    def process_categories(self, categories: List[Dict]):
        """Process categories into entities"""
        print("📂 Processing categories...")
        for category in categories:
            cat_id = self.create_entity_id('category', category['category'])
            observations = [
                f"Category for organizing notes",
                f"Definition: {category.get('definition', 'No definition')}"
            ]
            
            self.add_entity(
                cat_id,
                'category',
                category['category'],
                {
                    'definition': category.get('definition', ''),
                    'note_count': 0  # Will be updated later
                },
                observations
            )
    
    def process_notes(self, notes: List[Dict]):
        """Process notes into entities and relationships"""
        print(f"📝 Processing {len(notes)} notes...")
        
        domain_counts = {}
        category_counts = {}
        
        for note in notes:
            # Create note entity
            note_id = note['id']
            content = note['content']
            timestamp = note.get('timestamp', 0)
            categories = note.get('categories', [])
            metadata = note.get('metadata', {})
            context = note.get('context', {})
            
            # Note observations
            observations = [
                f"Created on {datetime.fromtimestamp(timestamp/1000).strftime('%Y-%m-%d %H:%M')}",
                f"Content length: {len(content)} characters"
            ]
            
            if metadata.get('domain'):
                observations.append(f"Captured from: {metadata['domain']}")
            
            if categories:
                observations.append(f"Categorized as: {', '.join(categories)}")
            
            # Add note entity
            self.add_entity(
                note_id,
                'note',
                content[:50] + '...' if len(content) > 50 else content,
                {
                    'content': content,
                    'timestamp': timestamp,
                    'word_count': context.get('wordCount', 0),
                    'content_length': context.get('contentLength', len(content)),
                    'categories': categories,
                    'metadata': metadata,
                    'context': context
                },
                observations
            )
            
            # Process categories and create relationships
            for category_name in categories:
                cat_id = self.create_entity_id('category', category_name)
                
                # Create category if not exists
                if cat_id not in self.entities:
                    self.add_entity(
                        cat_id,
                        'category',
                        category_name,
                        {'definition': f'Category: {category_name}', 'note_count': 0},
                        [f"Auto-created category from notes"]
                    )
                
                # Create note -> category relationship
                self.add_relationship(note_id, cat_id, 'TAGGED_AS', 1.0)
                
                # Track category usage
                category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
            
            # Process URL context and domain
            if metadata.get('url'):
                url = metadata['url']
                domain = metadata.get('domain', '')
                title = metadata.get('title', '')
                
                # Create URL context entity
                url_id = self.create_entity_id('url_context', url)
                if url_id not in self.entities:
                    url_observations = [
                        f"Source webpage for notes",
                        f"Domain: {domain}",
                        f"Title: {title}"
                    ]
                    
                    self.add_entity(
                        url_id,
                        'url_context',
                        title or url,
                        {
                            'url': url,
                            'title': title,
                            'domain': domain,
                            'summary': metadata.get('summary', ''),
                            'note_count': 0
                        },
                        url_observations
                    )
                
                # Create note -> url_context relationship
                self.add_relationship(note_id, url_id, 'CREATED_FROM', 1.0)
                
                # Create domain entity
                if domain:
                    domain_id = self.create_entity_id('domain', domain)
                    if domain_id not in self.entities:
                        domain_observations = [
                            f"Website domain",
                            f"Contains notes from multiple pages"
                        ]
                        
                        self.add_entity(
                            domain_id,
                            'domain',
                            domain,
                            {
                                'domain': domain,
                                'note_count': 0,
                                'url_count': 0
                            },
                            domain_observations
                        )
                    
                    # Create url_context -> domain relationship
                    self.add_relationship(url_id, domain_id, 'BELONGS_TO', 1.0)
                    
                    # Create note -> domain relationship
                    self.add_relationship(note_id, domain_id, 'FROM_DOMAIN', 0.8)
                    
                    # Track domain usage
                    domain_counts[domain_id] = domain_counts.get(domain_id, 0) + 1
        
        # Update entity counts
        for domain_id, count in domain_counts.items():
            if domain_id in self.entities:
                self.entities[domain_id]['data']['note_count'] = count
                self.entities[domain_id]['observations'].append(f"Contains {count} notes")
        
        for cat_id, count in category_counts.items():
            if cat_id in self.entities:
                self.entities[cat_id]['data']['note_count'] = count
                self.entities[cat_id]['observations'].append(f"Applied to {count} notes")
    
    def create_temporal_relationships(self, notes: List[Dict]):
        """Create temporal relationships between notes"""
        print("⏰ Creating temporal relationships...")
        
        # Sort notes by timestamp
        sorted_notes = sorted(notes, key=lambda x: x.get('timestamp', 0))
        
        # Create relationships between temporally close notes (within 1 hour)
        for i, note1 in enumerate(sorted_notes):
            for j, note2 in enumerate(sorted_notes[i+1:], i+1):
                time_diff = abs(note2.get('timestamp', 0) - note1.get('timestamp', 0))
                
                # If notes are within 1 hour (3600000 ms)
                if time_diff < 3600000:
                    strength = max(0.3, 1.0 - (time_diff / 3600000))  # Closer = stronger
                    self.add_relationship(
                        note1['id'], 
                        note2['id'], 
                        'TEMPORAL_NEAR', 
                        strength,
                        {'time_diff_ms': time_diff}
                    )
                else:
                    break  # Notes are sorted, so further notes will be even further apart
    
    def upload_to_firestore(self, batch_size: int = 500):
        """Upload entities and relationships to Firestore"""
        print(f"🔥 Uploading to Firestore...")
        print(f"📊 Entities: {len(self.entities)}, Relationships: {len(self.relationships)}")
        
        # Clear existing data (optional - comment out to preserve existing data)
        print("🗑️ Clearing existing data...")
        self.clear_collections()
        
        # Upload entities in batches
        print("📤 Uploading entities...")
        entity_items = list(self.entities.items())
        for i in range(0, len(entity_items), batch_size):
            batch = self.db.batch()
            batch_items = entity_items[i:i+batch_size]
            
            for entity_id, entity_data in batch_items:
                doc_ref = self.db.collection('kg_entities').document(entity_id)
                batch.set(doc_ref, entity_data)
            
            batch.commit()
            print(f"   ✅ Uploaded entities batch {i//batch_size + 1}/{(len(entity_items)-1)//batch_size + 1}")
        
        # Upload relationships in batches
        print("📤 Uploading relationships...")
        for i in range(0, len(self.relationships), batch_size):
            batch = self.db.batch()
            batch_items = self.relationships[i:i+batch_size]
            
            for relationship in batch_items:
                # Generate unique ID for relationship
                rel_id = str(uuid.uuid4())
                doc_ref = self.db.collection('kg_relationships').document(rel_id)
                batch.set(doc_ref, relationship)
            
            batch.commit()
            print(f"   ✅ Uploaded relationships batch {i//batch_size + 1}/{(len(self.relationships)-1)//batch_size + 1}")
    
    def clear_collections(self):
        """Clear existing collections (be careful!)"""
        collections = ['kg_entities', 'kg_relationships']
        
        for collection_name in collections:
            docs = self.db.collection(collection_name).limit(500).stream()
            batch = self.db.batch()
            count = 0
            
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
                
                if count >= 500:
                    batch.commit()
                    batch = self.db.batch()
                    count = 0
            
            if count > 0:
                batch.commit()
            
            print(f"   🗑️ Cleared {collection_name}")
    
    def print_summary(self):
        """Print upload summary"""
        entity_types = {}
        for entity in self.entities.values():
            entity_type = entity['type']
            entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
        
        relationship_types = {}
        for rel in self.relationships:
            rel_type = rel['type']
            relationship_types[rel_type] = relationship_types.get(rel_type, 0) + 1
        
        print("\n📊 Upload Summary:")
        print("Entities:")
        for entity_type, count in entity_types.items():
            print(f"  {entity_type}: {count}")
        
        print("Relationships:")
        for rel_type, count in relationship_types.items():
            print(f"  {rel_type}: {count}")

def main():
    """Main function"""
    # Configuration
    json_file_path = "/mnt/c/kg-note/knowledge-weaver-complete-2025-06-30.json"
    project_id = 'kg-note-e7fdd'  # Will use default project from environment
    
    print("🚀 Starting Firestore upload process...")
    
    # Initialize uploader
    uploader = FirestoreUploader(project_id)
    
    # Load and process data
    data = uploader.load_json_data(json_file_path)
    
    # Process entities
    if 'categories' in data:
        uploader.process_categories(data['categories'])
    
    if 'notes' in data:
        uploader.process_notes(data['notes'])
        uploader.create_temporal_relationships(data['notes'])
    
    # Print summary before upload
    uploader.print_summary()
    
    # Confirm upload
    response = input("\n❓ Do you want to upload this data to Firestore? (y/N): ")
    if response.lower() in ['y', 'yes']:
        uploader.upload_to_firestore()
        print("✅ Upload completed successfully!")
    else:
        print("❌ Upload cancelled.")

if __name__ == "__main__":
    main()