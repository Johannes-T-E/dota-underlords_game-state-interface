class MatchManager {
    constructor() {
        this.matches = [];
        this.init();
    }

    async init() {
        await this.loadMatches();
    }

    async loadMatches() {
        try {
            const response = await fetch('/api/matches');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.matches = data.matches;
                this.renderMatches();
            }
        } catch (error) {
            console.error('Failed to load matches:', error);
            this.showError('Failed to load matches');
        }
    }

    renderMatches() {
        const container = document.getElementById('matchesList');
        
        if (this.matches.length === 0) {
            container.innerHTML = '<div class="empty-state">No matches found in database</div>';
            return;
        }

        container.innerHTML = this.matches.map(match => `
            <div class="match-item" data-match-id="${match.match_id}">
                <div class="match-info">
                    <div class="match-id">Match ID: ${match.match_id}</div>
                    <div class="match-meta">
                        Started: ${new Date(match.started_at).toLocaleString()} | 
                        Ended: ${match.ended_at ? new Date(match.ended_at).toLocaleString() : 'In Progress'} | 
                        Players: ${match.player_count}
                    </div>
                </div>
                <button class="delete-button" onclick="matchManager.deleteMatch('${match.match_id}')">
                    Delete Match
                </button>
            </div>
        `).join('');
    }

    async deleteMatch(matchId) {
        if (!confirm(`Are you sure you want to delete match ${matchId}?\n\nThis will permanently remove:\n- Match record\n- All player data\n- All snapshots\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/matches/${matchId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                console.log('Match deleted:', matchId);
                // Remove from local array and re-render
                this.matches = this.matches.filter(m => m.match_id !== matchId);
                this.renderMatches();
            } else {
                alert('Failed to delete match: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Failed to delete match');
        }
    }

    showError(message) {
        const container = document.getElementById('matchesList');
        container.innerHTML = `<div class="empty-state">${message}</div>`;
    }
}

// Initialize when page loads
const matchManager = new MatchManager();
