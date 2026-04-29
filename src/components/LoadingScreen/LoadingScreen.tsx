import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './LoadingScreen.css'

interface LoadingScreenProps {
  progressText?: string;
}

export const LoadingScreen = ({ progressText }: LoadingScreenProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  return (
    <div className="loading-screen" role="status" aria-live="polite" tabIndex={-1} ref={containerRef}>
      <div className="loading-content">
        <div className="spinner" aria-hidden="true"></div>
        <p>{progressText || t('generic_loading')}</p>
      </div>
    </div>
  )
}
