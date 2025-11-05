// State management
const appState = {
    currentView: 'gsi-processor',
    theme: 'light',
    zoom: 1,
    nodeSpacing: 120,
    rankSpacing: 200,
    arrowThickness: 4,
    arrowShape: 'triangle',
    arrowScale: 1,
    orientation: 'LR' // 'LR' for horizontal, 'TB' for vertical
};

// Cytoscape instance
let cy = null;

// Color helper function - matches dataflow.js
function getColor(colorType) {
    const isDark = appState.theme === 'dark';
    const colors = {
        'entry': isDark ? '#3b82f6' : '#0066ff',
        'entry-stroke': isDark ? '#2563eb' : '#0052cc',
        'process': isDark ? '#8b5cf6' : '#7c3aed', // Changed from red to purple/violet
        'process-stroke': isDark ? '#7c3aed' : '#6d28d9',
        'decision': isDark ? '#d946ef' : '#c026d3',
        'decision-stroke': isDark ? '#c026d3' : '#a21caf',
        'buffer': isDark ? '#0d9488' : '#0f766e', // Dark teal - distinct shade
        'buffer-stroke': isDark ? '#0f766e' : '#115e59',
        'candidate': isDark ? '#14b8a6' : '#0d9488', // Medium teal - distinct shade
        'candidate-stroke': isDark ? '#0f766e' : '#0f766e',
        'storage': isDark ? '#10b981' : '#059669', // Emerald green - main storage
        'storage-stroke': isDark ? '#059669' : '#047857',
        'delivery': isDark ? '#f97316' : '#ea580c',
        'delivery-stroke': isDark ? '#ea580c' : '#c2410c',
        'end-state': isDark ? '#6b7280' : '#4b5563', // Gray - indicates end/terminal state
        'end-state-stroke': isDark ? '#4b5563' : '#374151',
        'database': isDark ? '#06b6d4' : '#0891b2', // Cyan/light blue-green - distinct shade
        'database-stroke': isDark ? '#0891b2' : '#0e7490'
    };
    return colors[colorType] || (isDark ? '#94a3b8' : '#64748b');
}

// Get edge colors
function getEdgeColor(edgeType) {
    const isDark = appState.theme === 'dark';
    const colors = {
        'normal': isDark ? '#94a3b8' : '#64748b',
        'yes': isDark ? '#22c55e' : '#16a34a',
        'no': isDark ? '#ef4444' : '#dc2626',
        'write': isDark ? '#06b6d4' : '#0891b2',
        'read': isDark ? '#a855f7' : '#9333ea',
        'async-db': isDark ? '#f97316' : '#ea580c'
    };
    return colors[edgeType] || colors.normal;
}

