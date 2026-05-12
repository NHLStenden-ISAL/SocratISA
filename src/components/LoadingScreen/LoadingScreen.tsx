/**
 * LoadingScreen: laadscherm tussen pagina's dat optioneel voortgang van het AI model ophalen weergeeft.
 */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatProgressText } from '../../utils/progress';
import { useAutoFocus } from '../../hooks';
import type { ProgressInfo } from '../../types';
import './LoadingScreen.css';

interface LoadingScreenProps {
  progressInfo?: ProgressInfo | null;
}

export const LoadingScreen = ({ progressInfo }: LoadingScreenProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  useAutoFocus(containerRef);

  const showProgress = !!progressInfo;

  return (
    <div className="loading-screen" role="status" aria-live="polite" tabIndex={-1} ref={containerRef}>
      <div className="loading-content">

        {/* Laad spinner */}
        <div className="spinner" aria-hidden="true"></div>

        {/* Laadbalk */}
        {showProgress && (
          <div className="loading-progress-track">
            <div className="loading-progress-fill" style={{ width: `${progressInfo.percentage}%` }}></div>
          </div>
        )}

        {/* Laad tijd schatting */}
        {progressInfo?.isDownloading && (
          <p className="loading-eta">{t('home_preload_eta')}</p>
        )}

        {/* Laad progressie tekst */}
        <p>
          {formatProgressText(progressInfo, t)}
        </p>
      </div>
    </div>
  );
}
