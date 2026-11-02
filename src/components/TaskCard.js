'use client';

import React from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart, assignee }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const commentsCount = (task.comments || []).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { label: 'Critique', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'HIGH':
        return { label: 'Haute', bg: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'MEDIUM':
        return { label: 'Moyenne', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'LOW':
      default:
        return { label: 'Basse', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const priorityInfo = getPriorityBadge(task.priority);

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="w-full text-left group bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing select-none block"
    >
      {/* En-tête de carte : Priorité et Tags */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.bg}`}
        >
          {priorityInfo.label}
        </span>

        {isOverdue && (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>En retard</span>
          </span>
        )}
      </div>

      {/* Titre de la tâche */}
      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
        {task.title}
      </h4>

      {/* Description courte (si présente) */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 font-normal">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Barre de progression sous-tâches */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>Sous-tâches</span>
            </span>
            <span className="font-semibold text-slate-700">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completedSubtasks === totalSubtasks ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Pied de carte : Date, Commentaires et Assigné */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-xs">
        <div className="flex items-center space-x-3">
          {task.dueDate && (
            <span
              className={`flex items-center space-x-1 text-[11px] ${
                isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
              }`}
              title={`Échéance : ${new Date(task.dueDate).toLocaleDateString()}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </span>
          )}

          {commentsCount > 0 && (
            <span
              className="flex items-center space-x-1 text-[11px] text-slate-500"
              title={`${commentsCount} commentaire(s)`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </span>
          )}
        </div>

        {/* Avatar Assignee */}
        {assignee ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: assignee.avatarColor || '#4F46E5' }}
            title={`Attribué à : ${assignee.fullName} (${assignee.role})`}
          >
            {assignee.fullName?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <span
            className="text-[10px] text-slate-400 italic bg-slate-50 px-1.5 py-0.5 rounded border border-dashed border-slate-200"
            title="Non attribué"
          >
            Libre
          </span>
        )}
      </div>
    </button>
  );
}