// Generate GSI Processor elements for Cytoscape
function generateGSIProcessorElements() {
    const nodes = [
        // Entry
        { data: { id: 'Start', label: 'GSI Payload', type: 'entry' } },
        
        // Process nodes
        { data: { id: 'Extract', label: 'extract_player_states_from_payload\nSeparates into private and public states', type: 'process' } },
        { data: { id: 'ProcessPrivate', label: 'Process Private States', type: 'process' } },
        { data: { id: 'ProcessPublic', label: 'Process Public States', type: 'process' } },
        { data: { id: 'ProcessBuffered', label: 'Process buffered_data\nprocess_buffered_data()', type: 'process' } },
        { data: { id: 'StartMatch', label: 'start_new_match\nUses candidates data', type: 'process' } },
        { data: { id: 'Skip', label: 'Skip', type: 'end-state' } },
        { data: { id: 'Wait', label: 'Wait for more players', type: 'end-state' } },
        
        // Decision nodes
        { data: { id: 'PrivatePath', label: 'Match active?', type: 'decision' } },
        { data: { id: 'PublicPath', label: 'Match active?', type: 'decision' } },
        { data: { id: 'ValidPlayer', label: 'Is valid player?', type: 'decision' } },
        { data: { id: 'Check8', label: '8 valid players\nin candidates?', type: 'decision' } },
        { data: { id: 'CheckUpdates', label: 'any_updates\n& match_id?', type: 'decision' } },
        
        // Add/Store operations
        { data: { id: 'BufferPrivate', label: 'Add to private_player_buffer', type: 'add-buffer' } },
        { data: { id: 'BufferPublic', label: 'Add to public_player_buffer', type: 'add-buffer' } },
        { data: { id: 'AddCandidate', label: 'Add to candidates if new', type: 'add-candidate' } },
        { data: { id: 'StorePrivate', label: 'Store in match_state', type: 'store' } },
        { data: { id: 'StorePublic', label: 'Store in match_state', type: 'store' } },
        { data: { id: 'UpdatePublic', label: 'Store in match_state', type: 'store' } },
        
        // Storage nodes
        { data: { id: 'PrivateBuffer', label: 'private_player_buffer', type: 'buffer' } },
        { data: { id: 'PublicBuffer', label: 'public_player_buffer', type: 'buffer' } },
        { data: { id: 'Candidates', label: 'candidates', type: 'candidate' } },
        { data: { id: 'MatchState', label: 'match_state\nMemory', type: 'storage' } },
        { data: { id: 'DB', label: 'Database', type: 'database' } },
        
        // Delivery nodes
        { data: { id: 'EmitWS', label: 'Emit WebSocket update', type: 'delivery' } },
        { data: { id: 'End', label: 'Done', type: 'delivery' } }
    ];
    
    const edges = [
        // Normal flow
        { data: { id: 'e1', source: 'Start', target: 'Extract', label: '', type: 'normal' } },
        { data: { id: 'e2', source: 'Extract', target: 'ProcessPrivate', label: '', type: 'normal' } },
        { data: { id: 'e3', source: 'Extract', target: 'ProcessPublic', label: '', type: 'normal' } },
        { data: { id: 'e4', source: 'ProcessPrivate', target: 'PrivatePath', label: '', type: 'normal' } },
        { data: { id: 'e5', source: 'ProcessPublic', target: 'PublicPath', label: '', type: 'normal' } },
        { data: { id: 'e6', source: 'AddCandidate', target: 'BufferPublic', label: '', type: 'normal' } },
        { data: { id: 'e7', source: 'BufferPublic', target: 'Check8', label: '', type: 'normal' } },
        { data: { id: 'e8', source: 'StartMatch', target: 'ProcessBuffered', label: '', type: 'normal' } },
        { data: { id: 'e9', source: 'ProcessBuffered', target: 'StorePublic', label: '', type: 'normal' } },
        { data: { id: 'e10', source: 'MatchState', target: 'CheckUpdates', label: '', type: 'normal' } },
        { data: { id: 'e11', source: 'EmitWS', target: 'End', label: '', type: 'normal' } },
        
        // Decision paths - "No" (red)
        { data: { id: 'e12', source: 'PrivatePath', target: 'BufferPrivate', label: 'No', type: 'no' } },
        { data: { id: 'e13', source: 'PublicPath', target: 'ValidPlayer', label: 'No', type: 'no' } },
        { data: { id: 'e14', source: 'ValidPlayer', target: 'Skip', label: 'No', type: 'no' } },
        { data: { id: 'e15', source: 'Check8', target: 'Wait', label: 'No', type: 'no' } },
        { data: { id: 'e16', source: 'CheckUpdates', target: 'End', label: 'No', type: 'no' } },
        
        // Decision paths - "Yes" (green)
        { data: { id: 'e17', source: 'PrivatePath', target: 'StorePrivate', label: 'Yes', type: 'yes' } },
        { data: { id: 'e18', source: 'PublicPath', target: 'UpdatePublic', label: 'Yes', type: 'yes' } },
        { data: { id: 'e19', source: 'ValidPlayer', target: 'AddCandidate', label: 'Yes', type: 'yes' } },
        { data: { id: 'e20', source: 'Check8', target: 'StartMatch', label: 'Yes', type: 'yes' } },
        { data: { id: 'e21', source: 'CheckUpdates', target: 'EmitWS', label: 'Yes', type: 'yes' } },
        
        // Write operations (teal, dashed)
        { data: { id: 'e22', source: 'BufferPrivate', target: 'PrivateBuffer', label: 'Write', type: 'write' } },
        { data: { id: 'e23', source: 'BufferPublic', target: 'PublicBuffer', label: 'Write', type: 'write' } },
        { data: { id: 'e24', source: 'AddCandidate', target: 'Candidates', label: 'Write', type: 'write' } },
        { data: { id: 'e25', source: 'StorePrivate', target: 'MatchState', label: 'Write', type: 'write' } },
        { data: { id: 'e26', source: 'StorePublic', target: 'MatchState', label: 'Write', type: 'write' } },
        { data: { id: 'e27', source: 'UpdatePublic', target: 'MatchState', label: 'Write', type: 'write' } },
        
        // Async DB write (orange, dashed)
        { data: { id: 'e28', source: 'MatchState', target: 'DB', label: 'Async DB Write', type: 'async-db' } },
        
        // Read operations (purple, dashed)
        { data: { id: 'e29', source: 'Candidates', target: 'Check8', label: 'Read', type: 'read' } },
        { data: { id: 'e30', source: 'Candidates', target: 'StartMatch', label: 'Read', type: 'read' } },
        { data: { id: 'e31', source: 'PrivateBuffer', target: 'ProcessBuffered', label: 'Read', type: 'read' } },
        { data: { id: 'e32', source: 'PublicBuffer', target: 'ProcessBuffered', label: 'Read', type: 'read' } },
        { data: { id: 'e33', source: 'MatchState', target: 'CheckUpdates', label: 'Read', type: 'read' } },
        { data: { id: 'e34', source: 'MatchState', target: 'EmitWS', label: 'Read', type: 'read' } }
    ];
    
    return { nodes, edges };
}

