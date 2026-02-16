import { useI18n } from '../i18n/context';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switcher">
      <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
      <span className="lang-divider">|</span>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}
