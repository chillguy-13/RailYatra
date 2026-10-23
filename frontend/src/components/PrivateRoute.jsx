import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-page"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="spinner-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};
