import { ReactNode, useEffect } from 'react';
import './PageHeader.css';

export interface PageHeaderProps {
  title: string;
  icon: ReactNode;
  titleSuffix?: ReactNode;
  description?: string;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  icon,
  titleSuffix,
  description,
  centerContent,
  rightContent,
  className = '',
}: PageHeaderProps) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header__left">
        <span className="page-header__icon" aria-hidden>
          {icon}
        </span>
        <div className="page-header__text">
          <div className="page-header__title-row">
            <h1 className="page-header__title">{title}</h1>
            {titleSuffix ? <div className="page-header__title-suffix">{titleSuffix}</div> : null}
          </div>
          {description && <p className="page-header__description">{description}</p>}
        </div>
      </div>

      {centerContent ? <div className="page-header__center">{centerContent}</div> : <div className="page-header__center" />}
      {rightContent ? <div className="page-header__right">{rightContent}</div> : <div className="page-header__right" />}
    </header>
  );
};
