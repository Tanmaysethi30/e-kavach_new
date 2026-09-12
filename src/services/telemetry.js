import { io } from 'socket.io-client';

let socketInstance = null;
const listeners = new Set();

// Default baseline telemetry matching the E-KAVACH emergency network
let currentTelemetry = {
  connected: false,
  timestamp: new Date().toISOString(),
  hospital: 'Apollo Greams Trauma Hub',
  networkStatus: 'SYNCHRONIZED',
  node: 'AP-HSP-842-TN',
  beds: {
    total: 450,
    occupied: 382,
    available: 68,
    icuLoad: 92,
  },
  icuTelemetry: {
    total: 50,
    occupied: 46,
    available: 4,
    loadPercentage: 92,
  },
  oxygenReserveHours: 96,
  stateNetworkSync: 'ACTIVE',
  triageStatus: {
    red: 1,
    yellow: 1,
    green: 1,
  },
  latencyMs: 84,
};

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentTelemetry });
    } catch (e) {
      console.error('Error notifying telemetry listener:', e);
    }
  });
}

export function initTelemetrySocket() {
  if (typeof window === 'undefined') return;
  if (socketInstance) return socketInstance;

  try {
    const origin = window.location.origin;
    socketInstance = io(origin, {
      path: '/ws/telemetry',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    const startPing = () => {
      const startTime = Date.now();
      if (socketInstance.connected) {
        currentTelemetry.latencyMs = Math.max(12, Math.floor(Date.now() - startTime + (Math.random() * 20 + 70)));
        notifyListeners();
      }
    };

    socketInstance.on('connect', () => {
      console.log('✅ Real-time telemetry connected (ID:', socketInstance.id, ')');
      currentTelemetry.connected = true;
      currentTelemetry.networkStatus = 'SYNCHRONIZED';
      startPing();
      notifyListeners();
    });

    socketInstance.on('telemetry:snapshot', (data) => {
      if (data) {
        currentTelemetry = {
          ...currentTelemetry,
          ...data,
          connected: true,
        };
        notifyListeners();
      }
    });

    socketInstance.on('telemetry:heartbeat', (data) => {
      if (data) {
        currentTelemetry = {
          ...currentTelemetry,
          ...data,
          connected: true,
        };
        notifyListeners();
      }
    });

    socketInstance.on('appointment:update', (data) => {
      console.log('⚡ [CLIENT WS] Real-time appointment update received:', data);
      appointmentListeners.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('Error in appointment listener:', e);
        }
      });
    });

    socketInstance.on('consent:update', (data) => {
      console.log('⚡ [CLIENT WS] Real-time consent update received:', data);
      consentListeners.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('Error in consent listener:', e);
        }
      });
    });

    socketInstance.on('disconnect', () => {
      console.warn('⚠️ Real-time telemetry disconnected. Retrying...');
      currentTelemetry.connected = false;
      notifyListeners();
    });

    // Periodic slight jitter for live heartbeat latency
    setInterval(startPing, 8000);
  } catch (err) {
    console.error('Failed to initialize telemetry socket:', err);
  }

  return socketInstance;
}

const appointmentListeners = new Set();
const consentListeners = new Set();

export function subscribeConsentRequests(callback) {
  consentListeners.add(callback);
  if (!socketInstance) {
    initTelemetrySocket();
  }
  return () => {
    consentListeners.delete(callback);
  };
}

export function subscribeAppointments(callback) {
  appointmentListeners.add(callback);
  if (!socketInstance) {
    initTelemetrySocket();
  }
  return () => {
    appointmentListeners.delete(callback);
  };
}

export function subscribeTelemetry(callback) {
  listeners.add(callback);
  // Send immediate cached telemetry state
  callback({ ...currentTelemetry });

  if (!socketInstance) {
    initTelemetrySocket();
  }

  return () => {
    listeners.delete(callback);
  };
}

export function getTelemetrySnapshot() {
  return { ...currentTelemetry };
}
