console.log('🚀 Simple Knowledge Graph loading...');

// Global variables
let allData = { nodes: [], links: [] };
let currentData = { nodes: [], links: [] };
let simulation = null;
let svg, g, tooltip;
let selectedNode = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM loaded, initializing...');
    
    // Check if D3 is available
    if (typeof d3 === 'undefined') {
        setStatus('❌ D3.js library not loaded. Please check internet connection.', 'error');
        return;
    }
    
    console.log('✅ D3.js version:', d3.version);
    
    initializeGraph();
    setupEventListeners();
    setStatus('✅ Ready! Click "Load Demo Data" to start or upload your JSON file.', 'success');
});

function initializeGraph() {
    console.log('🎨 Initializing graph...');
    
    // Setup SVG
    svg = d3.select('#graph');
    tooltip = d3.select('#tooltip');
    
    const container = document.getElementById('graph-container');
    const rect = container.getBoundingClientRect();
    
    svg.attr('width', rect.width).attr('height', rect.height);
    
    // Create main group for zoom/pan
    g = svg.append('g');
    
    // Setup zoom
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Setup simulation
    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(rect.width / 2, rect.height / 2))
        .force('collision', d3.forceCollide().radius(25));
    
    console.log('✅ Graph initialized');
}

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // File upload
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('load-sample').addEventListener('click', loadSampleData);
    document.getElementById('reset-view').addEventListener('click', resetView);
    document.getElementById('clear-search').addEventListener('click', clearSearch);
    
    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Window resize
    window.addEventListener('resize', handleResize);
    
    console.log('✅ Event listeners ready');
}

function setStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    console.log(`📢 Status: ${message}`);
}

function showLoading(show = true) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📁 Loading file:', file.name);
    setStatus('📁 Reading file...', 'info');
    showLoading(true);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            console.log('✅ JSON parsed successfully');
            loadKnowledgeGraph(data);
        } catch (error) {
            console.error('❌ JSON parse error:', error);
            setStatus('❌ Error: Invalid JSON file format', 'error');
            showLoading(false);
        }
    };
    
    reader.onerror = function() {
        console.error('❌ File read error');
        setStatus('❌ Error reading file', 'error');
        showLoading(false);
    };
    
    reader.readAsText(file);
}

function loadSampleData() {
    console.log('🎯 Loading sample data...');
    setStatus('🎯 Loading demo data...', 'info');
    showLoading(true);
    
    const sampleData = {
        metadata: {
            totalNotes: 6,
            totalCategories: 3,
            source: "Demo Data"
        },
        categories: [
            { category: "Machine Learning", definition: "AI and ML concepts" },
            { category: "Web Development", definition: "Web technologies and frameworks" },
            { category: "Productivity", definition: "Tools and techniques for productivity" }
        ],
        notes: [
            {
                id: "note-1",
                content: "Transformer models revolutionized NLP with attention mechanisms. Key components include multi-head attention, positional encoding, and feed-forward networks.",
                categories: ["Machine Learning"],
                metadata: {
                    title: "Understanding Transformers",
                    url: "https://arxiv.org/abs/1706.03762",
                    domain: "arxiv.org"
                },
                timestamp: Date.now() - 86400000
            },
            {
                id: "note-2", 
                content: "React hooks like useState and useEffect allow functional components to manage state and side effects more elegantly than class components.",
                categories: ["Web Development"],
                metadata: {
                    title: "React Hooks Guide",
                    url: "https://reactjs.org/docs/hooks-intro.html",
                    domain: "reactjs.org"
                },
                timestamp: Date.now() - 43200000
            },
            {
                id: "note-3",
                content: "Time blocking involves dedicating specific time slots to different activities. This technique helps improve focus and reduces context switching.",
                categories: ["Productivity"],
                metadata: {
                    title: "Time Blocking Technique",
                    url: "https://blog.rescuetime.com/time-blocking/",
                    domain: "blog.rescuetime.com"
                },
                timestamp: Date.now() - 21600000
            },
            {
                id: "note-4",
                content: "Vector databases like Pinecone and Weaviate store high-dimensional embeddings for semantic search and RAG applications.",
                categories: ["Machine Learning", "Web Development"],
                metadata: {
                    title: "Vector Database Guide",
                    url: "https://www.pinecone.io/learn/vector-database/",
                    domain: "pinecone.io"
                },
                timestamp: Date.now() - 10800000
            },
            {
                id: "note-5",
                content: "GraphQL provides a query language for APIs with strong typing and efficient data fetching compared to REST.",
                categories: ["Web Development"],
                metadata: {
                    title: "GraphQL vs REST",
                    url: "https://graphql.org/learn/",
                    domain: "graphql.org"
                },
                timestamp: Date.now() - 7200000
            },
            {
                id: "note-6",
                content: "The Pomodoro Technique uses 25-minute focused work sessions followed by short breaks to maintain concentration and avoid burnout.",
                categories: ["Productivity"],
                metadata: {
                    title: "Pomodoro Technique",
                    url: "https://todoist.com/productivity-methods/pomodoro-technique",
                    domain: "todoist.com"
                },
                timestamp: Date.now() - 3600000
            }
        ]
    };
    
    setTimeout(() => {
        loadKnowledgeGraph(sampleData);
    }, 500);
}

