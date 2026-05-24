import hijriSafe from 'hijri-date/lib/safe.js';

export function gregorianToHijri(gDate) {
    let hijri = hijriSafe.toHijri(new Date(gDate));
    hijri = hijri.subtractDay(); // matches ArticleService.js workaround
    return { year: hijri.year, month: hijri.month, day: hijri.date };
}

/** Convert display Hijri (footer/articles) back to Gregorian. */
export function hijriDisplayToGregorian(year, month, day) {
    const anchor = new Date(year + 579, month - 1, 15, 12, 0, 0, 0);
    for (let delta = -380; delta <= 380; delta++) {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + delta);
        const h = gregorianToHijri(d);
        if (h.year === year && h.month === month && h.day === day) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
        }
    }
    throw new Error(`Invalid Hijri date: ${year}-${month}-${day}`);
}

export function getDisplayHijriMonthDays(year, month) {
    const days = [];
    for (let d = 1; d <= 30; d++) {
        try {
            const g = hijriDisplayToGregorian(year, month, d);
            const check = gregorianToHijri(g);
            if (check.year !== year || check.month !== month) break;
            days.push({ day: d, date: g });
        } catch {
            break;
        }
    }
    return days;
}

export function shiftDisplayHijriMonth(year, month, delta) {
    let m = month + delta;
    let y = year;
    while (m < 1) {
        m += 12;
        y -= 1;
    }
    while (m > 12) {
        m -= 12;
        y += 1;
    }
    return { year: y, month: m };
}