// Generate Cytoscape stylesheet
function generateStylesheet() {
    const isDark = appState.theme === 'dark';
    const arrowThickness = appState.arrowThickness;
    
    const stylesheet = [
        // Node styles
        {
            selector: 'node[type = "entry"]',
            style: {
                'background-color': getColor('entry'),
                'border-color': getColor('entry-stroke'),
                'border-width': 3,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '14px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '150px',
                'height': '80px',
                'text-wrap': 'wrap',
                'text-max-width': '140px'
            }
        },
        {
            selector: 'node[type = "process"]',
            style: {
                'background-color': getColor('process'),
                'border-color': getColor('process-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '180px',
                'height': '60px',
                'text-wrap': 'wrap',
                'text-max-width': '170px'
            }
        },
        {
            selector: 'node[type = "decision"]',
            style: {
                'background-color': getColor('decision'),
                'border-color': getColor('decision-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'diamond',
                'width': '160px',
                'height': '100px',
                'text-wrap': 'wrap',
                'text-max-width': '150px'
            }
        },
        {
            selector: 'node[type = "add-buffer"]',
            style: {
                'background-color': getColor('buffer'),
                'border-color': getColor('buffer-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '12px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '200px',
                'height': '50px',
                'text-wrap': 'wrap',
                'text-max-width': '190px'
            }
        },
        {
            selector: 'node[type = "add-candidate"]',
            style: {
                'background-color': getColor('candidate'),
                'border-color': getColor('candidate-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '12px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '200px',
                'height': '50px',
                'text-wrap': 'wrap',
                'text-max-width': '190px'
            }
        },
        {
            selector: 'node[type = "store"]',
            style: {
                'background-color': getColor('storage'),
                'border-color': getColor('storage-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '12px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '180px',
                'height': '50px',
                'text-wrap': 'wrap',
                'text-max-width': '170px'
            }
        },
        {
            selector: 'node[type = "buffer"]',
            style: {
                'background-color': getColor('buffer'),
                'border-color': getColor('buffer-stroke'),
                'border-width': 3,
                'border-style': 'dashed',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'hexagon',
                'width': '180px',
                'height': '100px',
                'text-wrap': 'wrap',
                'text-max-width': '170px'
            }
        },
        {
            selector: 'node[type = "candidate"]',
            style: {
                'background-color': getColor('candidate'),
                'border-color': getColor('candidate-stroke'),
                'border-width': 3,
                'border-style': 'dotted',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'hexagon',
                'width': '160px',
                'height': '100px',
                'text-wrap': 'wrap',
                'text-max-width': '150px'
            }
        },
        {
            selector: 'node[type = "storage"]',
            style: {
                'background-color': getColor('storage'),
                'border-color': getColor('storage-stroke'),
                'border-width': 4,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '14px',
                'font-weight': 'bold',
                'shape': 'hexagon',
                'width': '200px',
                'height': '120px',
                'text-wrap': 'wrap',
                'text-max-width': '190px'
            }
        },
        {
            selector: 'node[type = "database"]',
            style: {
                'background-color': getColor('database'),
                'border-color': getColor('database-stroke'),
                'border-width': 4,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '14px',
                'font-weight': 'bold',
                'shape': 'hexagon',
                'width': '160px',
                'height': '120px',
                'text-wrap': 'wrap',
                'text-max-width': '150px'
            }
        },
        {
            selector: 'node[type = "delivery"]',
            style: {
                'background-color': getColor('delivery'),
                'border-color': getColor('delivery-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '160px',
                'height': '60px',
                'text-wrap': 'wrap',
                'text-max-width': '150px'
            }
        },
        {
            selector: 'node[type = "end-state"]',
            style: {
                'background-color': getColor('end-state'),
                'border-color': getColor('end-state-stroke'),
                'border-width': 2,
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '13px',
                'font-weight': 'bold',
                'shape': 'round-rectangle',
                'width': '180px',
                'height': '60px',
                'text-wrap': 'wrap',
                'text-max-width': '170px'
            }
        },
        
        // Edge styles
        {
            selector: 'edge[type = "normal"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('normal'),
                'target-arrow-color': getEdgeColor('normal'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('normal'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: 'edge[type = "yes"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('yes'),
                'target-arrow-color': getEdgeColor('yes'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('yes'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: 'edge[type = "no"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('no'),
                'target-arrow-color': getEdgeColor('no'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('no'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: 'edge[type = "write"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('write'),
                'target-arrow-color': getEdgeColor('write'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'line-style': 'dashed',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('write'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: 'edge[type = "read"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('read'),
                'target-arrow-color': getEdgeColor('read'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'line-style': 'dashed',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('read'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: 'edge[type = "async-db"]',
            style: {
                'width': arrowThickness,
                'line-color': getEdgeColor('async-db'),
                'target-arrow-color': getEdgeColor('async-db'),
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'line-style': 'dashed',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '12px',
                'color': getEdgeColor('async-db'),
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        
        // Default edge style (fallback for edges without type)
        {
            selector: 'edge',
            style: {
                'width': arrowThickness,
                'target-arrow-shape': appState.arrowShape,
                'target-arrow-size': appState.arrowScale * 3,
                'curve-style': 'bezier'
            }
        }
    ];
    
    console.log('Generated stylesheet with', stylesheet.length, 'rules');
    console.log('First node style:', stylesheet.find(s => s.selector.includes('node[type = "entry"]')));
    
    return stylesheet;
}

// Initialize Cytoscape
function initCytoscape() {
    const container = document.getElementById('cytoscape-container');
    if (!container) {
        console.error('Cytoscape container not found');
        return;
    }
    
    // Destroy existing instance if any
    if (cy) {
        cy.destroy();
        cy = null;
    }
    
    // Show loading spinner
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('hidden');
    }
    
    const elements = generateGSIProcessorElements();
    const stylesheet = generateStylesheet();
    
        console.log('Initializing Cytoscape with', elements.nodes.length, 'nodes and', elements.edges.length, 'edges');
        console.log('Container found:', container);
        console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
    
    // Ensure container has dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Container has zero dimensions, setting explicit size');
        container.style.width = '100%';
        container.style.height = '800px';
    }
    
    try {
        cy = cytoscape({
            container: container,
            elements: [...elements.nodes, ...elements.edges],
            style: stylesheet,
            layout: {
                name: 'dagre',
                rankDir: appState.orientation,
                nodeSep: appState.nodeSpacing,
                rankSep: appState.rankSpacing,
                edgeSep: 20,
                animate: false, // Disable animation initially for faster rendering
                fit: true,
                padding: 50
            },
            minZoom: 0.1,
            maxZoom: 3,
            userPanningEnabled: true,
            userZoomingEnabled: true,
            boxSelectionEnabled: false,
            headless: false, // Ensure it's not headless
            wheelSensitivity: 1,
            pixelRatio: 1 // Force pixel ratio to 1 for consistent rendering
        });
        
        // Verify stylesheet was applied
        console.log('Stylesheet length:', stylesheet.length);
        console.log('Applied stylesheet:', cy.style());
        
        // Check if nodes have styles
        const testNode = cy.nodes().first();
        if (testNode.length > 0) {
            console.log('Test node style:', testNode.style());
            console.log('Test node data:', testNode.data());
        }
        
        console.log('Cytoscape instance created');
        console.log('Renderer:', cy.renderer());
        console.log('Container element:', cy.container());
        
        // Check if canvas exists
        setTimeout(() => {
            const canvas = container.querySelector('canvas');
            console.log('Canvas found:', canvas);
            if (canvas) {
                console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
                console.log('Canvas style:', canvas.style.cssText);
            }
        }, 100);
        
        // Wait for Cytoscape to be ready
        cy.ready(() => {
            console.log('Cytoscape ready, running layout...');
            console.log('Initial extent:', cy.extent());
            
            // Run layout after ready
            const layout = cy.layout({
                name: 'dagre',
                rankDir: appState.orientation,
                nodeSep: appState.nodeSpacing,
                rankSep: appState.rankSpacing,
                edgeSep: 20,
                animate: true,
                animationDuration: 500,
                fit: true,
                padding: 50
            });
            
            layout.one('layoutstop', () => {
                console.log('Layout complete');
                console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
                console.log('Cytoscape dimensions:', cy.width(), 'x', cy.height());
                console.log('Node count:', cy.nodes().length);
                console.log('Edge count:', cy.edges().length);
                
                // Check node positions
                const firstNode = cy.nodes().first();
                if (firstNode.length > 0) {
                    const pos = firstNode.position();
                    console.log('First node position:', pos);
                    console.log('First node rendered position:', firstNode.renderedPosition());
                }
                
                // Ensure container is visible
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                
                // Force resize first
                cy.resize();
                
                // Fit to viewport with padding
                cy.fit(undefined, 50);
                
                // Center the view
                cy.center();
                
                // Force another resize after fit
                setTimeout(() => {
                    cy.resize();
                    cy.fit(undefined, 50);
                    
                    console.log('After fit - zoom:', cy.zoom(), 'pan:', cy.pan());
                    console.log('Extent:', cy.extent());
                    console.log('Viewport:', cy.extent());
                    
                    // Check if nodes are visible
                    const nodesInView = cy.nodes().filter(node => {
                        const pos = node.position();
                        const extent = cy.extent();
                        return pos.x >= extent.x1 && pos.x <= extent.x2 && 
                               pos.y >= extent.y1 && pos.y <= extent.y2;
                    });
                    console.log('Nodes in viewport:', nodesInView.length, 'of', cy.nodes().length);
                    
                                // Check edge colors are applied correctly
                    cy.edges().forEach(edge => {
                        const style = edge.style();
                        const data = edge.data();
                        console.log('Edge:', edge.id(), 
                            'type:', data.type,
                            'line-color:', style['line-color'],
                            'target-arrow-color:', style['target-arrow-color'],
                            'expected-color:', getEdgeColor(data.type));
                    });
                    
                    // Force a redraw
                    cy.resize();
                    cy.trigger('resize');
                    
                    // Check canvas context
                    const canvas = container.querySelector('canvas');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        console.log('Canvas context:', ctx);
                        // Try to draw a test rectangle
                        ctx.fillStyle = 'red';
                        ctx.fillRect(10, 10, 50, 50);
                        console.log('Test rectangle drawn');
                    }
                    
                    updateZoomIndicator();
                    
                    // Hide loading spinner
                    if (spinner) {
                        spinner.classList.add('hidden');
                    }
                }, 100);
            });
            
            layout.run();
        });
        
        // Add event listeners
        cy.on('zoom', updateZoomIndicator);
        cy.on('pan', updateZoomIndicator);
        
        // Node click handler
        cy.on('tap', 'node', function(evt) {
            const node = evt.target;
            showDetailsPanel(node.data());
        });
        
        // Close panel when clicking background
        cy.on('tap', function(evt) {
            if (evt.target === cy) {
                closeDetailsPanel();
            }
        });
        
    } catch (error) {
        console.error('Error creating Cytoscape instance:', error);
        if (spinner) {
            spinner.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
        }
    }
}

// Update zoom indicator
function updateZoomIndicator() {
    if (!cy) return;
    const zoom = cy.zoom();
    const zoomPercent = Math.round(zoom * 100);
    const indicator = document.getElementById('zoomIndicator');
    if (indicator) {
        indicator.textContent = `${zoomPercent}%`;
    }
}

// Update layout
function updateLayout() {
    if (!cy) return;
    
    const layout = cy.layout({
        name: 'dagre',
        rankDir: appState.orientation,
        nodeSep: appState.nodeSpacing,
        rankSep: appState.rankSpacing,
        edgeSep: 20,
        animate: true,
        animationDuration: 500,
        animationEasing: 'ease-out'
    });
    
    layout.one('layoutstop', () => {
        cy.fit(undefined, 50);
    });
    
    layout.run();
}

// Update edge styles (for arrow thickness, shape, and colors)
function updateEdgeStyles() {
    if (!cy) return;
    
    const stylesheet = generateStylesheet();
    cy.style(stylesheet);
    cy.resize(); // Force redraw
}

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('dataflow-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    appState.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme();
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('dataflow-theme', appState.theme);
    applyTheme();
    // Re-render diagram with new theme
    if (cy) {
        updateEdgeStyles();
        initCytoscape();
    }
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', appState.theme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = appState.theme === 'dark' ? '☀️' : '🌙';
    }
}

// Controls initialization
function initControls() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (cy) {
                cy.zoom(cy.zoom() * 1.2);
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (cy) {
                cy.zoom(cy.zoom() * 0.8);
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (cy) {
                cy.fit(undefined, 50);
                cy.center();
            }
        });
    }
    
    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Export image
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDiagram);
    }
    
    // Spacing controls
    const nodeSpacingInput = document.getElementById('nodeSpacing');
    const rankSpacingInput = document.getElementById('rankSpacing');
    const arrowThicknessInput = document.getElementById('arrowThickness');
    const arrowShapeSelect = document.getElementById('arrowShape');
    const arrowScaleInput = document.getElementById('arrowScale');
    const orientationSelect = document.getElementById('orientation');
    const applyBtn = document.getElementById('applySpacingBtn');
    
    // Load saved values
    const savedNodeSpacing = localStorage.getItem('cytoscape-nodeSpacing');
    const savedRankSpacing = localStorage.getItem('cytoscape-rankSpacing');
    const savedArrowThickness = localStorage.getItem('cytoscape-arrowThickness');
    const savedArrowShape = localStorage.getItem('cytoscape-arrowShape');
    const savedArrowScale = localStorage.getItem('cytoscape-arrowScale');
    const savedOrientation = localStorage.getItem('cytoscape-orientation');
    
    if (savedNodeSpacing) {
        appState.nodeSpacing = parseInt(savedNodeSpacing);
        if (nodeSpacingInput) nodeSpacingInput.value = savedNodeSpacing;
    }
    if (savedRankSpacing) {
        appState.rankSpacing = parseInt(savedRankSpacing);
        if (rankSpacingInput) rankSpacingInput.value = savedRankSpacing;
    }
    if (savedArrowThickness) {
        appState.arrowThickness = parseFloat(savedArrowThickness);
        if (arrowThicknessInput) arrowThicknessInput.value = savedArrowThickness;
    }
    if (savedArrowShape) {
        appState.arrowShape = savedArrowShape;
        if (arrowShapeSelect) arrowShapeSelect.value = savedArrowShape;
    }
    if (savedArrowScale) {
        appState.arrowScale = parseFloat(savedArrowScale);
        if (arrowScaleInput) arrowScaleInput.value = savedArrowScale;
    }
    if (savedOrientation) {
        appState.orientation = savedOrientation;
        if (orientationSelect) orientationSelect.value = savedOrientation;
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (nodeSpacingInput) {
                appState.nodeSpacing = parseInt(nodeSpacingInput.value) || 120;
                localStorage.setItem('cytoscape-nodeSpacing', appState.nodeSpacing.toString());
            }
            if (rankSpacingInput) {
                appState.rankSpacing = parseInt(rankSpacingInput.value) || 200;
                localStorage.setItem('cytoscape-rankSpacing', appState.rankSpacing.toString());
            }
            if (arrowThicknessInput) {
                appState.arrowThickness = parseFloat(arrowThicknessInput.value) || 4;
                localStorage.setItem('cytoscape-arrowThickness', appState.arrowThickness.toString());
            }
            if (arrowShapeSelect) {
                appState.arrowShape = arrowShapeSelect.value;
                localStorage.setItem('cytoscape-arrowShape', appState.arrowShape);
            }
            if (arrowScaleInput) {
                appState.arrowScale = parseFloat(arrowScaleInput.value) || 1;
                localStorage.setItem('cytoscape-arrowScale', appState.arrowScale.toString());
            }
            if (orientationSelect) {
                appState.orientation = orientationSelect.value;
                localStorage.setItem('cytoscape-orientation', appState.orientation);
            }
            
            updateEdgeStyles();
            updateLayout();
        });
    }
    
    // Details panel
    const closePanelBtn = document.getElementById('closePanel');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', closeDetailsPanel);
    }
}

// Details panel functions
function showDetailsPanel(nodeData) {
    const panel = document.getElementById('detailsPanel');
    const content = document.getElementById('panelContent');
    
    if (!panel || !content) return;
    
    content.innerHTML = `
        <h3>${nodeData.label || nodeData.id}</h3>
        <div class="info-box">
            <p><strong>Type:</strong> ${nodeData.type || 'N/A'}</p>
            <p><strong>ID:</strong> ${nodeData.id}</p>
        </div>
    `;
    
    panel.classList.add('open');
}

function closeDetailsPanel() {
    const panel = document.getElementById('detailsPanel');
    if (panel) {
        panel.classList.remove('open');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initControls();
    
    // Wait for Cytoscape and extensions to be available
    const checkLibraries = setInterval(() => {
        if (typeof cytoscape !== 'undefined' && typeof dagre !== 'undefined') {
            clearInterval(checkLibraries);
            try {
                initCytoscape();
            } catch (error) {
                console.error('Error initializing Cytoscape:', error);
                const spinner = document.getElementById('loadingSpinner');
                if (spinner) {
                    spinner.innerHTML = '<p style="color: red;">Error initializing diagram: ' + error.message + '</p>';
                }
            }
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkLibraries);
        if (!cy) {
            console.error('Cytoscape.js or dagre not loaded');
            const spinner = document.getElementById('loadingSpinner');
            if (spinner) {
                spinner.innerHTML = '<p style="color: red;">Error: Cytoscape.js or dagre extension not loaded. Please check the console for details.</p>';
            }
        }
    }, 5000);
});

// Handle window resize
window.addEventListener('resize', () => {
    if (cy) {
        cy.resize();
        cy.fit(undefined, 50);
    }
});

// Fullscreen functionality
function toggleFullscreen() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Listen for fullscreen changes to update button text
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                           document.mozFullScreenElement || document.msFullscreenElement);
    
    fullscreenBtn.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    
    // Resize Cytoscape after fullscreen change
    if (cy) {
        setTimeout(() => {
            cy.resize();
            cy.fit(undefined, 50);
        }, 100);
    }
}

// Export diagram as high-quality image
function exportDiagram() {
    if (!cy) {
        alert('Diagram not loaded yet');
        return;
    }
    
    // Get current zoom to restore after export
    const currentZoom = cy.zoom();
    const currentPan = cy.pan();
    
    // Fit to viewport to ensure everything is visible
    cy.fit(undefined, 50);
    
    // Wait a bit for the fit to complete
    setTimeout(() => {
        // Export at high resolution (2x scale for better quality)
        const scale = 2; // Higher scale = better quality but larger file
        const options = {
            output: 'blob',
            bg: appState.theme === 'dark' ? '#1a202c' : '#ffffff',
            full: true, // Export entire graph, not just viewport
            scale: scale,
            maxWidth: 5000,
            maxHeight: 5000
        };
        
        try {
            // Use Cytoscape's png export
            const pngBlob = cy.png(options);
            
            // Restore zoom and pan
            cy.zoom(currentZoom);
            cy.pan(currentPan);
            
            // Create download link
            const url = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gsi-processor-diagram-${new Date().toISOString().slice(0, 10)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Error exporting diagram:', error);
            alert('Error exporting diagram. Please try again.');
            // Restore zoom and pan even on error
            cy.zoom(currentZoom);
            cy.pan(currentPan);
        }
    }, 100);
}

