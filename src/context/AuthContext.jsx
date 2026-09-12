import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, logoutFirebase } from '../services/firebase';

const AuthContext = createContext();

export const roleProfiles = {
  patient: {
    role: 'patient',
    registration_id: 'REG-PAT-RAJESH-1001',
    registrationId: 'REG-PAT-RAJESH-1001',
    name: 'Rajesh V. Sharma',
    id: 'ABHA-9824-8819-3320-TN',
    abhaNumber: '9824-8819-3320-TN',
    emergencyToken: 'EK-TR-88190-V4',
    passToken: 'EK-TR-88190-V4',
    tag: 'Verified Health ID',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/patient/dashboard',
    emergencyContactName: 'Ananya S. Sharma',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '+91 98401 22819',
  },
  doctor: {
    role: 'doctor',
    registration_id: 'REG-DOC-KAVITHA-2002',
    registrationId: 'REG-DOC-KAVITHA-2002',
    hospitalRegistrationId: 'REG-HOSP-APOLLO-0842',
    name: 'Dr. Kavitha Menon',
    title: 'Chief Interventional Cardio',
    id: 'NMC: MD-44912-TN',
    tag: 'ID-9942',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/doctor/dashboard',
  },
  hospital: {
    role: 'hospital',
    registration_id: 'REG-HOSP-ADMIN-3003',
    registrationId: 'REG-HOSP-ADMIN-3003',
    hospitalRegistrationId: 'REG-HOSP-APOLLO-0842',
    name: 'Dr. R. K. Nambiar',
    title: 'Hospital Administrator',
    id: 'AP-HSP-842-TN',
    email: 'namanjain82670@gmail.com',
    tag: 'VERIFIED ADMIN',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/admin/dashboard',
  },
  admin: {
    role: 'hospital',
    registration_id: 'REG-HOSP-ADMIN-3003',
    registrationId: 'REG-HOSP-ADMIN-3003',
    hospitalRegistrationId: 'REG-HOSP-APOLLO-0842',
    name: 'Dr. R. K. Nambiar',
    title: 'Hospital Administrator',
    id: 'AP-HSP-842-TN',
    email: 'namanjain82670@gmail.com',
    tag: 'VERIFIED ADMIN',
    hospital: 'Apollo Greams Trauma Hub',
    dashboardRoute: '/admin/dashboard',
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ekavach_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = async (role, credentials = {}) => {
    const normRole = role === 'admin' ? 'hospital' : (role || 'patient');
    const defaultRoute = normRole === 'doctor' ? '/doctor/dashboard' : normRole === 'hospital' ? '/admin/dashboard' : '/patient/dashboard';
    
    const hasIdentifier = Boolean((credentials.identifier || '').trim());
    const payload = {
      role: normRole,
      identifier: (credentials.identifier || '').trim(),
      email: (credentials.identifier || '').trim(),
      phone: (credentials.identifier || '').trim(),
      password: credentials.password || '',
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        const regId = data.user.registration_id || data.registration_id || data.user.id;
        const userObj = {
          ...data.user,
          registration_id: regId,
          registrationId: regId,
          role: data.user.role || normRole,
          dashboardRoute: data.user.dashboardRoute || defaultRoute,
        };

        setCurrentUser(userObj);
        localStorage.setItem('ekavach_user', JSON.stringify(userObj));
        if (data.accessToken) {
          localStorage.setItem('ekavach_token', data.accessToken);
        }
        return userObj.dashboardRoute;
      }

      if (hasIdentifier) {
        const errorMsg = data.message || data.error || 'Invalid credentials or account not found. Please verify your details.';
        throw new Error(errorMsg);
      }
    } catch (err) {
      if (hasIdentifier) {
        throw err;
      }
      console.warn('Backend login fallback used:', err);
    }

    // Safe fallback for role-based navigation when no specific identifier was provided
    const fallbackProfile = roleProfiles[normRole] || roleProfiles.patient;
    setCurrentUser(fallbackProfile);
    localStorage.setItem('ekavach_user', JSON.stringify(fallbackProfile));
    return defaultRoute;
  };

  const register = async (role, details = {}) => {
    const normRole = role === 'admin' ? 'hospital' : (role || 'patient');
    const defaultRoute = normRole === 'doctor' ? '/doctor/dashboard' : normRole === 'hospital' ? '/admin/dashboard' : '/patient/dashboard';

    const cleanName = details.name || (normRole === 'doctor' ? 'Medical Clinician' : normRole === 'hospital' ? 'Hospital Administrator' : 'Registered Patient');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: details.email || `${normRole}_${Date.now()}@ekavach.health`,
        phone: details.phone || details.contact,
        password: details.password || 'Password@123',
        role: normRole,
        name: cleanName,
        additionalDetails: {
          ...details,
          name: cleanName,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.user) {
      const regId = data.user.registration_id || data.registration_id || data.user.id;
      const userObj = {
        ...data.user,
        registration_id: regId,
        registrationId: regId,
        role: data.user.role || normRole,
        dashboardRoute: data.user.dashboardRoute || defaultRoute,
      };

      setCurrentUser(userObj);
      localStorage.setItem('ekavach_user', JSON.stringify(userObj));
      if (data.accessToken) {
        localStorage.setItem('ekavach_token', data.accessToken);
      }
      return defaultRoute;
    }

    const message = data.error || data.message || 'Registration failed. Please check your credentials.';
    throw new Error(message);
  };

  const updateProfileDetails = (updatedFields) => {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        ...updatedFields,
        profileCompleted: true, // Mark profile completed once saved
      };
      if (updatedFields.fullName && !updatedFields.name) {
        updated.name = updatedFields.fullName;
      }
      localStorage.setItem('ekavach_user', JSON.stringify(updated));
      return updated;
    });
  };

  const createPassword = async (role, details = {}) => {
    const normRole = role === 'admin' ? 'hospital' : (role || 'patient');
    const defaultRoute = normRole === 'doctor' ? '/doctor/dashboard' : normRole === 'hospital' ? '/admin/dashboard' : '/patient/dashboard';
    
    const res = await fetch('/api/auth/create-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: normRole,
        identifier: details.identifier || details.email || details.phone,
        newPassword: details.password || details.newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.user) {
      const regId = data.user.registration_id || data.registration_id || data.user.id;
      const userObj = {
        ...data.user,
        registration_id: regId,
        registrationId: regId,
        role: data.user.role || normRole,
        dashboardRoute: data.user.dashboardRoute || defaultRoute,
      };
      setCurrentUser(userObj);
      localStorage.setItem('ekavach_user', JSON.stringify(userObj));
      if (data.accessToken) {
        localStorage.setItem('ekavach_token', data.accessToken);
      }
      return userObj.dashboardRoute;
    }

    const err = data.error || data.message || 'Failed to create password';
    throw new Error(err);
  };

  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    // Local session verification on mount
    const savedToken = localStorage.getItem('ekavach_token');
    const savedUser = localStorage.getItem('ekavach_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!parsed.registration_id && parsed.registrationId) {
          parsed.registration_id = parsed.registrationId;
        }
        setCurrentUser(parsed);
      } catch (_e) {}
    }

    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser((prev) => {
              const updated = { ...prev, ...data.user };
              localStorage.setItem('ekavach_user', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const signInWithGoogle = async (preferredRole = 'patient') => {
    try {
      localStorage.setItem('ekavach_selected_role', preferredRole);
      const gUser = await loginWithGoogle();
      if (!gUser) throw new Error('No user returned from Google sign-in');

      let role = preferredRole;
      if (!role) {
        if (gUser.email === 'namanjain82670@gmail.com') {
          role = 'hospital';
        } else if (gUser.email?.toLowerCase().includes('doctor') || gUser.displayName?.toLowerCase().includes('dr.')) {
          role = 'doctor';
        } else {
          role = 'patient';
        }
      }

      const normRole = role === 'admin' ? 'hospital' : role;
      const defaultRoute = normRole === 'doctor' ? '/doctor/dashboard' : normRole === 'hospital' ? '/admin/dashboard' : '/patient/dashboard';
      const regId = `REG-GGL-${gUser.uid.slice(0, 8).toUpperCase()}`;

      const userObj = {
        name: gUser.displayName || (normRole === 'doctor' ? 'Dr. Medical Clinician' : normRole === 'hospital' ? 'Hospital Administrator' : 'Verified Patient'),
        email: gUser.email,
        uid: gUser.uid,
        id: normRole === 'patient' ? `ABHA-${gUser.uid.slice(0, 4).toUpperCase()}-${gUser.uid.slice(4, 8).toUpperCase()}-TN` : regId,
        registration_id: regId,
        registrationId: regId,
        photoURL: gUser.photoURL,
        role: normRole,
        dashboardRoute: defaultRoute,
        tag: 'VERIFIED',
      };

      setCurrentUser(userObj);
      localStorage.setItem('ekavach_user', JSON.stringify(userObj));
      return defaultRoute;
    } catch (err) {
      console.error('Google Sign-In error:', err);
      throw err;
    }
  };

  const logout = async () => {
    await logoutFirebase();
    localStorage.removeItem('ekavach_user');
    localStorage.removeItem('ekavach_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        setCurrentUser,
        firebaseUser,
        signInWithGoogle,
        login,
        register,
        updateProfileDetails,
        createPassword,
        logout,
        roleProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
