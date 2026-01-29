// Translation registry
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { es } from './es';

export const translations = {
    en,
    zh,
    ja,
    es,
};

export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export const defaultLanguage = 'en';