function loadKnowledgeGraph(data) {
    console.log('🔄 Processing knowledge graph data...');
    
    try {
        const processed = processData(data);
        allData = processed;
        currentData = { ...processed };
        
        console.log(`📊 Processed: ${processed.nodes.length} nodes, ${processed.links.length} links`);
        
        createFilterButtons();
        updateVisualization();
        updateStatistics();
        
        setStatus(`✅ Loaded ${processed.nodes.length} nodes successfully!`, 'success');
        showLoading(false);
        
    } catch (error) {
        console.error('❌ Error processing data:', error);
        setStatus('❌ Error processing data: ' + error.message, 'error');
        showLoading(false);
    }
}

function processData(data) {
    console.log('⚙️ Processing data...');
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    function addNode(id, type, name, data = {}) {
        if (nodeMap.has(id)) return nodeMap.get(id);
        
        const node = {
            id, type, name, data,
            connections: 0,
            radius: type === 'note' ? 15 : type === 'category' ? 20 : 12
        };
        nodes.push(node);
        nodeMap.set(id, node);
        return node;
    }
    
    function addLink(sourceId, targetId, type = 'default') {
        const existing = links.find(l => 
            (l.source === sourceId && l.target === targetId) || 
            (l.source === targetId && l.target === sourceId)
        );
        
        if (!existing) {
            links.push({ source: sourceId, target: targetId, type });
            const sourceNode = nodeMap.get(sourceId);
            const targetNode = nodeMap.get(targetId);
            if (sourceNode) sourceNode.connections++;
            if (targetNode) targetNode.connections++;
        }
    }
    
    // Add categories
    if (data.categories) {
        data.categories.forEach(category => {
            addNode(`category-${category.category}`, 'category', category.category, {
                definition: category.definition
            });
        });
    }
    
    // Add notes and relationships
    if (data.notes) {
        data.notes.forEach(note => {
            const noteName = note.content.length > 30 ? 
                note.content.substring(0, 30) + '...' : note.content;
            
            addNode(note.id, 'note', noteName, {
                content: note.content,
                categories: note.categories || [],
                metadata: note.metadata || {},
                timestamp: note.timestamp,
                wordCount: note.content.split(' ').length
            });
            
            // Link to categories
            if (note.categories) {
                note.categories.forEach(categoryName => {
                    const categoryId = `category-${categoryName}`;
                    addLink(note.id, categoryId, 'category');
                });
            }
            
            // Add domain
            if (note.metadata?.domain) {
                const domainId = `domain-${note.metadata.domain}`;
                if (!nodeMap.has(domainId)) {
                    addNode(domainId, 'domain', note.metadata.domain, {
                        domain: note.metadata.domain
                    });
                }
                addLink(note.id, domainId, 'domain');
            }
            
            // Add URL
            if (note.metadata?.url) {
                const urlId = `url-${btoa(note.metadata.url).substring(0, 8)}`;
                if (!nodeMap.has(urlId)) {
                    addNode(urlId, 'url_context', note.metadata.title || 'Page', {
                        url: note.metadata.url,
                        title: note.metadata.title
                    });
                }
                addLink(note.id, urlId, 'url');
            }
        });
    }
    
    console.log(`✅ Created ${nodes.length} nodes and ${links.length} links`);
    return { nodes, links };
}

