import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, logoutFirebase, syncUserProfileToFirestore } from '../services/firebase';

const AuthContext = createContext();

export const roleProfiles = {
  patient: {
    role: 'patient',
    registration_id: 'REG-PAT-RAJESH-1001',
    registrationId: 'REG-PAT-RAJESH-1001',
    name: 'Rajesh V. Sharma',
    id: 'ABHA-9824-8819-TN',
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
    return saved ? JSON.parse(saved) : roleProfiles.patient;
  });

  const login = async (role, credentials = {}) => {
    const normRole = role === 'admin' ? 'hospital' : (role || 'patient');
    const profile = roleProfiles[normRole] || roleProfiles.patient;
    try {
      const payload = {
        role: normRole,
        identifier: credentials.identifier || '',
        email: credentials.identifier || '',
        phone: credentials.identifier || '',
        password: credentials.password || '',
      };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        const regId = data.user.registration_id || data.registration_id || profile.registration_id;
        const merged = {
          ...profile,
          ...data.user,
          registration_id: regId,
          registrationId: regId,
          role: normRole,
          dashboardRoute: profile.dashboardRoute,
        };
        setCurrentUser(merged);
        localStorage.setItem('ekavach_user', JSON.stringify(merged));
        syncUserProfileToFirestore(merged);
        if (data.accessToken) {
          localStorage.setItem('ekavach_token', data.accessToken);
        }
        if (normRole === 'patient' && (merged.profileCompleted === false || (!merged.bloodGroup && !merged.pincode))) {
          return '/patient/settings#profile';
        }
        return profile.dashboardRoute;
      } else if (credentials.identifier && (res.status === 400 || res.status === 401 || data.error || data.message)) {
        throw new Error(data.message || data.error || 'Invalid credentials or account not found in database');
      }
    } catch (e) {
      if (credentials.identifier && e.message) {
        throw e;
      }
      console.warn('Real-time auth sync fallback to role profile:', e);
    }

    setCurrentUser(profile);
    localStorage.setItem('ekavach_user', JSON.stringify(profile));
    syncUserProfileToFirestore(profile);
    if (normRole === 'patient' && (profile.profileCompleted === false || (!profile.bloodGroup && !profile.pincode))) {
      return '/patient/settings#profile';
    }
    return profile.dashboardRoute;
  };

  const register = async (role, details = {}) => {
    const normRole = role === 'admin' ? 'hospital' : (role || 'patient');
    const baseProfile = roleProfiles[normRole] || roleProfiles.patient;
    
    // Generate unique ID according to role
    const assignedId = normRole === 'doctor'
      ? (details.licenseId || details.nmcNumber ? ((details.licenseId || details.nmcNumber).startsWith('NMC') ? (details.licenseId || details.nmcNumber) : `NMC: ${details.licenseId || details.nmcNumber}`) : baseProfile.id)
      : (details.abhaNumber || (normRole === 'patient'
        ? `ABHA-${(details.aadhaar || details.phone || Date.now().toString()).slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}-TN`
        : baseProfile.id));

    const userPayload = {
      ...baseProfile,
      ...details,
      name: details.name || baseProfile.name,
      id: assignedId,
      nmcNumber: details.licenseId || details.nmcNumber || baseProfile.nmcNumber || '',
      licenseId: details.licenseId || details.nmcNumber || baseProfile.licenseId || '',
      abhaNumber: normRole === 'patient' ? assignedId : '',
      bloodGroup: details.bloodGroup || '',
      pincode: details.pincode || '',
      address: details.address || '',
      city: details.city || '',
      state: details.state || '',
      dob: details.dob || '',
      gender: details.gender || '',
      bpLevel: details.bpLevel || 'Normal (120/80)',
      hasDiabetes: details.hasDiabetes || 'No',
      diabetesType: details.diabetesType || '',
      diabetesMedication: details.diabetesMedication || '',
      emergencyContactName: details.emergencyContactName || baseProfile.emergencyContactName || '',
      emergencyContactRelation: details.emergencyContactRelation || baseProfile.emergencyContactRelation || 'Parent',
      emergencyContactPhone: details.emergencyContactPhone || baseProfile.emergencyContactPhone || '',
      allergies: details.allergies || '',
      conditions: details.conditions || '',
      aadhaarNumber: details.aadhaar || details.aadhaarNumber || '',
      profileCompleted: normRole === 'patient' ? false : true,
      role: normRole,
      dashboardRoute: baseProfile.dashboardRoute,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: details.email || `${normRole}_${Date.now()}@ekavach.gov.in`,
          phone: details.phone || details.contact,
          password: details.password || 'Ekavach@2026',
          role: normRole,
          name: userPayload.name,
          additionalDetails: userPayload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const regId = data.user.registration_id || data.registration_id || `REG-${Date.now()}`;
          const merged = {
            ...userPayload,
            ...data.user,
            registration_id: regId,
            registrationId: regId,
            profileCompleted: normRole === 'patient' ? false : true,
          };
          setCurrentUser(merged);
          localStorage.setItem('ekavach_user', JSON.stringify(merged));
          syncUserProfileToFirestore(merged);
          if (data.accessToken) {
            localStorage.setItem('ekavach_token', data.accessToken);
          }
          return normRole === 'patient' ? '/patient/settings#profile' : (normRole === 'hospital' ? '/admin/hospital-details' : baseProfile.dashboardRoute);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const message = errData.error || errData.message || 'Registration failed. Please check your credentials.';
        throw new Error(message);
      }
    } catch (e) {
      console.warn('Registration attempt failed:', e.message);
      throw e;
    }
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
    const profile = roleProfiles[normRole] || roleProfiles.patient;
    try {
      const res = await fetch('/api/auth/create-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: normRole,
          identifier: details.identifier || details.email || details.phone,
          newPassword: details.password || details.newPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const regId = data.user.registration_id || data.registration_id || profile.registration_id;
          const merged = { ...profile, ...data.user, registration_id: regId, registrationId: regId, role: normRole, dashboardRoute: profile.dashboardRoute };
          setCurrentUser(merged);
          localStorage.setItem('ekavach_user', JSON.stringify(merged));
          if (data.accessToken) {
            localStorage.setItem('ekavach_token', data.accessToken);
          }
          return profile.dashboardRoute;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create password');
      }
    } catch (e) {
      console.warn('Create password fallback:', e);
    }
    const merged = { ...profile, role: normRole, dashboardRoute: profile.dashboardRoute };
    setCurrentUser(merged);
    localStorage.setItem('ekavach_user', JSON.stringify(merged));
    return profile.dashboardRoute;
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
      const baseProfile = roleProfiles[normRole] || roleProfiles.patient;
      const abhaId = normRole === 'patient' ? `ABHA-${gUser.uid.slice(0, 4).toUpperCase()}-${gUser.uid.slice(4, 8).toUpperCase()}-TN` : baseProfile.id;
      const regId = `REG-GGL-${gUser.uid.slice(0, 8).toUpperCase()}`;

      const merged = {
        ...baseProfile,
        name: gUser.displayName || baseProfile.name,
        email: gUser.email,
        uid: gUser.uid,
        id: abhaId,
        registration_id: regId,
        registrationId: regId,
        photoURL: gUser.photoURL,
        role: normRole,
        dashboardRoute: baseProfile.dashboardRoute,
        isLocalSystemDB: true,
      };

      setCurrentUser(merged);
      localStorage.setItem('ekavach_user', JSON.stringify(merged));
      return baseProfile.dashboardRoute;
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
