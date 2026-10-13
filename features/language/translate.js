import messages from './messages.json' with { type: 'json' };

export const LANGUAGE_KEY = 'toeic900:language';
export const LANGUAGE_COOKIE = 'toeic900-language';
export const LANGUAGES = [
  { code: 'en', label: 'English', dateLocale: 'en-GB' },
  { code: 'vi', label: 'Tiếng Việt', dateLocale: 'vi-VN' },
  { code: 'zh', label: '中文', dateLocale: 'zh-CN' },
  { code: 'ko', label: '한국어', dateLocale: 'ko-KR' },
];
export const validLanguage = (value) => LANGUAGES.some((language) => language.code === value);
export const languageOf = (value) => validLanguage(value) ? value : 'en';

const interpolate = (text, values) => text.replace(/\{(\d+)\}/g, (match, index) => values[index] ?? match);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.keys(messages).filter((key) => /\{\d+\}/.test(key) && /[a-z]/i.test(key))
  .sort((a, b) => b.replace(/\{\d+\}/g, '').length - a.replace(/\{\d+\}/g, '').length)
  .map((key) => ({
    key,
    regex: new RegExp('^' + key.split(/\{\d+\}/).map(escapeRegex).join('(\\d+(?:\\.\\d+)?)') + '$'),
    indices: [...key.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1])),
  }));

export function translate(locale, text, values = []) {
  if (typeof text !== 'string') return text;
  const language = languageOf(locale);
  if (language === 'en') return interpolate(text, values);
  if (Object.hasOwn(messages, text)) {
    return interpolate(messages[text][language] ?? text, values);
  }
  // Labels from saved results and lesson metadata arrive as complete strings.
  for (const separator of [' · ', ' — ']) {
    if (text.includes(separator)) return text.split(separator).map((part) => translate(language, part)).join(separator);
  }
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const params = [];
      pattern.indices.forEach((index, i) => { params[index] = translate(language, match[i + 1]); });
      return translate(language, pattern.key, params);
    }
  }
  return interpolate(text, values);
}
