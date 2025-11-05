// State management
const appState = {
    currentView: 'overview',
    theme: 'light',
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    nodeSpacing: 120,
    rankSpacing: 200,
    arrowThickness: 4,
    orientation: 'horizontal' // 'horizontal' or 'vertical'
};

// Component data with detailed information
const componentData = {
    'game-client': {
        title: 'Underlords Game Client',
        type: 'entry',
        details: {
            description: 'The Dota Underlords game client sends Game State Integration (GSI) data to the backend server.',
            config: {
                endpoint: 'http://127.0.0.1:3000/upload',
                frequency: '10 times per second',
                timeout: '0.1 seconds',
                buffer: '0.1 seconds',
                throttle: '0.1 seconds'
            },
            dataTypes: [
                'public_player_state - All players\' visible game state',
                'private_player_state - Client owner\'s private data (shop, rewards, etc.)'
            ],
            file: 'backend/config.py (matches game client config)'
        }
    }
};

// Theme management
function initTheme() {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('dataflow-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    appState.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    applyTheme();
    updateMermaidTheme();
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('dataflow-theme', appState.theme);
    applyTheme();
    updateMermaidTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', appState.theme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = appState.theme === 'dark' ? '☀️' : '🌙';
    }
}

function updateMermaidTheme() {
    if (window.mermaid) {
        const theme = appState.theme === 'dark' ? 'dark' : 'default';
        // Preserve current spacing settings
        const nodeSpacing = window.mermaidNodeSpacing || appState.nodeSpacing || 120;
        const rankSpacing = window.mermaidRankSpacing || appState.rankSpacing || 200;
        
        window.mermaid.initialize({ 
            startOnLoad: false,
            theme: theme,
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
                nodeSpacing: nodeSpacing,
                rankSpacing: rankSpacing
            }
        });
        
        // Re-render diagram with new theme
        renderDiagram();
    }
}

// View management
function initView() {
    const savedView = localStorage.getItem('dataflow-view') || 'overview';
    const savedOrientation = localStorage.getItem('mermaid-orientation') || 'horizontal';
    appState.orientation = savedOrientation;
    switchView(savedView);
}

function switchView(viewName) {
    appState.currentView = viewName;
    localStorage.setItem('dataflow-view', viewName);
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Show loading spinner
    const spinner = document.getElementById('loadingSpinner');
    const diagram = document.getElementById('dataflow-diagram');
    if (spinner) spinner.style.display = 'block';
    if (diagram) diagram.style.opacity = '0';
    
    // Render diagram after a brief delay for animation
    setTimeout(() => {
        renderDiagram();
    }, 100);
}

// Zoom and Pan functionality
function initZoomPan() {
    const wrapper = document.getElementById('canvasWrapper');
    const container = document.getElementById('mermaidContainer');
    
    if (!wrapper || !container) return;
    
    // Reset zoom/pan
    document.getElementById('resetBtn').addEventListener('click', () => {
        appState.zoom = 1;
        appState.panX = 0;
        appState.panY = 0;
        updateTransform();
    });
    
    // Zoom buttons
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        appState.zoom = Math.min(appState.zoom + 0.1, 20); // Increased max zoom to 20x
        updateTransform();
        updateZoomIndicator();
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        appState.zoom = Math.max(appState.zoom - 0.1, 0.1); // Reduced min zoom to 0.1x
        updateTransform();
        updateZoomIndicator();
    });
    
    // Mouse wheel zoom
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const oldZoom = appState.zoom;
        appState.zoom = Math.max(0.1, Math.min(20, appState.zoom + delta)); // Increased max to 20x, min to 0.1x
        
        // Zoom towards mouse position
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleChange = appState.zoom - oldZoom;
        appState.panX -= (mouseX - appState.panX) * scaleChange / oldZoom;
        appState.panY -= (mouseY - appState.panY) * scaleChange / oldZoom;
        
        updateTransform();
        updateZoomIndicator();
    }, { passive: false });
    
    // Drag to pan
    wrapper.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            appState.isDragging = true;
            appState.dragStart = { x: e.clientX - appState.panX, y: e.clientY - appState.panY };
            wrapper.classList.add('dragging');
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (appState.isDragging) {
            appState.panX = e.clientX - appState.dragStart.x;
            appState.panY = e.clientY - appState.dragStart.y;
            updateTransform();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (appState.isDragging) {
            appState.isDragging = false;
            wrapper.classList.remove('dragging');
        }
    });
    
    // Double-click to reset
    wrapper.addEventListener('dblclick', () => {
        appState.zoom = 1;
        appState.panX = 0;
        appState.panY = 0;
        updateTransform();
        updateZoomIndicator();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case '+':
            case '=':
                e.preventDefault();
                appState.zoom = Math.min(appState.zoom + 0.1, 20);
                updateTransform();
                updateZoomIndicator();
                break;
            case '-':
            case '_':
                e.preventDefault();
                appState.zoom = Math.max(appState.zoom - 0.1, 0.1);
                updateTransform();
                updateZoomIndicator();
                break;
            case '0':
                e.preventDefault();
                appState.zoom = 1;
                appState.panX = 0;
                appState.panY = 0;
                updateTransform();
                updateZoomIndicator();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                appState.panX += 50;
                updateTransform();
                break;
            case 'ArrowRight':
                e.preventDefault();
                appState.panX -= 50;
                updateTransform();
                break;
            case 'ArrowUp':
                e.preventDefault();
                appState.panY += 50;
                updateTransform();
                break;
            case 'ArrowDown':
                e.preventDefault();
                appState.panY -= 50;
                updateTransform();
                break;
        }
    });
}

function updateTransform() {
    const container = document.getElementById('mermaidContainer');
    if (container) {
        container.style.transform = `translate(${appState.panX}px, ${appState.panY}px) scale(${appState.zoom})`;
    }
}

function updateZoomIndicator() {
    const indicator = document.getElementById('zoomIndicator');
    if (indicator) {
        indicator.textContent = Math.round(appState.zoom * 100) + '%';
    }
}

// Get diagram orientation direction
function getOrientation() {
    return appState.orientation === 'vertical' ? 'TD' : 'LR';
}

// Diagram generation functions
function generateOverviewDiagram() {
    return `
flowchart ${getOrientation()}
    GameClient["Underlords Game Client<br/>HTTP POST 10x/sec"]
    RouteHandler["Flask Route Handler<br/>/upload endpoint<br/><small>routes.py::receive_gsi_data()</small>"]
    StartBgTask["Start Background Task<br/>socketio.start_background_task()<br/><small>routes.py</small>"]
    ProcessGSI["process_gsi_data()<br/>Process blocks/data, check sequences,<br/>buffer or process states<br/><small>gsi_processor.py</small>"]
    
    UpdateMemory[("Update In-Memory State<br/>match_state object<br/><small>game_logic.py::process_and_store_*</small>")]
    QueueDB["Queue DB Write<br/>db_write_queue.put()<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    DBWriter["DB Writer Thread<br/>Background worker<br/><small>gsi_processor.py::db_writer_worker()</small>"]
    SQLiteDB[("SQLite Database<br/>underlords_gsi_v3.db<br/><small>database.py::UnderlordsDatabaseManager</small>")]
    
    EmitUpdate["Emit WebSocket Update<br/>emit_realtime_update()<br/><small>game_logic.py</small>"]
    WebSocket["WebSocket<br/>Broadcast to clients<br/><small>websocket.py</small>"]
    Frontend["Frontend Client<br/>React App"]
    
    GameClient --> RouteHandler
    RouteHandler --> StartBgTask
    StartBgTask --> ProcessGSI
    ProcessGSI --> UpdateMemory
    ProcessGSI --> QueueDB
    ProcessGSI --> EmitUpdate
    
    UpdateMemory --> QueueDB
    QueueDB --> DBWriter
    DBWriter --> SQLiteDB
    
    EmitUpdate --> WebSocket
    WebSocket --> Frontend
    
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:3px,color:#fff
    classDef httpStyle fill:${getColor('http')},stroke:${getColor('http-stroke')},stroke-width:2px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef storageStyle fill:${getColor('storage')},stroke:${getColor('storage-stroke')},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${getColor('buffer')},stroke:${getColor('buffer-stroke')},stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    
    class GameClient entryStyle
    class RouteHandler,StartBgTask httpStyle
    class ProcessGSI,EmitUpdate processStyle
    class UpdateMemory,QueueDB bufferStyle
    class DBWriter processStyle
    class SQLiteDB storageStyle
    class WebSocket,Frontend deliveryStyle
`;
}

