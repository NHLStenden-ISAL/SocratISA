/**
 * LoadingScreen: laadscherm tussen pagina's dat optioneel voortgang van het AI model ophalen weergeeft.
 */
import { useTranslation } from 'react-i18next';
import { formatProgressText } from '../../utils/progress';
import type { ProgressInfo } from '../../types';
import './LoadingScreen.css';

interface LoadingScreenProps {
  progressInfo?: ProgressInfo | null;
}

export const LoadingScreen = ({ progressInfo }: LoadingScreenProps) => {
  const { t } = useTranslation();
  return (
    <div className="loading-screen" role="status" aria-live="polite" tabIndex={-1} autoFocus>
      <div className="loading-content">

        {/* Laad spinner */}
        <div className="spinner" aria-hidden="true"></div>

        {/* Laadbalk */}
        {progressInfo && <progress className="progress loading" value={progressInfo.percentage} max={100} />}

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
