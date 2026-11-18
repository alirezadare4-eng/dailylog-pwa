import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Printer, 
  Briefcase, 
  User, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { DailyReport, Activity } from '../types';
import { formatToJalaliFull, toPersianDigits } from '../utils/jalali';
import { printReportPDF } from '../utils/exportUtils';

interface ArchiveViewProps {
  reports: DailyReport[];
  activities: Activity[];
  onEditReport: (date: string) => void;
  onDeleteReport: (reportId: string) => void;
  onToggleActivity: (act: Activity) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  reports,
  activities,
  onEditReport,
  onDeleteReport,
  onToggleActivity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'work' | 'personal'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  // Extract unique projects
  const uniqueProjects = Array.from(new Set(activities.map(a => a.project).filter(Boolean)));

  // Filter activities
  const filteredActivities = activities.filter(act => {
    // Type filter
    if (filterType !== 'all' && act.type !== filterType) return false;
    // Project filter
    if (filterProject !== 'all' && act.project !== filterProject) return false;
    // Status filter
    if (filterStatus === 'completed' && act.status !== 'completed') return false;
    if (filterStatus === 'pending' && act.status === 'completed') return false;
    // Search text
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (act.title || '').toLowerCase().includes(q);
      const matchDesc = (act.description || '').toLowerCase().includes(q);
      const matchProj = (act.project || '').toLowerCase().includes(q);
      const matchCat = (act.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProj && !matchCat) return false;
    }
    return true;
  });

  // Group activities by date
  const reportsMap = new Map(reports.map(r => [r.id, r]));
  const groupedByReportId: Record<string, Activity[]> = {};

  filteredActivities.forEach(act => {
    if (!groupedByReportId[act.reportId]) {
      groupedByReportId[act.reportId] = [];
    }
    groupedByReportId[act.reportId].push(act);
  });

  const matchedReportIds = Object.keys(groupedByReportId);

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="soft-card p-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          آرشیو و جست‌وجوی گزارش‌ها
        </h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جست‌وجو در عنوان، پروژه، توضیحات یا دسته‌بندی..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">همه فعالیت‌ها</option>
              <option value="work">فقط کاری</option>
              <option value="personal">فقط شخصی</option>
            </select>

            {/* Filter by Project */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">همه پروژه‌ها</option>
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="completed">انجام شده</option>
              <option value="pending">نیمه‌تمام / در حال انجام</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>یافت شد: {toPersianDigits(filteredActivities.length)} فعالیت در {toPersianDigits(matchedReportIds.length)} روز</span>
      </div>

      {/* Grouped Day Cards */}
      {matchedReportIds.length === 0 ? (
        <div className="soft-card p-12 text-center text-slate-400 dark:text-slate-500">
          هیچ گزارشی با فیلترهای انتخابی پیدا نشد.
        </div>
      ) : (
        matchedReportIds.map(repId => {
          const report = reportsMap.get(repId);
          const dayActs = groupedByReportId[repId] || [];
          if (!report) return null;

          return (
            <div key={repId} className="soft-card overflow-hidden">
              {/* Day Card Header */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatToJalaliFull(report.date)}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {report.jalaliDate} - {toPersianDigits(dayActs.length)} مورد
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printReportPDF(report, dayActs)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="چاپ یا PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditReport(report.date)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="ویرایش گفت‌وگوی این روز"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('آیا از حذف این گزارش و تمام فعالیت‌های آن اطمینان دارید؟')) {
                        onDeleteReport(report.id);
                      }
                    }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="حذف گزارش"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Summary if present */}
              {report.summary && (
                <div className="px-5 pt-3 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800">
                  <span className="font-semibold text-slate-400">خلاصه روز: </span>
                  {report.summary}
                </div>
              )}

              {/* Activities Table/List */}
              <div className="p-4 space-y-2">
                {dayActs.map(act => {
                  const isDone = act.status === 'completed';
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleActivity(act)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {act.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded ${act.type === 'work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40'}`}>
                              {act.type === 'work' ? 'کاری' : 'شخصی'}
                            </span>
                            {act.project && <span>پروژه: {act.project}</span>}
                            {act.category && <span>دسته‌بندی: {act.category}</span>}
                            {act.durationMinutes ? <span>{toPersianDigits(act.durationMinutes)} دقیقه</span> : null}
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isDone 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {isDone ? 'انجام شد' : 'نیمه‌تمام'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

