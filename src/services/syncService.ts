import { db } from '../db';
import { DailyReport, Activity } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedReportsCount: number;
  syncedActivitiesCount: number;
}

export async function syncWithServer(): Promise<SyncResult> {
  try {
    // 1. Gather local unsynced records
    const unsyncedReports = await db.reports
      .filter(r => !r.syncStatus || r.syncStatus !== 'synced')
      .toArray();

    const unsyncedActivities = await db.activities
      .filter(a => !a.syncStatus || a.syncStatus !== 'synced')
      .toArray();

    // If completely offline or backend not available, test endpoint
    const ping = await fetch('/api/health', { method: 'GET' }).catch(() => null);
    if (!ping || !ping.ok) {
      return {
        success: false,
        message: 'سرور در دسترس نیست. اطلاعات در حافظه محلی ذخیره شده و پس از اتصال همگام خواهد شد.',
        syncedReportsCount: 0,
        syncedActivitiesCount: 0
      };
    }

    // 2. Push unsynced changes to server
    const pushRes = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reports: unsyncedReports,
        activities: unsyncedActivities
      })
    });

    if (!pushRes.ok) {
      throw new Error(`Sync Push failed with status: ${pushRes.status}`);
    }

    // Mark pushed records as synced
    await db.transaction('rw', db.reports, db.activities, async () => {
      for (const r of unsyncedReports) {
        await db.reports.update(r.id, { syncStatus: 'synced' });
      }
      for (const a of unsyncedActivities) {
        await db.activities.update(a.id, { syncStatus: 'synced' });
      }
    });

    // 3. Pull latest changes from server
    const pullRes = await fetch('/api/sync/pull');
    if (pullRes.ok) {
      const serverData = await pullRes.json();
      const serverReports: DailyReport[] = serverData.reports || [];
      const serverActivities: Activity[] = serverData.activities || [];

      await db.transaction('rw', db.reports, db.activities, async () => {
        for (const rep of serverReports) {
          const local = await db.reports.get(rep.id);
          // Conflict resolution: latest updatedAt wins
          if (!local || new Date(rep.updatedAt) >= new Date(local.updatedAt)) {
            await db.reports.put({ ...rep, syncStatus: 'synced' });
          }
        }
        for (const act of serverActivities) {
          const local = await db.activities.get(act.id);
          if (!local || new Date(act.updatedAt) >= new Date(local.updatedAt)) {
            await db.activities.put({ ...act, syncStatus: 'synced' });
          }
        }
      });
    }

    return {
      success: true,
      message: 'همگام‌سازی با موفقیت انجام شد.',
      syncedReportsCount: unsyncedReports.length,
      syncedActivitiesCount: unsyncedActivities.length
    };
  } catch (err: any) {
    console.error('Sync error:', err);
    return {
      success: false,
      message: err.message || 'خطا در ارتباط با سرور',
      syncedReportsCount: 0,
      syncedActivitiesCount: 0
    };
  }
}

// Full JSON Backup & Restore for offline resilience
export async function exportLocalBackup() {
  const reports = await db.reports.toArray();
  const activities = await db.activities.toArray();
  const projects = await db.projects.toArray();
  const categories = await db.categories.toArray();
  const reminders = await db.reminders.toArray();

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { reports, activities, projects, categories, reminders }
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dailylog_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importLocalBackup(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) throw new Error('فرمت فایل پشتیبان معتبر نیست.');

    const { reports, activities, projects, categories, reminders } = parsed.data;

    await db.transaction('rw', db.reports, db.activities, db.projects, db.categories, db.reminders, async () => {
      if (reports?.length) await db.reports.bulkPut(reports);
      if (activities?.length) await db.activities.bulkPut(activities);
      if (projects?.length) await db.projects.bulkPut(projects);
      if (categories?.length) await db.categories.bulkPut(categories);
      if (reminders?.length) await db.reminders.bulkPut(reminders);
    });

    return true;
  } catch (err) {
    console.error('Import error:', err);
    return false;
  }
}

