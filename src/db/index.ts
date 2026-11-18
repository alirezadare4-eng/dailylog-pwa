import Dexie, { Table } from 'dexie';
import { Activity, DailyReport, Project, Category, ReminderSetting } from '../types';

export class DailyLogDatabase extends Dexie {
  reports!: Table<DailyReport, string>;
  activities!: Table<Activity, string>;
  projects!: Table<Project, string>;
  categories!: Table<Category, string>;
  reminders!: Table<ReminderSetting, string>;

  constructor() {
    super('DailyLogDB');

    this.version(1).stores({
      reports: 'id, date, jalaliDate, isDraft, syncStatus',
      activities: 'id, reportId, type, status, project, category, syncStatus',
      projects: 'id, name',
      categories: 'id, name, type',
      reminders: 'id'
    });
  }
}

export const db = new DailyLogDatabase();

// Seed default initial configurations if empty
export async function initDatabaseDefaults() {
  const reminderCount = await db.reminders.count();
  if (reminderCount === 0) {
    await db.reminders.put({
      id: 'default',
      enabled: true,
      time: '22:00',
      skipIfReportCompleted: true
    });
  }

  const projectCount = await db.projects.count();
  if (projectCount === 0) {
    await db.projects.bulkPut([
      { id: 'proj-1', name: 'سپهریار', color: '#3b82f6' },
      { id: 'proj-2', name: 'توسعه محصول', color: '#10b981' },
      { id: 'proj-3', name: 'پشتیبانی مشتریان', color: '#f59e0b' }
    ]);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut([
      { id: 'cat-1', name: 'روزمره', type: 'personal', color: '#64748b' },
      { id: 'cat-2', name: 'خانواده', type: 'personal', color: '#ec4899' },
      { id: 'cat-3', name: 'ورزش و سلامتی', type: 'personal', color: '#10b981' },
      { id: 'cat-4', name: 'امور مالی', type: 'personal', color: '#eab308' },
      { id: 'cat-5', name: 'تفریح و مطالعه', type: 'personal', color: '#8b5cf6' }
    ]);
  }
}

