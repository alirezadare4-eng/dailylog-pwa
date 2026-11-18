// Data models for DailyLog PWA

export type ActivityType = 'work' | 'personal';

export type ActivityStatus = 'completed' | 'in_progress' | 'pending';

export type Priority = 'low' | 'medium' | 'high';

export interface Activity {
  id: string; // UUID
  reportId: string; // References DailyReport.id
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  
  // Work specific
  project?: string;
  durationMinutes?: number;
  priority?: Priority;

  // Personal specific
  category?: 'routine' | 'family' | 'leisure' | 'sports' | 'finance' | 'custom' | string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
  syncStatus?: 'synced' | 'created' | 'updated' | 'deleted';
}

export interface DailyReport {
  id: string; // UUID
  userId: string;
  date: string; // Standard format YYYY-MM-DD
  jalaliDate: string; // e.g. 1403/08/28
  summary?: string;
  tomorrowPlan?: string;
  isDraft: boolean; // True if created via conversation and not yet finished
  conversationStep?: number; // Step saved for resumption
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'created' | 'updated' | 'deleted';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: ActivityType;
  color?: string;
}

export interface ReminderSetting {
  id: string;
  enabled: boolean;
  time: string; // e.g. "22:00"
  skipIfReportCompleted: boolean;
  lastNotifiedDate?: string;
}

export interface SyncState {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

