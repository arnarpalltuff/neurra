import { useSettingsStore } from '../stores/settingsStore';
import { translations, TranslationStrings, Language } from './translations';

/**
 * Hook to get translated strings based on the current language setting.
 * Falls back to English for any missing keys.
 */
export function useTranslation(): TranslationStrings & { language: Language } {
  const language = useSettingsStore(s => s.language);
  const t = translations[language] ?? translations.en;
  return { ...t, language };
}

/**
 * Non-hook version for use outside of React components.
 */
export function getTranslation(): TranslationStrings {
  const language = useSettingsStore.getState().language;
  return translations[language] ?? translations.en;
}