function generateDetailedDiagram() {
    return `
flowchart ${getOrientation()}
    %% Entry Point
    GameClient["Underlords Game Client<br/>HTTP POST 10x/sec"]
    RouteHandler["Flask Route Handler<br/>/upload endpoint<br/><small>routes.py::receive_gsi_data()</small>"]
    BackgroundTask["Background Task<br/>socketio.start_background_task()<br/><small>routes.py</small>"]
    GSIProcessor["process_gsi_data()<br/>Main loop with data_lock<br/><small>gsi_processor.py</small>"]
    
    %% Data Extraction Loop
    ExtractBlocks["Loop through<br/>gsi_payload['block']<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ExtractData["Loop through<br/>block['data']<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    HasPlayerState{"Has private/public<br/>player_state?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    
    %% Private State Path (can run parallel with public)
    CheckPrivateSeq["Check Private Sequence<br/>Skip if duplicate<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ActiveMatchPrivate{"Active Match?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    BufferPrivate[("Buffer Private State<br/>private_player_buffer<br/><small>match_state.py</small>")]
    ProcessPrivateState["process_and_store_gsi<br/>_private_player_state()<br/><small>game_logic.py</small>"]
    
    %% Public State Path (can run parallel with private)
    GetAccountID["get_account_id()<br/>Normalize bots to negative int<br/><small>utils.py</small>"]
    CheckPublicSeq["Check Public Sequence<br/>Skip if duplicate<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ActiveMatchPublic{"Active Match?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    
    %% No Match Path - Collection Phase
    CleanupCheck{"Every 10th update?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    CleanupBuffers["cleanup_buffers()<br/>Remove stale entries<br/><small>match_manager.py</small>"]
    ValidatePlayer["is_valid_new_player()<br/>health=100, level=1, etc<br/><small>utils.py</small>"]
    AddCandidate[("Add to candidates<br/>candidates dict<br/><small>match_state.py</small>")]
    BufferPublic[("Buffer Public State<br/>public_player_buffer<br/><small>match_state.py</small>")]
    Has8Candidates{"8 Candidates?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    StartMatch["start_new_match()<br/>Generate match_id, create DB record<br/><small>match_manager.py</small>"]
    ProcessBuffered["process_buffered_data()<br/>Process BOTH buffers<br/><small>match_manager.py</small>"]
    
    %% Active Match Path
    CheckAbandonment["Check Abandonment<br/>Health reset OR slot change?<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    AbandonMatch["abandon_match()<br/>Set match end, reset state<br/><small>match_manager.py</small>"]
    UpdateSequence["Update Sequence<br/>Track sequence_num<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ProcessPublicState["process_and_store_gsi<br/>_public_player_state()<br/><small>game_logic.py</small>"]
    UpdateRound["update_round_from<br/>_combat_type()<br/><small>game_logic.py</small>"]
    
    %% Memory & Database
    UpdateMemory[("Update In-Memory State<br/>match_state.latest_*<br/><small>game_logic.py::process_and_store_*</small>")]
    QueueDBWrite["Queue DB Write<br/>insert_snapshot task<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    DBWorker["DB Writer Thread<br/>Polls queue continuously<br/><small>gsi_processor.py::db_writer_worker()</small>"]
    SQLiteDB[("SQLite Database<br/>Commit after each task<br/><small>database.py::UnderlordsDatabaseManager</small>")]
    
    %% Match End Detection
    CheckFinalPlace["Check final_place > 0<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    HasFinalPlace{"Player eliminated?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    CheckMatchEnd["check_match_end()<br/>2nd place detected?<br/><small>match_manager.py</small>"]
    MarkWinner["Assign winner<br/>remaining player = 1st<br/><small>match_manager.py::check_match_end()</small>"]
    MatchEndTransaction["Queue match_end_transaction<br/>Update final_place, match end time<br/><small>match_manager.py::check_match_end()</small>"]
    EmitFinal["emit_realtime_update()<br/>Final state<br/><small>game_logic.py</small>"]
    EmitMatchEnded["socketio.emit('match_ended')<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ResetState["match_state.reset()<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    %% Real-time Delivery
    AnyUpdates{"any_updates?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    EmitUpdate["emit_realtime_update()<br/><small>game_logic.py</small>"]
    WebSocket["WebSocket<br/>Broadcast to all clients<br/><small>websocket.py</small>"]
    Frontend["Frontend Client"]
    
    %% Main Flow
    GameClient --> RouteHandler
    RouteHandler --> BackgroundTask
    BackgroundTask --> GSIProcessor
    GSIProcessor --> ExtractBlocks
    ExtractBlocks --> ExtractData
    ExtractData --> HasPlayerState
    HasPlayerState -->|No| ExtractData
    
    %% Private State Branch
    HasPlayerState -->|Has private| CheckPrivateSeq
    CheckPrivateSeq -->|New| ActiveMatchPrivate
    CheckPrivateSeq -->|Duplicate| HasPlayerState
    ActiveMatchPrivate -->|No| BufferPrivate
    ActiveMatchPrivate -->|Yes| ProcessPrivateState
    BufferPrivate --> HasPlayerState
    ProcessPrivateState --> UpdateMemory
    
    %% Public State Branch (parallel to private)
    HasPlayerState -->|Has public| GetAccountID
    GetAccountID --> CheckPublicSeq
    CheckPublicSeq -->|New| ActiveMatchPublic
    CheckPublicSeq -->|Duplicate| AnyUpdates
    
    %% No Match Path
    ActiveMatchPublic -->|No| CleanupCheck
    CleanupCheck -->|Yes| CleanupBuffers
    CleanupCheck -->|No| ValidatePlayer
    CleanupBuffers --> ValidatePlayer
    ValidatePlayer -->|Valid| AddCandidate
    ValidatePlayer -->|Invalid| AnyUpdates
    AddCandidate --> BufferPublic
    BufferPublic --> Has8Candidates
    Has8Candidates -->|No| AnyUpdates
    Has8Candidates -->|Yes 8/8| StartMatch
    StartMatch --> ProcessBuffered
    ProcessBuffered --> EmitUpdate
    
    %% Active Match Path
    ActiveMatchPublic -->|Yes| CheckAbandonment
    CheckAbandonment -->|Abandoned| AbandonMatch
    CheckAbandonment -->|Continue| UpdateSequence
    AbandonMatch --> AnyUpdates
    UpdateSequence --> ProcessPublicState
    ProcessPublicState --> UpdateRound
    UpdateRound --> UpdateMemory
    UpdateMemory --> QueueDBWrite
    
    %% Match End Flow
    ProcessPublicState --> CheckFinalPlace
    CheckFinalPlace --> HasFinalPlace
    HasFinalPlace -->|No| AnyUpdates
    HasFinalPlace -->|Yes| CheckMatchEnd
    CheckMatchEnd -->|2nd place: Mark Winner| MarkWinner
    CheckMatchEnd -->|Not ended| AnyUpdates
    MarkWinner --> MatchEndTransaction
    MatchEndTransaction --> EmitFinal
    EmitFinal --> EmitMatchEnded
    EmitMatchEnded --> ResetState
    ResetState --> AnyUpdates
    
    %% Database Worker
    QueueDBWrite --> DBWorker
    DBWorker --> SQLiteDB
    
    %% Real-time Updates
    AnyUpdates -->|Yes| EmitUpdate
    AnyUpdates -->|No| ExtractData
    EmitUpdate --> WebSocket
    WebSocket --> Frontend
    
    %% Styling
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:3px,color:#fff
    classDef httpStyle fill:${getColor('http')},stroke:${getColor('http-stroke')},stroke-width:2px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef storageStyle fill:${getColor('storage')},stroke:${getColor('storage-stroke')},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${getColor('buffer')},stroke:${getColor('buffer-stroke')},stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    classDef lifecycleStyle fill:${getColor('lifecycle')},stroke:${getColor('lifecycle-stroke')},stroke-width:2px,color:#fff
    
    class GameClient entryStyle
    class RouteHandler,BackgroundTask httpStyle
    class GSIProcessor,ExtractBlocks,ExtractData,GetAccountID,CheckPrivateSeq,CheckPublicSeq,ValidatePlayer,UpdateSequence,ProcessPublicState,ProcessPrivateState,UpdateRound,QueueDBWrite,DBWorker,CheckFinalPlace,CheckMatchEnd,CleanupBuffers,MarkWinner,EmitFinal,EmitMatchEnded processStyle
    class HasPlayerState,ActiveMatchPrivate,ActiveMatchPublic,Has8Candidates,HasFinalPlace,AnyUpdates,CleanupCheck,CheckAbandonment decisionStyle
    class SQLiteDB storageStyle
    class EmitUpdate,WebSocket,Frontend deliveryStyle
    class BufferPrivate,BufferPublic,AddCandidate,UpdateMemory bufferStyle
    class StartMatch,AbandonMatch,ProcessBuffered,MatchEndTransaction,ResetState lifecycleStyle
`;
}

function generateNoMatchDiagram() {
    return `
flowchart ${getOrientation()}
    GameClient["Underlords Game Client<br/>HTTP POST to /upload"]
    ProcessGSI["process_gsi_data()<br/>Process GSI payload, check sequences<br/><small>gsi_processor.py</small>"]
    
    GetAccountID["get_account_id()<br/>Normalize to int<br/><small>utils.py</small>"]
    ActiveMatch{"Active Match?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    
    CleanupCheck{"Every 10th update?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    CleanupBuffers["cleanup_buffers()<br/>Remove stale entries<br/><small>match_manager.py</small>"]
    
    ValidatePlayer["is_valid_new_player()<br/>Health=100, level=1,<br/>wins=0, losses=0, xp=0<br/><small>utils.py</small>"]
    NotInCandidates{"Not already<br/>in candidates?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    AddCandidate[("Add to Candidates<br/>candidates[account_id]<br/><small>match_state.py</small>")]
    BufferPublic[("Buffer Public State<br/>public_player_buffer<br/><small>match_state.py</small>")]
    
    Has8Candidates{"8 Candidates<br/>collected?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    StartMatch["start_new_match()<br/>Generate match_id<br/>Create DB record<br/><small>match_manager.py</small>"]
    ProcessBuffered["process_buffered_data()<br/>Process BOTH buffers:<br/>private_player_buffer<br/>public_player_buffer<br/><small>match_manager.py</small>"]
    ClearBuffers["Clear both buffers<br/><small>match_manager.py::process_buffered_data()</small>"]
    ClearCandidates["Clear candidates dict<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    EmitUpdate["emit_realtime_update()<br/>Send initial state<br/><small>game_logic.py</small>"]
    Frontend["Frontend Client<br/>Display match start"]
    
    GameClient --> ProcessGSI
    ProcessGSI --> GetAccountID
    GetAccountID --> ActiveMatch
    
    ActiveMatch -->|NO| CleanupCheck
    CleanupCheck -->|Yes every 10th| CleanupBuffers
    CleanupCheck -->|No| ValidatePlayer
    CleanupBuffers --> ValidatePlayer
    
    ValidatePlayer -->|Valid| NotInCandidates
    ValidatePlayer -->|Invalid| ProcessGSI
    NotInCandidates -->|Yes add| AddCandidate
    NotInCandidates -->|Already exists| BufferPublic
    AddCandidate --> BufferPublic
    BufferPublic --> Has8Candidates
    
    Has8Candidates -->|NO| ProcessGSI
    Has8Candidates -->|YES 8/8| StartMatch
    StartMatch --> ProcessBuffered
    ProcessBuffered --> ClearBuffers
    ClearBuffers --> ClearCandidates
    ClearCandidates --> EmitUpdate
    EmitUpdate --> Frontend
    
    ActiveMatch -->|YES| ProcessGSI
    
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:2px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${getColor('buffer')},stroke:${getColor('buffer-stroke')},stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    classDef lifecycleStyle fill:${getColor('lifecycle')},stroke:${getColor('lifecycle-stroke')},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    
    class GameClient entryStyle
    class ProcessGSI,GetAccountID,ValidatePlayer,CleanupBuffers processStyle
    class ActiveMatch,Has8Candidates,CleanupCheck,NotInCandidates decisionStyle
    class AddCandidate,BufferPublic bufferStyle
    class StartMatch,ProcessBuffered,ClearBuffers,ClearCandidates lifecycleStyle
    class EmitUpdate,Frontend deliveryStyle
`;
}

