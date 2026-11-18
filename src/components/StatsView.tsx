import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Briefcase,
  User
} from 'lucide-react';
import { DailyReport, Activity } from '../types';
import { toPersianDigits, formatToJalali } from '../utils/jalali';
import { exportActivitiesToExcel } from '../utils/exportUtils';

interface StatsViewProps {
  reports: DailyReport[];
  activities: Activity[];
}

export const StatsView: React.FC<StatsViewProps> = ({ reports, activities }) => {
  const [period, setPeriod] = useState<'all' | '30days' | '7days'>('30days');

  // Filter based on period
  const now = new Date();
  const filteredActivities = activities.filter(act => {
    if (period === 'all') return true;
    const rep = reports.find(r => r.id === act.reportId);
    if (!rep) return true;
    const repDate = new Date(rep.date);
    const diffDays = (now.getTime() - repDate.getTime()) / (1000 * 3600 * 24);
    if (period === '7days') return diffDays <= 7;
    if (period === '30days') return diffDays <= 30;
    return true;
  });

  const totalActs = filteredActivities.length;
  const completedCount = filteredActivities.filter(a => a.status === 'completed').length;
  const pendingCount = totalActs - completedCount;
  const completionRate = totalActs > 0 ? Math.round((completedCount / totalActs) * 100) : 0;

  const workActs = filteredActivities.filter(a => a.type === 'work');
  const personalActs = filteredActivities.filter(a => a.type === 'personal');

  // Project breakdown
  const projectStats: Record<string, { total: number; completed: number }> = {};
  workActs.forEach(act => {
    const p = act.project || 'عمومی';
    if (!projectStats[p]) projectStats[p] = { total: 0, completed: 0 };
    projectStats[p].total++;
    if (act.status === 'completed') projectStats[p].completed++;
  });

  const reportsMap = Object.fromEntries(reports.map(r => [r.id, r]));

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="soft-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>گزارش‌گیری، آمار و نمودارهای عملکرد</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بررسی روند تکمیل کارها، دسته‌بندی‌ها و بهره‌وری شخصی و کاری
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === '7days' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === '30days' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              ماه جاری (۳۰ روز)
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === 'all' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              کل تاریخچه
            </button>
          </div>

          <button
            onClick={() => exportActivitiesToExcel(filteredActivities, reportsMap)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی Excel</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-5">
          <span className="text-xs font-semibold text-slate-400">نرخ تکمیل کل</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {toPersianDigits(completionRate)}٪
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="soft-card p-5">
          <span className="text-xs font-semibold text-slate-400">کل فعالیت‌ها</span>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            {toPersianDigits(totalActs)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {toPersianDigits(reports.length)} روز ثبت شده
          </span>
        </div>

        <div className="soft-card p-5">
          <span className="text-xs font-semibold text-slate-400">انجام‌شده (موفق)</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {toPersianDigits(completedCount)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1 block">
            ✓ عملکرد مطلوب
          </span>
        </div>

        <div className="soft-card p-5">
          <span className="text-xs font-semibold text-slate-400">نیمه‌تمام و باقیمانده</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {toPersianDigits(pendingCount)}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-500 mt-1 block">
            نیازمند پیگیری در فردا
          </span>
        </div>
      </div>

      {/* Split Comparison: Work vs Personal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work vs Personal Distribution */}
        <div className="soft-card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
            <span>توزیع فعالیت‌های کاری در برابر شخصی</span>
            <span className="text-xs font-normal text-slate-400">{toPersianDigits(totalActs)} مورد</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Briefcase className="w-3.5 h-3.5" />
                  فعالیت‌های کاری ({toPersianDigits(workActs.length)})
                </span>
                <span className="font-bold">
                  {totalActs > 0 ? toPersianDigits(Math.round((workActs.length / totalActs) * 100)) : 0}٪
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${totalActs > 0 ? (workActs.length / totalActs) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-purple-600">
                  <User className="w-3.5 h-3.5" />
                  فعالیت‌های شخصی ({toPersianDigits(personalActs.length)})
                </span>
                <span className="font-bold">
                  {totalActs > 0 ? toPersianDigits(Math.round((personalActs.length / totalActs) * 100)) : 0}٪
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${totalActs > 0 ? (personalActs.length / totalActs) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Performance Breakdown */}
        <div className="soft-card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
            عملکرد به تفکیک پروژه‌ها
          </h3>

          {Object.keys(projectStats).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              هنوز فعالیت پروژه‌ای در این بازه ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(projectStats).map(([proj, stat]) => {
                const projRate = Math.round((stat.completed / stat.total) * 100);
                return (
                  <div key={proj} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-white">{proj}</span>
                      <span className="text-slate-500">
                        {toPersianDigits(stat.completed)} از {toPersianDigits(stat.total)} انجام شده ({toPersianDigits(projRate)}٪)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${projRate}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

