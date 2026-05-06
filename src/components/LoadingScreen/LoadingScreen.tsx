import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgressInfo } from '../../types'
import './LoadingScreen.css'

interface LoadingScreenProps {
  progressInfo?: ProgressInfo | null;
}

export const LoadingScreen = ({ progressInfo }: LoadingScreenProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(function focusContainer() {
    containerRef.current?.focus()
  }, [])

  const showProgress = progressInfo && progressInfo.percentage > 0;

  return (
    <div className="loading-screen" role="status" aria-live="polite" tabIndex={-1} ref={containerRef}>
      <div className="loading-content">
        <div className="spinner" aria-hidden="true"></div>
        {showProgress && (
          <div className="loading-progress-track">
            <div className="loading-progress-fill" style={{ width: `${progressInfo.percentage}%` }}></div>
          </div>
        )}
        <p>
          {showProgress
            ? (progressInfo.isDownloading ? t('home_preload_downloading') : t('home_preload_cache'))
                + (progressInfo.mbFetched != null ? ': ' + progressInfo.mbFetched + ' MB' : '')
                + ' (' + progressInfo.percentage + '%)'
            : (progressInfo?.text || t('generic_loading'))
          }
        </p>
      </div>
    </div>
  )
}