function generateActiveMatchDiagram() {
    return `
flowchart ${getOrientation()}
    GameClient["Underlords Game Client<br/>HTTP POST to /upload"]
    ReceiveGSI["Receive GSI Data<br/>Active match exists<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    GetAccountID["get_account_id()<br/>Normalize to int<br/><small>utils.py</small>"]
    CheckPublicSeq["Check Public Sequence<br/>Skip if duplicate<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ActiveMatch{"Active Match?<br/>match_id exists?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    
    CheckAbandonment["Check Abandonment<br/>Client owner only<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    HealthReset{"Health reset<br/>to 100?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    SlotChange{"Slot changed?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    AbandonMatch["abandon_match()<br/>Update match end time<br/>Reset match_state<br/><small>match_manager.py</small>"]
    
    UpdateSequence["Update sequence_num<br/>sequences[account_id]<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ProcessPublicState["process_and_store_gsi<br/>_public_player_state()<br/><small>game_logic.py</small>"]
    UpdateRound["update_round_from<br/>_combat_type()<br/>Track prep/combat transitions<br/><small>game_logic.py</small>"]
    UpdateMemory[("Update In-Memory State<br/>match_state.latest_*<br/><small>game_logic.py::process_and_store_*</small>")]
    
    QueueSnapshot["Queue DB Write<br/>insert_snapshot task<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    DBWorker["DB Writer Thread<br/>Background worker<br/><small>gsi_processor.py::db_writer_worker()</small>"]
    SQLiteDB[("SQLite Database<br/>Continuous commits<br/><small>database.py::UnderlordsDatabaseManager</small>")]
    
    CheckFinalPlace["Check final_place<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    HasFinalPlace{"final_place > 0?<br/>Player eliminated?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    QueueFinalPlace["Queue DB Write<br/>update_final_place task<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    CheckMatchEnd["check_match_end()<br/>Count eliminated players<br/><small>match_manager.py</small>"]
    Has2ndPlace{"Someone got<br/>2nd place?<br/><small>match_manager.py::check_match_end()</small>"}
    HasWinner{"Winner already<br/>marked?<br/><small>match_manager.py::check_match_end()</small>"}
    FindWinner["Find remaining player<br/>still_playing[0]<br/><small>match_manager.py::check_match_end()</small>"]
    MarkWinner["Update winner in memory<br/>final_place = 1<br/><small>match_manager.py::check_match_end()</small>"]
    QueueTransaction["Queue match_end_transaction<br/>Update final_place + match end<br/><small>match_manager.py::check_match_end()</small>"]
    
    AllDone{"All players have<br/>final_place?<br/><small>match_manager.py::check_match_end()</small>"}
    QueueMatchEnd["Queue update_match_end<br/>Set ended_at timestamp<br/><small>match_manager.py::check_match_end()</small>"]
    
    EmitFinal["emit_realtime_update()<br/>Send final state<br/><small>game_logic.py</small>"]
    EmitMatchEnded["socketio.emit('match_ended')<br/>Notify clients<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    ResetState["match_state.reset()<br/>Clear all state<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    EmitUpdate["emit_realtime_update()<br/>Send current state<br/><small>game_logic.py</small>"]
    Frontend["Frontend Client<br/>Display updates"]
    
    GameClient --> ReceiveGSI
    ReceiveGSI --> GetAccountID
    GetAccountID --> CheckPublicSeq
    CheckPublicSeq -->|New| ActiveMatch
    CheckPublicSeq -->|Duplicate| ReceiveGSI
    ActiveMatch -->|YES| CheckAbandonment
    ActiveMatch -->|NO| ReceiveGSI
    
    CheckAbandonment --> HealthReset
    HealthReset -->|Yes| AbandonMatch
    HealthReset -->|No| SlotChange
    SlotChange -->|Yes| AbandonMatch
    SlotChange -->|No| UpdateSequence
    AbandonMatch --> ReceiveGSI
    
    UpdateSequence --> ProcessPublicState
    ProcessPublicState --> UpdateRound
    UpdateRound --> UpdateMemory
    UpdateMemory --> QueueSnapshot
    QueueSnapshot --> DBWorker
    DBWorker --> SQLiteDB
    
    ProcessPublicState --> CheckFinalPlace
    CheckFinalPlace --> HasFinalPlace
    HasFinalPlace -->|NO| EmitUpdate
    HasFinalPlace -->|YES| QueueFinalPlace
    QueueFinalPlace --> CheckMatchEnd
    
    CheckMatchEnd --> Has2ndPlace
    Has2ndPlace -->|NO| AllDone
    Has2ndPlace -->|YES| HasWinner
    HasWinner -->|YES| AllDone
    HasWinner -->|NO| FindWinner
    FindWinner --> MarkWinner
    MarkWinner --> QueueTransaction
    QueueTransaction --> EmitFinal
    EmitFinal --> EmitMatchEnded
    EmitMatchEnded --> ResetState
    ResetState --> ReceiveGSI
    
    AllDone -->|YES| QueueMatchEnd
    AllDone -->|NO| EmitUpdate
    QueueMatchEnd --> EmitFinal
    
    EmitUpdate --> Frontend
    
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:2px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${getColor('buffer')},stroke:${getColor('buffer-stroke')},stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    classDef storageStyle fill:${getColor('storage')},stroke:${getColor('storage-stroke')},stroke-width:2px,color:#fff
    classDef lifecycleStyle fill:${getColor('lifecycle')},stroke:${getColor('lifecycle-stroke')},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    
    class GameClient entryStyle
    class ReceiveGSI,GetAccountID,CheckPublicSeq,CheckAbandonment,UpdateSequence,ProcessPublicState,UpdateRound,QueueSnapshot,DBWorker,CheckFinalPlace,QueueFinalPlace,CheckMatchEnd,FindWinner,MarkWinner,EmitFinal,EmitMatchEnded processStyle
    class ActiveMatch,HasFinalPlace,Has2ndPlace,HasWinner,AllDone,HealthReset,SlotChange decisionStyle
    class UpdateMemory bufferStyle
    class SQLiteDB storageStyle
    class AbandonMatch,QueueTransaction,QueueMatchEnd,ResetState lifecycleStyle
    class EmitUpdate,Frontend deliveryStyle
`;
}

