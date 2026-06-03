import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { tasksApi } from '../services/api';
import toast from 'react-hot-toast';

const TaskContext = createContext();

// Reducer: pure function that handles state transitions
const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks:   [],
    loading: false,
    error:   null,
  });

  const fetchTasks = useCallback(async (filters = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await tasksApi.getAll(filters);
      dispatch({ type: 'SET_TASKS', payload: response.data.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      toast.error('Failed to load tasks');
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const response = await tasksApi.create(taskData);
      dispatch({ type: 'ADD_TASK', payload: response.data.data });
      toast.success('Task created!');
      return response.data.data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id, data) => {
    try {
      const response = await tasksApi.update(id, data);
      dispatch({ type: 'UPDATE_TASK', payload: response.data.data });
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await tasksApi.delete(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  return (
    <TaskContext.Provider value={{
      ...state, fetchTasks, createTask, updateTask, deleteTask,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
};
