import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// FIX: Added .js extension to ensure files are resolved as modules.
import enTranslation from './locales/en/translation.js';
// FIX: Added .js extension to ensure files are resolved as modules.
import zhTranslation from './locales/zh/translation.js';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': {
        translation: enTranslation,
      },
      'zh-CN': {
        translation: zhTranslation,
      },
    },
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
    }
  });

export default i18n;