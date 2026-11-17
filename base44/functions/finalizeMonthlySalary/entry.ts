import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const TIMEZONE = 'Asia/Jerusalem';

function monthInfo(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now).split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    day,
    lastDay,
    isLastDay: day === lastDay,
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
    monthLabel: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, 1))),
    rangeStart: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    rangeEnd: new Date(Date.UTC(year, month, 1)).toISOString()
  };
}

function monthEndInstant(info) {
  return new Date(Date.UTC(info.year, info.month - 1, info.lastDay, 18, 0, 0)).toISOString();
}

function parseAmount(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

async function countCompletedTasks(base44, info) {
  const pageSize = 200;
  let skip = 0;
  let count = 0;
  const titles = [];
  while (true) {
    const page = await base44.asServiceRole.entities.Task.filter(
      { completed: true, created_date: { $gte: info.rangeStart, $lt: info.rangeEnd } },
      { sort: '-created_date', limit: pageSize, skip }
    );
    const items = page?.items ?? [];
    count += items.length;
    for (const task of items) {
      if (titles.length < 12 && task.title) titles.push(task.title);
    }
    if (items.length < pageSize) break;
    skip += pageSize;
  }
  return { count, titles };
}

async function loadEmployees(base44) {
  const pageSize = 200;
  let skip = 0;
  const all = [];
  while (true) {
    const page = await base44.asServiceRole.entities.EmployeeSalary.list({ sort: 'employee_name', limit: pageSize, skip });
    const items = page?.items ?? [];
    all.push(...items);
    if (items.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    const info = monthInfo(new Date());
    if (!info.isLastDay && !force) {
      return Response.json({
        finalized: false,
        reason: 'not_last_day_of_month',
        month: info.monthKey,
        month_label: info.monthLabel
      });
    }

    const { count: completedTasks, titles: taskTitles } = await countCompletedTasks(base44, info);
    const employees = await loadEmployees(base44);

    const lines = employees.map((employee) => {
      const monthly = Math.round((parseAmount(employee.annual_salary) / 12) * 100) / 100;
      return {
        employee_name: employee.employee_name,
        annual_salary: parseAmount(employee.annual_salary),
        monthly_salary: monthly
      };
    });
    const totalMonthlySalary = Math.round(lines.reduce((sum, line) => sum + line.monthly_salary, 0) * 100) / 100;

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const hr = admins?.[0] ?? null;

    const payload = {
      month: info.monthKey,
      month_label: info.monthLabel,
      completed_task_count: completedTasks,
      employee_count: lines.length,
      total_monthly_salary: totalMonthlySalary,
      status: 'finalized',
      finalized_at: monthEndInstant(info),
      sample_tasks: taskTitles
    };

    const existing = await base44.asServiceRole.entities.MonthlySalaryRun.filter({ month: info.monthKey }, { limit: 1 });
    const existingRecord = existing?.items?.[0] ?? null;
    const record = existingRecord
      ? await base44.asServiceRole.entities.MonthlySalaryRun.update(existingRecord.id, payload)
      : await base44.asServiceRole.entities.MonthlySalaryRun.create(payload);

    return Response.json({
      finalized: true,
      record_id: record.id,
      month: payload.month,
      month_label: payload.month_label,
      completed_tasks: completedTasks,
      employee_count: lines.length,
      total_monthly_salary: totalMonthlySalary,
      hr_recipient: hr?.email ?? null,
      hr_name: hr?.full_name ?? 'HR team'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}