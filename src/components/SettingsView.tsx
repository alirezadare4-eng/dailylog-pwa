import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Cloud, 
  Download, 
  Upload, 
  FolderPlus, 
  Check, 
  RefreshCw,
  FolderOpen,
  Trash2,
  Tag
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../db';
import { ReminderSetting, Project, Category } from '../types';
import { requestNotificationPermission, subscribeUserToPush } from '../services/reminderService';
import { syncWithServer, exportLocalBackup, importLocalBackup } from '../services/syncService';
import { toPersianDigits } from '../utils/jalali';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [reminder, setReminder] = useState<ReminderSetting>({
    id: 'default',
    enabled: true,
    time: '22:00',
    skipIfReportCompleted: true
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const rem = await db.reminders.get('default');
      if (rem) setReminder(rem);

      const projs = await db.projects.toArray();
      setProjects(projs);

      const cats = await db.categories.toArray();
      setCategories(cats);
    }
    loadSettings();
  }, []);

  const handleSaveReminder = async (updated: Partial<ReminderSetting>) => {
    const next = { ...reminder, ...updated };
    setReminder(next);
    await db.reminders.put(next);

    if (next.enabled && Notification.permission !== 'granted') {
      await requestNotificationPermission();
      await subscribeUserToPush();
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const p: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      color: '#3b82f6'
    };
    await db.projects.put(p);
    setProjects(prev => [...prev, p]);
    setNewProjectName('');
  };

  const handleDeleteProject = async (id: string) => {
    await db.projects.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const c: Category = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      type: 'personal',
      color: '#8b5cf6'
    };
    await db.categories.put(c);
    setCategories(prev => [...prev, c]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (id: string) => {
    await db.categories.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('در حال اتصال به سرور و همگام‌سازی دوطرفه...');
    const res = await syncWithServer();
    setIsSyncing(false);
    setSyncStatusMsg(res.message);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importLocalBackup(content);
      if (success) {
        alert('نسخه پشتیبان با موفقیت بازیابی شد. صفحه تازه‌سازی می‌شود.');
        window.location.reload();
      } else {
        alert('خطا در بازیابی نسخه پشتیبان');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="soft-card p-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">تنظیمات سیستم و شخصی‌سازی</h2>
        <p className="text-xs text-slate-500 mt-1">مدیریت اعلان‌ها، همگام‌سازی، ظاهر برنامه و پشتیبان‌گیری</p>
      </div>

      {/* 1. Theme Appearance */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">حالت تیره / روشن</h3>
              <p className="text-xs text-slate-500">پوسته فعال: {theme === 'dark' ? 'حالت شب (تیره)' : 'حالت روز (روشن)'}</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            تغییر به {theme === 'dark' ? 'روشن' : 'تاریک'}
          </button>
        </div>
      </div>

      {/* 2. Notification Reminder System */}
      <div className="soft-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">سیستم یادآوری روزانه</h3>
              <p className="text-xs text-slate-500">ارسال نوتیفیکیشن اختصاصی به وقت محلی</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={(e) => handleSaveReminder({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {reminder.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                ساعت یادآوری روزانه
              </label>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => handleSaveReminder({ time: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminder.skipIfReportCompleted}
                  onChange={(e) => handleSaveReminder({ skipIfReportCompleted: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <span>عدم ارسال در صورت ثبت کامل گزارش امروز</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. Server Sync & PostgreSQL Cloud Architecture */}
      <div className="soft-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">همگام‌سازی سرور (PostgreSQL + API)</h3>
              <p className="text-xs text-slate-500">ذخیره آفلاین با IndexedDB و همگام‌سازی ابری</p>
            </div>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>همگام‌سازی اکنون</span>
          </button>
        </div>

        {syncStatusMsg && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {syncStatusMsg}
          </div>
        )}
      </div>

      {/* 4. Manage Projects & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="soft-card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>مدیریت پروژه‌ها</span>
          </h3>

          <form onSubmit={handleAddProject} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="نام پروژه جدید..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              افزودن
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {projects.map(p => (
              <div key={p.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between text-xs">
                <span>{p.name}</span>
                <button onClick={() => handleDeleteProject(p.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="soft-card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" />
            <span>دسته‌بندی‌های شخصی</span>
          </h3>

          <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="دسته‌بندی جدید..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700"
            >
              افزودن
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {categories.map(c => (
              <div key={c.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between text-xs">
                <span>{c.name}</span>
                <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Backup & Restore Data */}
      <div className="soft-card p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
          پشتیبان‌گیری و بازیابی داده‌ها (Backup & Restore)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          می‌توانید در هر زمان یک فایل نسخه پشتیبان کامل از تمامی گزارش‌ها و فعالیت‌های خود را به صورت استاندارد ذخیره کنید.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportLocalBackup}
            className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>دریافت فایل پشتیبان (Export JSON)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>بازیابی از فایل (Import JSON)</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

