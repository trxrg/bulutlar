import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { gregorianToHijri } from './hijriDate.js';

const localeMap = {
    'en-US': enUS,
    tr,
};

const HIJRI_MONTH_KEYS = [
    'hijri_month_1',
    'hijri_month_2',
    'hijri_month_3',
    'hijri_month_4',
    'hijri_month_5',
    'hijri_month_6',
    'hijri_month_7',
    'hijri_month_8',
    'hijri_month_9',
    'hijri_month_10',
    'hijri_month_11',
    'hijri_month_12',
];

function getLocale(localeKey) {
    return localeMap[localeKey] || tr;
}

export function formatGregorianDate(date, localeKey) {
    return format(date, 'd MMMM yyyy', { locale: getLocale(localeKey) });
}

export function formatGregorianWeekday(date, localeKey) {
    return format(date, 'EEEE', { locale: getLocale(localeKey) });
}

export function formatHijriDate(date, t) {
    const { year, month, day } = gregorianToHijri(date);
    const monthName = t(HIJRI_MONTH_KEYS[month - 1]);
    return `${day} ${monthName} ${year}`;
}
