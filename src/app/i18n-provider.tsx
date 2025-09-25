'use client';

import { useEffect } from 'react';
import { I18nextProvider as ReactI18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export function I18nextProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Update document direction and lang when language changes
    const updateDocumentAttributes = () => {
      const currentLang = i18n.language;
      const isRTL = currentLang === 'ar';
      
      document.documentElement.lang = currentLang;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      // Add/remove RTL class for styling
      if (isRTL) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    };

    // Update on initial load
    updateDocumentAttributes();

    // Update when language changes
    i18n.on('languageChanged', updateDocumentAttributes);

    return () => {
      i18n.off('languageChanged', updateDocumentAttributes);
    };
  }, []);

  return (
    <ReactI18nextProvider i18n={i18n}>
      {children}
    </ReactI18nextProvider>
  );
}