import enMessages from '../messages/en.json';
import bnMessages from '../messages/bn.json';

export type Locale = 'en' | 'bn';

export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'bn'];

const dictionaries: Record<Locale, typeof enMessages> = {
  en: enMessages,
  bn: bnMessages as typeof enMessages,
};

export function getDictionary(locale: string = 'en') {
  const target = locale === 'bn' ? 'bn' : 'en';
  return dictionaries[target] || dictionaries.en;
}

export function getNestedTranslation(obj: any, path: string): string {
  if (!obj || !path) return path;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}
