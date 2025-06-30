console.log('🚀 Fallback Knowledge Graph loading...');

// Global variables
let allData = { nodes: [], links: [] };
let currentData = { nodes: [], links: [] };
let selectedNode = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM loaded, initializing fallback visualization...');
    
    setupEventListeners();
    setStatus('✅ Ready! No external libraries needed. Click "Load Demo Data" to start!', 'success');
});

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // File upload
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('load-sample').addEventListener('click', loadSampleData);
    document.getElementById('clear-all').addEventListener('click', clearAll);
    
    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    console.log('✅ Event listeners ready');
}

function setStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    console.log(`📢 Status: ${message}`);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📁 Loading file:', file.name);
    setStatus('📁 Reading your JSON file...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            console.log('✅ JSON parsed successfully');
            loadKnowledgeGraph(data);
        } catch (error) {
            console.error('❌ JSON parse error:', error);
            setStatus('❌ Error: Invalid JSON file format. Please check your file.', 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('❌ File read error');
        setStatus('❌ Error reading file', 'error');
    };
    
    reader.readAsText(file);
}

function loadSampleData() {
    console.log('🎯 Loading sample data...');
    setStatus('🎯 Loading demo data...', 'info');
    
    const sampleData = {
        metadata: {
            totalNotes: 6,
            totalCategories: 3,
            source: "Demo Data"
        },
        categories: [
            { category: "Machine Learning", definition: "AI, ML concepts, algorithms, and applications in modern technology" },
            { category: "Web Development", definition: "Frontend and backend technologies, frameworks, and best practices" },
            { category: "Productivity", definition: "Tools, techniques, and methods for improving personal and professional efficiency" }
        ],
        notes: [
            {
                id: "note-1",
                content: "Transformer models have revolutionized natural language processing with their attention mechanism. The key innovation is self-attention, which allows the model to weigh the importance of different words in a sentence when processing each word. This has led to breakthroughs in machine translation, text generation, and language understanding tasks.",
                categories: ["Machine Learning"],
                metadata: {
                    title: "Understanding Transformer Architecture",
                    url: "https://arxiv.org/abs/1706.03762",
                    domain: "arxiv.org",
                    summary: "The groundbreaking 'Attention Is All You Need' paper"
                },
                timestamp: Date.now() - 86400000
            },
            {
                id: "note-2", 
                content: "React hooks like useState and useEffect have fundamentally changed how we write React components. They allow functional components to manage state and side effects, eliminating the need for class components in most cases. This leads to cleaner, more reusable code that's easier to test and understand.",
                categories: ["Web Development"],
                metadata: {
                    title: "React Hooks Complete Guide",
                    url: "https://reactjs.org/docs/hooks-intro.html",
                    domain: "reactjs.org",
                    summary: "Official React documentation on hooks"
                },
                timestamp: Date.now() - 43200000
            },
            {
                id: "note-3",
                content: "Time blocking is a powerful productivity technique where you dedicate specific time slots to different activities throughout your day. Instead of working from a to-do list, you schedule tasks in your calendar, which helps prevent overcommitment and ensures important work gets proper attention.",
                categories: ["Productivity"],
                metadata: {
                    title: "Master Time Blocking for Better Focus",
                    url: "https://blog.rescuetime.com/time-blocking/",
                    domain: "blog.rescuetime.com",
                    summary: "Complete guide to implementing time blocking"
                },
                timestamp: Date.now() - 21600000
            },
            {
                id: "note-4",
                content: "Vector databases like Pinecone, Weaviate, and Chroma are becoming essential for AI applications. They store high-dimensional embeddings and enable semantic search, similarity matching, and retrieval-augmented generation (RAG). This technology bridges the gap between traditional databases and modern AI systems.",
                categories: ["Machine Learning", "Web Development"],
                metadata: {
                    title: "Vector Databases Explained",
                    url: "https://www.pinecone.io/learn/vector-database/",
                    domain: "pinecone.io",
                    summary: "What are vector databases and why do they matter?"
                },
                timestamp: Date.now() - 10800000
            },
            {
                id: "note-5",
                content: "GraphQL provides a more efficient alternative to REST APIs by allowing clients to request exactly the data they need. With its strong type system, single endpoint, and powerful query language, GraphQL reduces over-fetching and under-fetching while improving developer experience.",
                categories: ["Web Development"],
                metadata: {
                    title: "GraphQL vs REST: A Complete Comparison",
                    url: "https://graphql.org/learn/thinking-in-graphs/",
                    domain: "graphql.org",
                    summary: "Official GraphQL learning resources"
                },
                timestamp: Date.now() - 7200000
            },
            {
                id: "note-6",
                content: "The Pomodoro Technique breaks work into 25-minute focused sessions followed by 5-minute breaks. After four pomodoros, you take a longer 15-30 minute break. This method leverages the brain's natural attention cycles to maintain high productivity while preventing burnout and mental fatigue.",
                categories: ["Productivity"],
                metadata: {
                    title: "Pomodoro Technique: A Complete Guide",
                    url: "https://todoist.com/productivity-methods/pomodoro-technique",
                    domain: "todoist.com",
                    summary: "How to implement the Pomodoro Technique effectively"
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
        
        console.log(`📊 Processed: ${processed.nodes.length} nodes, ${processed.connections} connections`);
        
        createFilterButtons();
        displayNodes();
        updateStatistics();
        
        setStatus(`✅ Loaded ${processed.nodes.length} items successfully! Click any item to explore.`, 'success');
        
    } catch (error) {
        console.error('❌ Error processing data:', error);
        setStatus('❌ Error processing data: ' + error.message, 'error');
    }
}

function processData(data) {
    console.log('⚙️ Processing data...');
    
    const nodes = [];
    const connections = [];
    
    // Add categories
    if (data.categories) {
        data.categories.forEach(category => {
            nodes.push({
                id: `category-${category.category}`,
                type: 'category',
                name: category.category,
                data: {
                    definition: category.definition,
                    type: 'category'
                },
                connections: []
            });
        });
    }
    
    // Add notes and create connections
    if (data.notes) {
        data.notes.forEach(note => {
            const noteNode = {
                id: note.id,
                type: 'note',
                name: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
                data: {
                    content: note.content,
                    categories: note.categories || [],
                    metadata: note.metadata || {},
                    timestamp: note.timestamp,
                    wordCount: note.content.split(' ').length,
                    type: 'note'
                },
                connections: []
            };
            nodes.push(noteNode);
            
            // Create connections to categories
            if (note.categories) {
                note.categories.forEach(categoryName => {
                    const categoryId = `category-${categoryName}`;
                    noteNode.connections.push({
                        target: categoryId,
                        type: 'category',
                        label: `Tagged as ${categoryName}`
                    });
                    
                    // Add reverse connection
                    const categoryNode = nodes.find(n => n.id === categoryId);
                    if (categoryNode) {
                        categoryNode.connections.push({
                            target: note.id,
                            type: 'note',
                            label: `Contains note`
                        });
                    }
                });
            }
            
            // Add domain if exists
            if (note.metadata?.domain) {
                const domainId = `domain-${note.metadata.domain}`;
                let domainNode = nodes.find(n => n.id === domainId);
                
                if (!domainNode) {
                    domainNode = {
                        id: domainId,
                        type: 'domain',
                        name: note.metadata.domain,
                        data: {
                            domain: note.metadata.domain,
                            noteCount: 1,
                            type: 'domain'
                        },
                        connections: []
                    };
                    nodes.push(domainNode);
                } else {
                    domainNode.data.noteCount++;
                }
                
                noteNode.connections.push({
                    target: domainId,
                    type: 'domain',
                    label: `From ${note.metadata.domain}`
                });
                
                domainNode.connections.push({
                    target: note.id,
                    type: 'note',
                    label: `Source of note`
                });
            }
            
            // Add URL if exists
            if (note.metadata?.url) {
                const urlId = `url-${btoa(note.metadata.url).substring(0, 8)}`;
                let urlNode = nodes.find(n => n.id === urlId);
                
                if (!urlNode) {
                    urlNode = {
                        id: urlId,
                        type: 'url_context',
                        name: note.metadata.title || 'Web Page',
                        data: {
                            url: note.metadata.url,
                            title: note.metadata.title,
                            summary: note.metadata.summary || '',
                            type: 'url_context'
                        },
                        connections: []
                    };
                    nodes.push(urlNode);
                }
                
                noteNode.connections.push({
                    target: urlId,
                    type: 'url',
                    label: `Source page`
                });
                
                urlNode.connections.push({
                    target: note.id,
                    type: 'note',
                    label: `Generated note`
                });
            }
        });
    }
    
    // Count total connections
    const totalConnections = nodes.reduce((sum, node) => sum + node.connections.length, 0);
    
    console.log(`✅ Created ${nodes.length} nodes with ${totalConnections} connections`);
    return { nodes, connections: totalConnections };
}

function createFilterButtons() {
    const container = document.getElementById('filter-buttons');
    container.innerHTML = '';
    
    const nodeTypes = [...new Set(currentData.nodes.map(n => n.type))];
    const typeIcons = {
        note: '📝',
        category: '📂', 
        domain: '🌐',
        url_context: '🔗'
    };
    
    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.innerHTML = `🔍 All (${currentData.nodes.length})`;
    allBtn.onclick = () => filterByType('all', allBtn);
    container.appendChild(allBtn);
    
    // Add type-specific buttons
    nodeTypes.forEach(type => {
        const count = currentData.nodes.filter(n => n.type === type).length;
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
        currentData = { nodes: filteredNodes, connections: allData.connections };
    }
    
    displayNodes();
    updateStatistics();
    setStatus(`Showing ${currentData.nodes.length} ${type === 'all' ? 'items' : type + ' items'}`, 'info');
}

function displayNodes() {
    const container = document.getElementById('nodes-container');
    container.innerHTML = '';
    
    if (currentData.nodes.length === 0) {
        container.innerHTML = '<div class="no-data">No items match your current filter.</div>';
        return;
    }
    
    currentData.nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `node-item ${node.type}`;
        nodeEl.onclick = () => selectNode(node, nodeEl);
        
        const typeEmoji = {
            note: '📝',
            category: '📂',
            domain: '🌐',
            url_context: '🔗'
        };
        
        nodeEl.innerHTML = `
            <div class="node-type">${typeEmoji[node.type]} ${node.type}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-content">${getNodePreview(node)}</div>
            <div class="connections">🔗 ${node.connections.length} connections</div>
        `;
        
        container.appendChild(nodeEl);
    });
}

function getNodePreview(node) {
    switch (node.type) {
        case 'note':
            const categories = node.data.categories.length > 0 ? 
                `📂 ${node.data.categories.join(', ')} • ` : '';
            const wordCount = `📊 ${node.data.wordCount} words`;
            return `${categories}${wordCount}`;
            
        case 'category':
            return node.data.definition || 'No definition available';
            
        case 'domain':
            return `🌐 ${node.data.domain} • ${node.data.noteCount || 1} notes`;
            
        case 'url_context':
            return node.data.summary || `🔗 ${node.data.url}`;
            
        default:
            return 'No preview available';
    }
}

function selectNode(node, nodeEl) {
    console.log('🖱️ Node selected:', node.name);
    
    // Update visual selection
    document.querySelectorAll('.node-item').forEach(el => el.classList.remove('selected'));
    nodeEl.classList.add('selected');
    
    selectedNode = node;
    showNodeDetails(node);
}

function showNodeDetails(node) {
    const detailsEl = document.getElementById('details-panel');
    
    let html = `
        <div class="details-title">${getNodeIcon(node.type)} ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}</div>
        <p><strong>Name:</strong> ${node.name}</p>
        <p><strong>Connections:</strong> ${node.connections.length}</p>
    `;
    
    if (node.type === 'note') {
        html += `
            <div style="margin: 15px 0;">
                <strong>📝 Full Content:</strong>
                <div style="background: #444; padding: 12px; border-radius: 5px; margin: 8px 0; max-height: 200px; overflow-y: auto; line-height: 1.5;">
                    ${node.data.content}
                </div>
            </div>
            <p><strong>📂 Categories:</strong> ${node.data.categories.join(', ') || 'None'}</p>
            <p><strong>📊 Word Count:</strong> ${node.data.wordCount}</p>
        `;
        
        if (node.data.metadata.url) {
            html += `<p><strong>🌐 Source:</strong> <a href="${node.data.metadata.url}" target="_blank" style="color: #4a9eff; text-decoration: underline;">${node.data.metadata.title || 'Link'}</a></p>`;
        }
        
        if (node.data.timestamp) {
            html += `<p><strong>📅 Created:</strong> ${new Date(node.data.timestamp).toLocaleString()}</p>`;
        }
        
    } else if (node.type === 'category') {
        html += `
            <div style="margin: 15px 0;">
                <strong>📖 Definition:</strong>
                <div style="background: #444; padding: 12px; border-radius: 5px; margin: 8px 0; line-height: 1.5;">
                    ${node.data.definition}
                </div>
            </div>
        `;
        
    } else if (node.type === 'domain') {
        html += `
            <p><strong>🌐 Domain:</strong> ${node.data.domain}</p>
            <p><strong>📝 Notes Count:</strong> ${node.data.noteCount || 1}</p>
        `;
        
    } else if (node.type === 'url_context') {
        html += `
            <p><strong>🔗 URL:</strong> <a href="${node.data.url}" target="_blank" style="color: #4a9eff; text-decoration: underline; word-break: break-all;">${node.data.url}</a></p>
            <p><strong>📄 Title:</strong> ${node.data.title}</p>
            ${node.data.summary ? `<p><strong>📋 Summary:</strong> ${node.data.summary}</p>` : ''}
        `;
    }
    
    // Show connections
    if (node.connections.length > 0) {
        html += `
            <div style="margin-top: 20px;">
                <strong>🔗 Connected To:</strong>
                <div style="margin-top: 8px;">
        `;
        
        node.connections.slice(0, 5).forEach(conn => {
            const targetNode = allData.nodes.find(n => n.id === conn.target);
            if (targetNode) {
                html += `<div style="background: #444; padding: 6px 10px; border-radius: 15px; margin: 3px 0; font-size: 0.85em;">
                    ${getNodeIcon(targetNode.type)} ${targetNode.name.substring(0, 40)}${targetNode.name.length > 40 ? '...' : ''}
                </div>`;
            }
        });
        
        if (node.connections.length > 5) {
            html += `<div style="color: #888; font-size: 0.8em; margin-top: 5px;">... and ${node.connections.length - 5} more</div>`;
        }
        
        html += `</div></div>`;
    }
    
    detailsEl.innerHTML = html;
}

function getNodeIcon(type) {
    const icons = {
        note: '📝',
        category: '📂',
        domain: '🌐',
        url_context: '🔗'
    };
    return icons[type] || '•';
}

function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
        currentData = { ...allData };
        displayNodes();
        updateStatistics();
        setStatus('Search cleared - showing all items', 'info');
        return;
    }
    
    console.log('🔍 Searching for:', query);
    
    const matchingNodes = allData.nodes.filter(node => {
        return node.name.toLowerCase().includes(query) ||
               (node.data.content && node.data.content.toLowerCase().includes(query)) ||
               (node.data.categories && node.data.categories.some(cat => cat.toLowerCase().includes(query))) ||
               (node.data.domain && node.data.domain.toLowerCase().includes(query)) ||
               (node.data.definition && node.data.definition.toLowerCase().includes(query));
    });
    
    currentData = { nodes: matchingNodes, connections: allData.connections };
    displayNodes();
    updateStatistics();
    
    if (matchingNodes.length > 0) {
        setStatus(`Found ${matchingNodes.length} matches for "${query}"`, 'success');
    } else {
        setStatus(`No matches found for "${query}"`, 'error');
    }
}

