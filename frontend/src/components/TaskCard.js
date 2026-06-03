import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';

const STATUS_COLORS = {
  todo:        { bg: '#FEF3C7', text: '#92400E', label: '📋 Todo'       },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: '🔄 In Progress' },
  done:        { bg: '#D1FAE5', text: '#065F46', label: '✅ Done'        },
};

const PRIORITY_COLORS = {
  low:    { bg: '#F0FDF4', text: '#166534', label: '🟢 Low'    },
  medium: { bg: '#FFFBEB', text: '#92400E', label: '🟡 Medium' },
  high:   { bg: '#FEF2F2', text: '#991B1B', label: '🔴 High'   },
};

const NEXT_STATUS = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export default function TaskCard({ task }) {
  const { updateTask, deleteTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);

  const statusStyle   = STATUS_COLORS[task.status]   || STATUS_COLORS.todo;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  const handleAdvanceStatus = () => {
    updateTask(task.id, { status: NEXT_STATUS[task.status] });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setIsDeleting(true);
    try { await deleteTask(task.id); }
    catch { setIsDeleting(false); }
  };

  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb',
      opacity: isDeleting ? 0.5 : 1, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          {task.title}
        </h3>
        <button onClick={handleDelete} disabled={isDeleting}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
                   fontSize: '18px', color: '#9CA3AF' }}>
          🗑️
        </button>
      </div>

      {task.description && (
        <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 12px 0' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '12px',
                       background: statusStyle.bg, color: statusStyle.text }}>
          {statusStyle.label}
        </span>
        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '12px',
                       background: priorityStyle.bg, color: priorityStyle.text }}>
          {priorityStyle.label}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
          {new Date(task.created_at).toLocaleDateString()}
        </span>
        <button onClick={handleAdvanceStatus}
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px',
                   background: '#4F46E5', color: 'white', border: 'none', cursor: 'pointer' }}>
          Advance →
        </button>
      </div>
    </div>
  );
}
