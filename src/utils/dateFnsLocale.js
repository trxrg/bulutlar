import { enUS, tr } from 'date-fns/locale';

const localeMap = {
    'en-US': enUS,
    tr,
};

export function resolveDateFnsLocale(locale) {
    return localeMap[locale] || tr;
}