function updateStatistics() {
    const stats = {
        notes: currentData.nodes.filter(n => n.type === 'note').length,
        categories: currentData.nodes.filter(n => n.type === 'category').length,
        domains: currentData.nodes.filter(n => n.type === 'domain').length,
        connections: currentData.connections || 0
    };
    
    document.getElementById('notes-count').textContent = stats.notes;
    document.getElementById('categories-count').textContent = stats.categories;
    document.getElementById('domains-count').textContent = stats.domains;
    document.getElementById('connections-count').textContent = stats.connections;
}

function clearAll() {
    console.log('🔄 Clearing all data...');
    
    allData = { nodes: [], connections: 0 };
    currentData = { nodes: [], connections: 0 };
    selectedNode = null;
    
    document.getElementById('file-input').value = '';
    document.getElementById('search-input').value = '';
    document.getElementById('nodes-container').innerHTML = '<div class="no-data">Data cleared. Load demo data or upload your JSON file to start exploring.</div>';
    document.getElementById('details-panel').innerHTML = 'Click on any item to see detailed information.';
    document.getElementById('filter-buttons').innerHTML = '';
    
    updateStatistics();
    setStatus('All data cleared', 'info');
}

console.log('✅ Fallback Knowledge Graph script loaded! No external dependencies required.');