function generatePrivatePublicDiagram() {
    return `
flowchart ${getOrientation()}
    GameClient["Underlords Game Client<br/>HTTP POST 10x/sec"]
    ProcessGSI["process_gsi_data()<br/>Process blocks/data, handle both states<br/><small>gsi_processor.py</small>"]
    
    HasPrivate{"Has private<br/>_player_state?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    HasPublic{"Has public<br/>_player_state?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    
    %% Private Branch
    CheckPrivateSeq["Check Private Sequence<br/>sequences['private_sequence']<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    PrivateDup{"Duplicate<br/>sequence?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    ActiveMatchPriv{"Active Match?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    BufferPrivate[("Buffer Private<br/>private_player_buffer<br/><small>match_state.py</small>")]
    ProcessPrivate["process_and_store_gsi<br/>_private_player_state()<br/><small>game_logic.py</small>"]
    UpdateMemPriv[("Update Memory<br/>latest_processed_private<br/>_player_state<br/><small>match_state.py</small>")]
    QueuePrivateDB["Queue DB Write<br/>insert_snapshot<br/>'private_player'<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    %% Public Branch
    GetAccountID["get_account_id()<br/>Normalize bots<br/><small>utils.py</small>"]
    CheckPublicSeq["Check Public Sequence<br/>sequences[account_id]<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    PublicDup{"Duplicate<br/>sequence?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    ActiveMatchPub{"Active Match?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    BufferPublic[("Buffer Public<br/>public_player_buffer<br/><small>match_state.py</small>")]
    ProcessPublic["process_and_store_gsi<br/>_public_player_state()<br/><small>game_logic.py</small>"]
    UpdateMemPub[("Update Memory<br/>latest_processed_public<br/>_player_states[account_id]<br/><small>match_state.py</small>")]
    QueuePublicDB["Queue DB Write<br/>insert_snapshot<br/>account_id<br/><small>gsi_processor.py::process_gsi_data()</small>"]
    
    %% Convergence
    AnyUpdates{"any_updates<br/>flag?<br/><small>gsi_processor.py::process_gsi_data()</small>"}
    QueueDB["DB Write Queue<br/>Thread-safe queue<br/><small>match_state.py</small>"]
    DBWorker["DB Writer Thread<br/>Continuous polling<br/><small>gsi_processor.py::db_writer_worker()</small>"]
    SQLiteDB[("SQLite Database<br/>Commit per task<br/><small>database.py::UnderlordsDatabaseManager</small>")]
    
    EmitUpdate["emit_realtime_update()<br/>Broadcast to clients<br/><small>game_logic.py</small>"]
    WebSocket["WebSocket<br/>All connected clients<br/><small>websocket.py</small>"]
    Frontend["Frontend Client"]
    
    GameClient --> ProcessGSI
    ProcessGSI --> HasPrivate
    ProcessGSI --> HasPublic
    
    %% Private Path (parallel with public)
    HasPrivate -->|Yes| CheckPrivateSeq
    HasPrivate -->|No| AnyUpdates
    CheckPrivateSeq --> PrivateDup
    PrivateDup -->|Yes - Skip| HasPublic
    PrivateDup -->|No| ActiveMatchPriv
    ActiveMatchPriv -->|No| BufferPrivate
    ActiveMatchPriv -->|Yes| ProcessPrivate
    BufferPrivate --> HasPublic
    ProcessPrivate --> UpdateMemPriv
    UpdateMemPriv --> QueuePrivateDB
    QueuePrivateDB --> HasPublic
    
    %% Public Path (parallel with private)
    HasPublic -->|Yes| GetAccountID
    HasPublic -->|No| AnyUpdates
    GetAccountID --> CheckPublicSeq
    CheckPublicSeq --> PublicDup
    PublicDup -->|Yes - Skip| AnyUpdates
    PublicDup -->|No| ActiveMatchPub
    ActiveMatchPub -->|No| BufferPublic
    ActiveMatchPub -->|Yes| ProcessPublic
    BufferPublic --> AnyUpdates
    ProcessPublic --> UpdateMemPub
    UpdateMemPub --> QueuePublicDB
    QueuePublicDB --> AnyUpdates
    
    %% Convergence after both branches
    AnyUpdates -->|Yes| EmitUpdate
    AnyUpdates -->|No| ProcessGSI
    
    QueuePrivateDB --> QueueDB
    QueuePublicDB --> QueueDB
    QueueDB --> DBWorker
    DBWorker --> SQLiteDB
    
    EmitUpdate --> WebSocket
    WebSocket --> Frontend
    
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:3px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${getColor('buffer')},stroke:${getColor('buffer-stroke')},stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    classDef storageStyle fill:${getColor('storage')},stroke:${getColor('storage-stroke')},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    
    class GameClient entryStyle
    class ProcessGSI,CheckPrivateSeq,CheckPublicSeq,GetAccountID,ProcessPrivate,ProcessPublic,DBWorker,EmitUpdate processStyle
    class HasPrivate,HasPublic,PrivateDup,PublicDup,ActiveMatchPriv,ActiveMatchPub,AnyUpdates decisionStyle
    class BufferPrivate,BufferPublic,UpdateMemPriv,UpdateMemPub,QueuePrivateDB,QueuePublicDB,QueueDB bufferStyle
    class SQLiteDB storageStyle
    class WebSocket,Frontend deliveryStyle
`;
}

function generateGSIProcessorDiagram() {
    return `
flowchart ${getOrientation()}
    Start([GSI Payload]) --> Extract["extract_player_states_from_payload<br/>Separates into private and public states"]
    
    Extract --> ProcessPrivate["Process Private States"]
    Extract --> ProcessPublic["Process Public States"]
    
    ProcessPrivate --> PrivatePath{"Match active?"}
    PrivatePath -->|No| BufferPrivate["Add to private_player_buffer"]
    PrivatePath -->|Yes| StorePrivate["Store in match_state"]
    
    ProcessPublic --> PublicPath{"Match active?"}
    PublicPath -->|No| ValidPlayer{"Is valid player?"}
    PublicPath -->|Yes| UpdatePublic["Store in match_state"]
    
    ValidPlayer -->|Yes| AddCandidate["Add to candidates if new"]
    ValidPlayer -->|No| Skip[Skip]
    
    AddCandidate --> BufferPublic["Add to public_player_buffer"]
    BufferPublic --> Check8{"8 valid players<br/>in candidates?"}
    Check8 -->|No| Wait["Wait for more players"]
    Check8 -->|Yes| StartMatch["start_new_match<br/>Uses candidates data"]
    
    BufferPrivate -.->|Write| PrivateBuffer[("private_player_buffer")]
    BufferPublic -.->|Write| PublicBuffer[("public_player_buffer")]
    AddCandidate -.->|Write| Candidates[("candidates")]
    
    StartMatch --> ProcessBuffered["Process buffered_data<br/>process_buffered_data()"]
    ProcessBuffered --> StorePublic["Store in match_state"]
    
    StorePrivate -.->|Write| MatchState[("match_state<br/>Memory")]
    StorePublic -.->|Write| MatchState
    UpdatePublic -.->|Write| MatchState
    
    MatchState --> CheckUpdates{"any_updates<br/>& match_id?"}
    CheckUpdates -->|Yes| EmitWS["Emit WebSocket update"]
    CheckUpdates -->|No| End([Done])
    EmitWS --> End
    
    MatchState -.->|Async DB Write| DB[("Database")]
    
    %% Read relationships
    Candidates -.->|Read| Check8
    Candidates -.->|Read| StartMatch
    PrivateBuffer -.->|Read| ProcessBuffered
    PublicBuffer -.->|Read| ProcessBuffered
    MatchState -.->|Read| CheckUpdates
    MatchState -.->|Read| EmitWS
    
    %% Styling
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:3px,color:#fff
    classDef processStyle fill:${getColor('process')},stroke:${getColor('process-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef bufferStyle fill:${appState.theme === 'dark' ? '#0e7490' : '#0e7490'},stroke:${appState.theme === 'dark' ? '#0c5d75' : '#0c5d75'},stroke-width:2px,color:#fff
    classDef candidateStyle fill:${appState.theme === 'dark' ? '#155e75' : '#155e75'},stroke:${appState.theme === 'dark' ? '#164e63' : '#164e63'},stroke-width:2px,color:#fff
    classDef storageStyle fill:${appState.theme === 'dark' ? '#0891b2' : '#0891b2'},stroke:${appState.theme === 'dark' ? '#0e7490' : '#0e7490'},stroke-width:2px,color:#fff
    classDef deliveryStyle fill:${getColor('delivery')},stroke:${getColor('delivery-stroke')},stroke-width:2px,color:#fff
    classDef addStyle fill:${appState.theme === 'dark' ? '#14b8a6' : '#14b8a6'},stroke:${appState.theme === 'dark' ? '#0f766e' : '#0f766e'},stroke-width:2px,color:#fff
    classDef storeStyle fill:${appState.theme === 'dark' ? '#06b6d4' : '#06b6d4'},stroke:${appState.theme === 'dark' ? '#0891b2' : '#0891b2'},stroke-width:2px,color:#fff
    classDef dbStyle fill:${appState.theme === 'dark' ? '#06b6d4' : '#06b6d4'},stroke:${appState.theme === 'dark' ? '#0891b2' : '#0891b2'},stroke-width:3px,color:#fff
    
    %% Custom styles that match storage node colors - these will override addStyle/storeStyle
    classDef addToPrivateBufferStyle fill:${appState.theme === 'dark' ? '#0e7490' : '#0e7490'},stroke:${appState.theme === 'dark' ? '#0c5d75' : '#0c5d75'},stroke-width:2px,color:#fff
    classDef addToPublicBufferStyle fill:${appState.theme === 'dark' ? '#0e7490' : '#0e7490'},stroke:${appState.theme === 'dark' ? '#0c5d75' : '#0c5d75'},stroke-width:2px,color:#fff
    classDef addToCandidatesStyle fill:${appState.theme === 'dark' ? '#155e75' : '#155e75'},stroke:${appState.theme === 'dark' ? '#164e63' : '#164e63'},stroke-width:2px,color:#fff
    classDef storeToMatchStateStyle fill:${appState.theme === 'dark' ? '#0891b2' : '#0891b2'},stroke:${appState.theme === 'dark' ? '#0e7490' : '#0e7490'},stroke-width:2px,color:#fff
    
    class Start entryStyle
    class Extract,ProcessPrivate,ProcessPublic,ProcessBuffered processStyle
    %% Apply matching colors directly via classDef
    class BufferPrivate addToPrivateBufferStyle
    class BufferPublic addToPublicBufferStyle
    class AddCandidate addToCandidatesStyle
    class StorePrivate storeToMatchStateStyle
    class StorePublic storeToMatchStateStyle
    class UpdatePublic storeToMatchStateStyle
    class StartMatch processStyle
    class PrivatePath,PublicPath,ValidPlayer,Check8,CheckUpdates decisionStyle
    class PrivateBuffer,PublicBuffer bufferStyle
    class Candidates candidateStyle
    class MatchState storageStyle
    class DB dbStyle
    class EmitWS,End deliveryStyle
    
    %% Link styling for decision paths
    %% Edge count: Start->Extract(0), Extract->ProcessPrivate(1), Extract->ProcessPublic(2),
    %% ProcessPrivate->PrivatePath(3), PrivatePath->|No|BufferPrivate(4), PrivatePath->|Yes|StorePrivate(5),
    %% ProcessPublic->PublicPath(6), PublicPath->|No|ValidPlayer(7), PublicPath->|Yes|UpdatePublic(8),
    %% ValidPlayer->|Yes|AddCandidate(9), ValidPlayer->|No|Skip(10), AddCandidate->BufferPublic(11),
    %% BufferPublic->Check8(12), Check8->|No|Wait(13), Check8->|Yes|StartMatch(14),
    %% StartMatch->ProcessBuffered(15), ProcessBuffered->StorePublic(16),
    %% BufferPrivate-.->|Write|PrivateBuffer(17), BufferPublic-.->|Write|PublicBuffer(18),
    %% AddCandidate-.->|Write|Candidates(19), StorePrivate-.->|Write|MatchState(20),
    %% StorePublic-.->|Write|MatchState(21), UpdatePublic-.->|Write|MatchState(22),
    %% MatchState->CheckUpdates(23), CheckUpdates->|Yes|EmitWS(24), CheckUpdates->|No|End(25),
    %% EmitWS->End(26), MatchState-.->|Async DB Write|DB(27),
    %% Candidates-.->|Read|Check8(28), Candidates-.->|Read|StartMatch(29),
    %% PrivateBuffer-.->|Read|ProcessBuffered(30), PublicBuffer-.->|Read|ProcessBuffered(31),
    %% MatchState-.->|Read|CheckUpdates(32), MatchState-.->|Read|EmitWS(33)
    
    %% Arrow thickness from appState
    %% All arrows use dynamic thickness from appState.arrowThickness
    
    %% "Yes" paths (green)
    linkStyle 5 stroke:${appState.theme === 'dark' ? '#22c55e' : '#16a34a'},stroke-width:${appState.arrowThickness}px
    linkStyle 8 stroke:${appState.theme === 'dark' ? '#22c55e' : '#16a34a'},stroke-width:${appState.arrowThickness}px
    linkStyle 9 stroke:${appState.theme === 'dark' ? '#22c55e' : '#16a34a'},stroke-width:${appState.arrowThickness}px
    linkStyle 14 stroke:${appState.theme === 'dark' ? '#22c55e' : '#16a34a'},stroke-width:${appState.arrowThickness}px
    linkStyle 24 stroke:${appState.theme === 'dark' ? '#22c55e' : '#16a34a'},stroke-width:${appState.arrowThickness}px
    
    %% "No" paths (red)
    linkStyle 4 stroke:${appState.theme === 'dark' ? '#ef4444' : '#dc2626'},stroke-width:${appState.arrowThickness}px
    linkStyle 7 stroke:${appState.theme === 'dark' ? '#ef4444' : '#dc2626'},stroke-width:${appState.arrowThickness}px
    linkStyle 10 stroke:${appState.theme === 'dark' ? '#ef4444' : '#dc2626'},stroke-width:${appState.arrowThickness}px
    linkStyle 13 stroke:${appState.theme === 'dark' ? '#ef4444' : '#dc2626'},stroke-width:${appState.arrowThickness}px
    linkStyle 25 stroke:${appState.theme === 'dark' ? '#ef4444' : '#dc2626'},stroke-width:${appState.arrowThickness}px
    
    %% Regular arrows (not styled above) - default gray color
    linkStyle 0 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 1 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 2 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 3 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 6 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 11 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 12 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 15 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 16 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 23 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    linkStyle 26 stroke:${appState.theme === 'dark' ? '#94a3b8' : '#64748b'},stroke-width:${appState.arrowThickness}px
    
    %% Write operations (teal) - dashed - ALL 6 write operations
    %% Edge 17: BufferPrivate-.->|Write|PrivateBuffer
    %% Edge 18: BufferPublic-.->|Write|PublicBuffer  
    %% Edge 19: AddCandidate-.->|Write|Candidates
    linkStyle 17 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 18 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 19 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 20 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 21 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 22 stroke:${appState.theme === 'dark' ? '#06b6d4' : '#0891b2'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    
    %% Async DB write (orange) - dashed
    linkStyle 27 stroke:${appState.theme === 'dark' ? '#f97316' : '#ea580c'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    
    %% Read operations (purple/violet) - dashed - ALL 6 read operations
    linkStyle 28 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 29 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 30 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 31 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 32 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
    linkStyle 33 stroke:${appState.theme === 'dark' ? '#a855f7' : '#9333ea'},stroke-width:${appState.arrowThickness}px,stroke-dasharray: 5 5
`;
}

