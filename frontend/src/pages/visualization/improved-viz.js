document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 Knowledge Graph Explorer loaded');
    
    // Check D3.js availability
    if (typeof d3 === 'undefined') {
        document.getElementById('graph-container').innerHTML = 
            '<div class="flex items-center justify-center h-full text-red-400"><div class="text-center"><div class="text-4xl mb-2">❌</div><div>D3.js library not loaded</div></div></div>';
        return;
    }
    
    // Global variables
    let graphData = { nodes: [], links: [] };
    let allData = { nodes: [], links: [] };
    let simulation = null;
    let svg, g, tooltip;
    let selectedNode = null;
    
    // Initialize
    initializeVisualization();
    setupEventListeners();
    
    function initializeVisualization() {
        // Setup SVG and simulation
        svg = d3.select('#knowledge-graph');
        tooltip = d3.select('#tooltip');
        
        const container = document.getElementById('graph-container');
        const rect = container.getBoundingClientRect();
        
        svg.attr('width', rect.width).attr('height', rect.height);
        
        g = svg.append('g');
        
        // Setup zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Setup simulation
        simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-800))
            .force('center', d3.forceCenter(rect.width / 2, rect.height / 2))
            .force('collision', d3.forceCollide().radius(35));
    }
    
    function setupEventListeners() {
        // File upload
        document.getElementById('file-input').addEventListener('change', handleFileUpload);
        document.getElementById('load-sample').addEventListener('click', loadSampleData);
        document.getElementById('load-your-data').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // Controls
        document.getElementById('force-strength').addEventListener('input', updateSimulation);
        document.getElementById('link-distance').addEventListener('input', updateSimulation);
        document.getElementById('show-labels').addEventListener('change', toggleLabels);
        document.getElementById('show-relationships').addEventListener('change', toggleConnections);
        document.getElementById('reset-view').addEventListener('click', resetView);
        document.getElementById('clear-search').addEventListener('click', clearSearch);
        
        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Fullscreen
        document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
        
        // Window resize
        window.addEventListener('resize', handleResize);
    }
    
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        updateStats('Loading file...', 'info');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                console.log('📁 File loaded:', data.metadata || 'No metadata');
                loadKnowledgeGraph(data);
            } catch (error) {
                console.error('❌ JSON parse error:', error);
                updateStats('Error: Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    function loadSampleData() {
        console.log('🎯 Loading demo data...');
        
        const sampleData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalNotes: 8,
                totalCategories: 4,
                source: "Demo Data"
            },
            categories: [
                { category: "Machine Learning", definition: "AI and ML concepts, algorithms, and applications" },
                { category: "Web Development", definition: "Frontend and backend web technologies" },
                { category: "Productivity", definition: "Tools and techniques for better productivity" },
                { category: "Research", definition: "Academic and industry research topics" }
            ],
            notes: [
                {
                    id: "note-ml-transformers",
                    content: "Transformer models have revolutionized NLP with their attention mechanism. Key innovations include self-attention, positional encoding, and the encoder-decoder architecture that enables parallel processing.",
                    timestamp: Date.now() - 86400000,
                    categories: ["Machine Learning", "Research"],
                    metadata: {
                        title: "Understanding Transformer Architecture",
                        url: "https://arxiv.org/abs/1706.03762",
                        domain: "arxiv.org",
                        summary: "Attention Is All You Need - Original Transformer paper"
                    },
                    context: { wordCount: 28, contentLength: 169 }
                },
                {
                    id: "note-react-hooks",
                    content: "React Hooks like useState and useEffect allow functional components to have state and lifecycle methods. They make code more reusable and easier to test than class components.",
                    timestamp: Date.now() - 43200000,
                    categories: ["Web Development"],
                    metadata: {
                        title: "React Hooks Guide",
                        url: "https://reactjs.org/docs/hooks-intro.html",
                        domain: "reactjs.org",
                        summary: "Introduction to React Hooks"
                    },
                    context: { wordCount: 26, contentLength: 156 }
                },
                {
                    id: "note-time-blocking",
                    content: "Time blocking involves scheduling specific time slots for different tasks. This technique helps maintain focus, reduces context switching, and provides better work-life balance.",
                    timestamp: Date.now() - 21600000,
                    categories: ["Productivity"],
                    metadata: {
                        title: "Time Blocking Technique",
                        url: "https://blog.rescuetime.com/time-blocking-101/",
                        domain: "blog.rescuetime.com",
                        summary: "Complete guide to time blocking"
                    },
                    context: { wordCount: 25, contentLength: 148 }
                },
                {
                    id: "note-vector-databases",
                    content: "Vector databases store high-dimensional embeddings and enable semantic search. Popular options include Pinecone, Weaviate, and Chroma. Essential for RAG applications.",
                    timestamp: Date.now() - 10800000,
                    categories: ["Machine Learning", "Web Development"],
                    metadata: {
                        title: "Vector Database Comparison",
                        url: "https://www.pinecone.io/learn/vector-database/",
                        domain: "pinecone.io",
                        summary: "What is a vector database?"
                    },
                    context: { wordCount: 22, contentLength: 131 }
                },
                {
                    id: "note-graphql-benefits",
                    content: "GraphQL provides a query language for APIs with strong typing, single endpoint, and client-specified data fetching. Reduces over-fetching and under-fetching problems.",
                    timestamp: Date.now() - 7200000,
                    categories: ["Web Development"],
                    metadata: {
                        title: "GraphQL vs REST",
                        url: "https://graphql.org/learn/thinking-in-graphs/",
                        domain: "graphql.org",
                        summary: "Thinking in graphs"
                    },
                    context: { wordCount: 21, contentLength: 127 }
                },
                {
                    id: "note-research-methods",
                    content: "Effective research involves systematic literature review, hypothesis formation, experimental design, and statistical analysis. Critical thinking and peer review are essential.",
                    timestamp: Date.now() - 3600000,
                    categories: ["Research", "Productivity"],
                    metadata: {
                        title: "Research Methodology",
                        url: "https://www.scribbr.com/methodology/research-methods/",
                        domain: "scribbr.com",
                        summary: "Guide to research methods"
                    },
                    context: { wordCount: 22, contentLength: 134 }
                },
                {
                    id: "note-knowledge-graphs",
                    content: "Knowledge graphs represent entities and relationships in a structured format. They enable semantic search, recommendation systems, and AI reasoning. Neo4j and Apache Jena are popular tools.",
                    timestamp: Date.now() - 1800000,
                    categories: ["Machine Learning", "Research"],
                    metadata: {
                        title: "Introduction to Knowledge Graphs",
                        url: "https://www.ontotext.com/knowledgehub/fundamentals/what-is-a-knowledge-graph/",
                        domain: "ontotext.com",
                        summary: "What is a knowledge graph?"
                    },
                    context: { wordCount: 26, contentLength: 155 }
                },
                {
                    id: "note-pomodoro-technique",
                    content: "The Pomodoro Technique uses 25-minute focused work sessions followed by 5-minute breaks. After 4 pomodoros, take a longer 15-30 minute break. Helps maintain concentration.",
                    timestamp: Date.now() - 900000,
                    categories: ["Productivity"],
                    metadata: {
                        title: "Pomodoro Technique Guide",
                        url: "https://todoist.com/productivity-methods/pomodoro-technique",
                        domain: "todoist.com",
                        summary: "How to use the Pomodoro Technique"
                    },
                    context: { wordCount: 26, contentLength: 152 }
                }
            ]
        };
        
        loadKnowledgeGraph(sampleData);
    }
    
    function loadKnowledgeGraph(data) {
        console.log('🔄 Processing knowledge graph data...');
        updateStats('Processing data...', 'info');
        
        try {
            const processed = processKnowledgeGraphData(data);
            allData = processed;
            graphData = { ...processed };
            
            console.log(`📊 Processed: ${processed.nodes.length} nodes, ${processed.links.length} links`);
            
            createQuickFilters();
            updateVisualization();
            updateStatistics();
            updateStats(`Loaded ${processed.nodes.length} nodes successfully`, 'success');
            
        } catch (error) {
            console.error('❌ Error processing data:', error);
            updateStats('Error processing data: ' + error.message, 'error');
        }
    }
    
    function processKnowledgeGraphData(data) {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        
        function addNode(id, type, name, data = {}, size = 'medium') {
            if (nodeMap.has(id)) return nodeMap.get(id);
            
            const radius = size === 'large' ? 25 : size === 'small' ? 12 : 18;
            const node = {
                id, type, name, data,
                radius,
                connections: 0,
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100
            };
            nodes.push(node);
            nodeMap.set(id, node);
            return node;
        }
        
        function addLink(sourceId, targetId, type = 'default', strength = 0.5) {
            const existing = links.find(l => 
                (l.source === sourceId && l.target === targetId) || 
                (l.source === targetId && l.target === sourceId)
            );
            
            if (!existing) {
                links.push({ source: sourceId, target: targetId, type, strength });
                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(targetId);
                if (sourceNode) sourceNode.connections++;
                if (targetNode) targetNode.connections++;
            }
        }
        
        // Process categories first
        if (data.categories) {
            data.categories.forEach(category => {
                addNode(`category-${category.category}`, 'category', category.category, {
                    definition: category.definition || 'No definition provided'
                }, 'large');
            });
        }
        
        // Process notes
        if (data.notes) {
            data.notes.forEach(note => {
                const shortContent = note.content.length > 50 ? 
                    note.content.substring(0, 50) + '...' : note.content;
                
                addNode(note.id, 'note', shortContent, {
                    fullContent: note.content,
                    timestamp: note.timestamp,
                    categories: note.categories || [],
                    metadata: note.metadata || {},
                    context: note.context || {},
                    wordCount: note.context?.wordCount || note.content.split(' ').length
                }, 'medium');
                
                // Link to categories
                if (note.categories) {
                    note.categories.forEach(categoryName => {
                        const categoryId = `category-${categoryName}`;
                        addLink(note.id, categoryId, 'category', 0.8);
                    });
                }
                
                // Add and link to domains
                if (note.metadata?.domain) {
                    const domainId = `domain-${note.metadata.domain}`;
                    if (!nodeMap.has(domainId)) {
                        addNode(domainId, 'domain', note.metadata.domain, {
                            domain: note.metadata.domain,
                            noteCount: 1
                        }, 'medium');
                    } else {
                        nodeMap.get(domainId).data.noteCount++;
                    }
                    addLink(note.id, domainId, 'domain', 0.7);
                }
                
                // Add and link to URLs
                if (note.metadata?.url) {
                    const urlId = `url-${btoa(note.metadata.url).substring(0, 10)}`;
                    if (!nodeMap.has(urlId)) {
                        addNode(urlId, 'url_context', note.metadata.title || 'Untitled', {
                            url: note.metadata.url,
                            title: note.metadata.title,
                            summary: note.metadata.summary || ''
                        }, 'small');
                    }
                    addLink(note.id, urlId, 'url', 1.0);
                }
            });
        }
        
        // Add temporal relationships for notes
        const sortedNotes = (data.notes || [])
            .filter(n => n.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        for (let i = 0; i < sortedNotes.length - 1; i++) {
            const timeDiff = sortedNotes[i + 1].timestamp - sortedNotes[i].timestamp;
            if (timeDiff < 3600000) { // 1 hour
                addLink(sortedNotes[i].id, sortedNotes[i + 1].id, 'temporal', 0.3);
            }
        }
        
        return { nodes, links };
    }
    
    function updateVisualization() {
        console.log('🎨 Updating visualization...');
        
        // Clear existing elements
        g.selectAll('*').remove();
        
        // Create links
        const link = g.selectAll('.link')
            .data(graphData.links)
            .enter()
            .append('line')
            .attr('class', d => `link ${d.type}`)
            .style('opacity', document.getElementById('show-relationships').checked ? 0.6 : 0);
        
        // Create nodes
        const node = g.selectAll('.node')
            .data(graphData.nodes)
            .enter()
            .append('circle')
            .attr('class', d => `node ${d.type}`)
            .attr('r', d => d.radius)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('click', handleNodeClick)
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut);
        
        // Create labels
        const label = g.selectAll('.node-label')
            .data(graphData.nodes)
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .style('opacity', document.getElementById('show-labels').checked ? 1 : 0)
            .text(d => {
                if (d.type === 'note') {
                    return d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name;
                }
                return d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name;
            });
        
        // Update simulation
        simulation.nodes(graphData.nodes);
        simulation.force('link').links(graphData.links);
        simulation.alpha(0.3).restart();
        
        // Simulation tick function
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            label
                .attr('x', d => d.x)
                .attr('y', d => d.y + 5);
        });
    }
    
    function handleNodeClick(event, d) {
        console.log('🖱️ Node clicked:', d.name);
        
        // Clear previous selection
        g.selectAll('.node').classed('selected', false);
        d3.select(event.target).classed('selected', true);
        
        selectedNode = d;
        updateNodeInfo(d);
        
        // Highlight connected nodes
        highlightConnectedNodes(d);
    }
    
    function updateNodeInfo(node) {
        const infoDiv = document.getElementById('node-info');
        let html = `
            <div class="space-y-3">
                <div class="flex items-center gap-2 pb-2 border-b border-gray-600">
                    <div class="w-4 h-4 rounded-full node ${node.type}"></div>
                    <span class="font-semibold text-white capitalize">${node.type}</span>
                </div>
                <div class="font-medium text-blue-300">${node.name}</div>
        `;
        
        if (node.type === 'note') {
            const wordCount = node.data.wordCount || 'Unknown';
            const categories = node.data.categories?.join(', ') || 'None';
            const created = node.data.timestamp ? 
                new Date(node.data.timestamp).toLocaleDateString() : 'Unknown';
            
            html += `
                <div class="text-xs space-y-2">
                    <div><strong>📝 Content:</strong><br/>${node.data.fullContent.substring(0, 200)}${node.data.fullContent.length > 200 ? '...' : ''}</div>
                    <div><strong>📂 Categories:</strong> ${categories}</div>
                    <div><strong>📊 Word Count:</strong> ${wordCount}</div>
                    <div><strong>📅 Created:</strong> ${created}</div>
                    <div><strong>🔗 Connections:</strong> ${node.connections}</div>
            `;
            
            if (node.data.metadata?.url) {
                html += `<div><strong>🌐 Source:</strong> <a href="${node.data.metadata.url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">${node.data.metadata.title || 'Link'}</a></div>`;
            }
            
            html += `</div>`;
            
        } else if (node.type === 'category') {
            html += `
                <div class="text-xs space-y-2">
                    <div><strong>📖 Definition:</strong><br/>${node.data.definition}</div>
                    <div><strong>🔗 Connected Notes:</strong> ${node.connections}</div>
                </div>
            `;
            
        } else if (node.type === 'domain') {
            html += `
                <div class="text-xs space-y-2">
                    <div><strong>🌐 Domain:</strong> ${node.data.domain}</div>
                    <div><strong>📝 Notes:</strong> ${node.data.noteCount || node.connections}</div>
                </div>
            `;
            
        } else if (node.type === 'url_context') {
            html += `
                <div class="text-xs space-y-2">
                    <div><strong>🔗 URL:</strong> <a href="${node.data.url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline break-all">${node.data.url}</a></div>
                    ${node.data.summary ? `<div><strong>📄 Summary:</strong> ${node.data.summary}</div>` : ''}
                </div>
            `;
        }
        
        html += `</div>`;
        infoDiv.innerHTML = html;
    }
    
    function handleMouseOver(event, d) {
        const content = getTooltipContent(d);
        
        tooltip
            .style('opacity', 1)
            .html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    function handleMouseOut() {
        tooltip.style('opacity', 0);
    }
    
    function getTooltipContent(d) {
        let content = `<div class="font-semibold text-yellow-300">${d.name}</div>`;
        content += `<div class="text-gray-300 capitalize">${d.type}</div>`;
        content += `<div class="text-blue-300">${d.connections} connections</div>`;
        
        if (d.type === 'note' && d.data.categories?.length > 0) {
            content += `<div class="text-green-300">📂 ${d.data.categories.join(', ')}</div>`;
        }
        
        if (d.type === 'note' && d.data.wordCount) {
            content += `<div class="text-purple-300">📊 ${d.data.wordCount} words</div>`;
        }
        
        return content;
    }
    
    function createQuickFilters() {
        const filterContainer = document.getElementById('quick-filters');
        filterContainer.innerHTML = '';
        
        const nodeTypes = [...new Set(allData.nodes.map(n => n.type))];
        const typeIcons = {
            note: '📝',
            category: '📂', 
            domain: '🌐',
            url_context: '🔗'
        };
        
        nodeTypes.forEach(type => {
            const count = allData.nodes.filter(n => n.type === type).length;
            const button = document.createElement('button');
            button.className = 'px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-full transition-colors';
            button.innerHTML = `${typeIcons[type] || '•'} ${type} (${count})`;
            button.onclick = () => filterByType(type);
            filterContainer.appendChild(button);
        });
        
        // Add "All" button
        const allButton = document.createElement('button');
        allButton.className = 'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors';
        allButton.innerHTML = `🔍 All (${allData.nodes.length})`;
        allButton.onclick = () => {
            graphData = { ...allData };
            updateVisualization();
            updateStatistics();
        };
        filterContainer.appendChild(allButton);
    }
    
    function filterByType(type) {
        const filteredNodes = allData.nodes.filter(n => n.type === type);
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = allData.links.filter(l => 
            nodeIds.has(l.source.id || l.source) && nodeIds.has(l.target.id || l.target)
        );
        
        graphData = { nodes: filteredNodes, links: filteredLinks };
        updateVisualization();
        updateStatistics();
    }
    
    function handleSearch() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        
        if (!query) {
            clearSearch();
            return;
        }
        
        console.log('🔍 Searching for:', query);
        
        // Clear previous highlights
        g.selectAll('.node').classed('search-highlight', false);
        
        // Find matching nodes
        const matchingNodes = allData.nodes.filter(node => {
            return node.name.toLowerCase().includes(query) ||
                   (node.data.fullContent && node.data.fullContent.toLowerCase().includes(query)) ||
                   (node.data.categories && node.data.categories.some(cat => cat.toLowerCase().includes(query))) ||
                   (node.data.domain && node.data.domain.toLowerCase().includes(query));
        });
        
        if (matchingNodes.length > 0) {
            // Filter to show matching nodes and their connections
            const matchingIds = new Set(matchingNodes.map(n => n.id));
            const connectedNodes = new Set();
            
            // Add directly connected nodes
            allData.links.forEach(link => {
                const sourceId = link.source.id || link.source;
                const targetId = link.target.id || link.target;
                
                if (matchingIds.has(sourceId)) {
                    connectedNodes.add(targetId);
                }
                if (matchingIds.has(targetId)) {
                    connectedNodes.add(sourceId);
                }
            });
            
            // Combine matching and connected nodes
            matchingIds.forEach(id => connectedNodes.add(id));
            
            const filteredNodes = allData.nodes.filter(n => connectedNodes.has(n.id));
            const filteredLinks = allData.links.filter(l => {
                const sourceId = l.source.id || l.source;
                const targetId = l.target.id || l.target;
                return connectedNodes.has(sourceId) && connectedNodes.has(targetId);
            });
            
            graphData = { nodes: filteredNodes, links: filteredLinks };
            updateVisualization();
            updateStatistics();
            
            // Highlight matching nodes after visualization update
            setTimeout(() => {
                g.selectAll('.node')
                    .filter(d => matchingIds.has(d.id))
                    .classed('search-highlight', true);
            }, 100);
            
            updateStats(`Found ${matchingNodes.length} matches`, 'success');
            
        } else {
            updateStats('No matches found', 'warning');
        }
    }
    
    function clearSearch() {
        document.getElementById('search-input').value = '';
        g.selectAll('.node').classed('search-highlight', false);
        graphData = { ...allData };
        updateVisualization();
        updateStatistics();
        updateStats('Search cleared', 'info');
    }
    
    function updateStatistics() {
        const stats = {
            notes: graphData.nodes.filter(n => n.type === 'note').length,
            categories: graphData.nodes.filter(n => n.type === 'category').length,
            domains: graphData.nodes.filter(n => n.type === 'domain').length,
            connections: graphData.links.length
        };
        
        document.getElementById('notes-count').textContent = stats.notes;
        document.getElementById('categories-count').textContent = stats.categories;
        document.getElementById('domains-count').textContent = stats.domains;
        document.getElementById('connections-count').textContent = stats.connections;
    }
    
    function updateStats(message, type = 'info') {
        const statsContent = document.getElementById('stats-content');
        const colors = {
            info: 'text-blue-300',
            success: 'text-green-300',
            warning: 'text-yellow-300',
            error: 'text-red-300'
        };
        
        statsContent.className = colors[type] || colors.info;
        statsContent.textContent = message;
    }
    
    // Utility functions
    function updateSimulation() {
        if (!simulation) return;
        
        const strength = +document.getElementById('force-strength').value;
        const distance = +document.getElementById('link-distance').value;
        
        simulation
            .force('charge').strength(strength)
            .force('link').distance(distance);
        
        simulation.alpha(0.3).restart();
    }
    
    function toggleLabels() {
        const show = document.getElementById('show-labels').checked;
        g.selectAll('.node-label').style('opacity', show ? 1 : 0);
    }
    
    function toggleConnections() {
        const show = document.getElementById('show-relationships').checked;
        g.selectAll('.link').style('opacity', show ? 0.6 : 0);
    }
    
    function resetView() {
        svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity
        );
        
        if (simulation) {
            simulation.alpha(0.3).restart();
        }
        
        // Clear selection
        g.selectAll('.node').classed('selected', false);
        selectedNode = null;
        document.getElementById('node-info').innerHTML = 'Click on any node to see detailed information.';
    }
    
    function toggleFullscreen() {
        const container = document.getElementById('graph-container');
        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    function handleResize() {
        const container = document.getElementById('graph-container');
        const rect = container.getBoundingClientRect();
        svg.attr('width', rect.width).attr('height', rect.height);
        
        if (simulation) {
            simulation.force('center', d3.forceCenter(rect.width / 2, rect.height / 2));
            simulation.alpha(0.3).restart();
        }
    }
    
    function highlightConnectedNodes(node) {
        // This could be enhanced to show connection paths
        console.log('🔗 Highlighting connections for:', node.name);
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
    
    // Utility function for debouncing search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    console.log('🚀 Knowledge Graph Explorer ready!');
});