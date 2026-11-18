import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import { 
  gregorianToJalali, 
  jalaliToGregorian, 
  getDaysInJalaliMonth, 
  getJalaliMonthFirstDayOfWeek, 
  PERSIAN_MONTH_NAMES, 
  PERSIAN_WEEK_DAYS, 
  toPersianDigits,
  getTodayStandardDate,
  formatToJalali
} from '../utils/jalali';
import { DailyReport } from '../types';

interface PersianCalendarProps {
  reports: DailyReport[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenReport: (date: string) => void;
  onOpenDayDetails?: (date: string) => void;
}

export const PersianCalendar: React.FC<PersianCalendarProps> = ({
  reports,
  selectedDate,
  onSelectDate,
  onOpenReport,
  onOpenDayDetails
}) => {
  const todayStandard = getTodayStandardDate();
  const todayJalali = gregorianToJalali(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );

  const [viewYear, setViewYear] = useState<number>(todayJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(todayJalali.jm);

  // Map of date strings to reports for quick status lookup
  const reportsMap = new Map<string, DailyReport>();
  reports.forEach(r => {
    reportsMap.set(r.date, r);
  });

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => setViewYear(prev => prev - 1);
  const handleNextYear = () => setViewYear(prev => prev + 1);

  const handleGoToToday = () => {
    setViewYear(todayJalali.jy);
    setViewMonth(todayJalali.jm);
    onSelectDate(todayStandard);
  };

  const totalDays = getDaysInJalaliMonth(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliMonthFirstDayOfWeek(viewYear, viewMonth);

  // Generate grid cells
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="soft-card p-5">
      {/* Month & Year Header Controls */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevYear}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="سال قبل"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="ماه قبل"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800 dark:text-white">
            {PERSIAN_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
          </span>
          <button
            onClick={handleGoToToday}
            className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            برو به امروز
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="ماه بعد"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextYear}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="سال بعد"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {PERSIAN_WEEK_DAYS.map((day, idx) => (
          <div 
            key={day} 
            className={`text-xs font-semibold py-1 ${idx === 6 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading blank slots */}
        {blanks.map(i => (
          <div key={`blank-${i}`} className="h-11 sm:h-12" />
        ))}

        {/* Days */}
        {monthDays.map(day => {
          const { gy, gm, gd } = jalaliToGregorian(viewYear, viewMonth, day);
          const dateStr = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
          
          const isToday = dateStr === todayStandard;
          const isSelected = dateStr === selectedDate;
          const report = reportsMap.get(dateStr);
          const hasReport = !!report;
          const isDraft = report?.isDraft;

          return (
            <button
              key={`day-${day}`}
              onClick={() => {
                onSelectDate(dateStr);
                onOpenDayDetails?.(dateStr);
              }}
              className={`
                h-11 sm:h-12 relative rounded-xl flex flex-col items-center justify-center transition-all duration-150
                ${isSelected 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-[1.03] z-10' 
                  : isToday 
                    ? 'border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-medium'
                }
              `}
            >
              <span className="text-sm">{toPersianDigits(day)}</span>

              {/* Status Indicator Dots */}
              {hasReport && (
                <div className="absolute bottom-1.5 flex items-center justify-center gap-0.5">
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected 
                        ? 'bg-white' 
                        : isDraft 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`} 
                    title={isDraft ? 'گزارش پیش‌نویس / ناقص' : 'گزارش ثبت شده'}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend & Selected Day Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>دارای گزارش کامل</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>پیش‌نویس / ناقص</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (onOpenDayDetails) {
              onOpenDayDetails(selectedDate);
            } else {
              onOpenReport(selectedDate);
            }
          }}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>مشاهده و ثبت برای تاریخ انتخابی</span>
        </button>
      </div>
    </div>
  );
};