// Color helper function - bold, modern color palette
function getColor(colorType) {
    const isDark = appState.theme === 'dark';
    const colors = {
        // Entry Point - Electric Blue
        'entry': isDark ? '#3b82f6' : '#0066ff',
        'entry-stroke': isDark ? '#2563eb' : '#0052cc',
        
        // HTTP Layer - Turquoise
        'http': isDark ? '#14b8a6' : '#0d9488',
        'http-stroke': isDark ? '#0f766e' : '#0a7169',
        
        // Processing - Fire Red
        'process': isDark ? '#ef4444' : '#dc2626',
        'process-stroke': isDark ? '#dc2626' : '#b91c1c',
        
        // Decision Point - Magenta
        'decision': isDark ? '#d946ef' : '#c026d3',
        'decision-stroke': isDark ? '#c026d3' : '#a21caf',
        
        // Buffer - Charcoal Gray
        'buffer': isDark ? '#475569' : '#64748b',
        'buffer-stroke': isDark ? '#334155' : '#475569',
        
        // Storage - Emerald Green
        'storage': isDark ? '#22c55e' : '#16a34a',
        'storage-stroke': isDark ? '#16a34a' : '#15803d',
        
        // Delivery - Coral/Orange
        'delivery': isDark ? '#f97316' : '#ea580c',
        'delivery-stroke': isDark ? '#ea580c' : '#c2410c',
        
        // Lifecycle - Gold/Yellow
        'lifecycle': isDark ? '#eab308' : '#ca8a04',
        'lifecycle-stroke': isDark ? '#ca8a04' : '#a16207',
        
        // Edge color for connections
        'edge': isDark ? '#94a3b8' : '#64748b'
    };
    return colors[colorType] || (isDark ? '#94a3b8' : '#64748b');
}

// Get edge color for Mermaid links
function getEdgeColor() {
    return appState.theme === 'dark' ? '#94a3b8' : '#64748b';
}

// Fix write arrow colors by finding edges with "Write" labels
// Mermaid structure: <g class="edge"> contains both <path> and <g class="edgeLabel">
function fixWriteArrowColors(element) {
    const svg = element.querySelector('svg');
    if (!svg) return;
    
    const writeColor = appState.theme === 'dark' ? '#06b6d4' : '#0891b2';
    const normalColor = appState.theme === 'dark' ? '#94a3b8' : '#64748b';
    const arrowThickness = appState.arrowThickness;
    
    // Find all edge groups (Mermaid wraps each edge in a <g> element)
    // Each edge group contains: <path> (the line) and <g class="edgeLabel"> (the label)
    const edgeGroups = svg.querySelectorAll('g.edge, g.edgePath');
    
    edgeGroups.forEach(edgeGroup => {
        // Find the path and label within this edge group
        const path = edgeGroup.querySelector('path[id^="flowchart"], path.path');
        const labelGroup = edgeGroup.querySelector('g.edgeLabel');
        
        if (!path) return;
        
        // Get label text
        let labelText = '';
        if (labelGroup) {
            const texts = labelGroup.querySelectorAll('text');
            labelText = Array.from(texts)
                .map(t => t.textContent || '')
                .join(' ')
                .trim()
                .toLowerCase();
        }
        
        // Determine line type based on label
        const isWrite = labelText.includes('write') && !labelText.includes('async');
        const isRead = labelText.includes('read');
        const isAsyncDB = labelText.includes('async db write');
        const isNormal = !labelText || labelText === 'yes' || labelText === 'no';
        
        // Apply styling based on line type
        if (isWrite) {
            // Write lines: teal, dashed
            path.setAttribute('stroke', writeColor);
            path.setAttribute('stroke-width', `${arrowThickness}px`);
            path.setAttribute('stroke-dasharray', '5 5');
            path.style.stroke = writeColor;
            path.style.strokeWidth = `${arrowThickness}px`;
            path.style.strokeDasharray = '5 5';
        } else if (isNormal) {
            // Normal lines: gray, solid (remove any write styling)
            path.setAttribute('stroke', normalColor);
            path.removeAttribute('stroke-dasharray');
            path.style.stroke = normalColor;
            path.style.strokeWidth = `${arrowThickness}px`;
            path.style.strokeDasharray = '';
        }
        // Read lines and async DB lines are handled by linkStyle, leave them alone
    });
    
    // Also handle any paths that aren't in edge groups (fallback)
    const orphanPaths = Array.from(svg.querySelectorAll('path[id^="flowchart"], path.path'))
        .filter(p => !p.closest('g.edge, g.edgePath'));
    
    orphanPaths.forEach(path => {
        const pathStyle = path.getAttribute('style') || '';
        const hasDashArray = path.getAttribute('stroke-dasharray') || pathStyle.includes('stroke-dasharray');
        
        // If it looks like it was incorrectly styled as write, fix it
        if (pathStyle.includes(writeColor) || hasDashArray) {
            // Check if there's a nearby label that would indicate it's a write line
            const allLabels = svg.querySelectorAll('g.edgeLabel');
            let hasWriteLabel = false;
            
            allLabels.forEach(labelGroup => {
                const texts = labelGroup.querySelectorAll('text');
                const labelText = Array.from(texts)
                    .map(t => t.textContent || '')
                    .join(' ')
                    .trim()
                    .toLowerCase();
                
                if (labelText.includes('write') && !labelText.includes('async')) {
                    try {
                        const labelBBox = labelGroup.getBBox();
                        const pathBBox = path.getBBox();
                        const distance = Math.sqrt(
                            Math.pow(labelBBox.x + labelBBox.width/2 - (pathBBox.x + pathBBox.width/2), 2) +
                            Math.pow(labelBBox.y + labelBBox.height/2 - (pathBBox.y + pathBBox.height/2), 2)
                        );
                        if (distance < 300) {
                            hasWriteLabel = true;
                        }
                    } catch (e) {}
                }
            });
            
            // If no write label found, it's a normal line
            if (!hasWriteLabel) {
                path.setAttribute('stroke', normalColor);
                path.removeAttribute('stroke-dasharray');
                path.style.stroke = normalColor;
                path.style.strokeWidth = `${arrowThickness}px`;
                path.style.strokeDasharray = '';
            }
        }
    });
}

