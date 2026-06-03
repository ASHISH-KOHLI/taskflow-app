import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.2s',
};

const labelStyle = { display: 'block', marginBottom: '6px',
                     fontSize: '14px', fontWeight: '500', color: '#374151' };

export default function TaskForm({ onSuccess }) {
  const { createTask } = useTasks();
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await createTask(formData);
      setFormData({ title: '', description: '', priority: 'medium', status: 'todo' });
      onSuccess?.();
    } catch (err) {
      // Error already handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input name="title" value={formData.title} onChange={handleChange}
          placeholder="Task title..." required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange}
          placeholder="Optional description..." rows={3}
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
            <option value="todo">📋 Todo</option>
            <option value="in_progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={submitting || !formData.title.trim()}
        style={{
          padding: '10px 20px', background: submitting ? '#9CA3AF' : '#4F46E5',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
        }}>
        {submitting ? '⏳ Creating...' : '+ Create Task'}
      </button>
    </form>
  );
}
