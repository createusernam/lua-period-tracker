import { useI18n } from '../i18n/context';

interface Props {
  onImport: () => void;
  onLogFirst: () => void;
}

export default function OnboardingCard({ onImport, onLogFirst }: Props) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="onboarding-card">
      <h2 className="onboarding-title">{t('onboarding.welcome')}</h2>
      <p className="onboarding-subtitle">{t('onboarding.subtitle')}</p>

      <div className="onboarding-lang-picker">
        <button
          className={`onboarding-lang-btn ${lang === 'ru' ? 'active' : ''}`}
          onClick={() => setLang('ru')}
        >
          Русский
        </button>
        <button
          className={`onboarding-lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang('en')}
        >
          English
        </button>
      </div>

      <div className="onboarding-buttons">
        <button className="btn-primary" onClick={onImport}>
          {t('onboarding.import')}
        </button>
        <button className="btn-secondary" onClick={onLogFirst}>
          {t('onboarding.log_first')}
        </button>
      </div>

      <p className="onboarding-privacy">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {' '}{t('onboarding.privacy')}
      </p>
    </div>
  );
}