function createFilterButtons() {
    const container = document.getElementById('filter-buttons');
    container.innerHTML = '';
    
    const nodeTypes = [...new Set(allData.nodes.map(n => n.type))];
    const typeIcons = {
        note: '📝',
        category: '📂', 
        domain: '🌐',
        url_context: '🔗'
    };
    
    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.innerHTML = `🔍 All (${allData.nodes.length})`;
    allBtn.onclick = () => filterByType('all', allBtn);
    container.appendChild(allBtn);
    
    // Add type-specific buttons
    nodeTypes.forEach(type => {
        const count = allData.nodes.filter(n => n.type === type).length;
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerHTML = `${typeIcons[type] || '•'} ${type} (${count})`;
        btn.onclick = () => filterByType(type, btn);
        container.appendChild(btn);
    });
}

function filterByType(type, buttonEl) {
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');
    
    if (type === 'all') {
        currentData = { ...allData };
    } else {
        const filteredNodes = allData.nodes.filter(n => n.type === type);
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = allData.links.filter(l => 
            nodeIds.has(l.source.id || l.source) && nodeIds.has(l.target.id || l.target)
        );
        currentData = { nodes: filteredNodes, links: filteredLinks };
    }
    
    updateVisualization();
    updateStatistics();
    setStatus(`Filtered to show ${currentData.nodes.length} nodes`, 'info');
}

function updateVisualization() {
    console.log('🎨 Updating visualization...');
    
    // Clear existing
    g.selectAll('*').remove();
    
    if (currentData.nodes.length === 0) {
        setStatus('No data to display', 'warning');
        return;
    }
    
    // Create links
    const link = g.selectAll('.link')
        .data(currentData.links)
        .enter()
        .append('line')
        .attr('class', d => `link ${d.type}`);
    
    // Create nodes
    const node = g.selectAll('.node')
        .data(currentData.nodes)
        .enter()
        .append('circle')
        .attr('class', d => `node ${d.type}`)
        .attr('r', d => d.radius + (d.connections * 2))
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', handleNodeClick)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);
    
    // Create labels
    const label = g.selectAll('.node-label')
        .data(currentData.nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('dy', -25)
        .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name);
    
    // Update simulation
    simulation.nodes(currentData.nodes);
    simulation.force('link').links(currentData.links);
    simulation.alpha(0.3).restart();
    
    // Tick function
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
            .attr('y', d => d.y);
    });
    
    console.log('✅ Visualization updated');
}

function handleNodeClick(event, d) {
    console.log('🖱️ Node clicked:', d.name);
    
    // Clear previous selection
    g.selectAll('.node').classed('selected', false);
    d3.select(event.target).classed('selected', true);
    
    selectedNode = d;
    showNodeInfo(d);
}

