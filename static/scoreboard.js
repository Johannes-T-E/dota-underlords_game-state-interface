class UnderlordsScoreboard {
    constructor() {
        console.log('UnderlordsScoreboard instance created');
        this.socket = null;
        this.data = null;
        this.lastState = null;
        this.currentSort = { field: 'health', direction: 'desc' };
        this.playerChangeEvents = {};
        this.heroesData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHeroesData();
        this.connectWebSocket();
    }

    async loadHeroesData() {
        try {
            const response = await fetch('/static/underlords_heroes.json');
            this.heroesData = await response.json();
            console.log('[Scoreboard] Heroes data loaded');
        } catch (error) {
            console.error('[Scoreboard] Failed to load heroes data:', error);
        }
    }

    getDotaUnitNameFromUnitId(unitId) {
        if (!this.heroesData || !this.heroesData.heroes) {
            return 'npc_dota_hero_abaddon'; // fallback
        }
        
        // Find hero by ID and return dota_unit_name
        for (const [heroName, heroData] of Object.entries(this.heroesData.heroes)) {
            if (heroData.id === unitId) {
                return heroData.dota_unit_name || 'npc_dota_hero_abaddon';
            }
        }
        
        return 'npc_dota_hero_abaddon'; // fallback
    }

    setupEventListeners() {
        // Sort functionality
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const field = e.target.dataset.sort;
                this.sortBy(field);
            });
        });
    }

    connectWebSocket() {
        // Connect to SocketIO server
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected to server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('[WebSocket] Disconnected from server');
            this.updateConnectionStatus(false);
        });

        this.socket.on('match_update', (data) => {
            console.log('[WebSocket] Received match update:', data);
            this.handleMatchUpdate(data);
        });

        this.socket.on('connection_response', (data) => {
            console.log('[WebSocket] Connection response:', data);
        });

        this.socket.on('test_response', (data) => {
            console.log('[WebSocket] Test response:', data);
        });
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.className = 'connection-indicator connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'connection-indicator disconnected';
            text.textContent = 'Disconnected';
        }
    }

    handleMatchUpdate(data) {
        this.data = data;
        this.displayScoreboard();
    }

    displayScoreboard() {
        if (!this.data || !this.data.players) {
            this.showNoMatch();
            return;
        }

        this.hideError();
        this.showMatchInfo();
        this.showScoreboard();

        let shouldRender = false;
        if (!this.lastState) {
            shouldRender = true;
            console.log('[Scoreboard] Full render: no lastState');
        } else if (this.lastState.players.length !== this.data.players.length) {
            shouldRender = true;
            console.log('[Scoreboard] Full render: player count changed');
        } else if (!this.samePlayerOrder(this.lastState.players, this.data.players)) {
            shouldRender = true;
            console.log('[Scoreboard] Full render: player order changed');
        } else if (this.hasContentChanges(this.lastState.players, this.data.players)) {
            shouldRender = true;
            console.log('[Scoreboard] Full render: content changed');
        }
        
        if (shouldRender) {
            this.renderTable();
            this.lastState = JSON.parse(JSON.stringify(this.data));
        } else {
            this.updateTableWithDiff(this.data.players);
        }
    }

    showMatchInfo() {
        const matchInfo = document.getElementById('matchInfo');
        const matchIdValue = document.getElementById('matchIdValue');
        const roundValue = document.getElementById('roundValue');
        const phaseValue = document.getElementById('phaseValue');

        matchIdValue.textContent = this.data.match_id || 'Unknown';
        roundValue.textContent = this.data.round || 0;
        phaseValue.textContent = this.data.phase || 'Unknown';

        matchInfo.classList.remove('hide');
    }

    showScoreboard() {
        document.getElementById('scoreboard').classList.remove('hide');
        document.getElementById('noMatch').classList.add('hide');
    }

    showNoMatch() {
        document.getElementById('scoreboard').classList.add('hide');
        document.getElementById('noMatch').classList.remove('hide');
        document.getElementById('matchInfo').classList.add('hide');
    }

    // Helper to check if player order is the same
    samePlayerOrder(arr1, arr2) {
        if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].player_id !== arr2[i].player_id) return false;
        }
        return true;
    }

    hasContentChanges(oldPlayers, newPlayers) {
        if (!oldPlayers || !newPlayers) return true;
        if (oldPlayers.length !== newPlayers.length) return true;
        
        for (let i = 0; i < oldPlayers.length; i++) {
            const oldPlayer = oldPlayers[i];
            const newPlayer = newPlayers[i];
            
            // Check if key fields have changed
            if (oldPlayer.health !== newPlayer.health ||
                oldPlayer.gold !== newPlayer.gold ||
                oldPlayer.level !== newPlayer.level ||
                oldPlayer.wins !== newPlayer.wins ||
                oldPlayer.losses !== newPlayer.losses ||
                oldPlayer.net_worth !== newPlayer.net_worth ||
                !this.arraysEqual(oldPlayer.units, newPlayer.units)) {
                return true;
            }
        }
        return false;
    }

    // Helper for deep array comparison
    arraysEqual(arr1, arr2) {
        if (arr1 === arr2) return true;
        if (!arr1 || !arr2) return false;
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (!this.objectsEqual(arr1[i], arr2[i])) return false;
        }
        return true;
    }

    objectsEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    updateTableWithDiff(players) {
        if (!this.lastState) {
            this.renderTable();
            this.lastState = JSON.parse(JSON.stringify(this.data));
            return;
        }

        players.forEach((player, idx) => {
            const lastPlayer = this.lastState.players[idx];
            const playerId = player.player_id;

            // Gold changes
            if (player.gold !== lastPlayer.gold) {
                this.updateGoldDisplay(playerId, player.gold);
                this.addChangeEvent(playerId, { type: 'gold', delta: player.gold - lastPlayer.gold });
            }

            // Health changes
            if (player.health !== lastPlayer.health) {
                this.updateHealthDisplay(playerId, player.health);
                this.addChangeEvent(playerId, { type: 'health', delta: player.health - lastPlayer.health });
            }

            // Level changes
            if (player.level !== lastPlayer.level) {
                this.updateLevelDisplay(playerId, player.level);
                this.addChangeEvent(playerId, { type: 'level', delta: player.level - lastPlayer.level });
            }

            // Units changes (check both roster and bench)
            if (!this.arraysEqual(player.units, lastPlayer.units)) {
                this.updateUnitsDisplay(playerId, player.units);
                this.addChangeEvent(playerId, { type: 'units', delta: 1 });
            }
        });

        // Save new state
        this.lastState = JSON.parse(JSON.stringify(this.data));
    }

    // Add a change event to the scrolling bar for a player
    addChangeEvent(playerId, event) {
        if (!this.playerChangeEvents[playerId]) this.playerChangeEvents[playerId] = [];
        this.pruneChangeEvents(playerId);
        this.playerChangeEvents[playerId].unshift({ ...event, timestamp: Date.now() });
        
        const bar = document.querySelector(`#player-${playerId} .change-bar`);
        if (bar) this.renderChangeBar(playerId, bar);
        
        // Remove after 4s
        setTimeout(() => {
            this.pruneChangeEvents(playerId);
            const bar2 = document.querySelector(`#player-${playerId} .change-bar`);
            if (bar2) this.renderChangeBar(playerId, bar2);
        }, 4000);
    }

    pruneChangeEvents(playerId) {
        const now = Date.now();
        if (!this.playerChangeEvents[playerId]) return;
        this.playerChangeEvents[playerId] = this.playerChangeEvents[playerId].filter(e => now - e.timestamp < 4000).slice(0, 10);
    }

    renderChangeBar(playerId, bar) {
        bar.innerHTML = '';
        const events = this.playerChangeEvents[playerId] || [];
        events.forEach(event => {
            const el = document.createElement('div');
            el.className = 'change-event';
            if (event.type === 'gold') {
                el.textContent = (event.delta > 0 ? '+' : '') + event.delta + 'g';
                el.style.color = event.delta < 0 ? '#e6c200' : '#bada55';
            } else if (event.type === 'health') {
                el.textContent = (event.delta > 0 ? '+' : '') + event.delta + 'hp';
                el.style.color = event.delta < 0 ? '#e74c3c' : '#2ecc40';
            } else if (event.type === 'level') {
                el.textContent = 'Lv' + (event.delta > 0 ? '+' : '') + event.delta;
                el.style.color = '#00bfff';
            } else if (event.type === 'units') {
                el.textContent = 'Units';
                el.style.color = '#aaa';
            }
            bar.appendChild(el);
        });
    }

    updateGoldDisplay(playerId, gold) {
        const el = document.querySelector(`#player-${playerId} .gold-label`);
        if (el) el.textContent = gold;
    }

    updateHealthDisplay(playerId, health) {
        const el = document.querySelector(`#player-${playerId} .health-large`);
        if (el) el.textContent = health;
    }

    updateLevelDisplay(playerId, level) {
        const el = document.querySelector(`#player-${playerId} .unit-label`);
        if (el) el.textContent = level;
    }

    updateUnitsDisplay(playerId, units) {
        const playerRow = document.querySelector(`#player-${playerId}`);
        if (!playerRow) return;
        
        // Separate units into roster (y >= 0) and bench (y = -1)
        const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
        const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);
        
        const rosterCol = playerRow.querySelector('.col-roster');
        if (rosterCol) {
            rosterCol.innerHTML = this.createRosterContainer(rosterUnits);
        }
        
        const benchCol = playerRow.querySelector('.col-bench');
        if (benchCol) {
            benchCol.innerHTML = this.createBenchContainer(benchUnits);
        }
    }

    renderTable() {
        console.log('[Scoreboard] renderTable called: full DOM re-render');
        const playersContainer = document.getElementById('playersContainer');
        
        playersContainer.innerHTML = '';

        // Sort players by current sort criteria
        const sortedPlayers = this.getSortedPlayers();

        sortedPlayers.forEach((player, index) => {
            const playerRow = this.createPlayerRow(player, index + 1);
            playersContainer.appendChild(playerRow);
        });
    }

    createPlayerRow(player, position) {
        const row = document.createElement('div');
        row.className = 'player-row';
        row.id = `player-${player.player_id}`;
        
        const playerName = player.persona_name || player.bot_persona_name || 'Unknown';
        const isHuman = player.is_human_player;
        
        // Separate units into roster (y >= 0) and bench (y = -1)
        const units = player.units || [];
        const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
        const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);
        
        row.innerHTML = `
            <div class="col-place" style="display: flex; align-items: center;">
                <div class="change-bar" style="width: 40px; min-height: 40px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start; margin-right: 4px; background: rgba(0,0,0,0.08); border-radius: 6px;"></div>
                <div class="place-number">${position}</div>
            </div>
            <div class="col-player">
                <div class="name-container">
                    <div class="player-name">${playerName}</div>
                    <div class="name-bottom">
                        <div class="unit-display">
                            <div class="unit-icon"></div>
                            <div class="unit-label">${player.level || 0}</div>
                        </div>
                        <div class="gold-display">
                            <div class="gold-icon"></div>
                            <div class="gold-label">${player.gold || 0}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-health">
                <div class="health-column">
                    <div class="health-large">${player.health !== null ? player.health : '—'}</div>
                    <div class="health-icon-large"></div>
                </div>
            </div>
            <div class="col-record">
                <div class="record-label">${this.formatRecord(player)}</div>
            </div>
            <div class="col-networth">
                <div class="networth-label">${player.net_worth !== null ? player.net_worth : '—'}</div>
            </div>
            <div class="col-roster">
                ${this.createRosterContainer(rosterUnits)}
            </div>
            <div class="col-bench">
                ${this.createBenchContainer(benchUnits)}
            </div>
        `;
        
        // Add self class for human player
        if (isHuman) {
            row.classList.add('self');
        }
        
        // Populate change bar
        setTimeout(() => {
            const bar = row.querySelector('.change-bar');
            if (bar) this.renderChangeBar(player.player_id, bar);
        }, 0);
        
        return row;
    }

    createRosterContainer(units) {
        const container = document.createElement('div');
        container.className = 'roster-container';
        
        units.forEach(unit => {
            const unitElement = this.createUnitElement(unit);
            container.appendChild(unitElement);
        });
        
        return container.outerHTML;
    }

    createBenchContainer(bench) {
        const container = document.createElement('div');
        container.className = 'bench-container';
        
        bench.forEach(unit => {
            const unitElement = this.createUnitElement(unit);
            container.appendChild(unitElement);
        });
        
        return container.outerHTML;
    }

    createUnitElement(unit) {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'roster-unit';
        
        const unitId = unit.unit_id || 0;
        const dotaUnitName = this.getDotaUnitNameFromUnitId(unitId);
        const starLevel = unit.rank || 0;
        const heroImage = `/static/icons/hero_icons_scaled_56x56/${dotaUnitName}_png.png`;
        
        unitDiv.innerHTML = `
            <img src="${heroImage}" 
                 alt="${dotaUnitName}" 
                 class="hero-portrait"
                 onerror="this.src='/static/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png'">
            <div class="stars-container">
                <div class="star-list">
                    ${this.createStarIcons(starLevel)}
                </div>
            </div>
        `;
        
        return unitDiv;
    }

    createStarIcons(starLevel) {
        let stars = '';
        for (let i = 0; i < starLevel; i++) {
            stars += `<div class="star-icon rank${Math.min(starLevel, 3)}"></div>`;
        }
        return stars;
    }

    formatRecord(player) {
        if (player.wins === null || player.losses === null) {
            return '—';
        }
        const wins = player.wins || 0;
        const losses = player.losses || 0;
        return `${wins}-${losses}`;
    }

    getSortedPlayers() {
        if (!this.data.players) return [];
        
        const players = [...this.data.players];
        
        return players.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.currentSort.field) {
                case 'health':
                    aValue = a.health !== null ? a.health : -1;
                    bValue = b.health !== null ? b.health : -1;
                    break;
                case 'record':
                    aValue = (a.wins !== null && a.losses !== null) ? (a.wins - a.losses) : -999;
                    bValue = (b.wins !== null && b.losses !== null) ? (b.wins - b.losses) : -999;
                    break;
                case 'networth':
                    aValue = a.net_worth !== null ? a.net_worth : -1;
                    bValue = b.net_worth !== null ? b.net_worth : -1;
                    break;
                default:
                    aValue = a.health !== null ? a.health : -1;
                    bValue = b.health !== null ? b.health : -1;
            }
            
            const result = aValue - bValue;
            return this.currentSort.direction === 'asc' ? result : -result;
        });
    }

    sortBy(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'desc';
        }
        
        this.updateSortIndicators();
        this.renderTable();
    }

    updateSortIndicators() {
        // Remove active class from all headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('active');
            const arrow = header.querySelector('.sort-arrow');
            if (arrow) arrow.remove();
        });
        
        // Add active class and arrow to current sort header
        const activeHeader = document.querySelector(`[data-sort="${this.currentSort.field}"]`);
        if (activeHeader) {
            activeHeader.classList.add('active');
            const arrow = document.createElement('span');
            arrow.className = 'sort-arrow';
            arrow.textContent = this.currentSort.direction === 'asc' ? '▲' : '▼';
            activeHeader.appendChild(arrow);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.querySelector('.error-text').textContent = message;
        errorDiv.classList.remove('hide');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hide');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.scoreboardApp) {
        window.scoreboardApp = new UnderlordsScoreboard();
    }
});
