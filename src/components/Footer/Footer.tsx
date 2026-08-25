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
            <h3>{t('footer.privacyTitle')}</h3>
            <p>{t('footer.privacyBody')}</p>
          </div>

          {/* Lokale Verwerking */}
          <div className="footer-block">
            <h3>{t('footer.localTitle')}</h3>
            <p>{t('footer.localBody')}</p>
          </div>

          {/* Disclaimer */}
          <div className="footer-block">
            <h3>{t('footer.disclaimerTitle')}</h3>
            <p>{t('footer.disclaimerBody')}</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p className="footer-copy">
            {t('footer.attribution', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
};
