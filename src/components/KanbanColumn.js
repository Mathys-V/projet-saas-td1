'use client';

import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

export default function KanbanColumn({
  column,
  tasks,
  usersMap,
  onTaskClick,
  onDragStart,
  onDropTask,
  onAddTaskClick,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/80 rounded-2xl p-3 min-w-[280px] w-full flex-1 border transition-all ${
        isDragOver
          ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200'
          : 'border-slate-200/60'
      }`}
    >
      {/* Header Colonne */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${column.dotColor}`} />
          <h3 className="text-sm font-bold text-slate-800">{column.title}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTaskClick(column.id)}
          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
          title={`Ajouter une tâche dans ${column.title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cartes de la colonne */}
      <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[300px] max-h-[calc(100vh-280px)] pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            assignee={usersMap[task.assigneeId]}
            onClick={onTaskClick}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
            <span>Aucune tâche</span>
            <button
              onClick={() => onAddTaskClick(column.id)}
              className="mt-1 text-indigo-600 hover:underline font-medium text-[11px]"
            >
              + Ajouter une tâche
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