function showNodeInfo(node) {
    const infoEl = document.getElementById('node-info');
    
    let html = `
        <h4>📍 ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}</h4>
        <p><strong>Name:</strong> ${node.name}</p>
        <p><strong>Connections:</strong> ${node.connections}</p>
    `;
    
    if (node.type === 'note') {
        html += `
            <p><strong>📝 Full Content:</strong></p>
            <div style="background: #444; padding: 10px; border-radius: 5px; margin: 10px 0; max-height: 150px; overflow-y: auto;">
                ${node.data.content}
            </div>
            <p><strong>📂 Categories:</strong> ${node.data.categories.join(', ') || 'None'}</p>
            <p><strong>📊 Word Count:</strong> ${node.data.wordCount}</p>
        `;
        
        if (node.data.metadata.url) {
            html += `<p><strong>🌐 Source:</strong> <a href="${node.data.metadata.url}" target="_blank" style="color: #4a9eff;">${node.data.metadata.title || 'Link'}</a></p>`;
        }
        
        if (node.data.timestamp) {
            html += `<p><strong>📅 Created:</strong> ${new Date(node.data.timestamp).toLocaleDateString()}</p>`;
        }
        
    } else if (node.type === 'category') {
        html += `<p><strong>📖 Definition:</strong> ${node.data.definition}</p>`;
        
    } else if (node.type === 'domain') {
        html += `<p><strong>🌐 Domain:</strong> ${node.data.domain}</p>`;
        
    } else if (node.type === 'url_context') {
        html += `
            <p><strong>🔗 URL:</strong> <a href="${node.data.url}" target="_blank" style="color: #4a9eff; word-break: break-all;">${node.data.url}</a></p>
            <p><strong>📄 Title:</strong> ${node.data.title}</p>
        `;
    }
    
    infoEl.innerHTML = html;
}

function handleMouseOver(event, d) {
    const content = `
        <strong>${d.name}</strong><br/>
        Type: ${d.type}<br/>
        Connections: ${d.connections}
        ${d.type === 'note' && d.data.wordCount ? `<br/>Words: ${d.data.wordCount}` : ''}
    `;
    
    tooltip
        .style('opacity', 1)
        .html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
}

function handleMouseOut() {
    tooltip.style('opacity', 0);
}

function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
        clearSearch();
        return;
    }
    
    console.log('🔍 Searching for:', query);
    
    // Find matching nodes
    const matchingNodes = allData.nodes.filter(node => {
        return node.name.toLowerCase().includes(query) ||
               (node.data.content && node.data.content.toLowerCase().includes(query)) ||
               (node.data.categories && node.data.categories.some(cat => cat.toLowerCase().includes(query))) ||
               (node.data.domain && node.data.domain.toLowerCase().includes(query));
    });
    
    if (matchingNodes.length > 0) {
        // Show matching nodes and their connections
        const matchingIds = new Set(matchingNodes.map(n => n.id));
        const connectedIds = new Set(matchingIds);
        
        // Add connected nodes
        allData.links.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            
            if (matchingIds.has(sourceId)) connectedIds.add(targetId);
            if (matchingIds.has(targetId)) connectedIds.add(sourceId);
        });
        
        const filteredNodes = allData.nodes.filter(n => connectedIds.has(n.id));
        const filteredLinks = allData.links.filter(l => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            return connectedIds.has(sourceId) && connectedIds.has(targetId);
        });
        
        currentData = { nodes: filteredNodes, links: filteredLinks };
        updateVisualization();
        updateStatistics();
        
        setStatus(`Found ${matchingNodes.length} matches`, 'success');
        
    } else {
        setStatus('No matches found', 'warning');
    }
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    currentData = { ...allData };
    updateVisualization();
    updateStatistics();
    setStatus('Search cleared', 'info');
    
    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn').classList.add('active');
}

function updateStatistics() {
    const stats = {
        notes: currentData.nodes.filter(n => n.type === 'note').length,
        categories: currentData.nodes.filter(n => n.type === 'category').length,
        domains: currentData.nodes.filter(n => n.type === 'domain').length,
        links: currentData.links.length
    };
    
    document.getElementById('notes-count').textContent = stats.notes;
    document.getElementById('categories-count').textContent = stats.categories;
    document.getElementById('domains-count').textContent = stats.domains;
    document.getElementById('links-count').textContent = stats.links;
}

function resetView() {
    console.log('🔄 Resetting view...');
    
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
    document.getElementById('node-info').innerHTML = '<h4>ℹ️ Node Details</h4><p>Click on any node to see detailed information.</p>';
    
    setStatus('View reset', 'info');
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

console.log('✅ Simple Knowledge Graph script loaded!');