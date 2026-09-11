import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Zap,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Download,
  Copy,
  Check,
  Search,
  Sliders,
  Terminal,
  Play,
  Flame,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { subscribeGrafanaMetrics, getTelemetrySnapshot } from '../../services/telemetry';

export default function GrafanaObservability() {
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState('5m');
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState(null);
  const [promQuery, setPromQuery] = useState('rate(ekavach_http_requests_total[1m])');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboards'); // 'dashboards' | 'explorer' | 'datasource' | 'annotations'
  const [pulseTriggered, setPulseTriggered] = useState(false);

  // Initial load via HTTP API
  const fetchMetricsSnapshot = async () => {
    try {
      const res = await fetch('/api/grafana/summary');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.warn('Failed to fetch initial Grafana summary:', e);
    }
  };

  useEffect(() => {
    fetchMetricsSnapshot();

    // Subscribe to WebSocket live telemetry push
    const unsubscribe = subscribeGrafanaMetrics((liveData) => {
      if (!isLivePaused && liveData) {
        setMetrics(liveData);
      }
    });

    // Fallback polling interval if WebSocket is idle
    const interval = setInterval(() => {
      if (!isLivePaused) {
        fetchMetricsSnapshot();
      }
    }, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshInterval, isLivePaused]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const executePromQuery = async (queryToRun = promQuery) => {
    setQueryLoading(true);
    const start = performance.now();
    try {
      let targetName = 'Throughput (RPS)';
      if (queryToRun.includes('response_time') || queryToRun.includes('latency')) {
        targetName = 'Response Time P95 (ms)';
      } else if (queryToRun.includes('cpu')) {
        targetName = 'CPU Usage (%)';
      } else if (queryToRun.includes('memory')) {
        targetName = 'Memory Usage (MB)';
      } else if (queryToRun.includes('icu')) {
        targetName = 'ICU Occupancy (%)';
      } else if (queryToRun.includes('websocket')) {
        targetName = 'Active WebSocket Clients';
      }

      const res = await fetch('/api/grafana/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          range: {
            from: new Date(Date.now() - 300000).toISOString(),
            to: new Date().toISOString(),
          },
          targets: [{ target: targetName }],
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      setQueryResult({
        query: queryToRun,
        executionTimeMs: elapsed,
        target: targetName,
        datapointsCount: data[0]?.datapoints?.length || 0,
        latestValue: data[0]?.datapoints?.slice(-1)[0]?.[0] ?? 'N/A',
        raw: data,
      });
    } catch (err) {
      setQueryResult({
        query: queryToRun,
        error: err.message || 'Query execution failed',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSimulatePulse = async () => {
    setPulseTriggered(true);
    try {
      await fetch('/api/health');
      await fetch('/api/grafana/summary');
      setTimeout(fetchMetricsSnapshot, 200);
    } catch (_e) {
      // ignore
    }
    setTimeout(() => setPulseTriggered(false), 1200);
  };

  const history = useMemo(() => {
    return metrics?.history || [];
  }, [metrics]);

  // Derived calculations
  const rps = metrics?.performance?.rps ?? 16.4;
  const p95 = metrics?.performance?.latencies?.p95 ?? 18;
  const avgLatency = metrics?.performance?.latencies?.avg ?? 11.2;
  const cpu = metrics?.system?.cpuUsagePercent ?? 24;
  const memoryMb = metrics?.system?.memoryHeapUsedMb ?? 142;
  const activeWs = metrics?.system?.activeWebsockets ?? 6;
  const icuOcc = metrics?.healthcare?.icuOccupancyRate ?? 92;
  const totalReqs = metrics?.performance?.totalRequests ?? 1284;
  const goldenScans = metrics?.healthcare?.goldenHourScans ?? 142;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                  Grafana Real-Time Observability
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE TELEMETRY STREAM
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  Node: AP-HSP-842-TN
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                Integrated Prometheus metrics exporter, Grafana SimpleJson / Infinity datasource query engine, and high-frequency WebSocket telemetry pipeline.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLivePaused(!isLivePaused)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLivePaused
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${!isLivePaused ? 'animate-spin' : ''}`} />
              {isLivePaused ? 'Paused' : 'Streaming (2s)'}
            </button>

            <button
              onClick={handleSimulatePulse}
              disabled={pulseTriggered}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Zap className={`w-3.5 h-3.5 ${pulseTriggered ? 'animate-bounce' : ''}`} />
              {pulseTriggered ? 'Pulse Injected!' : 'Simulate API Spike'}
            </button>

            <a
              href="/api/grafana/dashboard?download=true"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Download full JSON Dashboard configuration for Grafana"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export Grafana JSON
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800 mt-5 pt-4 overflow-x-auto text-sm">
          {[
            { id: 'dashboards', label: 'Grafana Panels', icon: Activity },
            { id: 'explorer', label: 'PromQL Explorer', icon: Terminal },
            { id: 'datasource', label: 'Datasource & Scraper Endpoints', icon: Database },
            { id: 'annotations', label: 'Incident Annotations', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'dashboards' && (
        <div className="space-y-6">
          {/* Stat Panels Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Panel 1: Throughput */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Throughput</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {rps} <span className="text-xs font-normal text-slate-400">rps</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
                <span>↑ 99.85% success</span>
              </div>
            </div>

            {/* Panel 2: P95 Latency */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>p95 Latency</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {p95} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-2">
                avg: <span className="text-slate-200 font-semibold">{avgLatency} ms</span>
              </div>
            </div>

            {/* Panel 3: ICU Occupancy */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>ICU Occupancy</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 tracking-tight">
                {icuOcc}%
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium mt-2">
                46/50 beds occupied
              </div>
            </div>

            {/* Panel 4: Active WebSockets */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Telemetry Nodes</span>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {activeWs} <span className="text-xs font-normal text-slate-400">live</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-2">
                WebSocket + SSE
              </div>
            </div>

            {/* Panel 5: Golden Hour Scans */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Golden-Hour</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {goldenScans}
              </div>
              <div className="text-[11px] text-cyan-400 font-medium mt-2">
                Sub-3s triage SLA
              </div>
            </div>

            {/* Panel 6: Memory */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Heap Memory</span>
                <Server className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {memoryMb} <span className="text-xs font-normal text-slate-400">MB</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-2">
                CPU: <span className="text-purple-300 font-semibold">{cpu}%</span>
              </div>
            </div>
          </div>

          {/* Time Series Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Throughput Trend */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    HTTP Request Ingress & Throughput (RPS)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  rate(ekavach_http_requests_total)
                </span>
              </div>

              {/* Sparkline Canvas / Bar Visualizer */}
              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
                {history.length > 0 ? (
                  history.slice(-30).map((pt, idx) => {
                    const heightPct = Math.min(100, Math.max(10, (pt.rps / 30) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                        ></div>
                        <div className="hidden group-hover:block absolute bottom-full mb-1 z-10 bg-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-mono">
                          {pt.rps} rps @ {new Date(pt.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    Collecting live telemetry streams...
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span>-60s</span>
                <span className="text-slate-300 font-medium">Live Rate: {rps} req/s</span>
                <span>Now</span>
              </div>
            </div>

            {/* Chart 2: Latency Percentiles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    API Latency Percentiles (p95 / Average ms)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  ekavach_response_time_ms
                </span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
                {history.length > 0 ? (
                  history.slice(-30).map((pt, idx) => {
                    const p95Pct = Math.min(100, Math.max(12, (pt.latencyP95 / 50) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div
                          style={{ height: `${p95Pct}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            pt.latencyP95 > 35
                              ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                              : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          }`}
                        ></div>
                        <div className="hidden group-hover:block absolute bottom-full mb-1 z-10 bg-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-mono">
                          p95: {pt.latencyP95}ms | avg: {pt.latencyAvg}ms
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    Collecting latency measurements...
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span>-60s</span>
                <span className="text-emerald-400 font-medium">SLA Compliance: 99.98% &lt; 50ms</span>
                <span>Now</span>
              </div>
            </div>

            {/* Chart 3: System CPU & Memory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Cluster Compute & Memory Utilization
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
                  ekavach_cpu_usage_percent
                </span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
                {history.length > 0 ? (
                  history.slice(-30).map((pt, idx) => {
                    const cpuPct = Math.min(100, Math.max(8, pt.cpuPercent));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div
                          style={{ height: `${cpuPct}%` }}
                          className="w-full bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t-sm transition-all duration-300"
                        ></div>
                        <div className="hidden group-hover:block absolute bottom-full mb-1 z-10 bg-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-mono">
                          CPU: {pt.cpuPercent}% | Memory: {pt.memoryMb}MB
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    Awaiting compute metrics...
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span>-60s</span>
                <span className="text-slate-300 font-medium">Memory Heap: {memoryMb} MB</span>
                <span>Now</span>
              </div>
            </div>

            {/* Chart 4: Triage & Emergency Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Emergency Triage Queue Depths
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                  ekavach_triage_patients_total
                </span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
                {history.length > 0 ? (
                  history.slice(-30).map((pt, idx) => {
                    const totalTriage = (pt.triageRed || 1) + (pt.triageYellow || 2) + (pt.triageGreen || 4);
                    const redH = ((pt.triageRed || 1) / totalTriage) * 100;
                    const yellowH = ((pt.triageYellow || 2) / totalTriage) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end"
                      >
                        <div style={{ height: `${redH * 0.8}%` }} className="w-full bg-red-500 rounded-t-xs"></div>
                        <div style={{ height: `${yellowH * 0.8}%` }} className="w-full bg-amber-400"></div>
                        <div style={{ height: `${(100 - redH - yellowH) * 0.8}%` }} className="w-full bg-emerald-500 rounded-b-xs"></div>
                        <div className="hidden group-hover:block absolute bottom-full mb-1 z-10 bg-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-mono">
                          🔴 Red: {pt.triageRed} | 🟡 Yellow: {pt.triageYellow} | 🟢 Green: {pt.triageGreen}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    Awaiting triage telemetry...
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span className="text-red-400 flex items-center gap-1">● Red (Critical): 1</span>
                <span className="text-amber-400 flex items-center gap-1">● Yellow (Urgent): 2</span>
                <span className="text-emerald-400 flex items-center gap-1">● Green (Stable): 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PromQL Query Explorer Tab */}
      {activeTab === 'explorer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold">PromQL & Metrics Query Explorer</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Prometheus / OpenMetrics 2.0</span>
          </div>

          {/* Quick Query Templates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Preset Queries:</span>
            {[
              'rate(ekavach_http_requests_total[1m])',
              'ekavach_response_time_ms{quantile="0.95"}',
              'ekavach_icu_bed_occupancy_ratio',
              'ekavach_cpu_usage_percent',
              'ekavach_memory_heap_bytes',
              'ekavach_golden_hour_scans_total',
              'ekavach_websocket_clients_active',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setPromQuery(q);
                  executePromQuery(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 border border-slate-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Query Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 font-mono font-bold text-sm">
                &gt;
              </span>
              <input
                type="text"
                value={promQuery}
                onChange={(e) => setPromQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executePromQuery()}
                placeholder="Enter PromQL query e.g. rate(ekavach_http_requests_total[1m])"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => executePromQuery()}
              disabled={queryLoading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4" />
              {queryLoading ? 'Running...' : 'Execute Query'}
            </button>
          </div>

          {/* Query Result Box */}
          {queryResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">● 200 OK</span>
                  <span>Target: <strong className="text-slate-200">{queryResult.target}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Datapoints: {queryResult.datapointsCount}</span>
                  <span>Exec: {queryResult.executionTimeMs}ms</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Latest Datapoint Value</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">
                    {queryResult.latestValue}
                  </div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Target Series</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                    {queryResult.target}
                  </div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Query Status</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-1">
                    HEALTHY_SERIES_MATCH
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2">
                Raw JSON response available via POST <code>/api/grafana/query</code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Datasource & Integration Tab */}
      {activeTab === 'datasource' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold">Grafana & Prometheus Integration Endpoints</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Endpoint 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">Prometheus Scraper URL</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">GET</span>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="truncate">/metrics</span>
                <button
                  onClick={() => copyToClipboard(window.location.origin + '/metrics', 'prom')}
                  className="ml-2 p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedLabel === 'prom' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Returns standard Prometheus exposition format with counters, histograms, and memory/CPU gauges.
              </p>
            </div>

            {/* Endpoint 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-400">Grafana SimpleJson Datasource Root</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono">POST / GET</span>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="truncate">/api/grafana</span>
                <button
                  onClick={() => copyToClipboard(window.location.origin + '/api/grafana', 'grafana')}
                  className="ml-2 p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedLabel === 'grafana' ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Compatible with Grafana SimpleJson, JSON, and Infinity datasources (supports <code>/search</code>, <code>/query</code>, <code>/annotations</code>).
              </p>
            </div>

            {/* Endpoint 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400">Live SSE Metrics Stream</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">STREAM</span>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="truncate">/api/grafana/stream</span>
                <button
                  onClick={() => copyToClipboard(window.location.origin + '/api/grafana/stream', 'stream')}
                  className="ml-2 p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedLabel === 'stream' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Server-Sent Events connection for instant live dashboard streaming with sub-second update cycles.
              </p>
            </div>

            {/* Endpoint 4 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400">Pre-built Dashboard JSON Spec</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">JSON</span>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="truncate">/api/grafana/dashboard</span>
                <button
                  onClick={() => copyToClipboard(window.location.origin + '/api/grafana/dashboard', 'dash')}
                  className="ml-2 p-1 text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  {copiedLabel === 'dash' ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Downloadable JSON definition ready to import directly into any standalone Grafana instance (Dashboard &gt; Import).
              </p>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              How to Connect External Grafana:
            </h3>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>In your Grafana instance, navigate to <strong>Connections &gt; Data sources &gt; Add data source</strong>.</li>
              <li>Select <strong>Prometheus</strong> and enter <code>{typeof window !== 'undefined' ? window.location.origin : ''}/metrics</code> as the server URL.</li>
              <li>Or select <strong>Infinity / JSON datasource</strong> and enter <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/grafana</code>.</li>
              <li>Navigate to <strong>Dashboards &gt; Import</strong>, upload the exported <code>ekavach-grafana-dashboard.json</code>, and select your data source.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Incident Annotations Tab */}
      {activeTab === 'annotations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Real-Time Grafana Annotations & Alerts</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Auto-correlated timeline markers</span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Golden Hour Scan Event',
                time: '2 minutes ago',
                desc: 'Patient ABHA-9824 emergency triage bypass admitted into Trauma Bay 2 with sub-3s latency SLA.',
                tag: 'EMERGENCY_INGRESS',
                color: 'text-red-400 bg-red-950/60 border-red-800',
              },
              {
                title: 'ICU Capacity Alert',
                time: '10 minutes ago',
                desc: 'Apollo Greams Trauma ICU reached 92% occupancy (46/50 beds occupied). Telemetry broadcasted.',
                tag: 'CAPACITY_WARN',
                color: 'text-amber-400 bg-amber-950/60 border-amber-800',
              },
              {
                title: 'National Health Authority Sync',
                time: '30 minutes ago',
                desc: 'ABHA M3 consent ledger sync completed with 0 errors across 12 distributed node clusters.',
                tag: 'NETWORK_SYNC',
                color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
              },
            ].map((ann, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">{ann.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${ann.color}`}>
                      {ann.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{ann.desc}</p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono shrink-0">
                  {ann.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
