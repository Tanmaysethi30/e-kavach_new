const express = require('express');
const router = express.Router();
const metricsService = require('../services/metrics.service');

// Prometheus scrape endpoint
router.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsService.formatPrometheusMetrics());
});

// Grafana SimpleJson / Infinity Datasource Root Health Check
router.get('/grafana', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'E-KAVACH Grafana Backend Datasource Active' });
});

router.get('/grafana/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'e-kavach-grafana-datasource' });
});

// Grafana Search (returns list of metric targets for dropdowns in panels)
router.all('/grafana/search', (req, res) => {
  res.json([
    'Throughput (RPS)',
    'Response Time P95 (ms)',
    'Response Time Avg (ms)',
    'CPU Usage (%)',
    'Memory Usage (MB)',
    'Active WebSocket Clients',
    'ICU Occupancy (%)',
    'Triage Red (Critical)',
    'Triage Yellow (Urgent)',
  ]);
});

// Grafana Query (returns time series datapoints [[value, timestamp], ...])
router.all('/grafana/query', (req, res) => {
  const { range, targets, maxDataPoints } = req.body || {};
  const from = range?.from ? new Date(range.from).getTime() : Date.now() - 300000;
  const to = range?.to ? new Date(range.to).getTime() : Date.now();

  const targetList = Array.isArray(targets) ? targets : [{ target: 'Throughput (RPS)' }];
  const responseData = metricsService.queryTimeSeries(targetList, from, to);
  res.json(responseData);
});

// Grafana Annotations
router.all('/grafana/annotations', (req, res) => {
  const { range } = req.body || {};
  const from = range?.from ? new Date(range.from).getTime() : Date.now() - 3600000;
  const to = range?.to ? new Date(range.to).getTime() : Date.now();

  const annotations = metricsService.getAnnotations(from, to);
  res.json(annotations);
});

// Download/Inspect pre-configured E-KAVACH Grafana Dashboard JSON
router.get('/grafana/dashboard', (req, res) => {
  const dashboard = metricsService.getGrafanaDashboardJson();
  if (req.query.download === 'true') {
    res.setHeader('Content-Disposition', 'attachment; filename="ekavach-grafana-dashboard.json"');
    res.setHeader('Content-Type', 'application/json');
  }
  res.json(dashboard);
});

// Live metrics snapshot summary for web UI
router.get('/grafana/summary', (req, res) => {
  res.json(metricsService.getSummary());
});

// Server-Sent Events (SSE) live metric stream for instant sub-second dashboard rendering
router.get('/grafana/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendUpdate = () => {
    const summary = metricsService.getSummary();
    res.write(`data: ${JSON.stringify(summary)}\n\n`);
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

module.exports = router;
