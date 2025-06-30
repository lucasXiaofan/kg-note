"""
Knowledge Graph Service for kg-note
Manages entities and relationships in Firestore following MCP patterns
"""

import hashlib
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from google.cloud import firestore
from google.auth import default
import os
import logging

logger = logging.getLogger(__name__)

class KnowledgeGraphService:
    def __init__(self):
        """Initialize Firestore client for knowledge graph operations"""
        try:
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                self.db = firestore.Client()
            else:
                # For Cloud Run deployment
                credentials, project = default()
                self.db = firestore.Client(credentials=credentials, project=project)
            logger.info("Knowledge Graph Service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            raise

    def _generate_entity_id(self, entity_type: str, identifier: str) -> str:
        """Generate consistent entity ID"""
        if entity_type == "note":
            return f"note-{identifier}"
        elif entity_type == "url_context":
            # Use URL hash for consistent IDs
            url_hash = hashlib.md5(identifier.encode()).hexdigest()[:12]
            return f"url-{url_hash}"
        elif entity_type == "category":
            return f"category-{identifier.lower().replace(' ', '-')}"
        elif entity_type == "concept":
            return f"concept-{identifier.lower().replace(' ', '-')}"
        elif entity_type == "domain":
            return f"domain-{identifier.lower()}"
        else:
            return f"{entity_type}-{uuid.uuid4().hex[:8]}"

    async def add_note_entity(self, note_data: Dict) -> str:
        """Add a note entity with automatic relationship creation"""
        try:
            # Create note entity
            note_id = self._generate_entity_id("note", str(note_data.get("timestamp", "")))
            
            # Extract title from content (first 50 chars)
            content = note_data.get("content", "")
            title = content[:50] + "..." if len(content) > 50 else content
            
            note_entity = {
                "type": "note",
                "name": title,
                "data": {
                    "content": content,
                    "timestamp": note_data.get("timestamp"),
                    "categories": note_data.get("categories", [])
                },
                "observations": [
                    f"Created at {datetime.fromtimestamp(note_data.get('timestamp', 0)).isoformat()}",
                    f"Content length: {len(content)} characters",
                    f"Categories: {', '.join(note_data.get('categories', []))}" if note_data.get('categories') else "No categories assigned"
                ],
                "created": firestore.SERVER_TIMESTAMP,
                "updated": firestore.SERVER_TIMESTAMP
            }

            # Add metadata observations if available
            metadata = note_data.get("metadata", {})
            if metadata:
                note_entity["observations"].extend([
                    f"Created from webpage: {metadata.get('title', 'Unknown')}",
                    f"Source domain: {metadata.get('domain', 'Unknown')}"
                ])

            # Store note entity
            self.db.collection("kg_entities").document(note_id).set(note_entity)

            # Create relationships
            await self._create_note_relationships(note_id, note_data)

            logger.info(f"Created note entity: {note_id}")
            return note_id

        except Exception as e:
            logger.error(f"Failed to add note entity: {e}")
            raise

    async def _create_note_relationships(self, note_id: str, note_data: Dict):
        """Create relationships for a note entity"""
        try:
            relationships = []
            metadata = note_data.get("metadata", {})
            
            # 1. URL Context relationship
            if metadata.get("url"):
                url_context_id = await self._ensure_url_context_entity(metadata)
                relationships.append({
                    "from_id": note_id,
                    "to_id": url_context_id,
                    "type": "CREATED_FROM",
                    "strength": 1.0,
                    "metadata": {"url": metadata.get("url")},
                    "created": firestore.SERVER_TIMESTAMP
                })

            # 2. Category relationships
            for category in note_data.get("categories", []):
                category_id = await self._ensure_category_entity(category)
                relationships.append({
                    "from_id": note_id,
                    "to_id": category_id,
                    "type": "TAGGED_AS",
                    "strength": 1.0,
                    "metadata": {"user_assigned": True},
                    "created": firestore.SERVER_TIMESTAMP
                })

            # 3. Concept relationships (AI-extracted)
            concepts = await self._extract_concepts(note_data.get("content", ""))
            for concept, confidence in concepts:
                concept_id = await self._ensure_concept_entity(concept)
                relationships.append({
                    "from_id": note_id,
                    "to_id": concept_id,
                    "type": "CONTAINS",
                    "strength": confidence,
                    "metadata": {"ai_extracted": True},
                    "created": firestore.SERVER_TIMESTAMP
                })

            # Batch write relationships
            if relationships:
                batch = self.db.batch()
                for rel in relationships:
                    rel_id = f"{rel['from_id']}-{rel['type']}-{rel['to_id']}"
                    batch.set(self.db.collection("kg_relationships").document(rel_id), rel)
                batch.commit()

            logger.info(f"Created {len(relationships)} relationships for note {note_id}")

        except Exception as e:
            logger.error(f"Failed to create note relationships: {e}")
            raise

    async def _ensure_url_context_entity(self, metadata: Dict) -> str:
        """Ensure URL context entity exists"""
        url = metadata.get("url", "")
        url_context_id = self._generate_entity_id("url_context", url)
        
        try:
            # Check if exists
            doc_ref = self.db.collection("kg_entities").document(url_context_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                # Create new URL context entity
                domain = metadata.get("domain", "")
                entity = {
                    "type": "url_context",
                    "name": metadata.get("title", "Untitled Page"),
                    "data": {
                        "url": url,
                        "domain": domain,
                        "title": metadata.get("title", ""),
                        "summary": metadata.get("summary", "")
                    },
                    "observations": [
                        f"First visited: {datetime.now().isoformat()}",
                        f"Domain: {domain}",
                        "Generated 1 note"
                    ],
                    "created": firestore.SERVER_TIMESTAMP,
                    "updated": firestore.SERVER_TIMESTAMP
                }
                doc_ref.set(entity)
                
                # Ensure domain entity exists
                if domain:
                    await self._ensure_domain_entity(domain)
            else:
                # Update note count
                doc_ref.update({
                    "updated": firestore.SERVER_TIMESTAMP
                })
                
            return url_context_id
            
        except Exception as e:
            logger.error(f"Failed to ensure URL context entity: {e}")
            raise

    async def _ensure_category_entity(self, category_name: str) -> str:
        """Ensure category entity exists"""
        category_id = self._generate_entity_id("category", category_name)
        
        try:
            doc_ref = self.db.collection("kg_entities").document(category_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                entity = {
                    "type": "category",
                    "name": category_name,
                    "data": {
                        "description": f"User-defined category: {category_name}",
                        "note_count": 1
                    },
                    "observations": [
                        f"Created: {datetime.now().isoformat()}",
                        "Contains 1 note"
                    ],
                    "created": firestore.SERVER_TIMESTAMP,
                    "updated": firestore.SERVER_TIMESTAMP
                }
                doc_ref.set(entity)
            else:
                # Increment note count
                doc_ref.update({
                    "data.note_count": firestore.Increment(1),
                    "updated": firestore.SERVER_TIMESTAMP
                })
                
            return category_id
            
        except Exception as e:
            logger.error(f"Failed to ensure category entity: {e}")
            raise

    async def _ensure_concept_entity(self, concept_name: str) -> str:
        """Ensure concept entity exists"""
        concept_id = self._generate_entity_id("concept", concept_name)
        
        try:
            doc_ref = self.db.collection("kg_entities").document(concept_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                entity = {
                    "type": "concept",
                    "name": concept_name,
                    "data": {
                        "frequency": 1
                    },
                    "observations": [
                        f"First extracted: {datetime.now().isoformat()}",
                        "Appears in 1 note"
                    ],
                    "created": firestore.SERVER_TIMESTAMP,
                    "updated": firestore.SERVER_TIMESTAMP
                }
                doc_ref.set(entity)
            else:
                # Increment frequency
                doc_ref.update({
                    "data.frequency": firestore.Increment(1),
                    "updated": firestore.SERVER_TIMESTAMP
                })
                
            return concept_id
            
        except Exception as e:
            logger.error(f"Failed to ensure concept entity: {e}")
            raise

    async def _ensure_domain_entity(self, domain_name: str) -> str:
        """Ensure domain entity exists"""
        domain_id = self._generate_entity_id("domain", domain_name)
        
        try:
            doc_ref = self.db.collection("kg_entities").document(domain_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                entity = {
                    "type": "domain",
                    "name": domain_name,
                    "data": {
                        "note_count": 1
                    },
                    "observations": [
                        f"First encountered: {datetime.now().isoformat()}",
                        "Generated 1 note"
                    ],
                    "created": firestore.SERVER_TIMESTAMP,
                    "updated": firestore.SERVER_TIMESTAMP
                }
                doc_ref.set(entity)
            else:
                # Increment note count
                doc_ref.update({
                    "data.note_count": firestore.Increment(1),
                    "updated": firestore.SERVER_TIMESTAMP
                })
                
            return domain_id
            
        except Exception as e:
            logger.error(f"Failed to ensure domain entity: {e}")
            raise

    async def _extract_concepts(self, content: str) -> List[Tuple[str, float]]:
        """Extract concepts from note content using simple keyword extraction"""
        # Simple concept extraction - in production, use AI/NLP
        import re
        
        # Common technical concepts (expandable)
        concept_patterns = {
            r'\b(?:docker|container|dockerfile)\b': ('docker', 0.9),
            r'\b(?:api|endpoint|rest)\b': ('api', 0.8),
            r'\b(?:deploy|deployment|cloud)\b': ('deployment', 0.8),
            r'\b(?:database|db|firestore|sql)\b': ('database', 0.8),
            r'\b(?:auth|authentication|login)\b': ('authentication', 0.7),
            r'\b(?:javascript|js|python|code)\b': ('programming', 0.7),
        }
        
        concepts = []
        content_lower = content.lower()
        
        for pattern, (concept, confidence) in concept_patterns.items():
            if re.search(pattern, content_lower, re.IGNORECASE):
                concepts.append((concept, confidence))
        
        return concepts

    async def find_related_notes(self, note_id: str, limit: int = 10) -> List[Dict]:
        """Find notes related to the given note"""
        try:
            related_notes = []
            
            # Get note's relationships
            relationships_query = self.db.collection("kg_relationships") \
                .where("from_id", "==", note_id) \
                .limit(20)
            
            relationships = relationships_query.stream()
            
            # Group related entities
            related_entities = {}
            for rel in relationships:
                rel_data = rel.to_dict()
                rel_type = rel_data.get("type")
                target_id = rel_data.get("to_id")
                
                if rel_type not in related_entities:
                    related_entities[rel_type] = []
                related_entities[rel_type].append(target_id)

            # Find notes sharing same categories, concepts, or URL contexts
            for entity_type, entity_ids in related_entities.items():
                if entity_type in ["TAGGED_AS", "CONTAINS", "CREATED_FROM"]:
                    # Find other notes connected to these entities
                    for entity_id in entity_ids:
                        reverse_rels = self.db.collection("kg_relationships") \
                            .where("to_id", "==", entity_id) \
                            .where("type", "==", entity_type) \
                            .limit(5).stream()
                        
                        for reverse_rel in reverse_rels:
                            reverse_data = reverse_rel.to_dict()
                            related_note_id = reverse_data.get("from_id")
                            
                            if related_note_id != note_id and related_note_id.startswith("note-"):
                                # Get note entity data
                                note_doc = self.db.collection("kg_entities").document(related_note_id).get()
                                if note_doc.exists:
                                    note_data = note_doc.to_dict()
                                    related_notes.append({
                                        "id": related_note_id,
                                        "name": note_data.get("name", ""),
                                        "content": note_data.get("data", {}).get("content", ""),
                                        "relationship_type": entity_type,
                                        "strength": reverse_data.get("strength", 0.5)
                                    })

            # Sort by relationship strength and limit
            related_notes.sort(key=lambda x: x["strength"], reverse=True)
            return related_notes[:limit]

        except Exception as e:
            logger.error(f"Failed to find related notes: {e}")
            return []

    async def search_entities(self, query: str, entity_types: List[str] = None, limit: int = 20) -> List[Dict]:
        """Search entities by name and observations"""
        try:
            results = []
            
            # Search by entity name (case-insensitive partial match)
            entities_ref = self.db.collection("kg_entities")
            
            if entity_types:
                entities_ref = entities_ref.where("type", "in", entity_types)
            
            # Firestore doesn't support case-insensitive search, so we get all and filter
            entities = entities_ref.limit(100).stream()
            
            query_lower = query.lower()
            
            for entity in entities:
                entity_data = entity.to_dict()
                entity_name = entity_data.get("name", "").lower()
                entity_observations = " ".join(entity_data.get("observations", [])).lower()
                
                # Check if query matches name or observations
                if query_lower in entity_name or query_lower in entity_observations:
                    results.append({
                        "id": entity.id,
                        "type": entity_data.get("type"),
                        "name": entity_data.get("name"),
                        "data": entity_data.get("data", {}),
                        "observations": entity_data.get("observations", [])
                    })
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Failed to search entities: {e}")
            return []

    async def get_knowledge_overview(self) -> Dict:
        """Get high-level overview of the knowledge graph"""
        try:
            overview = {
                "entity_counts": {},
                "top_domains": [],
                "top_categories": [],
                "top_concepts": [],
                "recent_activity": []
            }
            
            # Count entities by type
            entities = self.db.collection("kg_entities").stream()
            for entity in entities:
                entity_data = entity.to_dict()
                entity_type = entity_data.get("type", "unknown")
                overview["entity_counts"][entity_type] = overview["entity_counts"].get(entity_type, 0) + 1
            
            # Get top domains, categories, concepts
            for entity_type, result_key in [("domain", "top_domains"), ("category", "top_categories"), ("concept", "top_concepts")]:
                entities_query = self.db.collection("kg_entities") \
                    .where("type", "==", entity_type) \
                    .limit(5).stream()
                
                items = []
                for entity in entities_query:
                    entity_data = entity.to_dict()
                    items.append({
                        "name": entity_data.get("name"),
                        "count": entity_data.get("data", {}).get("note_count") or entity_data.get("data", {}).get("frequency", 0)
                    })
                
                overview[result_key] = sorted(items, key=lambda x: x["count"], reverse=True)
            
            return overview
            
        except Exception as e:
            logger.error(f"Failed to get knowledge overview: {e}")
            return {}