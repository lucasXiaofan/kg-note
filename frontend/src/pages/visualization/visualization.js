document.addEventListener('DOMContentLoaded', function() {
    console.log('Visualization page loaded');
    
    // Check if D3 is available
    if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded');
        document.getElementById('graph-container').innerHTML = '<div class="p-8 text-center text-red-400">Error: D3.js library not loaded. Please check your internet connection.</div>';
        return;
    }
    
    console.log('D3.js version:', d3.version);
    
    // Graph data
    let graphData = { nodes: [], links: [] };
    let originalData = null;
    let simulation = null;
    let selectedNode = null;
    
    // DOM elements
    const svg = d3.select('#knowledge-graph');
    const tooltip = d3.select('#tooltip');
    const fileInput = document.getElementById('file-input');
    const loadSampleButton = document.getElementById('load-sample');
    const resetViewButton = document.getElementById('reset-view');
    const nodeInfo = document.getElementById('node-details');
    const showLabelsCheckbox = document.getElementById('show-labels');
    
    // Graph elements
    let linkElements, nodeElements, labelElements;
    
    // Node type colors
    const nodeColors = {
        note: '#3b82f6',
        category: '#10b981',
        domain: '#f59e0b',
        url_context: '#8b5cf6',
        concept: '#ef4444'
    };
    
    // Initialize the visualization
    function initVisualization() {
        const container = document.getElementById('graph-container');
        const rect = container.getBoundingClientRect();
        
        svg
            .attr('width', rect.width)
            .attr('height', rect.height)
            .call(d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', (event) => {
                    svg.select('g').attr('transform', event.transform);
                }));
        
        svg.append('g'); // Container for zoom/pan
        
        // Setup simulation
        simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(rect.width / 2, rect.height / 2))
            .force('collision', d3.forceCollide().radius(25));
        
        updateForceParameters();
    }
    
    // Update force simulation parameters
    function updateForceParameters() {
        if (!simulation) return;
        
        simulation
            .force('charge').strength(-800)
            .force('link').distance(80);
        
        simulation.alpha(0.3).restart();
    }
    
    // Process JSON data into graph format
    function processKnowledgeGraphData(data) {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        
        // Helper function to add node
        function addNode(id, type, name, data = {}) {
            if (nodeMap.has(id)) return nodeMap.get(id);
            
            const node = {
                id,
                type,
                name: name || id,
                data,
                connections: 0
            };
            nodes.push(node);
            nodeMap.set(id, node);
            return node;
        }
        
        // Helper function to add link
        function addLink(source, target, type = 'default', strength = 0.5) {
            const existingLink = links.find(l => 
                (l.source === source && l.target === target) || 
                (l.source === target && l.target === source)
            );
            
            if (!existingLink) {
                links.push({
                    source,
                    target,
                    type,
                    strength
                });
                
                // Increment connection counts
                const sourceNode = nodeMap.get(source);
                const targetNode = nodeMap.get(target);
                if (sourceNode) sourceNode.connections++;
                if (targetNode) targetNode.connections++;
            }
        }
        
        // Process categories
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                addNode(`category-${category.category}`, 'category', category.category, {
                    definition: category.definition
                });
            });
        }
        
        // Process notes and create entities
        if (data.notes && data.notes.length > 0) {
            data.notes.forEach(note => {
                // Add note node
                const noteNode = addNode(note.id, 'note', note.content.substring(0, 50) + '...', {
                    content: note.content,
                    timestamp: note.timestamp,
                    categories: note.categories || [],
                    metadata: note.metadata || {},
                    context: note.context || {},
                    wordCount: note.context?.wordCount || 0,
                    contentLength: note.context?.contentLength || 0
                });
                
                // Add category relationships
                if (note.categories) {
                    note.categories.forEach(categoryName => {
                        const categoryId = `category-${categoryName}`;
                        addNode(categoryId, 'category', categoryName);
                        addLink(note.id, categoryId, 'same_category', 0.8);
                    });
                }
                
                // Add domain node and relationship
                if (note.metadata?.domain || note.context?.websiteDomain) {
                    const domain = note.metadata.domain || note.context.websiteDomain;
                    const domainId = `domain-${domain}`;
                    addNode(domainId, 'domain', domain, { domain });
                    addLink(note.id, domainId, 'same_domain', 0.7);
                }
                
                // Add URL context node and relationship
                if (note.metadata?.url || note.context?.sourceUrl) {
                    const url = note.metadata.url || note.context.sourceUrl;
                    const title = note.metadata.title || note.context.pageTitle || 'Unknown Page';
                    const urlId = `url-${btoa(url).substring(0, 10)}`;
                    addNode(urlId, 'url_context', title, {
                        url,
                        title,
                        summary: note.metadata?.summary || ''
                    });
                    addLink(note.id, urlId, 'created_from', 1.0);
                }
            });
        }
        
        // Add temporal relationships between notes
        const sortedNotes = data.notes
            ? data.notes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            : [];
        
        for (let i = 0; i < sortedNotes.length - 1; i++) {
            const currentNote = sortedNotes[i];
            const nextNote = sortedNotes[i + 1];
            
            // Link temporally close notes (within 1 hour)
            const timeDiff = Math.abs((nextNote.timestamp || 0) - (currentNote.timestamp || 0));
            if (timeDiff < 3600000) { // 1 hour in milliseconds
                addLink(currentNote.id, nextNote.id, 'temporal', 0.4);
            }
        }
        
        // Process pre-computed relationships if available
        if (data.knowledgeGraph && data.knowledgeGraph.relationships) {
            data.knowledgeGraph.relationships.forEach(rel => {
                addLink(rel.from, rel.to, rel.type, rel.strength || 0.5);
            });
        }
        
        return { nodes, links };
    }
    
    // Simplified - no complex filters needed
    function createNodeFilters(nodes) {
        // No complex filtering in simplified version
    }
    
    // Simplified - no filtering
    function applyFilters() {
        // No filtering in simplified version
    }
    
    // Update visualization
    function updateVisualization() {
        const currentSvg = d3.select('#knowledge-graph');
        const container = currentSvg.select('g');
        
        // Update links
        linkElements = container.selectAll('.link')
            .data(graphData.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);
        
        linkElements.exit().remove();
        
        const linkEnter = linkElements.enter()
            .append('line')
            .attr('class', d => `link ${d.type}`)
            .style('opacity', 0.6);
        
        linkElements = linkEnter.merge(linkElements);
        
        // Update nodes
        nodeElements = container.selectAll('.node')
            .data(graphData.nodes, d => d.id);
        
        nodeElements.exit().remove();
        
        const nodeEnter = nodeElements.enter()
            .append('circle')
            .attr('class', d => `node ${d.type}`)
            .attr('r', d => Math.max(8, Math.min(20, 8 + d.connections * 2)))
            .style('fill', d => nodeColors[d.type])
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('click', handleNodeClick)
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut);
        
        nodeElements = nodeEnter.merge(nodeElements);
        
        // Update labels
        labelElements = container.selectAll('.text')
            .data(graphData.nodes, d => d.id);
        
        labelElements.exit().remove();
        
        const labelEnter = labelElements.enter()
            .append('text')
            .attr('class', 'text')
            .attr('dy', -25)
            .attr('text-anchor', 'middle')
            .style('opacity', showLabelsCheckbox.checked ? 1 : 0)
            .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);
        
        labelElements = labelEnter.merge(labelElements);
        
        // Update simulation
        simulation.nodes(graphData.nodes);
        simulation.force('link').links(graphData.links);
        simulation.alpha(0.3).restart();
        
        // Update stats
        updateStats();
    }
    
    // Update statistics
    function updateStats() {
        const stats = {
            notes: graphData.nodes.filter(n => n.type === 'note').length,
            categories: graphData.nodes.filter(n => n.type === 'category').length,
            domains: graphData.nodes.filter(n => n.type === 'domain').length,
            relationships: graphData.links.length
        };
        
        document.getElementById('notes-count').textContent = stats.notes;
        document.getElementById('categories-count').textContent = stats.categories;
        document.getElementById('domains-count').textContent = stats.domains;
    }
    
    // Handle node click
    function handleNodeClick(event, d) {
        // Clear previous selection
        nodeElements.classed('selected', false);
        
        // Select current node
        d3.select(this).classed('selected', true);
        selectedNode = d;
        
        // Update info panel
        updateNodeInfo(d);
    }
    
    // Update node information panel
    function updateNodeInfo(node) {
        let html = `
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="w-4 h-4 rounded-full" style="background-color: ${nodeColors[node.type]}"></span>
                    <span class="font-semibold capitalize">${node.type}</span>
                </div>
                <div class="border-t border-gray-600 pt-2">
                    <div class="font-medium text-white">${node.name}</div>
                </div>
        `;
        
        // Simplified info display
        if (node.type === 'note') {
            html += `
                <div class="text-xs space-y-1">
                    <div><strong>Content:</strong> ${node.data.content ? node.data.content.substring(0, 100) + '...' : 'No content'}</div>
                    <div><strong>Categories:</strong> ${node.data.categories ? node.data.categories.join(', ') : 'None'}</div>
                </div>
            `;
        } else if (node.type === 'category') {
            html += `
                <div class="text-xs">
                    <div>${node.data.definition || 'Category node'}</div>
                </div>
            `;
        } else if (node.type === 'domain') {
            html += `
                <div class="text-xs">
                    <div>${node.data.domain}</div>
                </div>
            `;
        }
        
        html += `
                <div class="text-xs text-gray-400 border-t border-gray-600 pt-2">
                    <div><strong>Connections:</strong> ${node.connections}</div>
                </div>
            </div>
        `;
        
        nodeInfo.innerHTML = html;
    }
    
    // Mouse over handler
    function handleMouseOver(event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        
        let content = `<strong>${d.name}</strong><br/>Type: ${d.type}<br/>Connections: ${d.connections}`;
        
        if (d.type === 'note' && d.data.content) {
            content += `<br/><br/>${d.data.content.substring(0, 100)}...`;
        }
        
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    // Mouse out handler
    function handleMouseOut() {
        tooltip.transition().duration(200).style('opacity', 0);
    }
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Simulation tick function
    function ticked() {
        if (linkElements) {
            linkElements
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        }
        
        if (nodeElements) {
            nodeElements
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        }
        
        if (labelElements) {
            labelElements
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }
    }
    
    // Load data from file
    function loadDataFromFile(file) {
        console.log('Loading file:', file.name);
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                console.log('File content length:', e.target.result.length);
                const data = JSON.parse(e.target.result);
                console.log('Parsed JSON data:', data);
                loadKnowledgeGraph(data);
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error parsing JSON file: ' + error.message);
                
                // Show error in the graph container
                document.getElementById('graph-container').innerHTML = `
                    <div class="p-8 text-center text-red-400">
                        <h3 class="text-lg font-semibold mb-2">JSON Parse Error</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Try Again</button>
                    </div>
                `;
            }
        };
        reader.onerror = function(error) {
            console.error('File reading error:', error);
            alert('Error reading file: ' + error.message);
        };
        reader.readAsText(file);
    }
    
    // Load sample data
    function loadSampleData() {
        // Create sample data structure
        const sampleData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: "2.0.0",
                totalNotes: 5,
                totalCategories: 3,
                source: "Sample Data"
            },
            categories: [
                { category: "Machine Learning", definition: "AI and ML concepts and techniques" },
                { category: "Web Development", definition: "Frontend and backend web technologies" },
                { category: "Productivity", definition: "Tools and techniques for productivity" }
            ],
            notes: [
                {
                    id: "note-1",
                    content: "Vector databases are becoming essential for AI applications. They store embeddings and enable semantic search.",
                    timestamp: Date.now() - 86400000,
                    categories: ["Machine Learning"],
                    metadata: {
                        title: "Introduction to Vector Databases",
                        url: "https://example.com/vector-db",
                        domain: "example.com"
                    },
                    context: {
                        wordCount: 15,
                        contentLength: 95
                    }
                },
                {
                    id: "note-2",
                    content: "React 18 introduces concurrent features that improve user experience through better scheduling.",
                    timestamp: Date.now() - 43200000,
                    categories: ["Web Development"],
                    metadata: {
                        title: "React 18 Concurrent Features",
                        url: "https://react.dev/blog",
                        domain: "react.dev"
                    },
                    context: {
                        wordCount: 13,
                        contentLength: 88
                    }
                },
                {
                    id: "note-3",
                    content: "Time blocking is a productivity technique where you schedule specific time slots for different tasks.",
                    timestamp: Date.now() - 21600000,
                    categories: ["Productivity"],
                    metadata: {
                        title: "Time Blocking Guide",
                        url: "https://productivity.com/time-blocking",
                        domain: "productivity.com"
                    },
                    context: {
                        wordCount: 16,
                        contentLength: 98
                    }
                },
                {
                    id: "note-4",
                    content: "GraphQL provides a query language for APIs and runtime for executing queries with type system.",
                    timestamp: Date.now() - 10800000,
                    categories: ["Web Development"],
                    metadata: {
                        title: "GraphQL Basics",
                        url: "https://graphql.org/learn",
                        domain: "graphql.org"
                    },
                    context: {
                        wordCount: 15,
                        contentLength: 92
                    }
                },
                {
                    id: "note-5",
                    content: "Transformer models revolutionized NLP with attention mechanisms and parallel processing capabilities.",
                    timestamp: Date.now() - 3600000,
                    categories: ["Machine Learning"],
                    metadata: {
                        title: "Understanding Transformers",
                        url: "https://ai.example.com/transformers",
                        domain: "ai.example.com"
                    },
                    context: {
                        wordCount: 12,
                        contentLength: 89
                    }
                }
            ]
        };
        
        loadKnowledgeGraph(sampleData);
    }
    
    // Main function to load and visualize knowledge graph
    function loadKnowledgeGraph(data) {
        console.log('Loading knowledge graph with data:', data);
        
        // Show loading message
        document.getElementById('graph-container').innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
                <div class="text-center">
                    <div class="text-4xl mb-2">⏳</div>
                    <div>Processing knowledge graph...</div>
                </div>
            </div>
        `;
        
        try {
            originalData = processKnowledgeGraphData(data);
            graphData = { ...originalData };
            
            console.log('Processed data:', originalData);
            console.log('Nodes:', originalData.nodes.length, 'Links:', originalData.links.length);
            
            if (originalData.nodes.length === 0) {
                document.getElementById('graph-container').innerHTML = `
                    <div class="flex items-center justify-center h-full text-yellow-400">
                        <div class="text-center">
                            <div class="text-4xl mb-2">📋</div>
                            <div>No data to visualize</div>
                            <div class="text-sm mt-2">Try uploading a JSON file with notes and categories</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Clear the container and reinitialize SVG
            document.getElementById('graph-container').innerHTML = '<svg id="knowledge-graph" width="100%" height="100%"></svg>';
            
            // Reinitialize D3 elements
            const newSvg = d3.select('#knowledge-graph');
            const container = document.getElementById('graph-container');
            const rect = container.getBoundingClientRect();
            
            newSvg
                .attr('width', rect.width)
                .attr('height', rect.height)
                .call(d3.zoom()
                    .scaleExtent([0.1, 4])
                    .on('zoom', (event) => {
                        newSvg.select('g').attr('transform', event.transform);
                    }));
            
            newSvg.append('g'); // Container for zoom/pan
            
            // Simplified version - no complex filters
            updateVisualization();
            
            // Simplified version - no export button
            
            console.log('Knowledge graph loaded successfully');
            
        } catch (error) {
            console.error('Error loading knowledge graph:', error);
            document.getElementById('graph-container').innerHTML = `
                <div class="p-8 text-center text-red-400">
                    <h3 class="text-lg font-semibold mb-2">Loading Error</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Reload Page</button>
                </div>
            `;
        }
    }
    
    // Simplified - no export
    function exportSVG() {
        // Not available in simplified version
    }
    
    // Reset view
    function resetView() {
        svg.select('g').transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity
        );
        
        if (simulation) {
            simulation.alpha(0.3).restart();
        }
    }
    
    // Event listeners
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadDataFromFile(file);
        }
    });
    
    loadSampleButton.addEventListener('click', loadSampleData);
    resetViewButton.addEventListener('click', resetView);
    
    showLabelsCheckbox.addEventListener('change', function() {
        if (labelElements) {
            labelElements.style('opacity', this.checked ? 1 : 0);
        }
    });
    
    // Initialize
    console.log('Initializing visualization...');
    initVisualization();
    
    // Setup simulation tick
    simulation.on('tick', ticked);
    
    // Auto-load sample data for demo
    console.log('Loading sample data...');
    setTimeout(() => {
        loadSampleData();
    }, 1000);
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const container = document.getElementById('graph-container');
        const rect = container.getBoundingClientRect();
        svg.attr('width', rect.width).attr('height', rect.height);
        simulation.force('center', d3.forceCenter(rect.width / 2, rect.height / 2));
        simulation.alpha(0.3).restart();
    });
});