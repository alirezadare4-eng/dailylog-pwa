import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  User, 
  CheckCircle2, 
  Clock, 
  Tag, 
  FolderPlus, 
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';
import { db } from '../db';
import { Activity, ActivityType, ActivityStatus, Priority, DailyReport } from '../types';
import { formatToJalali, getTodayStandardDate } from '../utils/jalali';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: string;
  onAdded?: () => void;
}

const DEFAULT_PROJECTS = ['سپهریار', 'توسعه محصول', 'پشتیبانی مشتریان'];
const DEFAULT_CATEGORIES = ['روزمره', 'خانواده', 'ورزش و سلامتی', 'امور مالی', 'تفریح و مطالعه'];
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  targetDate = getTodayStandardDate(),
  onAdded
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('work');
  const [project, setProject] = useState('سپهریار');
  const [customProject, setCustomProject] = useState('');
  const [category, setCategory] = useState('روزمره');
  const [customCategory, setCustomCategory] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('completed');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [priority, setPriority] = useState<Priority>('medium');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(targetDate);
  const [availableProjects, setAvailableProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(targetDate);
      loadProjectsAndCategories();
    }
  }, [isOpen, targetDate]);

  const loadProjectsAndCategories = async () => {
    try {
      const dbProjects = await db.projects.toArray();
      const projNames = Array.from(new Set([...DEFAULT_PROJECTS, ...dbProjects.map(p => p.name)]));
      setAvailableProjects(projNames);

      const dbCategories = await db.categories.toArray();
      const catNames = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories.map(c => c.name)]));
      setAvailableCategories(catNames);
    } catch (e) {
      console.error('Error loading projects/categories', e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const finalProject = project === 'custom' ? customProject.trim() || 'عمومی' : project;
      const finalCategory = category === 'custom' ? customCategory.trim() || 'عمومی' : category;

      // 1. Ensure DailyReport exists for this date
      let rep = await db.reports.where('date').equals(date).first();
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

      // 2. Add Activity
      const newActivity: Activity = {
        id: generateUUID(),
        reportId: rep.id,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        project: type === 'work' ? finalProject : undefined,
        category: type === 'personal' ? finalCategory : undefined,
        durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
        priority: type === 'work' ? priority : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
        syncStatus: 'created'
      };

      await db.activities.put(newActivity);

      // Save custom project/category to db if new
      if (type === 'work' && project === 'custom' && customProject.trim()) {
        const exists = await db.projects.where('name').equals(customProject.trim()).first();
        if (!exists) {
          await db.projects.put({
            id: generateUUID(),
            name: customProject.trim(),
            color: '#3b82f6'
          });
        }
      } else if (type === 'personal' && category === 'custom' && customCategory.trim()) {
        const exists = await db.categories.where('name').equals(customCategory.trim()).first();
        if (!exists) {
          await db.categories.put({
            id: generateUUID(),
            name: customCategory.trim(),
            type: 'personal',
            color: '#8b5cf6'
          });
        }
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCustomProject('');
      setCustomCategory('');
      onAdded?.();
      onClose();
    } catch (err) {
      console.error('Error adding activity:', err);
      alert('خطا در ثبت فعالیت');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                ثبت فعالیت جدید
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تاریخ: {formatToJalali(date)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Type Selector (Work vs Personal) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              نوع فعالیت
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('work')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'work'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                }`}
              >
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>فعالیت کاری / پروژه‌ای</span>
              </button>

              <button
                type="button"
                onClick={() => setType('personal')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'personal'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                }`}
              >
                <User className="w-4 h-4 text-purple-600" />
                <span>فعالیت شخصی / روزمره</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              عنوان فعالیت <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'work' ? 'مثلا: پیگیری قرارداد مشتری یا توسعه قابلیت جدید...' : 'مثلا: ۴۵ دقیقه ورزش یا مطالعه کتاب...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Project or Category */}
          {type === 'work' ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                پروژه مرتبط
              </label>
              <div className="flex gap-2">
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                >
                  {availableProjects.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="custom">+ تعریف پروژه جدید...</option>
                </select>
              </div>
              {project === 'custom' && (
                <input
                  type="text"
                  placeholder="نام پروژه جدید را وارد کنید..."
                  value={customProject}
                  onChange={(e) => setCustomProject(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                دسته‌بندی شخصی
              </label>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="custom">+ تعریف دسته‌بندی جدید...</option>
                </select>
              </div>
              {category === 'custom' && (
                <input
                  type="text"
                  placeholder="نام دسته‌بندی جدید را وارد کنید..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>
          )}

          {/* Status & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                وضعیت
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'completed'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>انجام شد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'in_progress'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>نیمه‌تمام</span>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                مدت زمان (دقیقه)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={durationMinutes || ''}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                placeholder="۳۰"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDurationMinutes(m)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                      durationMinutes === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m}د
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority (Work only) */}
          {type === 'work' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                اولویت
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const label = p === 'high' ? 'بالا' : p === 'medium' ? 'متوسط' : 'پایین';
                  const activeColor = p === 'high' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' 
                    : p === 'medium'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        priority === p ? activeColor : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              توضیحات (اختیاری)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نکات مهم، نتایج حاصل یا یادداشت تکمیلی..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت فعالیت'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
