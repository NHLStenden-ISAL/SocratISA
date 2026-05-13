/**
 * Footer: voettekst met privacyinformatie, disclaimer en copyright.
 */
import { useTranslation } from 'react-i18next';
import './Footer.css';

export const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-sections">

          {/* Privacy */}
          <div className="footer-block">
            <h3>{t('footer_privacy_title')}</h3>
            <p>{t('footer_privacy_body')}</p>
          </div>

          {/* Lokale Verwerking */}
          <div className="footer-block">
            <h3>{t('footer_local_title')}</h3>
            <p>{t('footer_local_body')}</p>
          </div>

          {/* Disclaimer */}
          <div className="footer-block">
            <h3>{t('footer_disclaimer_title')}</h3>
            <p>{t('footer_disclaimer_body')}</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p className="footer-copy">
            {t('footer_attribution', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
};
