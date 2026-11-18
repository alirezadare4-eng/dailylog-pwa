import { db } from '../db';
import { getTodayStandardDate } from '../utils/jalali';

// Request Notification Permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    alert('مرورگر شما از سیستم اعلان‌ها پشتیبانی نمی‌کند.');
    return 'denied';
  }
  const perm = await Notification.requestPermission();
  return perm;
}

// Check and trigger reminder if 22:00 reached and not yet submitted
export async function checkAndTriggerReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const reminder = await db.reminders.get('default');
  if (!reminder || !reminder.enabled) {
    return;
  }

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const [targetH, targetM] = (reminder.time || '22:00').split(':').map(Number);

  // Check if it's at or past target time
  const isTime = currentHours > targetH || (currentHours === targetH && currentMinutes >= targetM);
  if (!isTime) return;

  const todayStr = getTodayStandardDate();

  // If already notified today, do not repeat
  if (reminder.lastNotifiedDate === todayStr) {
    return;
  }

  // Check if report completed today
  if (reminder.skipIfReportCompleted) {
    const todayReport = await db.reports.where('date').equals(todayStr).first();
    if (todayReport && !todayReport.isDraft) {
      // Already submitted report! Skip.
      return;
    }
  }

  // Trigger Notification
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: 'وقت گزارش روزانهته! 📝',
      body: 'امروز چه کارهایی انجام دادی؟ بیا گزارش امروزت رو ثبت کنیم.'
    });
  } else {
    new Notification('وقت گزارش روزانهته! 📝', {
      body: 'امروز چه کارهایی انجام دادی؟ بیا گزارش امروزت رو ثبت کنیم.',
      icon: '/icons/icon-192.svg'
    });
  }

  // Record that we notified for today
  await db.reminders.update('default', { lastNotifiedDate: todayStr });
}

// Subscribe to Web Push via Server (VAPID)
export async function subscribeUserToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    // Call server to get public key
    const res = await fetch('/api/vapid-public-key');
    if (!res.ok) return false;
    const { publicKey } = await res.json();

    if (!publicKey) return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to server
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });

    return true;
  } catch (err) {
    console.warn('Push subscription failed or server offline:', err);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

