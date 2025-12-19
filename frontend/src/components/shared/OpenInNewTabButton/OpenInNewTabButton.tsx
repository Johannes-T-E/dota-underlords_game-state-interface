import { Link } from 'react-router-dom';
import './OpenInNewTabButton.css';

export interface OpenInNewTabButtonProps {
  href: string;
  className?: string;
  title?: string;
}

export const OpenInNewTabButton = ({ 
  href, 
  className = '',
  title = 'Open in new tab'
}: OpenInNewTabButtonProps) => {
  return (
    <Link
      to={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`open-in-new-tab-button ${className}`}
      title={title}
      onClick={(e) => {
        // Prevent navigation in current tab if clicked normally
        // The target="_blank" will handle opening in new tab
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="open-in-new-tab-button__icon"
      >
        <path
          d="M10 2H14V6M14 2L8 8M14 2V6H10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
};


