'use client';

import React from 'react';
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';

const STATUS_LABELS = {
  TODO: { label: 'À faire', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_REVIEW: { label: 'En revue', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DONE: { label: 'Terminé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PRIORITY_LABELS = {
  CRITICAL: { label: 'Critique', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  MEDIUM: { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  LOW: { label: 'Basse', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function TaskTableView({
  tasks = [],
  usersMap = {},
  onTaskClick,
  onDuplicateTask,
  onDeleteTask,
  activeUser,
}) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
        Aucune tâche ne correspond aux critères de recherche ou de filtre.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Titre de la tâche</th>
              <th className="py-3 px-3">Statut</th>
              <th className="py-3 px-3">Priorité</th>
              <th className="py-3 px-3">Assigné à</th>
              <th className="py-3 px-3">Échéance</th>
              <th className="py-3 px-3">Sous-tâches</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
              const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
              const totalSubtasks = (task.subtasks || []).length;
              const assignee = task.assigneeId ? usersMap[task.assigneeId] : null;
              const statusCfg = STATUS_LABELS[task.status] || {
                label: task.status,
                color: 'bg-slate-100 text-slate-700',
              };
              const priorityCfg = PRIORITY_LABELS[task.priority] || {
                label: task.priority,
                color: 'bg-slate-100 text-slate-700',
              };

              return (
                <tr
                  key={task._id}
                  onClick={() => onTaskClick(task)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Titre & Description */}
                  <td className="py-3 px-4 max-w-xs sm:max-w-md">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {task.description}
                      </span>
                    )}
                    {task.tags?.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1 flex-wrap">
                        {task.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="py-3 px-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Priorité */}
                  <td className="py-3 px-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${priorityCfg.color}`}
                    >
                      {priorityCfg.label}
                    </span>
                  </td>

                  {/* Assigné à */}
                  <td className="py-3 px-3">
                    {assignee ? (
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: assignee.avatarColor || '#4F46E5' }}
                        >
                          {assignee.fullName?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700 truncate max-w-[100px]">
                          {assignee.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Non attribué</span>
                    )}
                  </td>

                  {/* Échéance */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {task.dueDate ? (
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-[11px] font-medium flex items-center space-x-1 ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3 text-rose-500" />}
                          <span>{new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Sous-tâches */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {totalSubtasks > 0 ? (
                      <div className="flex items-center space-x-1.5">
                        <CheckSquare className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onDuplicateTask && (
                        <button
                          onClick={() => onDuplicateTask(task)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Dupliquer la tâche"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onTaskClick(task)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Modifier la tâche"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {activeUser?.role !== 'MEMBER' && onDeleteTask && (
                        <button
                          onClick={() => {
                            if (confirm('Supprimer cette tâche ?')) {
                              void onDeleteTask(task._id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Supprimer la tâche"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
