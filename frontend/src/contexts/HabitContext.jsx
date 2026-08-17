import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const HabitContext = createContext();

export const useHabits = () => useContext(HabitContext);

export const HabitProvider = ({ children }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.get('/habits');
      // Normalize _id to id for frontend compatibility and ensure history exists
      const normalizedHabits = res.data.map(h => ({ ...h, id: h._id, history: h.history || {} }));
      setHabits(normalizedHabits);
    } catch (err) {
      console.error('Failed to fetch habits', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (habitData) => {
    try {
      const res = await api.post('/habits', habitData);
      const newHabit = { ...res.data, id: res.data._id, history: res.data.history || {} };
      setHabits([newHabit, ...habits]);
    } catch (err) {
      throw err.response?.data?.message || 'Failed to add habit';
    }
  };

  const updateHabit = async (id, habitData) => {
    try {
      // Optimistic update
      setHabits(habits.map(h => h.id === id ? { ...h, ...habitData } : h));
      await api.put(`/habits/${id}`, habitData);
    } catch (err) {
      // Revert on error
      fetchHabits();
      throw err.response?.data?.message || 'Failed to update habit';
    }
  };

  const deleteHabit = async (id) => {
    try {
      setHabits(habits.filter(h => h.id !== id));
      await api.delete(`/habits/${id}`);
    } catch (err) {
      fetchHabits();
      throw err.response?.data?.message || 'Failed to delete habit';
    }
  };

  return (
    <HabitContext.Provider value={{
      habits,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      refreshHabits: fetchHabits
    }}>
      {children}
    </HabitContext.Provider>
  );
};
