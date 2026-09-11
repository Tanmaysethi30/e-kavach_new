import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const roleProfiles = {
  patient: {
    role: 'patient',
    name: 'Rajesh V. Sharma',
    id: 'ABHA-9824-8819-TN',
    tag: 'Verified Health ID',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/patient/dashboard',
  },
  doctor: {
    role: 'doctor',
    name: 'Dr. Kavitha Menon',
    title: 'Chief Interventional Cardio',
    id: 'NMC: MD-44912-TN',
    tag: 'ID-9942',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/doctor/dashboard',
  },
  hospital: {
    role: 'hospital',
    name: 'Dr. R. K. Nambiar',
    title: 'Hospital Administrator',
    id: 'AP-HSP-842-TN',
    tag: 'VERIFIED ADMIN',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/admin/dashboard',
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ekavach_user');
    return saved ? JSON.parse(saved) : roleProfiles.patient;
  });

  const login = (role) => {
    const profile = roleProfiles[role] || roleProfiles.patient;
    setCurrentUser(profile);
    localStorage.setItem('ekavach_user', JSON.stringify(profile));
    return profile.dashboardRoute;
  };

  const logout = () => {
    localStorage.removeItem('ekavach_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, roleProfiles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
