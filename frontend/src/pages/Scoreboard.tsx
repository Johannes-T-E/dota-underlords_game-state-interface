import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { ConnectionStatus } from '../components/Scoreboard/ConnectionStatus';
import { MatchInfo } from '../components/Scoreboard/MatchInfo';
import { ScoreboardTable } from '../components/Scoreboard/ScoreboardTable';
import '../styles/scoreboard.css';
import '../styles/board-visualizer.css';

export const Scoreboard = () => {
  const { currentMatch } = useAppSelector((state) => state.match);

  return (
    <div className="container">
      <h1>Dota Underlords - Live Scoreboard</h1>
      
      <div className="navigation">
        <Link to="/matches" className="nav-button">
          Manage Matches
        </Link>
      </div>

      <ConnectionStatus />
      <MatchInfo />

      {currentMatch ? (
        <>
          <ScoreboardTable />
          {/* Board visualizations container */}
          <div id="boardsContainer" className="boards-container"></div>
        </>
      ) : (
        <div id="noMatch" className="no-match">
          <div className="no-match-content">
            <h2>No Active Match</h2>
            <p>Waiting for GSI data from Dota Underlords...</p>
            <div className="spinner"></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      <div id="errorMessage" className="error-message hide">
        <div className="error-text">An error occurred</div>
      </div>
    </div>
  );
};

