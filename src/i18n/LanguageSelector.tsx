import React from 'react';
import { useI18n } from './context';
import { Language } from './types';
import { Select } from '../shared/components/Select';

const languages: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'be', label: 'Беларуская' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Select
        options={languages}
        value={language}
        onChange={(v) => setLanguage(v as Language)}
        className="w-32"
      />
    </div>
  );
}

