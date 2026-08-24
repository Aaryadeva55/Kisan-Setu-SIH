import { Language } from '@kisan-setu/types';
import mr from './mr.json' with { type: 'json' };
import hi from './hi.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };

const dictionaries: Record<Language, Record<string, string>> = {
  [Language.MARATHI]: mr,
  [Language.HINDI]: hi,
  [Language.ENGLISH]: en,
};

export const AGRI_CROP_ALIASES: Record<string, { mr: string; hi: string; en: string }> = {
  soybean: { mr: 'सोयाबीन', hi: 'सोयाबीन', en: 'Soybean' },
  cotton: { mr: 'कापूस', hi: 'कपास', en: 'Cotton' },
  onion: { mr: 'कांदा', hi: 'प्याज', en: 'Onion' },
  sugarcane: { mr: 'ऊस', hi: 'गन्ना', en: 'Sugarcane' },
  tomato: { mr: 'टोमॅटो', hi: 'टमाटर', en: 'Tomato' },
  wheat: { mr: 'गहू', hi: 'गेहूं', en: 'Wheat' },
  pomegranate: { mr: 'डाळिंब', hi: 'अनार', en: 'Pomegranate' },
  gram: { mr: 'हरभरा', hi: 'चना', en: 'Gram (Chana)' },
};

export function t(
  key: string,
  lang: Language = Language.MARATHI,
  params: Record<string, string | number> = {}
): string {
  const dict = dictionaries[lang] || dictionaries[Language.MARATHI];
  let text = dict[key] || dictionaries[Language.ENGLISH][key] || key;

  for (const [paramKey, paramValue] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }

  return text;
}

export function translateCropName(cropName: string, lang: Language = Language.MARATHI): string {
  const normalized = cropName.toLowerCase().trim();
  for (const [key, names] of Object.entries(AGRI_CROP_ALIASES)) {
    if (
      normalized.includes(key) ||
      normalized.includes(names.mr.toLowerCase()) ||
      normalized.includes(names.hi.toLowerCase()) ||
      normalized.includes(names.en.toLowerCase())
    ) {
      if (lang === Language.MARATHI) return names.mr;
      if (lang === Language.HINDI) return names.hi;
      return names.en;
    }
  }
  return cropName;
}
