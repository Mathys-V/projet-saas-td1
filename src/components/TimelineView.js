'use client';

import React from 'react';
import TaskCard from './TaskCard';
import { Calendar, AlertCircle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function TimelineView({
  tasks = [],
  usersMap = {},
  onTaskClick,
  onDragStart,
  onAddTaskClick,
}) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Groupes temporels
  const overdue = [];
  const todayAndWeek = [];
  const later = [];
  const noDate = [];
  const completed = [];

  tasks.forEach((t) => {
    if (t.status === 'DONE') {
      completed.push(t);
      return;
    }
    if (!t.dueDate) {
      noDate.push(t);
      return;
    }
    const d = new Date(t.dueDate);
    if (d < startOfToday) {
      overdue.push(t);
    } else if (d <= endOfWeek) {
      todayAndWeek.push(t);
    } else {
      later.push(t);
    }
  });

  const timelineGroups = [
    {
      id: 'overdue',
      title: 'En retard',
      icon: AlertCircle,
      tasks: overdue,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      borderColor: 'border-rose-200',
      headerBg: 'bg-rose-50/70',
    },
    {
      id: 'this_week',
      title: 'Cette semaine (Échéances proches)',
      icon: Clock,
      tasks: todayAndWeek,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      borderColor: 'border-amber-200',
      headerBg: 'bg-amber-50/70',
    },
    {
      id: 'later',
      title: 'Plus tard / Moyen terme',
      icon: CalendarDays,
      tasks: later,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      borderColor: 'border-indigo-100',
      headerBg: 'bg-indigo-50/50',
    },
    {
      id: 'no_date',
      title: 'Sans date d\'échéance',
      icon: Calendar,
      tasks: noDate,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      borderColor: 'border-slate-200',
      headerBg: 'bg-slate-50',
    },
    {
      id: 'completed',
      title: 'Tâches terminées',
      icon: CheckCircle2,
      tasks: completed,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      borderColor: 'border-emerald-200',
      headerBg: 'bg-emerald-50/50',
    },
  ];

  return (
    <div className="space-y-6">
      {timelineGroups.map((group) => {
        const Icon = group.icon;
        return (
          <div
            key={group.id}
            className={`bg-white rounded-2xl border ${group.borderColor} shadow-xs overflow-hidden`}
          >
            <div className={`px-4 py-3 border-b ${group.borderColor} ${group.headerBg} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4 shrink-0 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">{group.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                  {group.tasks.length}
                </span>
              </div>
            </div>

            <div className="p-4">
              {group.tasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">
                  Aucune tâche dans cette tranche d&apos;échéance.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      assignee={task.assigneeId ? usersMap[task.assigneeId] : null}
                      onClick={() => onTaskClick(task)}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
