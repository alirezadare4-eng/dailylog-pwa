import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Home, 
  Calendar as CalendarIcon, 
  FileText, 
  BarChart2, 
  Settings, 
  PlusCircle, 
  Moon, 
  Sun,
  X
} from 'lucide-react';
import { db } from './db';
import { DailyReport, Activity } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { getTodayStandardDate } from './utils/jalali';
import { DashboardView } from './components/DashboardView';
import { PersianCalendar } from './components/PersianCalendar';
import { ConversationalLogger } from './components/ConversationalLogger';
import { AddActivityModal } from './components/AddActivityModal';
import { DayDetailsModal } from './components/DayDetailsModal';
import { ArchiveView } from './components/ArchiveView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { checkAndTriggerReminder } from './services/reminderService';
import { formatToJalali } from './utils/jalali';

type Tab = 'home' | 'calendar' | 'report' | 'stats' | 'settings' | 'archive';

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

const MainApp: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [reportTargetDate, setReportTargetDate] = useState<string>(getTodayStandardDate());
  const [isLoggerOpen, setIsLoggerOpen] = useState<boolean>(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState<boolean>(false);
  const [activityTargetDate, setActivityTargetDate] = useState<string>(getTodayStandardDate());
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState<boolean>(false);
  const [dayDetailsDate, setDayDetailsDate] = useState<string>(getTodayStandardDate());

  // Live queries from Dexie IndexedDB
  const reports = useLiveQuery(() => db.reports.toArray()) || [];
  const activities = useLiveQuery(() => db.activities.toArray()) || [];
  const reminder = useLiveQuery(() => db.reminders.get('default'));

  const todayStr = getTodayStandardDate();
  const todayReport = reports.find(r => r.date === todayStr);
  const todayActivities = activities.filter(a => a.reportId === todayReport?.id);

  // Reminder check interval
  useEffect(() => {
    checkAndTriggerReminder();
    const interval = setInterval(checkAndTriggerReminder, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleStartReport = (date: string) => {
    setReportTargetDate(date);
    setIsLoggerOpen(true);
  };

  const handleOpenAddActivity = (date?: string) => {
    setActivityTargetDate(date || todayStr);
    setIsAddActivityOpen(true);
  };

  const handleOpenDayDetails = (date: string) => {
    setDayDetailsDate(date);
    setReportTargetDate(date);
    setIsDayDetailsOpen(true);
  };

  const handleQuickAddActivity = async (title: string, type: 'work' | 'personal') => {
    const nowIso = new Date().toISOString();
    let rep = await db.reports.where('date').equals(todayStr).first();
    if (!rep) {
      rep = {
        id: generateUUID(),
        userId: 'default-user',
        date: todayStr,
        jalaliDate: formatToJalali(todayStr),
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
      type,
      title: title.trim(),
      status: 'completed',
      project: type === 'work' ? 'سپهریار' : undefined,
      category: type === 'personal' ? 'روزمره' : undefined,
      durationMinutes: 30,
      priority: 'medium',
      createdAt: nowIso,
      updatedAt: nowIso,
      syncStatus: 'created'
    };
    await db.activities.put(newAct);
  };

  const handleDeleteActivity = async (activityId: string) => {
    await db.activities.delete(activityId);
  };

  const handleToggleActivityStatus = async (activity: Activity) => {
    const nextStatus = activity.status === 'completed' ? 'in_progress' : 'completed';
    await db.activities.update(activity.id, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      syncStatus: 'updated'
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    await db.transaction('rw', db.reports, db.activities, async () => {
      await db.reports.delete(reportId);
      await db.activities.where('reportId').equals(reportId).delete();
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-900 transition-colors">
      {/* Top Navigation Header for Desktop & Mobile */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              د
            </div>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-white tracking-tight text-lg">
                روزنگار
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mr-1.5">
                DailyLog
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>خانه</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>تقویم</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>گزارش‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>آمار</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>تنظیمات</span>
            </button>
          </nav>

          {/* Quick Action Button & Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddActivity(todayStr)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">فعالیت جدید</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors"
              title="تغییر حالت شب/روز"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 mb-20 md:mb-6">
        {/* Modal for Direct Activity Creation */}
        <AddActivityModal
          isOpen={isAddActivityOpen}
          targetDate={activityTargetDate}
          onClose={() => setIsAddActivityOpen(false)}
        />

        {/* Modal for Day Details */}
        <DayDetailsModal
          isOpen={isDayDetailsOpen}
          onClose={() => setIsDayDetailsOpen(false)}
          date={dayDetailsDate}
          report={reports.find(r => r.date === dayDetailsDate)}
          activities={activities.filter(a => {
            const r = reports.find(rep => rep.date === dayDetailsDate);
            return a.reportId === r?.id;
          })}
          onToggleActivity={handleToggleActivityStatus}
          onDeleteActivity={handleDeleteActivity}
          onOpenAddModal={(date) => handleOpenAddActivity(date)}
          onOpenConversationalReport={(date) => handleStartReport(date)}
          onDeleteReport={handleDeleteReport}
        />

        {/* Modal / Overlay for Conversational Logger */}
        {isLoggerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
              <ConversationalLogger
                targetDate={reportTargetDate}
                onFinished={() => setIsLoggerOpen(false)}
                onCancel={() => setIsLoggerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'home' && (
          <DashboardView
            todayReport={todayReport}
            todayActivities={todayActivities}
            allReports={reports}
            reminderTime={reminder?.time || '22:00'}
            onStartReport={handleStartReport}
            onOpenAddActivity={() => handleOpenAddActivity(todayStr)}
            onOpenDayDetails={handleOpenDayDetails}
            onDeleteActivity={handleDeleteActivity}
            onQuickAddActivity={handleQuickAddActivity}
            onNavigateTab={(t) => setActiveTab(t as Tab)}
            onToggleActivityStatus={handleToggleActivityStatus}
          />
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <PersianCalendar
              reports={reports}
              selectedDate={reportTargetDate}
              onSelectDate={(d) => setReportTargetDate(d)}
              onOpenReport={handleStartReport}
              onOpenDayDetails={handleOpenDayDetails}
            />

            {/* Selected day activity preview */}
            {(() => {
              const selectedRep = reports.find(r => r.date === reportTargetDate);
              const selectedActs = activities.filter(a => a.reportId === selectedRep?.id);
              return (
                <div className="soft-card p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      فعالیت‌های تاریخ {formatToJalali(reportTargetDate)} ({reportTargetDate})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddActivity(reportTargetDate)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        + افزودن فعالیت
                      </button>
                      <button
                        onClick={() => handleStartReport(reportTargetDate)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                      >
                        گزارش گفت‌وگویی
                      </button>
                    </div>
                  </div>

                  {selectedActs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      گزارش یا فعالیتی برای این روز ثبت نشده است. با دکمه‌های بالا می‌توانید ثبت کنید.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedActs.map(a => (
                        <div key={a.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActivityStatus(a)}
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                a.status === 'completed' ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                              }`}
                            >
                              ✓
                            </button>
                            <span className={a.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                              {a.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={a.status === 'completed' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                              {a.status === 'completed' ? 'انجام شد' : 'نیمه‌تمام'}
                            </span>
                            <button
                              onClick={() => handleDeleteActivity(a.id)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded"
                              title="حذف"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            reports={reports}
            activities={activities}
            onEditReport={handleStartReport}
            onDeleteReport={handleDeleteReport}
            onToggleActivity={handleToggleActivityStatus}
            onDeleteActivity={handleDeleteActivity}
            onAddActivityToDate={(d) => handleOpenAddActivity(d)}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView reports={reports} activities={activities} />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (۵ آیتم درخواستی) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-700/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* ۱. خانه */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">خانه</span>
        </button>

        {/* ۲. تقویم */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'calendar' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">تقویم</span>
        </button>

        {/* ۳. گزارش (دکمه مرکزی شناور) */}
        <button
          onClick={() => handleStartReport(todayStr)}
          className="flex flex-col items-center justify-center -top-4 relative"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">ثبت</span>
        </button>

        {/* ۴. آمار */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">آمار</span>
        </button>

        {/* ۵. تنظیمات */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">تنظیمات</span>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

