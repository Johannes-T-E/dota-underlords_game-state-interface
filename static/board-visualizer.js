class BoardVisualizer {
    constructor(heroesData) {
        this.heroesData = heroesData;
        this.selectedPlayers = new Set();
        this.playerDataCache = new Map();
        this.init();
    }
    
    init() {
        this.container = document.getElementById('boardsContainer');
        if (!this.container) {
            console.error('[BoardVisualizer] boardsContainer not found');
            return;
        }
        console.log('[BoardVisualizer] Initialized');
    }
    
    togglePlayerBoard(playerId, playerData) {
        if (this.selectedPlayers.has(playerId)) {
            this.selectedPlayers.delete(playerId);
            this.removeBoardDisplay(playerId);
        } else {
            this.selectedPlayers.add(playerId);
            this.addBoardDisplay(playerId, playerData);
        }
        this.updateRowHighlights();
    }
    
    addBoardDisplay(playerId, playerData) {
        if (this.selectedPlayers.has(playerId)) {
            // Check if board already exists to prevent duplicates
            const existingBoard = document.getElementById(`board-${playerId}`);
            if (existingBoard) {
                // Update existing board instead of creating new one
                this.updateBoardDisplay(playerId, playerData.units || []);
                return;
            }
            
            this.playerDataCache.set(playerId, playerData);
            const boardElement = this.createBoardDisplay(playerData);
            this.container.appendChild(boardElement);
        }
    }
    
    removeBoardDisplay(playerId) {
        const boardElement = document.getElementById(`board-${playerId}`);
        if (boardElement) {
            boardElement.remove();
        }
        this.selectedPlayers.delete(playerId);
        this.playerDataCache.delete(playerId);
    }
    
    updateBoardDisplay(playerId, units) {
        if (this.selectedPlayers.has(playerId)) {
            const boardElement = document.getElementById(`board-${playerId}`);
            if (boardElement) {
                this.positionUnitsOnBoard(units, boardElement);
            }
        }
    }
    
    createBoardDisplay(player) {
        const boardWrapper = document.createElement('div');
        boardWrapper.className = 'board-wrapper';
        boardWrapper.id = `board-${player.player_id}`;
        
        const playerName = player.persona_name || player.bot_persona_name || 'Unknown';
        
        boardWrapper.innerHTML = `
            <div class="board-header">
                <span class="board-player-name">${playerName}</span>
                <button class="board-close-btn" onclick="if(window.boardVisualizer) window.boardVisualizer.removeBoardDisplay('${player.player_id}')">×</button>
            </div>
            <div class="board-grid-container">
                <div class="board-grid" id="board-grid-${player.player_id}">
                    ${this.createBoardGrid()}
                </div>
                <div class="bench-grid" id="bench-grid-${player.player_id}">
                    ${this.createBenchGrid()}
                </div>
            </div>
        `;
        
        // Position units on the board
        this.positionUnitsOnBoard(player.units || [], boardWrapper);
        
        return boardWrapper;
    }
    
    createBoardGrid() {
        let gridHTML = '';
        // Create 8x4 grid (y: 0-3, x: 0-7)
        for (let y = 3; y >= 0; y--) { // Top to bottom (y=3 to y=0)
            for (let x = 0; x < 8; x++) {
                gridHTML += `<div class="board-cell" data-x="${x}" data-y="${y}"></div>`;
            }
        }
        return gridHTML;
    }
    
    createBenchGrid() {
        let gridHTML = '';
        // Create 8x1 bench (y: -1, x: 0-7)
        for (let x = 0; x < 8; x++) {
            gridHTML += `<div class="bench-cell" data-x="${x}" data-y="-1"></div>`;
        }
        return gridHTML;
    }
    
    positionUnitsOnBoard(units, boardElement) {
        // Clear existing units
        const cells = boardElement.querySelectorAll('.board-cell, .bench-cell');
        cells.forEach(cell => {
            const existingUnit = cell.querySelector('.board-unit');
            if (existingUnit) {
                existingUnit.remove();
            }
        });
        
        // Position each unit
        units.forEach(unit => {
            if (unit.position) {
                const x = unit.position.x;
                const y = unit.position.y;
                
                let cell;
                if (y === -1) {
                    // Bench unit
                    cell = boardElement.querySelector(`.bench-cell[data-x="${x}"][data-y="-1"]`);
                } else if (y >= 0 && y <= 3) {
                    // Board unit
                    cell = boardElement.querySelector(`.board-cell[data-x="${x}"][data-y="${y}"]`);
                }
                
                if (cell) {
                    const unitElement = this.createBoardUnitElement(unit);
                    cell.appendChild(unitElement);
                }
            }
        });
    }
    
    createBoardUnitElement(unit) {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'board-unit';
        
        const unitId = unit.unit_id || 0;
        const dotaUnitName = this.getDotaUnitNameFromUnitId(unitId);
        const starLevel = unit.rank || 0;
        const heroImage = `/static/icons/hero_icons_scaled_56x56/${dotaUnitName}_png.png`;
        
        unitDiv.innerHTML = `
            <img src="${heroImage}" 
                 alt="${dotaUnitName}" 
                 class="board-hero-portrait"
                 onerror="this.src='/static/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png'">
            <div class="board-stars-container">
                <div class="board-star-list">
                    ${this.createStarIcons(starLevel)}
                </div>
            </div>
        `;
        
        return unitDiv;
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
    
    createStarIcons(starLevel) {
        let stars = '';
        for (let i = 0; i < starLevel; i++) {
            stars += `<div class="board-star-icon rank${Math.min(starLevel, 3)}"></div>`;
        }
        return stars;
    }
    
    updateRowHighlights() {
        // No visual highlighting needed - selection state is maintained internally
    }
    
    // Public method to be called from main scoreboard
    onPlayerDataUpdate(playerId, playerData) {
        if (this.selectedPlayers.has(playerId)) {
            this.playerDataCache.set(playerId, playerData);
            this.updateBoardDisplay(playerId, playerData.units || []);
        }
    }
    
    // Public method to clear all boards
    clearAllBoards() {
        this.selectedPlayers.clear();
        this.playerDataCache.clear();
        this.container.innerHTML = '';
        this.updateRowHighlights();
    }
}

// Global instance - will be initialized by main scoreboard
let boardVisualizer = null;
