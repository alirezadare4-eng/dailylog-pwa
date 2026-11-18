// Jalali (Solar Hijri) Calendar utility functions without external heavy dependencies

export interface JalaliDate {
  jy: number; // Jalali Year (e.g. 1403)
  jm: number; // Jalali Month (1-12)
  jd: number; // Jalali Day (1-31)
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
];

/**
 * Converts Gregorian date to Jalali
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Converts Jalali date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  let gd = days + 1;
  return { gy, gm, gd };
}

/**
 * Checks if a Jalali year is leap
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let bl = breaks.length;
  let jp = breaks[0];
  let jm: number;
  let jump: number;
  let leap: number;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error('Invalid Jalali year: ' + jy);
  }

  for (let i = 1; i < bl; i++) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) {
      let N = jy - jp;
      leap = N % 33;
      return [1, 5, 9, 13, 17, 22, 26, 30].indexOf(leap) !== -1;
    }
    jp = jm;
  }
  return false;
}

/**
 * Number of days in Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * Format standard ISO date (YYYY-MM-DD) to Jalali string (۱۴۰۳/۰۸/۲۸)
 */
export function formatToJalali(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

/**
 * Standardize date to YYYY-MM-DD
 */
export function getTodayStandardDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts Jalali string (YYYY/MM/DD) to standard ISO string (YYYY-MM-DD)
 */
export function jalaliStringToStandard(jalaliStr: string): string {
  const parts = jalaliStr.split('/').map(Number);
  if (parts.length !== 3) return getTodayStandardDate();
  const { gy, gm, gd } = jalaliToGregorian(parts[0], parts[1], parts[2]);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

/**
 * Standard date to full Persian text e.g. "چهارشنبه ۲۸ آبان ۱۴۰۳"
 */
export function formatToJalaliFull(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  
  // Persian day of week (Saturday is 0 in Persian calendar)
  // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const jsDay = d.getDay();
  const persianDayIndex = (jsDay + 1) % 7;
  const weekDayName = PERSIAN_WEEK_DAYS[persianDayIndex];
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];

  return `${weekDayName} ${jd} ${monthName} ${jy}`;
}

/**
 * Get starting day of week for Jalali month (0 = شنبه, 6 = جمعه)
 */
export function getJalaliMonthFirstDayOfWeek(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const d = new Date(gy, gm - 1, gd);
  return (d.getDay() + 1) % 7;
}

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => id[+w]);
}

