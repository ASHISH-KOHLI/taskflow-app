import React from 'react';
import { Toaster } from 'react-hot-toast';
import { TaskProvider } from './context/TaskContext';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <TaskProvider>
      <Toaster position="top-right" />
      <Dashboard />
    </TaskProvider>
  );
}