// Recolor storage nodes to shades of teal (write operation color)
function recolorStorageNodes(element) {
    const svg = element.querySelector('svg');
    if (!svg) return;
    
    // Define teal shades for different storage nodes
    const storageColors = {
        'private_player_buffer': { fill: appState.theme === 'dark' ? '#0e7490' : '#0e7490', stroke: appState.theme === 'dark' ? '#0c5d75' : '#0c5d75' },
        'public_player_buffer': { fill: appState.theme === 'dark' ? '#0e7490' : '#0e7490', stroke: appState.theme === 'dark' ? '#0c5d75' : '#0c5d75' },
        'candidates': { fill: appState.theme === 'dark' ? '#155e75' : '#155e75', stroke: appState.theme === 'dark' ? '#164e63' : '#164e63' },
        'match_state': { fill: appState.theme === 'dark' ? '#0891b2' : '#0891b2', stroke: appState.theme === 'dark' ? '#0e7490' : '#0e7490' },
        'database': { fill: appState.theme === 'dark' ? '#06b6d4' : '#06b6d4', stroke: appState.theme === 'dark' ? '#0891b2' : '#0891b2' }
    };
    
    // Map node IDs directly to their colors (most reliable method)
    const nodeIdColorMap = {
        'BufferPrivate': storageColors['private_player_buffer'],
        'BufferPublic': storageColors['public_player_buffer'],
        'AddCandidate': storageColors['candidates'],
        'StorePrivate': storageColors['match_state'],
        'StorePublic': storageColors['match_state'],
        'UpdatePublic': storageColors['match_state']
    };
    
    // Map operation nodes to their destination storage node colors (fallback for text matching)
    const operationColors = {
        'add to private_player_buffer': storageColors['private_player_buffer'],
        'add to private': storageColors['private_player_buffer'],
        'add to public_player_buffer': storageColors['public_player_buffer'],
        'add to public': storageColors['public_player_buffer'],
        'add to candidates': storageColors['candidates'],
        'add to candidates if new': storageColors['candidates'],
        'store in match_state': storageColors['match_state'],
        'store in match': storageColors['match_state'],
        'update': storageColors['match_state']
    };
    
    // Find all node groups (Mermaid nodes are typically in <g> elements)
    const nodeGroups = svg.querySelectorAll('g.node');
    
    nodeGroups.forEach(nodeGroup => {
        // Find the shape element (rect, ellipse, etc.)
        const shape = nodeGroup.querySelector('rect, ellipse, polygon, circle, path');
        if (!shape) return;
        
        // Method 1: Match by node ID (most reliable)
        const nodeId = nodeGroup.getAttribute('id') || '';
        let colors = null;
        
        // Extract node name from ID (Mermaid format: flowchart-nodeId-0)
        const nodeIdMatch = nodeId.match(/flowchart-(\w+)-/);
        const nodeName = nodeIdMatch ? nodeIdMatch[1] : '';
        
        if (nodeName && nodeIdColorMap[nodeName]) {
            colors = nodeIdColorMap[nodeName];
            console.log(`✓ Matched node "${nodeName}" by ID to color ${colors.fill}`);
        }
        
        // Method 2: Fallback to text matching if ID matching didn't work
        if (!colors) {
            const titleElement = nodeGroup.querySelector('title');
            const textElements = nodeGroup.querySelectorAll('text');
            let nodeText = '';
            
            if (titleElement) {
                nodeText = (titleElement.textContent || '').toLowerCase();
            }
            
            if (textElements.length > 0) {
                textElements.forEach(text => {
                    nodeText += (text.textContent || '').toLowerCase() + ' ';
                });
            }
            nodeText = nodeText.trim();
            
            // Check if this is a storage node
            for (const [nodeName, storageNodeColors] of Object.entries(storageColors)) {
                const searchName = nodeName.replace('_', ' ');
                if (nodeText.includes(searchName) || nodeText.includes(nodeName)) {
                    colors = storageNodeColors;
                    break;
                }
            }
            
            // Check for operation nodes
            if (!colors) {
                const sortedPatterns = Object.keys(operationColors).sort((a, b) => b.length - a.length);
                for (const operationPattern of sortedPatterns) {
                    if (nodeText.includes(operationPattern) || 
                        operationPattern.split(' ').every(word => nodeText.includes(word))) {
                        colors = operationColors[operationPattern];
                        console.log(`✓ Matched "${operationPattern}" by text to color ${colors.fill}`);
                        break;
                    }
                }
                
                // Keyword fallbacks
                if (!colors && nodeText.includes('add') && nodeText.includes('candidate')) {
                    colors = storageColors['candidates'];
                } else if (!colors && nodeText.includes('add') && (nodeText.includes('private') || nodeText.includes('private_player'))) {
                    colors = storageColors['private_player_buffer'];
                } else if (!colors && nodeText.includes('add') && (nodeText.includes('public') || nodeText.includes('public_player'))) {
                    colors = storageColors['public_player_buffer'];
                } else if (!colors && (nodeText.includes('store') || (nodeText.includes('update') && nodeText.includes('match')))) {
                    colors = storageColors['match_state'];
                }
            }
        }
        
        // Apply colors aggressively
        if (colors) {
            // Remove any existing fill/stroke from style
            let currentStyle = shape.getAttribute('style') || '';
            currentStyle = currentStyle.replace(/fill:\s*[^;!]+[;!]*/gi, '');
            currentStyle = currentStyle.replace(/stroke:\s*[^;!]+[;!]*/gi, '');
            currentStyle = currentStyle.replace(/;;+/g, ';').trim();
            if (currentStyle && !currentStyle.endsWith(';')) currentStyle += ';';
            currentStyle += ` fill:${colors.fill} !important; stroke:${colors.stroke} !important;`;
            
            // Set all properties
            shape.setAttribute('fill', colors.fill);
            shape.setAttribute('stroke', colors.stroke);
            shape.setAttribute('style', currentStyle.trim());
            shape.style.setProperty('fill', colors.fill, 'important');
            shape.style.setProperty('stroke', colors.stroke, 'important');
        }
    });
}

