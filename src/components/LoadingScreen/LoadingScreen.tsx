import { useTranslation } from 'react-i18next'
import './LoadingScreen.css'

export const LoadingScreen = () => {
  const { t } = useTranslation()
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-content">
        <div className="spinner" aria-hidden="true"></div>
        <p>{t('survey_loading')}</p>
      </div>
    </div>
  )
}
