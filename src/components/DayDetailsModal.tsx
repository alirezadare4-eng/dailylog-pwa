import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  User, 
  Plus, 
  Trash2, 
  Printer, 
  Sparkles, 
  Send,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { DailyReport, Activity } from '../types';
import { formatToJalaliFull, formatToJalali, toPersianDigits } from '../utils/jalali';
import { printReportPDF } from '../utils/exportUtils';
import { db } from '../db';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  report?: DailyReport;
  activities: Activity[];
  onToggleActivity: (act: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onOpenAddModal: (date: string) => void;
  onOpenConversationalReport: (date: string) => void;
  onDeleteReport?: (reportId: string) => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  report,
  activities,
  onToggleActivity,
  onDeleteActivity,
  onOpenAddModal,
  onOpenConversationalReport,
  onDeleteReport
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<'work' | 'personal'>('work');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  if (!isOpen) return null;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isQuickAdding) return;

    setIsQuickAdding(true);
    try {
      const nowIso = new Date().toISOString();
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      let rep = report;
      if (!rep) {
        const newRepId = generateUUID();
        rep = {
          id: newRepId,
          userId: 'default-user',
          date: date,
          jalaliDate: formatToJalali(date),
          summary: '',
          tomorrowPlan: '',
          isDraft: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          syncStatus: 'created'
        };
        await db.reports.put(rep);
      }

      const newAct: Activity = {
        id: generateUUID(),
        reportId: rep.id,
        type: quickType,
        title: quickTitle.trim(),
        status: 'completed',
        project: quickType === 'work' ? 'سپهریار' : undefined,
        category: quickType === 'personal' ? 'روزمره' : undefined,
        durationMinutes: 30,
        priority: 'medium',
        createdAt: nowIso,
        updatedAt: nowIso,
        syncStatus: 'created'
      };

      await db.activities.put(newAct);
      setQuickTitle('');
    } catch (err) {
      console.error('Error adding quick activity to date:', err);
    } finally {
      setIsQuickAdding(false);
    }
  };

  const workActs = activities.filter(a => a.type === 'work');
  const personalActs = activities.filter(a => a.type === 'personal');
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const jalaliFull = formatToJalaliFull(date);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-gradient-to-l from-slate-50 to-blue-50/40 dark:from-slate-800 dark:to-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                  {jalaliFull}
                </h3>
                {report && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    report.isDraft 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}>
                    {report.isDraft ? 'پیش‌نویس' : 'ثبت‌شده'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {date} • {toPersianDigits(activities.length)} فعالیت ({toPersianDigits(completedCount)} انجام‌شده)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {report && (
              <button
                onClick={() => printReportPDF(report, activities)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                title="خروجی PDF / چاپ"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Summary Card (If available) */}
          {report?.summary && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                📝 خلاصه روزانه:
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {report.summary}
              </p>
              {report.tomorrowPlan && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    🎯 برنامه فردا:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {report.tomorrowPlan}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Add Bar for This Date */}
          <form onSubmit={handleQuickAdd} className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-900/50 flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="ثبت سریع کار برای این تاریخ..."
              className="flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuickType(quickType === 'work' ? 'personal' : 'work')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
                  quickType === 'work'
                    ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300'
                    : 'border-purple-500 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300'
                }`}
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

          {/* Activities List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                فعالیت‌های این روز ({toPersianDigits(activities.length)} مورد)
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal(date);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ فرم کامل ثبت فعالیت</span>
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                  برای این تاریخ هنوز هیچ فعالیتی ثبت نشده است.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  می‌توانید با کادر بالا فوراً یک فعالیت اضافه کنید یا گزارش گفت‌وگویی را آغاز نمایید.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((act) => {
                  const isDone = act.status === 'completed';
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/30 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleActivity(act)}
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
                          <div className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {act.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
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
                        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
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
                          className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
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

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenConversationalReport(date);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{report ? 'ویرایش گزارش با گفت‌وگو' : 'ثبت گزارش گفت‌وگویی'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAddModal(date);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن فعالیت</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {report && onDeleteReport && (
              <button
                onClick={() => {
                  if (confirm('آیا از حذف کامل گزارش و فعالیت‌های این روز اطمینان دارید؟')) {
                    onDeleteReport(report.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors flex items-center gap-1"
                title="حذف کل این روز"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف روز</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
