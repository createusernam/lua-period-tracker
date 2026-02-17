import { useI18n } from '../i18n/context';

interface Props {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: Props) {
  const { t } = useI18n();

  const sections = [
    { title: 'privacy.data_title', text: 'privacy.data_text' },
    { title: 'privacy.storage_title', text: 'privacy.storage_text' },
    { title: 'privacy.gdrive_title', text: 'privacy.gdrive_text' },
    { title: 'privacy.thirdparty_title', text: 'privacy.thirdparty_text' },
    { title: 'privacy.rights_title', text: 'privacy.rights_text' },
    { title: 'privacy.not_medical', text: 'privacy.not_medical_text' },
    { title: 'privacy.contact_title', text: 'privacy.contact_text' },
  ] as const;

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button onClick={onClose} className="settings-back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('settings.back')}
        </button>
        <h2>{t('privacy.title')}</h2>
        <div className="settings-header-spacer" />
      </div>

      <div className="settings-content">
        <p className="privacy-intro">{t('privacy.intro')}</p>

        {sections.map(({ title, text }) => (
          <div key={title} className="privacy-section">
            <h3>{t(title)}</h3>
            <p>{t(text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
