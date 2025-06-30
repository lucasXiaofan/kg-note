// Simple Canvas-based Knowledge Graph Visualization
// No external dependencies - pure HTML5 Canvas + JavaScript

class SimpleGraphVisualization {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.links = [];
        this.selectedNode = null;
        this.isDragging = false;
        this.dragNode = null;
        this.lastMousePos = { x: 0, y: 0 };
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        
        this.nodeColors = {
            note: '#3b82f6',
            category: '#10b981', 
            domain: '#f59e0b',
            url_context: '#8b5cf6'
        };
        
        this.setupEventListeners();
        this.setupControls();
        this.animate();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupControls() {
        document.getElementById('load-sample').addEventListener('click', () => this.loadSampleData());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadFromFile(file);
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.pan.x) / this.zoom,
            y: (e.clientY - rect.top - this.pan.y) / this.zoom
        };
    }
    
    findNodeAt(pos) {
        return this.nodes.find(node => {
            const dx = pos.x - node.x;
            const dy = pos.y - node.y;
            return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
    }
    
    onMouseDown(e) {
        const pos = this.getMousePos(e);
        const node = this.findNodeAt(pos);
        
        if (node) {
            this.isDragging = true;
            this.dragNode = node;
            this.canvas.style.cursor = 'grabbing';
        } else {
            this.isDragging = true;
            this.dragNode = null;
        }
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;
            
            if (this.dragNode) {
                // Drag node
                this.dragNode.x += dx / this.zoom;
                this.dragNode.y += dy / this.zoom;
            } else {
                // Pan canvas
                this.pan.x += dx;
                this.pan.y += dy;
            }
            
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        } else {
            // Update cursor for hover
            const pos = this.getMousePos(e);
            const node = this.findNodeAt(pos);
            this.canvas.style.cursor = node ? 'pointer' : 'grab';
        }
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.dragNode = null;
        this.canvas.style.cursor = 'grab';
    }
    
    onClick(e) {
        const pos = this.getMousePos(e);
        const node = this.findNodeAt(pos);
        
        if (node) {
            this.selectNode(node);
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const zoomFactor = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
        
        this.zoom = Math.max(0.1, Math.min(3, this.zoom * zoomFactor));
    }
    
    selectNode(node) {
        this.selectedNode = node;
        this.updateNodeInfo(node);
        
        // Visual feedback
        this.render();
    }
    
    updateNodeInfo(node) {
        const detailsEl = document.getElementById('node-details');
        
        let html = `
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${this.nodeColors[node.type]}"></div>
                    <span class="font-semibold capitalize">${node.type}</span>
                </div>
                <div class="font-medium">${node.name}</div>
        `;
        
        if (node.type === 'note') {
            html += `
                <div class="text-xs text-gray-400">
                    <div><strong>Content:</strong> ${node.content ? node.content.substring(0, 150) + '...' : 'No content'}</div>
                    ${node.categories ? `<div><strong>Categories:</strong> ${node.categories.join(', ')}</div>` : ''}
                    ${node.timestamp ? `<div><strong>Created:</strong> ${new Date(node.timestamp).toLocaleDateString()}</div>` : ''}
                </div>
            `;
        } else if (node.type === 'category') {
            html += `<div class="text-xs text-gray-400">${node.definition || 'Category node'}</div>`;
        } else if (node.type === 'domain') {
            html += `<div class="text-xs text-gray-400">Domain: ${node.domain}</div>`;
        }
        
        html += `
                <div class="text-xs text-gray-500 mt-2">
                    Connections: ${node.connections || 0}
                </div>
            </div>
        `;
        
        detailsEl.innerHTML = html;
    }
    
    resetView() {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.selectedNode = null;
        document.getElementById('node-details').innerHTML = 'Click on a node to see details';
    }
    
    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processData(data);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    loadSampleData() {
        const sampleData = {
            notes: [
                {
                    id: "note-1",
                    content: "Vector databases are essential for AI applications. They store embeddings and enable semantic search.",
                    timestamp: Date.now() - 86400000,
                    categories: ["Machine Learning"],
                    metadata: { title: "Vector Databases", url: "https://example.com/vector-db", domain: "example.com" }
                },
                {
                    id: "note-2", 
                    content: "React 18 introduces concurrent features that improve user experience.",
                    timestamp: Date.now() - 43200000,
                    categories: ["Web Development"],
                    metadata: { title: "React 18 Features", url: "https://react.dev/blog", domain: "react.dev" }
                },
                {
                    id: "note-3",
                    content: "Time blocking is a productivity technique for better task management.",
                    timestamp: Date.now() - 21600000,
                    categories: ["Productivity"],
                    metadata: { title: "Time Blocking Guide", url: "https://productivity.com", domain: "productivity.com" }
                },
                {
                    id: "note-4",
                    content: "GraphQL provides a query language for APIs with type system.",
                    timestamp: Date.now() - 10800000,
                    categories: ["Web Development"],
                    metadata: { title: "GraphQL Basics", url: "https://graphql.org", domain: "graphql.org" }
                }
            ],
            categories: [
                { category: "Machine Learning", definition: "AI and ML concepts" },
                { category: "Web Development", definition: "Frontend and backend technologies" },
                { category: "Productivity", definition: "Productivity tools and techniques" }
            ]
        };
        
        this.processData(sampleData);
    }
    
    processData(data) {
        this.nodes = [];
        this.links = [];
        
        const nodeMap = new Map();
        
        // Helper to add node
        const addNode = (id, type, name, data = {}) => {
            if (nodeMap.has(id)) return nodeMap.get(id);
            
            const node = {
                id, type, name,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                radius: type === 'note' ? 8 : type === 'category' ? 12 : 10,
                connections: 0,
                ...data
            };
            
            this.nodes.push(node);
            nodeMap.set(id, node);
            return node;
        };
        
        // Helper to add link
        const addLink = (sourceId, targetId, type = 'default') => {
            const source = nodeMap.get(sourceId);
            const target = nodeMap.get(targetId);
            
            if (source && target) {
                this.links.push({ source, target, type });
                source.connections = (source.connections || 0) + 1;
                target.connections = (target.connections || 0) + 1;
            }
        };
        
        // Process categories
        if (data.categories) {
            data.categories.forEach(cat => {
                addNode(`category-${cat.category}`, 'category', cat.category, {
                    definition: cat.definition
                });
            });
        }
        
        // Process notes
        if (data.notes) {
            data.notes.forEach(note => {
                const noteNode = addNode(note.id, 'note', note.content.substring(0, 30) + '...', {
                    content: note.content,
                    timestamp: note.timestamp,
                    categories: note.categories || [],
                    metadata: note.metadata || {}
                });
                
                // Link to categories
                if (note.categories) {
                    note.categories.forEach(categoryName => {
                        const categoryId = `category-${categoryName}`;
                        addNode(categoryId, 'category', categoryName);
                        addLink(note.id, categoryId, 'category');
                    });
                }
                
                // Add domain node
                if (note.metadata?.domain) {
                    const domainId = `domain-${note.metadata.domain}`;
                    addNode(domainId, 'domain', note.metadata.domain, {
                        domain: note.metadata.domain
                    });
                    addLink(note.id, domainId, 'domain');
                }
            });
        }
        
        this.updateStats();
        this.distributeNodes();
    }
    
    distributeNodes() {
        // Simple force-like distribution
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        this.nodes.forEach((node, i) => {
            const angle = (i / this.nodes.length) * Math.PI * 2;
            const r = radius * (0.3 + Math.random() * 0.7);
            node.x = centerX + Math.cos(angle) * r;
            node.y = centerY + Math.sin(angle) * r;
        });
    }
    
    updateStats() {
        const stats = {
            notes: this.nodes.filter(n => n.type === 'note').length,
            categories: this.nodes.filter(n => n.type === 'category').length,
            domains: this.nodes.filter(n => n.type === 'domain').length,
            links: this.links.length
        };
        
        document.getElementById('notes-count').textContent = stats.notes;
        document.getElementById('categories-count').textContent = stats.categories;
        document.getElementById('domains-count').textContent = stats.domains;
        document.getElementById('links-count').textContent = stats.links;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transform
        this.ctx.save();
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw links
        this.ctx.strokeStyle = '#6b7280';
        this.ctx.lineWidth = 1;
        this.links.forEach(link => {
            this.ctx.beginPath();
            this.ctx.moveTo(link.source.x, link.source.y);
            this.ctx.lineTo(link.target.x, link.target.y);
            this.ctx.stroke();
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.ctx.fillStyle = this.nodeColors[node.type] || '#666';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight selected node
            if (node === this.selectedNode) {
                this.ctx.strokeStyle = '#fbbf24';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            // Draw label
            this.ctx.fillStyle = '#e5e7eb';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name,
                node.x, 
                node.y - node.radius - 5
            );
        });
        
        this.ctx.restore();
    }
    
    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing simple graph visualization...');
    new SimpleGraphVisualization();
});