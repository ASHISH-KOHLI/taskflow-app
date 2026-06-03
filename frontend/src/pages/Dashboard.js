import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

const COLUMNS = [
  { key: 'todo',        label: '📋 Todo',        color: '#FEF3C7' },
  { key: 'in_progress', label: '🔄 In Progress',  color: '#DBEAFE' },
  { key: 'done',        label: '✅ Done',          color: '#D1FAE5' },
];

export default function Dashboard() {
  const { tasks, loading, fetchTasks } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ priority: '' });

  useEffect(() => { fetchTasks(filter); }, [fetchTasks, filter]);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#4F46E5', color: 'white', padding: '16px 24px',
                       display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>⚡ TaskFlow</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
            GitOps Learning Project — {tasks.length} tasks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={filter.priority}
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
            style={{ padding: '8px', borderRadius: '6px', border: 'none', fontSize: '13px' }}>
            <option value="">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <button onClick={() => setShowForm(s => !s)}
            style={{ padding: '8px 16px', background: 'white', color: '#4F46E5',
                     border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            {showForm ? '✕ Cancel' : '+ New Task'}
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Task Form */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px',
                        marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#111827' }}>
              Create New Task
            </h2>
            <TaskForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
            ⏳ Loading tasks...
          </div>
        )}

        {/* Kanban Board */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {COLUMNS.map(col => (
              <div key={col.key}>
                <div style={{ background: col.color, borderRadius: '10px',
                              padding: '12px 16px', marginBottom: '12px',
                              display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{col.label}</span>
                  <span style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '999px',
                                 padding: '2px 8px', fontSize: '12px', fontWeight: '600' }}>
                    {tasksByStatus[col.key]?.length || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tasksByStatus[col.key]?.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus[col.key]?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF',
                                  border: '2px dashed #E5E7EB', borderRadius: '10px' }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
