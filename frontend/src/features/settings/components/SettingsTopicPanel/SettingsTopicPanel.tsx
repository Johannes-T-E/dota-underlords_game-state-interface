import { ReactNode, useState } from 'react';
import './SettingsTopicPanel.css';

export interface SettingsTopicPanelProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Compact preview shown in the panel header (other sections). */
  preview?: ReactNode;
  /** Larger preview pinned to the right of the control column while scrolling. */
  sidePreview?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export const SettingsTopicPanel = ({
  id,
  title,
  description,
  children,
  preview,
  sidePreview,
  defaultOpen = true,
  collapsible = true,
  className = '',
}: SettingsTopicPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={`settings-topic-panel ${className}`.trim()}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <header
        className={`settings-topic-panel__header ${collapsible ? 'settings-topic-panel__header--clickable' : ''}`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="settings-topic-panel__header-leading">
          {collapsible && (
            <span
              className={`settings-topic-panel__toggle ${isOpen ? 'settings-topic-panel__toggle--open' : ''}`}
              aria-hidden
            >
              ▶
            </span>
          )}
          <div className="settings-topic-panel__header-text">
            <h3 id={`${id}-title`} className="settings-topic-panel__title">
              {title}
            </h3>
            {description && <p className="settings-topic-panel__description">{description}</p>}
          </div>
        </div>

        {preview != null && (
          <div
            className="settings-topic-panel__preview"
            aria-label={`${title} preview`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="settings-topic-panel__preview-content">{preview}</div>
          </div>
        )}
      </header>

      {isOpen && (
        <div className="settings-topic-panel__body">
          {sidePreview != null ? (
            <div className="settings-topic-panel__body-split">
              <div className="settings-topic-panel__controls">{children}</div>
              <aside
                className="settings-topic-panel__side-preview"
                aria-label={`${title} live preview`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {sidePreview}
              </aside>
            </div>
          ) : (
            <div className="settings-topic-panel__controls">{children}</div>
          )}
        </div>
      )}
    </section>
  );
};
