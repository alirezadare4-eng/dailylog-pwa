import React, { useState } from 'react';
import { 
  Plus, 
  Briefcase, 
  User, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  Trash2,
  Send,
  Sparkles
} from 'lucide-react';
import { DailyReport, Activity } from '../types';
import { formatToJalaliFull, toPersianDigits, getTodayStandardDate } from '../utils/jalali';
import { PersianCalendar } from './PersianCalendar';
import { printReportPDF } from '../utils/exportUtils';

interface DashboardViewProps {
  todayReport?: DailyReport;
  todayActivities: Activity[];
  allReports: DailyReport[];
  reminderTime: string;
  onStartReport: (date: string) => void;
  onOpenAddActivity: () => void;
  onOpenDayDetails: (date: string) => void;
  onDeleteActivity: (id: string) => void;
  onQuickAddActivity: (title: string, type: 'work' | 'personal') => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onToggleActivityStatus: (activity: Activity) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  todayReport,
  todayActivities,
  allReports,
  reminderTime,
  onStartReport,
  onOpenAddActivity,
  onOpenDayDetails,
  onDeleteActivity,
  onQuickAddActivity,
  onNavigateTab,
  onToggleActivityStatus
}) => {
  const todayDate = getTodayStandardDate();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayDate);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<'work' | 'personal'>('work');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const personalActivities = todayActivities.filter(a => a.type === 'personal');
  const workActivities = todayActivities.filter(a => a.type === 'work');
  const completedActivities = todayActivities.filter(a => a.status === 'completed');
  const pendingActivities = todayActivities.filter(a => a.status !== 'completed');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isQuickAdding) return;
    setIsQuickAdding(true);
    try {
      await onQuickAddActivity(quickTitle.trim(), quickType);
      setQuickTitle('');
    } finally {
      setIsQuickAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Welcome */}
      <div className="soft-card p-6 bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatToJalaliFull(todayDate)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              سلام! روزت پر از پیشرفت و انرژی ✨
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              ثبت مستمر عملکرد روزانه، مسیر تبدیل اهداف بزرگ به دستاوردهای واقعی است.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={onOpenAddActivity}
              className="px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span>افزودن فعالیت جدید</span>
            </button>
            <button
              onClick={() => onStartReport(todayDate)}
              className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
              title="ثبت مرحله‌به‌مرحله به شیوه گفت‌وگو"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>گزارش هوشمند (گفت‌وگو)</span>
            </button>
            {todayReport && (
              <button
                onClick={() => printReportPDF(todayReport, todayActivities)}
                className="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md transition-all flex items-center justify-center gap-1.5"
                title="چاپ یا ذخیره PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Notification Banner */}
      <div className="soft-card p-4 bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
              یادآور هوشمند ساعت {toPersianDigits(reminderTime || '22:00')} فعال است
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              هر شب اعلان یادآوری برای ثبت روزانه ارسال می‌شود. در صورت ثبت کامل، یادآوری تکراری نخواهد شد.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('settings')}
          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline shrink-0"
        >
          تنظیمات
        </button>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Work Activities */}
        <div className="soft-card p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">کارهای کاری</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white">
              {toPersianDigits(workActivities.length)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
        </div>

        {/* Personal Activities */}
        <div className="soft-card p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">کارهای شخصی</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white">
              {toPersianDigits(personalActivities.length)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="soft-card p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">انجام‌شده</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(completedActivities.length)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
        </div>

        {/* Remaining / In-Progress */}
        <div className="soft-card p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">باقیمانده / نیمه‌تمام</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {toPersianDigits(pendingActivities.length)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today Summary & Activities vs Persian Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (or main in RTL): Today Activities & Summary */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today Summary */}
          <div className="soft-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>خلاصه گزارش امروز</span>
                {todayReport?.isDraft && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    پیش‌نویس موقت
                  </span>
                )}
              </h2>

              {todayReport && (
                <button
                  onClick={() => onStartReport(todayDate)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  ویرایش گفت‌وگو
                </button>
              )}
            </div>

            {todayReport?.summary ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {todayReport.summary}
              </p>
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
                هنوز خلاصه‌ای برای امروز ثبت نکرده‌اید. با دکمه بالا مکالمه را آغاز کنید.
              </div>
            )}

            {todayReport?.tomorrowPlan && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  🎯 برنامه فردا:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {todayReport.tomorrowPlan}
                </p>
              </div>
            )}
          </div>

          {/* Today Activity List */}
          <div className="soft-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  فعالیت‌های ثبت‌شده امروز
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                  {toPersianDigits(todayActivities.length)}
                </span>
              </div>

              <button
                onClick={onOpenAddActivity}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ فعالیت جدید</span>
              </button>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleQuickSubmit} className="mb-4 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/70 flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="ثبت سریع کار یا فعالیت برای امروز (بنویسید و اینتر بزنید)..."
                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickType(quickType === 'work' ? 'personal' : 'work')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
                    quickType === 'work'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                  }`}
                  title="تغییر نوع کاری / شخصی"
                >
                  {quickType === 'work' ? <Briefcase className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-purple-600" />}
                  <span>{quickType === 'work' ? 'کاری' : 'شخصی'}</span>
                </button>

                <button
                  type="submit"
                  disabled={!quickTitle.trim() || isQuickAdding}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Send className="w-3 h-3 rotate-180" />
                  <span>ثبت</span>
                </button>
              </div>
            </form>

            {todayActivities.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/20">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  هنوز هیچ فعالیتی برای امروز ثبت نشده است
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  می‌توانید همین الان با کادر بالا یا دکمه‌های زیر اولین کار امروز را اضافه کنید:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={onOpenAddActivity}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن فعالیت مستقیم</span>
                  </button>
                  <button
                    onClick={() => onStartReport(todayDate)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>شروع ثبت گفت‌وگویی</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayActivities.map((act) => {
                  const isDone = act.status === 'completed';
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/30 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleActivityStatus(act)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent'
                          }`}
                          title={isDone ? 'علامت به عنوان نیمه‌تمام' : 'علامت به عنوان انجام‌شده'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div>
                          <div className={`text-sm font-medium ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {act.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded font-medium ${act.type === 'work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                              {act.type === 'work' ? 'کاری' : 'شخصی'}
                            </span>
                            {act.project && <span>پروژه: {act.project}</span>}
                            {act.category && <span>دسته: {act.category}</span>}
                            {act.durationMinutes && <span>{toPersianDigits(act.durationMinutes)} دقیقه</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        }`}>
                          {isDone ? 'انجام شد' : 'نیمه‌تمام'}
                        </span>

                        <button
                          onClick={() => {
                            if (confirm(`آیا فعالیت «${act.title}» حذف شود؟`)) {
                              onDeleteActivity(act.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                          title="حذف فعالیت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right (Calendar on Dashboard) */}
        <div className="lg:col-span-5 space-y-6">
          <PersianCalendar
            reports={allReports}
            selectedDate={selectedCalendarDate}
            onSelectDate={(date) => setSelectedCalendarDate(date)}
            onOpenReport={(date) => onStartReport(date)}
            onOpenDayDetails={(date) => onOpenDayDetails(date)}
          />

          {/* Quick Actions Card */}
          <div className="soft-card p-5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
              دسترسی سریع
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('archive')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors text-right font-medium"
              >
                📁 جست‌وجو در آرشیو
              </button>
              <button
                onClick={() => onNavigateTab('stats')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors text-right font-medium"
              >
                📊 نمودارها و آمار
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

