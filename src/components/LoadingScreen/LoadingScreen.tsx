import { useTranslation } from 'react-i18next'
import './LoadingScreen.css'

interface LoadingScreenProps {
  progressText?: string;
}

export const LoadingScreen = ({ progressText }: LoadingScreenProps) => {
  const { t } = useTranslation()
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-content">
        <div className="spinner" aria-hidden="true"></div>
        <p>{progressText || t('generic_loading')}</p>
      </div>
    </div>
  )
}
