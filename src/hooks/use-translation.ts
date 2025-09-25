// src/hooks/use-translation.ts
import { useTranslation as useReactTranslation } from 'react-i18next';

export function useTranslation() {
  const { t, i18n } = useReactTranslation();
  
  const isRTL = i18n.language === 'ar';
  const currentLanguage = i18n.language;
  
  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
  };

  return {
    t,
    i18n,
    isRTL,
    currentLanguage,
    changeLanguage
  };
}