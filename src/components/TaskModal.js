'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  CheckSquare,
  MessageSquare,
  Trash2,
  Send,
  AlertCircle,
  Plus,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { id: 'TODO', label: 'À faire' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'IN_REVIEW', label: 'En revue' },
  { id: 'DONE', label: 'Terminé' },
];

const PRIORITY_OPTIONS = [
  { id: 'LOW', label: 'Basse' },
  { id: 'MEDIUM', label: 'Moyenne' },
  { id: 'HIGH', label: 'Haute' },
  { id: 'CRITICAL', label: 'Critique' },
];

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onAddComment,
  users = [],
  companyId,
  projectId,
  activeUser,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    tags: [],
    subtasks: [],
  });

  const [newTagInput, setNewTagInput] = useState('');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newCommentInput, setNewCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assigneeId ? task.assigneeId.toString() : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: Array.isArray(task.tags) ? [...task.tags] : [],
        subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : [],
      });
      setComments(Array.isArray(task.comments) ? [...task.comments] : []);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: activeUser?._id ? activeUser._id.toString() : '',
        dueDate: '',
        tags: [],
        subtasks: [],
      });
      setComments([]);
    }
  }, [task, activeUser]);

  if (!isOpen) return null;

  const isEditing = Boolean(task?._id);
  const isOverdue =
    formData.dueDate &&
    new Date(formData.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
    formData.status !== 'DONE';

  const completedSubtasks = formData.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = formData.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  let submitButtonText = 'Créer la tâche';
  if (saving) {
    submitButtonText = 'Enregistrement...';
  } else if (isEditing) {
    submitButtonText = 'Mettre à jour';
  }

  // Gestion des tags
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Gestion des sous-tâches
  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    const newSub = {
      _id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtaskInput.trim(),
      completed: false,
    };
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSub],
    }));
    setNewSubtaskInput('');
  };

  const handleToggleSubtask = (subId) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((s) => (s._id === subId ? { ...s, completed: !s.completed } : s)),
    }));
  };

  const handleDeleteSubtask = (subId) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s._id !== subId),
    }));
  };

  // Envoi d'un commentaire
  const handleSendComment = async () => {
    if (!newCommentInput.trim() || !task?._id) return;
    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/tasks/${task._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: activeUser?._id,
          authorName: activeUser?.fullName || 'Utilisateur',
          content: newCommentInput.trim(),
          companyId,
        }),
      });
      if (res.ok) {
        const newCom = await res.json();
        setComments((prev) => [...prev, newCom]);
        setNewCommentInput('');
        if (onAddComment) onAddComment(task._id, newCom);
      }
    } catch (err) {
      alert('Erreur commentaire : ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Sauvegarde
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Le titre de la tâche est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        companyId,
        projectId,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      });
      onClose();
    } catch (err) {
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700">
              {isEditing ? 'Édition de tâche' : 'Nouvelle tâche'}
            </span>
            {isOverdue && (
              <span className="flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Date limite dépassée !</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du modal défilable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="task-title-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Titre de la tâche *
              </label>
              <input
                id="task-title-input"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Développer l'API REST avec MongoDB..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Sélecteurs : Statut, Priorité, Assigné, Échéance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Statut */}
              <div>
                <label htmlFor="task-status-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Statut
                </label>
                <select
                  id="task-status-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label htmlFor="task-priority-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Priorité
                </label>
                <select
                  id="task-priority-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignation */}
              <div>
                <label htmlFor="task-assignee-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Attribué à
                </label>
                <select
                  id="task-assignee-select"
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Non attribué</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date d'échéance */}
              <div>
                <label htmlFor="task-due-date-input" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Échéance (Deadline)
                </label>
                <input
                  id="task-due-date-input"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isOverdue ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Description
              </label>
              <textarea
                id="task-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Détails de la tâche, contexte opérationnel..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Étiquettes (Tags / Labels) */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Étiquettes (Tags)</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ajouter un tag (ex: Backend, Frontend, Urgent)..."
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Sous-tâches (Checklist) avec Barre de progression */}
            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Sous-tâches (Checklist)</span>
                </span>
                {totalSubtasks > 0 && (
                  <span className="text-xs font-semibold text-slate-600">
                    {completedSubtasks}/{totalSubtasks} complétées ({progressPercent}%)
                  </span>
                )}
              </div>

              {totalSubtasks > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completedSubtasks === totalSubtasks ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Liste des sous-tâches */}
              <div className="space-y-1.5 mb-3">
                {formData.subtasks.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 group transition-colors"
                  >
                    <label className="flex items-center space-x-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st._id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span
                        className={`text-xs ${
                          st.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Ajout de sous-tâche */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Ajouter un élément à la checklist..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </form>

          {/* Fil de discussion et commentaires (visible si la tâche existe) */}
          {isEditing && (
            <div className="border-t border-slate-200 pt-5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion & Commentaires ({comments.length})</span>
              </span>

              {/* Liste des commentaires */}
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun commentaire pour l&apos;instant.</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={c._id || i} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString('fr-FR') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Champ d'ajout de commentaire */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSendComment();
                    }
                  }}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSendComment()}
                  disabled={submittingComment || !newCommentInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Commenter</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal avec actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment supprimer définitivement cette tâche ?')) {
                    void onDelete(task._id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer la tâche</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="task-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-colors"
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
