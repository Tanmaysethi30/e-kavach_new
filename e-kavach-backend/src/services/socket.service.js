const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.heartbeatInterval = null;
  }

  init(httpServer, corsOrigins) {
    this.io = new Server(httpServer, {
      path: '/ws/telemetry',
      cors: {
        origin: corsOrigins || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`[WS TELEMETRY] Client connected: ${socket.id}`);

      // Send immediate telemetry snapshot on connect
      socket.emit('telemetry:snapshot', {
        timestamp: new Date().toISOString(),
        networkStatus: 'SYNCHRONIZED',
        hospital: 'Apollo Greams Trauma Hub',
        beds: { total: 450, occupied: 382, available: 68, icuLoad: 92 },
        triageStatus: { red: 1, yellow: 1, green: 1 },
      });

      socket.on('subscribe', (channel) => {
        socket.join(channel);
        console.log(`[WS] ${socket.id} joined channel ${channel}`);
      });

      socket.on('disconnect', () => {
        console.log(`[WS TELEMETRY] Client disconnected: ${socket.id}`);
      });
    });

    // Start background live telemetry simulation pulse every 10 seconds
    this.startLivePulse();
  }

  broadcastTelemetry(event, data) {
    if (this.io) {
      this.io.emit(event, {
        timestamp: new Date().toISOString(),
        ...data,
      });
    }
  }

  broadcastAppointment(data) {
    if (this.io) {
      console.log('📡 [WS] Broadcasting appointment update:', data.type || 'APPOINTMENT');
      this.io.emit('appointment:update', {
        timestamp: new Date().toISOString(),
        ...data,
      });
    }
  }

  broadcastConsentRequest(data) {
    if (this.io) {
      console.log('📡 [WS] Broadcasting consent update:', data.type || 'CONSENT');
      this.io.emit('consent:update', {
        timestamp: new Date().toISOString(),
        ...data,
      });
    }
  }

  startLivePulse() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      if (this.io && this.io.engine.clientsCount > 0) {
        // Minor dynamic telemetry jitter for live feel
        const icuOccupancy = 45 + Math.floor(Math.random() * 3); // 45-47 beds
        const available = 50 - icuOccupancy;

        this.io.emit('telemetry:heartbeat', {
          timestamp: new Date().toISOString(),
          node: 'AP-HSP-842-TN',
          icuTelemetry: {
            total: 50,
            occupied: icuOccupancy,
            available,
            loadPercentage: Math.round((icuOccupancy / 50) * 100),
          },
          oxygenReserveHours: 96,
          stateNetworkSync: 'ACTIVE',
        });

        // Emit real-time Grafana metrics packet
        try {
          const metricsService = require('./metrics.service');
          if (metricsService && typeof metricsService.getSummary === 'function') {
            this.io.emit('telemetry:grafana-metrics', metricsService.getSummary());
          }
        } catch (_e) {
          // ignore
        }
      }
    }, 3000);
  }
}

module.exports = new SocketService();