// Style arrow labels: position at start and match line color
function styleArrowLabels(element) {
    const svg = element.querySelector('svg');
    if (!svg) return;
    
    // Find all edge paths
    const edgePaths = svg.querySelectorAll('path[id^="flowchart"], path.path');
    
    // Find all edge label groups (Mermaid uses g.edgeLabel)
    const edgeLabelGroups = svg.querySelectorAll('g.edgeLabel');
    
    edgeLabelGroups.forEach(labelGroup => {
        const texts = labelGroup.querySelectorAll('text');
        if (texts.length === 0) return;
        
        // Get label group position
        const labelBBox = labelGroup.getBBox();
        const labelCenterX = labelBBox.x + labelBBox.width / 2;
        const labelCenterY = labelBBox.y + labelBBox.height / 2;
        
        // Find the closest edge path
        let closestPath = null;
        let minDistance = Infinity;
        let closestColor = null;
        
        edgePaths.forEach(path => {
            const style = path.getAttribute('style');
            if (!style) return;
            
            const strokeMatch = style.match(/stroke:\s*([^;,\s]+)/);
            if (!strokeMatch) return;
            
            try {
                const pathBBox = path.getBBox();
                // Calculate distance to path start (first 5% of path)
                const pathStartX = pathBBox.x + pathBBox.width * 0.05;
                const pathStartY = pathBBox.y + pathBBox.height * 0.5;
                
                const distance = Math.sqrt(
                    Math.pow(labelCenterX - pathStartX, 2) +
                    Math.pow(labelCenterY - pathStartY, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPath = path;
                    closestColor = strokeMatch[1].trim();
                }
            } catch (e) {
                // BBox might fail for some paths, skip
            }
        });
        
        // Apply color to label text
        if (closestColor && minDistance < 300) {
            texts.forEach(text => {
                text.setAttribute('fill', closestColor);
                text.style.fill = closestColor;
            });
            
            // Try to position label at start of arrow
            if (closestPath) {
                try {
                    const pathBBox = closestPath.getBBox();
                    const pathStartX = pathBBox.x + pathBBox.width * 0.05;
                    const pathStartY = pathBBox.y + pathBBox.height * 0.5;
                    
                    // Adjust label group transform to move it closer to path start
                    const currentTransform = labelGroup.getAttribute('transform') || '';
                    const translateMatch = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
                    
                    if (translateMatch) {
                        const currentX = parseFloat(translateMatch[1]) || 0;
                        const currentY = parseFloat(translateMatch[2]) || 0;
                        const newX = currentX + (pathStartX - labelCenterX) * 0.3; // Move 30% towards start
                        const newY = currentY + (pathStartY - labelCenterY) * 0.3;
                        labelGroup.setAttribute('transform', `translate(${newX},${newY})`);
                    }
                } catch (e) {
                    // Transform adjustment might fail, that's okay
                }
            }
        }
    });
    
    // Also handle any loose text labels
    const allTexts = svg.querySelectorAll('text');
    allTexts.forEach(text => {
        const parentGroup = text.parentElement;
        // Skip if already in an edgeLabel group (we handled those above)
        if (parentGroup && parentGroup.classList.contains('edgeLabel')) return;
        
        const textX = parseFloat(text.getAttribute('x') || 0);
        const textY = parseFloat(text.getAttribute('y') || 0);
        
        let minDistance = Infinity;
        let closestColor = null;
        
        edgePaths.forEach(path => {
            const style = path.getAttribute('style');
            if (!style) return;
            
            const strokeMatch = style.match(/stroke:\s*([^;,\s]+)/);
            if (!strokeMatch) return;
            
            try {
                const pathBBox = path.getBBox();
                const pathStartX = pathBBox.x + pathBBox.width * 0.05;
                const pathStartY = pathBBox.y + pathBBox.height * 0.5;
                
                const distance = Math.sqrt(
                    Math.pow(textX - pathStartX, 2) +
                    Math.pow(textY - pathStartY, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = strokeMatch[1].trim();
                }
            } catch (e) {
                // Skip if BBox fails
            }
        });
        
        if (closestColor && minDistance < 200) {
            text.setAttribute('fill', closestColor);
            text.style.fill = closestColor;
        }
    });
}

// Render diagram
function renderDiagram() {
    const diagramElement = document.getElementById('dataflow-diagram');
    const spinner = document.getElementById('loadingSpinner');
    
    if (!diagramElement) {
        console.error('Diagram element not found');
        return;
    }
    
    let diagramCode = '';
    
    switch(appState.currentView) {
        case 'overview':
            diagramCode = generateOverviewDiagram();
            break;
        case 'detailed':
            diagramCode = generateDetailedDiagram();
            break;
        case 'no-match':
            diagramCode = generateNoMatchDiagram();
            break;
        case 'active-match':
            diagramCode = generateActiveMatchDiagram();
            break;
        case 'private-public':
            diagramCode = generatePrivatePublicDiagram();
            break;
        case 'gsi-processor':
            diagramCode = generateGSIProcessorDiagram();
            break;
        default:
            diagramCode = generateOverviewDiagram();
    }
    
    // Trim and validate diagram code
    diagramCode = diagramCode.trim();
    if (!diagramCode) {
        console.error('Empty diagram code generated');
        if (spinner) spinner.style.display = 'none';
        diagramElement.innerHTML = '<p style="color: red; padding: 20px;">Error: Empty diagram code</p>';
        return;
    }
    
    console.log('Rendering diagram with code length:', diagramCode.length);
    console.log('First 200 chars:', diagramCode.substring(0, 200));
    
    // Wait for Mermaid to be ready
    const checkMermaid = setInterval(() => {
        if (window.mermaid && window.mermaidReady) {
            clearInterval(checkMermaid);
            // Clear previous diagram
            diagramElement.innerHTML = '';
            
            // Use mermaid.render() - the recommended async API for v10
            renderMermaidDiagram(diagramElement, diagramCode, spinner);
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkMermaid);
        if (!window.mermaid || !window.mermaidReady) {
            console.error('Mermaid.js failed to load');
            if (spinner) spinner.style.display = 'none';
            diagramElement.innerHTML = '<p style="color: red; padding: 20px;">Error: Mermaid.js library failed to load</p>';
        }
    }, 5000);
}

// Main rendering function - using render() method with callback
async function renderMermaidDiagram(element, diagramCode, spinner) {
    try {
        if (!window.mermaid) {
            throw new Error('Mermaid not available on window');
        }
        
        if (!window.mermaid.render) {
            throw new Error('Mermaid render method not available');
        }
        
        const id = 'mermaid-diagram-' + Date.now();
        
        // Ensure element is in the DOM
        if (!element.parentElement) {
            console.warn('Element not in DOM, appending to body temporarily');
            document.body.appendChild(element);
        }
        
        // Clear element but ensure it's visible for rendering
        element.innerHTML = '';
        element.style.display = 'block';
        
        // Use render() with callback - this is the most reliable method for Mermaid v10
        // Signature: render(id, text, svgCallback)
        return new Promise((resolve, reject) => {
            try {
                // Validate diagram code before rendering
                if (!diagramCode || diagramCode.trim().length === 0) {
                    throw new Error('Diagram code is empty');
                }
                
                console.log('Calling mermaid.render() with id:', id);
                console.log('Diagram code starts with:', diagramCode.substring(0, 50));
                
                let callbackFired = false;
                const timeout = setTimeout(() => {
                    if (!callbackFired) {
                        console.error('Mermaid render callback timeout - trying promise-based approach');
                        callbackFired = true;
                        // Try promise-based render as fallback
                        if (window.mermaid.render && typeof window.mermaid.render === 'function') {
                            window.mermaid.render(id, diagramCode).then((result) => {
                                if (result && result.svg) {
                                    element.innerHTML = result.svg;
                                } else if (typeof result === 'string') {
                                    element.innerHTML = result;
                                } else {
                                    reject(new Error('Unexpected render result: ' + typeof result));
                                    return;
                                }
                                
                                // Only apply default edge color to unstyled edges (for GSI Processor diagram, linkStyle handles colors)
                                if (appState.currentView !== 'gsi-processor') {
                                    setTimeout(() => {
                                        const svg = element.querySelector('svg');
                                        if (svg) {
                                            const edgeColor = getEdgeColor();
                                            svg.querySelectorAll('path[id^="flowchart"], path.path, line[stroke]').forEach(path => {
                                                const style = path.getAttribute('style');
                                                if (!style || !style.includes('stroke:')) {
                                                    path.setAttribute('stroke', edgeColor);
                                                }
                                            });
                                            svg.querySelectorAll('marker path').forEach(marker => {
                                                marker.setAttribute('fill', edgeColor);
                                            });
                                        }
                                    }, 100);
                                }
                                
                                // Style arrow labels, fix write arrow colors, and recolor storage nodes
                                if (appState.currentView === 'gsi-processor') {
                                    setTimeout(() => {
                                        styleArrowLabels(element);
                                        fixWriteArrowColors(element);
                                        recolorStorageNodes(element);
                                    }, 150);
                                }
                                
                                if (spinner) spinner.style.display = 'none';
                                element.style.opacity = '1';
                                console.log('Mermaid diagram rendered successfully (promise fallback)');
                                resolve();
                            }).catch((promiseError) => {
                                console.error('Promise-based render also failed:', promiseError);
                                reject(promiseError);
                            });
                        } else {
                            reject(new Error('Render callback timeout and no promise-based render available'));
                        }
                    }
                }, 5000); // 5 second timeout
                
                try {
                    // Mermaid v9 render() - try without container first (v9 might not need it)
                    let renderResult;
                    try {
                        // Try without container (v9 standard)
                        renderResult = window.mermaid.render(id, diagramCode, (svgCode, bindFunctions) => {
                            callbackFired = true;
                            clearTimeout(timeout);
                            
                            try {
                                if (!svgCode || svgCode.trim().length === 0) {
                                    throw new Error('Mermaid returned empty SVG');
                                }
                                
                                element.innerHTML = svgCode;
                                
                                // Only apply default edge color to unstyled edges (for GSI Processor diagram, linkStyle handles colors)
                                if (appState.currentView !== 'gsi-processor') {
                                    setTimeout(() => {
                                        const svg = element.querySelector('svg');
                                        if (svg) {
                                            const edgeColor = getEdgeColor();
                                            // Only update edges that don't have explicit styling (linkStyle)
                                            svg.querySelectorAll('path[id^="flowchart"], path.path, line[stroke]').forEach(path => {
                                                // Check if this path has a style attribute with stroke (from linkStyle)
                                                const style = path.getAttribute('style');
                                                if (!style || !style.includes('stroke:')) {
                                                    path.setAttribute('stroke', edgeColor);
                                                }
                                            });
                                            // Update arrow markers
                                            svg.querySelectorAll('marker path').forEach(marker => {
                                                marker.setAttribute('fill', edgeColor);
                                            });
                                        }
                                    }, 100);
                                }
                                
                                // Style arrow labels, fix write arrow colors, and recolor storage nodes
                                if (appState.currentView === 'gsi-processor') {
                                    setTimeout(() => {
                                        styleArrowLabels(element);
                                        fixWriteArrowColors(element);
                                        recolorStorageNodes(element);
                                    }, 150);
                                }
                                
                                // Bind functions if provided (for interactivity)
                                if (bindFunctions && typeof bindFunctions === 'function') {
                                    bindFunctions(element);
                                }
                                
                                if (spinner) spinner.style.display = 'none';
                                element.style.opacity = '1';
                                console.log('Mermaid diagram rendered successfully');
                                resolve();
                            } catch (callbackError) {
                                console.error('Error in render callback:', callbackError);
                                console.error('SVG code received:', svgCode ? svgCode.substring(0, 100) : 'null');
                                reject(callbackError);
                            }
                        });
                    } catch (noContainerError) {
                        // If that fails, try with container
                        console.log('Render without container failed, trying with container:', noContainerError);
                        renderResult = window.mermaid.render(id, diagramCode, (svgCode, bindFunctions) => {
                            callbackFired = true;
                            clearTimeout(timeout);
                            
                            try {
                                if (!svgCode || svgCode.trim().length === 0) {
                                    throw new Error('Mermaid returned empty SVG');
                                }
                                
                                element.innerHTML = svgCode;
                                
                                // Only apply default edge color to unstyled edges (for GSI Processor diagram, linkStyle handles colors)
                                if (appState.currentView !== 'gsi-processor') {
                                    setTimeout(() => {
                                        const svg = element.querySelector('svg');
                                        if (svg) {
                                            const edgeColor = getEdgeColor();
                                            svg.querySelectorAll('path[id^="flowchart"], path.path, line[stroke]').forEach(path => {
                                                const style = path.getAttribute('style');
                                                if (!style || !style.includes('stroke:')) {
                                                    path.setAttribute('stroke', edgeColor);
                                                }
                                            });
                                            svg.querySelectorAll('marker path').forEach(marker => {
                                                marker.setAttribute('fill', edgeColor);
                                            });
                                        }
                                    }, 100);
                                }
                                
                                // Style arrow labels, fix write arrow colors, and recolor storage nodes
                                if (appState.currentView === 'gsi-processor') {
                                    setTimeout(() => {
                                        styleArrowLabels(element);
                                        fixWriteArrowColors(element);
                                        recolorStorageNodes(element);
                                    }, 150);
                                }
                                
                                if (bindFunctions && typeof bindFunctions === 'function') {
                                    bindFunctions(element);
                                }
                                
                                if (spinner) spinner.style.display = 'none';
                                element.style.opacity = '1';
                                console.log('Mermaid diagram rendered successfully (with container)');
                                resolve();
                            } catch (callbackError) {
                                console.error('Error in render callback:', callbackError);
                                reject(callbackError);
                            }
                        }, element);
                    }
                    
                    // If render() returns a promise, handle it
                    if (renderResult && typeof renderResult.then === 'function') {
                        renderResult.then(() => {
                            clearTimeout(timeout);
                        }).catch((renderPromiseError) => {
                            callbackFired = true;
                            clearTimeout(timeout);
                            console.error('Render promise rejected:', renderPromiseError);
                            reject(renderPromiseError);
                        });
                    }
                } catch (renderError) {
                    callbackFired = true;
                    clearTimeout(timeout);
                    console.error('Error calling mermaid.render():', renderError);
                    console.error('Error stack:', renderError.stack);
                    reject(renderError);
                }
            } catch (outerError) {
                console.error('Outer error in renderMermaidDiagram:', outerError);
                reject(outerError);
            }
        });
    } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        console.error('Diagram code length:', diagramCode.length);
        console.error('Diagram code preview:', diagramCode.substring(0, 200));
        if (spinner) spinner.style.display = 'none';
        element.innerHTML = '<div style="color: red; padding: 20px;"><p><strong>Error rendering diagram:</strong> ' + 
            (error.message || 'Unknown error') + '</p><details style="margin-top: 10px;"><summary>Diagram code (first 500 chars) - Check console for full error</summary><pre style="white-space: pre-wrap; font-size: 10px; max-height: 200px; overflow: auto;">' + 
            diagramCode.substring(0, 500).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></details></div>';
        throw error;
    }
}

// Alternative rendering method (fallback)
async function tryAlternativeRender(element, diagramCode, spinner) {
    try {
        // Clear and set content - ensure element has 'mermaid' class
        element.innerHTML = '';
        element.className = 'mermaid';
        element.textContent = diagramCode;
        
        // Try using mermaid.render() - async API for v10
        // In v10, render() signature is: render(id, text, svgCallback?, container?)
        if (window.mermaid.render) {
            const id = 'mermaid-' + Date.now();
            try {
                // Try callback-based render first (older v10 API)
                if (window.mermaid.render.length >= 3) {
                    window.mermaid.render(id, diagramCode, (svgCode, bindFunctions) => {
                        element.innerHTML = svgCode;
                        
                        // Only apply default edge color to unstyled edges (for GSI Processor diagram, linkStyle handles colors)
                        if (appState.currentView !== 'gsi-processor') {
                            setTimeout(() => {
                                const svg = element.querySelector('svg');
                                if (svg) {
                                    const edgeColor = getEdgeColor();
                                    svg.querySelectorAll('path[id^="flowchart"], path.path, line[stroke]').forEach(path => {
                                        const style = path.getAttribute('style');
                                        if (!style || !style.includes('stroke:')) {
                                            path.setAttribute('stroke', edgeColor);
                                        }
                                    });
                                    svg.querySelectorAll('marker path').forEach(marker => {
                                        marker.setAttribute('fill', edgeColor);
                                    });
                                }
                            }, 100);
                        }
                        
                        if (bindFunctions) bindFunctions(element);
                        if (spinner) spinner.style.display = 'none';
                        element.style.opacity = '1';
                        console.log('Mermaid diagram rendered using render() callback');
                    });
                    return;
                }
                
                // Try promise-based render (newer v10 API)
                const renderResult = await window.mermaid.render(id, diagramCode);
                if (renderResult && renderResult.svg) {
                    element.innerHTML = renderResult.svg;
                    if (spinner) spinner.style.display = 'none';
                    element.style.opacity = '1';
                    console.log('Mermaid diagram rendered using render() promise');
                    return;
                } else if (typeof renderResult === 'string') {
                    // Sometimes render() returns SVG string directly
                    element.innerHTML = renderResult;
                    if (spinner) spinner.style.display = 'none';
                    element.style.opacity = '1';
                    console.log('Mermaid diagram rendered using render() string');
                    return;
                }
            } catch (renderError) {
                console.error('mermaid.render() error:', renderError);
                // Continue to next method
            }
        }
        
        // Try using mermaid.init() - older API
        if (window.mermaid.init) {
            window.mermaid.init(undefined, element);
            if (spinner) spinner.style.display = 'none';
            element.style.opacity = '1';
            console.log('Mermaid diagram rendered using init()');
            return;
        }
        
        // Last resort: try parsing and rendering manually
        console.warn('All render methods failed, trying manual parse');
        throw new Error('No valid Mermaid rendering method found');
    } catch (error) {
        console.error('Alternative render failed:', error);
        if (spinner) spinner.style.display = 'none';
        element.innerHTML = '<div style="color: red; padding: 20px;"><p>Error rendering diagram: ' + error.message + '</p><details><summary>Diagram code (first 500 chars)</summary><pre style="white-space: pre-wrap; font-size: 10px;">' + 
            diagramCode.substring(0, 500).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></details></div>';
    }
}

// Initialize Mermaid diagram when ready
function initializeMermaidDiagram() {
    const checkMermaid = setInterval(() => {
        if (window.mermaid && window.mermaidReady) {
            clearInterval(checkMermaid);
            renderDiagram();
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkMermaid);
    }, 5000);
}

// Panel management
function showComponentDetails(componentId) {
    const data = componentData[componentId];
    if (!data) return;

    const panel = document.getElementById('detailsPanel');
    const content = document.getElementById('panelContent');
    
    let html = `<h3>${data.title}</h3>`;
    
    if (data.details.description) {
        html += `<p>${data.details.description}</p>`;
    }
    
    Object.keys(data.details).forEach(key => {
        if (key === 'description') return;
        
        const value = data.details[key];
        html += `<h4>${formatKey(key)}</h4>`;
        
        if (typeof value === 'object' && !Array.isArray(value)) {
            html += '<ul>';
            Object.keys(value).forEach(subKey => {
                html += `<li><strong>${formatKey(subKey)}:</strong> ${formatValue(value[subKey])}</li>`;
            });
            html += '</ul>';
        } else if (Array.isArray(value)) {
            html += '<ul>';
            value.forEach(item => {
                html += `<li>${formatValue(item)}</li>`;
            });
            html += '</ul>';
        } else {
            html += `<p>${formatValue(value)}</p>`;
        }
    });
    
    content.innerHTML = html;
    panel.classList.add('open');
}

function formatKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value) {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return value;
}

