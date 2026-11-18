import { Activity, DailyReport } from '../types';
import { formatToJalaliFull, toPersianDigits } from './jalali';

// Export to CSV / Excel compatible with UTF-8 BOM
export function exportActivitiesToExcel(activities: Activity[], reportsMap: Record<string, DailyReport>) {
  const headers = [
    'شناسه',
    'تاریخ شمسی',
    'تاریخ میلادی',
    'نوع فعالیت',
    'عنوان فعالیت',
    'وضعیت',
    'پروژه / دسته‌بندی',
    'مدت زمان (دقیقه)',
    'اولویت',
    'توضیحات'
  ];

  const rows = activities.map(act => {
    const report = reportsMap[act.reportId];
    return [
      act.id,
      report ? report.jalaliDate : '',
      report ? report.date : '',
      act.type === 'work' ? 'کاری' : 'شخصی',
      `"${(act.title || '').replace(/"/g, '""')}"`,
      act.status === 'completed' ? 'انجام شده' : act.status === 'in_progress' ? 'نیمه‌تمام' : 'معوق',
      act.type === 'work' ? (act.project || '-') : (act.category || '-'),
      act.durationMinutes || 0,
      act.priority === 'high' ? 'بالا' : act.priority === 'medium' ? 'متوسط' : 'عادی',
      `"${(act.description || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dailylog_activities_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate Printable Document & PDF View
export function printReportPDF(report: DailyReport, activities: Activity[]) {
  const workActivities = activities.filter(a => a.type === 'work');
  const personalActivities = activities.filter(a => a.type === 'personal');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('لطفا اجازه باز شدن پنجره پاپ‌آپ (Pop-up) را بدهید.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>گزارش روزانه - ${report.jalaliDate}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Vazirmatn', sans-serif;
      background: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 30px;
      direction: rtl;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #1d4ed8;
    }
    .date-badge {
      font-size: 14px;
      color: #64748b;
      background: #f1f5f9;
      padding: 6px 14px;
      border-radius: 999px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #334155;
      border-right: 4px solid #2563eb;
      padding-right: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: right;
      font-size: 13px;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
    }
    .status-completed { color: #16a34a; font-weight: 600; }
    .status-in_progress { color: #ea580c; font-weight: 600; }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 1.6;
    }
    @media print {
      body { padding: 10px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>روزنگار | DailyLog</h1>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">گزارش ثبت عملکرد روزانه</p>
    </div>
    <div class="date-badge">
      ${formatToJalaliFull(report.date)} (${report.jalaliDate})
    </div>
  </div>

  ${report.summary ? `
    <div class="section-title">خلاصه روز</div>
    <div class="card">${report.summary}</div>
  ` : ''}

  <div class="section-title">فعالیت‌های کاری (${toPersianDigits(workActivities.length)})</div>
  ${workActivities.length === 0 ? '<p style="color:#94a3b8; font-size:13px;">فعالیت کاری ثبت نشده است.</p>' : `
    <table>
      <thead>
        <tr>
          <th>ردیف</th>
          <th>عنوان</th>
          <th>پروژه</th>
          <th>مدت (دقیقه)</th>
          <th>اولویت</th>
          <th>وضعیت</th>
          <th>توضیحات</th>
        </tr>
      </thead>
      <tbody>
        ${workActivities.map((act, idx) => `
          <tr>
            <td>${toPersianDigits(idx + 1)}</td>
            <td style="font-weight:600;">${act.title}</td>
            <td>${act.project || '-'}</td>
            <td>${toPersianDigits(act.durationMinutes || 0)}</td>
            <td>${act.priority === 'high' ? 'بالا' : act.priority === 'medium' ? 'متوسط' : 'عادی'}</td>
            <td class="${act.status === 'completed' ? 'status-completed' : 'status-in_progress'}">
              ${act.status === 'completed' ? '✓ انجام شد' : '⚡ نیمه‌تمام'}
            </td>
            <td>${act.description || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <div class="section-title">فعالیت‌های شخصی (${toPersianDigits(personalActivities.length)})</div>
  ${personalActivities.length === 0 ? '<p style="color:#94a3b8; font-size:13px;">فعالیت شخصی ثبت نشده است.</p>' : `
    <table>
      <thead>
        <tr>
          <th>ردیف</th>
          <th>عنوان</th>
          <th>دسته‌بندی</th>
          <th>وضعیت</th>
          <th>توضیحات</th>
        </tr>
      </thead>
      <tbody>
        ${personalActivities.map((act, idx) => `
          <tr>
            <td>${toPersianDigits(idx + 1)}</td>
            <td style="font-weight:600;">${act.title}</td>
            <td>${act.category || '-'}</td>
            <td class="${act.status === 'completed' ? 'status-completed' : 'status-in_progress'}">
              ${act.status === 'completed' ? '✓ انجام شد' : '⚡ نیمه‌تمام'}
            </td>
            <td>${act.description || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  ${report.tomorrowPlan ? `
    <div class="section-title">برنامه فردا</div>
    <div class="card" style="border-right: 4px solid #10b981;">${report.tomorrowPlan}</div>
  ` : ''}

  <div style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 14px;">
      چاپ و ذخیره به عنوان PDF
    </button>
  </div>

  <script>
    // Auto-trigger print dialog after load
    window.onload = function() {
      // Optional: window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

