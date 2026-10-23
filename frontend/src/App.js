import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';

import './styles/global.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ViewTrains from './pages/ViewTrains';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import TicketSuccess from './pages/TicketSuccess';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import ManageTrains from './pages/ManageTrains';
import AddTrain from './pages/AddTrain';
import EditTrain from './pages/EditTrain';
import AdminBookings from './pages/AdminBookings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User routes */}
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/trains" element={<PrivateRoute><ViewTrains /></PrivateRoute>} />
          <Route path="/book/:trainNo" element={<PrivateRoute><Booking /></PrivateRoute>} />
          <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/ticket-success" element={<PrivateRoute><TicketSuccess /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/trains" element={<AdminRoute><ManageTrains /></AdminRoute>} />
          <Route path="/admin/trains/add" element={<AdminRoute><AddTrain /></AdminRoute>} />
          <Route path="/admin/trains/edit/:trainNo" element={<AdminRoute><EditTrain /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