function closePanel() {
    const panel = document.getElementById('detailsPanel');
    panel.classList.remove('open');
}

// Spacing controls
function initSpacingControls() {
    const nodeSpacingInput = document.getElementById('nodeSpacing');
    const rankSpacingInput = document.getElementById('rankSpacing');
    const arrowThicknessInput = document.getElementById('arrowThickness');
    const orientationSelect = document.getElementById('orientation');
    const applyBtn = document.getElementById('applySpacingBtn');
    
    // Load saved values
    const savedNodeSpacing = parseInt(localStorage.getItem('mermaid-nodeSpacing') || '120');
    const savedRankSpacing = parseInt(localStorage.getItem('mermaid-rankSpacing') || '200');
    const savedArrowThickness = parseFloat(localStorage.getItem('mermaid-arrowThickness') || '4');
    const savedOrientation = localStorage.getItem('mermaid-orientation') || 'horizontal';
    
    if (nodeSpacingInput) {
        nodeSpacingInput.value = savedNodeSpacing;
        appState.nodeSpacing = savedNodeSpacing;
    }
    if (rankSpacingInput) {
        rankSpacingInput.value = savedRankSpacing;
        appState.rankSpacing = savedRankSpacing;
    }
    if (arrowThicknessInput) {
        arrowThicknessInput.value = savedArrowThickness;
        appState.arrowThickness = savedArrowThickness;
    }
    if (orientationSelect) {
        orientationSelect.value = savedOrientation;
        appState.orientation = savedOrientation;
    }
    
    // Apply spacing button
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            // No validation - let user use any values they want
            const nodeSpacing = parseInt(nodeSpacingInput.value);
            const rankSpacing = parseInt(rankSpacingInput.value);
            const arrowThickness = parseFloat(arrowThicknessInput ? arrowThicknessInput.value : '4');
            const orientation = orientationSelect ? orientationSelect.value : 'horizontal';
            
            // Only use defaults if values are invalid numbers
            const validNodeSpacing = isNaN(nodeSpacing) ? 120 : nodeSpacing;
            const validRankSpacing = isNaN(rankSpacing) ? 200 : rankSpacing;
            const validArrowThickness = isNaN(arrowThickness) ? 4 : Math.max(0.1, arrowThickness);
            
            appState.nodeSpacing = validNodeSpacing;
            appState.rankSpacing = validRankSpacing;
            appState.arrowThickness = validArrowThickness;
            appState.orientation = orientation;
            
            // Save to localStorage
            localStorage.setItem('mermaid-nodeSpacing', validNodeSpacing.toString());
            localStorage.setItem('mermaid-rankSpacing', validRankSpacing.toString());
            localStorage.setItem('mermaid-arrowThickness', validArrowThickness.toString());
            localStorage.setItem('mermaid-orientation', orientation);
            
            // Update Mermaid config (preserve theme and colors)
            if (window.updateMermaidSpacing) {
                window.updateMermaidSpacing(validNodeSpacing, validRankSpacing);
            }
            
            // Re-render current diagram (this will regenerate with correct colors and orientation)
            renderDiagram();
        });
    }
    
    // Allow Enter key to apply
    if (nodeSpacingInput) {
        nodeSpacingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyBtn.click();
            }
        });
    }
    
    if (rankSpacingInput) {
        rankSpacingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyBtn.click();
            }
        });
    }
    
    if (arrowThicknessInput) {
        arrowThicknessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyBtn.click();
            }
        });
    }
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // View selector
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });
    
    // Initialize view
    initView();
    
    // Initialize spacing controls
    initSpacingControls();
    
    // Panel close button
    document.getElementById('closePanel').addEventListener('click', closePanel);
    
    // Close panel when clicking outside
    document.getElementById('detailsPanel').addEventListener('click', (e) => {
        if (e.target.id === 'detailsPanel') {
            closePanel();
        }
    });
    
    // Initialize zoom and pan
    initZoomPan();
    
    // Initialize Mermaid diagram
    initializeMermaidDiagram();
});

// Initialize on window load as well
window.addEventListener('load', () => {
    updateZoomIndicator();
});
