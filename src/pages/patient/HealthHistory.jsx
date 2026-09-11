import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeConsentRequests } from '../../services/telemetry';

export default function HealthHistory() {
  const navigate = useNavigate();
  const [activeRecordTab, setActiveRecordTab] = useState('rx'); // 'rx' | 'history' | 'documents'
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);

  // Gemini Document Analysis Modal State
  const [aiAnalysisModalOpen, setAiAnalysisModalOpen] = useState(false);
  const [analyzingRecord, setAnalyzingRecord] = useState(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time consent requests state
  const [consentRequests, setConsentRequests] = useState([]);
  const [copiedId, setCopiedId] = useState(false);

  // Document upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('Report');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customRecords, setCustomRecords] = useState([]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: 'Hello Rajesh! I am Gemini AI, your Clinical Health Assistant. Ask me anything about your prescriptions, drug interactions, or uploaded diagnostic reports.',
    },
  ]);

  const getToken = () => localStorage.getItem('ekavach_token') || localStorage.getItem('ek_token');

  const fetchConsentRequests = async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/patient/consent-requests', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.requests) {
          setConsentRequests(data.requests);
        }
      }
    } catch (_e) {}
  };

  const fetchHistoryRecords = async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/patient/health-history', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.records) {
          setCustomRecords(data.history.records);
        }
      }
    } catch (_e) {}
  };

  useEffect(() => {
    fetchConsentRequests();
    fetchHistoryRecords();

    const unsubscribe = subscribeConsentRequests((event) => {
      if (event.message) {
        showToast(event.message);
      }
      fetchConsentRequests();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRespondConsent = async (grantId, action) => {
    try {
      const token = getToken();
      const res = await fetch('/api/patient/consent/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grantId, action }),
      });
      if (res.ok) {
        showToast(`Access request ${action === 'APPROVE' ? 'APPROVED' : 'DECLINED'}`);
        fetchConsentRequests();
      }
    } catch (_e) {
      showToast('Failed to update access permission.');
    }
  };

  const handleCopyPatientId = () => {
    navigator.clipboard.writeText('patient-rajesh');
    setCopiedId(true);
    showToast('Patient Share ID (patient-rajesh) copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('Please provide a document title');
      return;
    }
    setIsUploading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const formData = new FormData();
      formData.append('title', uploadTitle);

      let mappedType = 'LAB_REPORT';
      if (uploadType === 'Prescription') mappedType = 'PRESCRIPTION';
      else if (uploadType === 'Report') mappedType = 'LAB_REPORT';
      else if (uploadType === 'Discharge Summary') mappedType = 'DISCHARGE_SUMMARY';
      else if (uploadType === 'Previous Record') mappedType = 'PREVIOUS_RECORD';
      else mappedType = 'OTHER';

      formData.append('recordType', mappedType);
      formData.append('notes', uploadNotes);
      if (uploadFile) {
        formData.append('document', uploadFile);
      }

      const res = await fetch('/api/patient/records', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        showToast('Medical document uploaded & saved to local system storage!');
        setUploadModalOpen(false);
        setUploadTitle('');
        setUploadNotes('');
        setUploadFile(null);
        await fetchHistoryRecords();
        setActiveRecordTab('documents');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast('Upload failed: ' + (errorData.error || 'Server error'));
      }
    } catch (err) {
      showToast('Error uploading file: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = async (recordId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document from local system storage?')) return;
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/patient/records/${recordId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        showToast('Document deleted from local storage.');
        if (selectedRecord?.id === recordId) setSelectedRecord(null);
        fetchHistoryRecords();
      } else {
        showToast('Failed to delete document.');
      }
    } catch (_e) {
      showToast('Error deleting document.');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadFullRecord = () => {
    showToast('Generating ABDM Digital Health Record (ABHA-9824-8819-TN.pdf)...');
    const customDocsList = customRecords.map((r, i) => `${i + 1}. ${r.title} (${r.recordType}) - Logged: ${new Date(r.date || r.createdAt).toLocaleDateString()}`).join('\n');
    const content = `E-KAVACH VERIFIED CLINICAL HEALTH RECORD\nPatient: Rajesh V. Sharma (ABHA 9824-8819-TN)\nGenerated At: ${new Date().toLocaleString()}\n\nPrescriptions:\n1. Rosuvastatin 10mg + Aspirin 75mg (Dr. Kavitha Menon, Cardiology)\n2. Metformin 500mg + Glimepiride 2mg (Dr. Arvind Swaminathan)\n\nDiagnoses:\n- Type II Diabetes (Insulin Dependent)\n- Hypertension (Stage 1)\n- Post-CABG Recovery (AIIMS)\n\nUploaded Local Documents:\n${customDocsList || 'None'}\n\nVerified via E-Kavach National Digital Health Grid.`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EKAVACH-Full-Health-Record.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real Gemini AI Chat Call
  const handleSendChat = async (promptText) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim() || isAiChatLoading) return;

    const userMsg = { id: Date.now(), role: 'user', text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiChatLoading(true);

    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch('/api/patient/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: textToSend,
          history: chatMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'ai', text: 'Gemini AI Assistant is currently processing. Please try again.' },
        ]);
      }
    } catch (_err) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: 'Error connecting to Gemini AI service.' },
      ]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  // Real Gemini Prescription & Medical Document Analysis Call
  const handleAnalyzeDocument = async (rec) => {
    setAnalyzingRecord(rec);
    setAiAnalysisResult('');
    setAiAnalysisModalOpen(true);
    setIsAnalyzing(true);

    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch('/api/patient/ai/analyze-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recordId: rec.id || null,
          title: rec.title,
          recordType: rec.recordType || rec.status || 'PRESCRIPTION',
          notes: rec.notes || rec.regimen || '',
          fileUrl: rec.fileUrl || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data.analysis || 'Analysis complete.');
      } else {
        setAiAnalysisResult('Unable to analyze document at this time.');
      }
    } catch (_err) {
      setAiAnalysisResult('Error connecting to Gemini AI analysis server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Base Prescriptions list
  const basePrescriptions = [
    {
      id: 'p-1',
      title: 'Rosuvastatin 10mg, Aspirin 75mg',
      doctor: 'Dr. Kavitha Menon — Cardiology',
      hospital: 'Apollo Greams Trauma Hub',
      date: '24 Oct 2026',
      status: 'Active',
      regimen: 'Once daily post-dinner • Lipid & anti-platelet management',
      notes: 'Prescribed post-LAD PTCA stent. Take once daily after evening meal with water. Continue ambulatory BP logging.',
    },
    {
      id: 'p-2',
      title: 'Metformin 500mg, Glimepiride 2mg',
      doctor: 'Dr. Arvind Swaminathan — Diabetology & Endocrinology',
      hospital: 'Fortis Clinical',
      date: '12 Aug 2026',
      status: 'Active',
      regimen: 'Twice daily with meals • HbA1c glycemic control protocol',
      notes: 'Maintain strict fasting sugar logs. Report any hypoglycemic episodes below 70 mg/dL immediately.',
    },
    {
      id: 'p-3',
      title: 'Carboxymethylcellulose 0.5% Eye Drops, Nepafenac 0.1%',
      doctor: 'Dr. Priya Sundaram — Ophthalmology',
      hospital: 'Sankara Eye Institute',
      date: '18 May 2026',
      status: 'Completed',
      regimen: 'Post-refractive dry-eye protocol • Completed 14-day regimen',
      notes: '14-day course completed without complications. Visual acuity restored to 6/6.',
    },
    {
      id: 'p-4',
      title: 'Pantoprazole 40mg, Paracetamol 650mg PRN',
      doctor: 'Dr. Siddharth Mukherjee — Cardiothoracic Surgery',
      hospital: 'AIIMS Trauma Center',
      date: '15 Jan 2026',
      status: 'Completed',
      regimen: 'Post-CABG recovery regimen • Completed course',
      notes: 'Surgical wound healed. Follow-up echo scheduled for next year.',
    },
  ];

  // Base Diagnoses list
  const baseDiagnoses = [
    {
      id: 'd-1',
      title: 'Type II Diabetes — Insulin Dependent',
      doctor: 'Dr. Arvind Swaminathan',
      specialty: 'Diabetology',
      hospital: 'Apex Endocrinology',
      date: 'Diagnosed Oct 2024',
      status: 'Ongoing',
      notes: 'Fasting blood sugar target < 120 mg/dL. Monitored quarterly with HbA1c. Confirmed via OGTT and fasting plasma glucose.',
    },
    {
      id: 'd-2',
      title: 'Hypertension (Stage 1)',
      doctor: 'Dr. Kavitha Menon',
      specialty: 'Cardiology',
      hospital: 'Apollo Greams Trauma Hub',
      date: 'Diagnosed Feb 2025',
      status: 'Ongoing',
      notes: 'Managed via lifestyle and low-dose ACE inhibitor. Ambulatory BP stable. Holter and 24h ambulatory BP revealed nocturnal dipping with mild daytime elevation.',
    },
    {
      id: 'd-3',
      title: 'Bilateral Dry Eye Syndrome',
      doctor: 'Dr. Priya Sundaram',
      specialty: 'Ophthalmology',
      hospital: 'Sankara Eye Institute',
      date: '18 May 2026',
      status: 'Resolved',
      notes: 'Resolved following 14-day anti-inflammatory tear therapy. Schirmer test normal. Cornea fluorescein staining negative.',
    },
    {
      id: 'd-4',
      title: 'Acute Bronchitis',
      doctor: 'Dr. Siddharth Mukherjee',
      specialty: 'Pulmonology',
      hospital: 'Civil Hospital',
      date: '10 Nov 2023',
      status: 'Resolved',
      notes: 'Treated with 5-day antibiotic course and nebulization. Fully cleared. Chest X-ray clear. Sputum culture normal.',
    },
  ];

  // Merge uploaded records by category
  const uploadedPrescriptions = customRecords.filter((r) => r.recordType === 'PRESCRIPTION');
  const uploadedDiagnoses = customRecords.filter((r) => r.recordType !== 'PRESCRIPTION');

  const allPrescriptions = [...basePrescriptions, ...uploadedPrescriptions];
  const allDiagnoses = [...baseDiagnoses, ...uploadedDiagnoses];
  const allUploadedDocuments = customRecords;

  // Global Search Filtering
  const q = searchQuery.trim().toLowerCase();

  const filteredPrescriptions = allPrescriptions.filter((p) => {
    if (!q) return true;
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.doctor && p.doctor.toLowerCase().includes(q)) ||
      (p.hospital && p.hospital.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.regimen && p.regimen.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q))
    );
  });

  const filteredDiagnoses = allDiagnoses.filter((d) => {
    if (!q) return true;
    return (
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.doctor && d.doctor.toLowerCase().includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.hospital && d.hospital.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q)) ||
      (d.status && d.status.toLowerCase().includes(q)) ||
      (d.recordType && d.recordType.toLowerCase().includes(q))
    );
  });

  const filteredRecords = allUploadedDocuments.filter((rec) => {
    if (!q) return true;
    return (
      (rec.title && rec.title.toLowerCase().includes(q)) ||
      (rec.notes && rec.notes.toLowerCase().includes(q)) ||
      (rec.recordType && rec.recordType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-sm px-space-md py-space-sm bg-primary text-on-primary rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">info</span>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg font-semibold">Health Record Alert</span>
            <span className="font-body-sm text-body-sm text-surface-variant">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-space-md text-surface-variant hover:text-on-primary transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Gemini AI Prescription & Document Analysis Modal */}
      {aiAnalysisModalOpen && analyzingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">psychology</span>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-primary">Gemini AI Prescription &amp; Document Analysis</h3>
                  <p className="text-xs text-on-surface-variant">Intelligent clinical extraction &amp; interaction analysis</p>
                </div>
              </div>
              <button onClick={() => setAiAnalysisModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant block font-semibold">Target Record</span>
                <span className="font-bold text-primary text-sm">{analyzingRecord.title}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-xs font-bold font-mono">
                {analyzingRecord.recordType || analyzingRecord.status || 'RECORD'}
              </span>
            </div>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
                <h4 className="font-bold text-primary text-base">Analyzing Medical Record with Gemini AI...</h4>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Scanning clinical notes, dosages, and attached document files for drug interactions and safety alerts.
                </p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-on-surface bg-surface-container-low p-4 rounded-xl border border-surface-container overflow-y-auto max-h-[50vh] whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                {aiAnalysisResult}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-surface-container">
              <button
                onClick={() => {
                  setAiAnalysisModalOpen(false);
                  setAiChatOpen(true);
                  handleSendChat(`Tell me more about ${analyzingRecord.title}`);
                }}
                className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs inline-flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Ask Follow-up in Chat
              </button>
              <button
                onClick={() => setAiAnalysisModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors"
                type="button"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <h3 className="font-headline-sm text-lg font-bold text-primary">{selectedRecord.title}</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-on-surface-variant hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 font-body-md text-sm text-on-surface">
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Doctor / Provider:</span>
                <span className="font-semibold text-right">{selectedRecord.doctor || selectedRecord.uploadedByUserId || 'Attending Physician'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Date Logged:</span>
                <span className="font-mono">{selectedRecord.date || new Date(selectedRecord.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Type / Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
                  {selectedRecord.status || selectedRecord.recordType || 'VERIFIED'}
                </span>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-surface-container-low mt-2">
                <span className="font-semibold text-primary block mb-1">Clinical Summary / Notes:</span>
                <p className="text-on-surface-variant text-xs leading-relaxed">{selectedRecord.notes || 'No detailed clinical notes attached.'}</p>
              </div>

              {/* File Attachment Section if available */}
              {selectedRecord.fileUrl && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-primary text-[24px]">picture_as_pdf</span>
                    <div className="truncate">
                      <span className="block font-semibold text-xs text-primary truncate">Attached Medical File</span>
                      <span className="block font-mono text-[10px] text-on-surface-variant truncate">{selectedRecord.fileUrl}</span>
                    </div>
                  </div>
                  <a
                    href={selectedRecord.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs inline-flex items-center gap-1 hover:bg-primary-container transition-colors shrink-0 no-underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Open File
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container flex-wrap">
              {selectedRecord.id && selectedRecord.fileUrl && (
                <button
                  onClick={(e) => handleDeleteRecord(selectedRecord.id, e)}
                  className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1 mr-auto"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete File
                </button>
              )}
              <button
                onClick={() => {
                  const target = selectedRecord;
                  setSelectedRecord(null);
                  handleAnalyzeDocument(target);
                }}
                className="px-3.5 py-2 rounded-lg bg-tertiary-container text-on-tertiary-container font-semibold text-xs hover:bg-tertiary-fixed transition-colors flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                Analyze with Gemini
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  navigate('/patient/consultation');
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary-container transition-colors"
                type="button"
              >
                Discuss with Doctor
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-sm transition-colors"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full gap-space-lg">
        {/* Header and Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                Prescriptions &amp; Health History
              </h1>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              A complete record of your medications, diagnoses, and uploaded medical documents analyzed with Gemini AI.
            </p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload Medical Document</span>
            </button>
            <button
              onClick={handleCopyPatientId}
              className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-tertiary-container text-on-tertiary-container font-label-lg text-label-lg shadow-sm hover:bg-tertiary-fixed transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>{copiedId ? 'ID Copied!' : 'Share Patient ID'}</span>
            </button>
            <button
              onClick={handleDownloadFullRecord}
              className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container text-primary font-label-lg text-label-lg shadow-sm hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download Full Record</span>
            </button>
          </div>
        </div>

        {/* Real-time Data Access Requests & Approval Banner */}
        {consentRequests.some((r) => r.status === 'PENDING_APPROVAL') && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-2xl">shield_person</span>
              </div>
              <div>
                <h4 className="font-bold text-base flex items-center gap-2">
                  <span>Data Access Request Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-mono">ACTION REQUIRED</span>
                </h4>
                {consentRequests
                  .filter((r) => r.status === 'PENDING_APPROVAL')
                  .map((r) => (
                    <p key={r.id} className="text-sm text-on-surface-variant mt-1">
                      <strong className="text-primary">{r.doctorName || 'Dr. Kavitha Menon'}</strong> ({r.hospitalName || 'Apollo Greams'}) requested access to your medical records &amp; uploaded documents via Patient ID <code className="bg-surface-container px-1 py-0.5 rounded text-xs font-bold">patient-rajesh</code>.
                    </p>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {consentRequests
                .filter((r) => r.status === 'PENDING_APPROVAL')
                .map((r) => (
                  <React.Fragment key={r.id}>
                    <button
                      onClick={() => handleRespondConsent(r.id, 'APPROVE')}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Approve Access
                    </button>
                    <button
                      onClick={() => handleRespondConsent(r.id, 'DECLINE')}
                      className="px-4 py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 font-semibold text-sm border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Decline
                    </button>
                  </React.Fragment>
                ))}
            </div>
          </div>
        )}

        {/* Upload Medical Document Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">cloud_upload</span>
                  <h3 className="font-headline-sm text-lg font-bold text-primary">Upload Medical Document</h3>
                </div>
                <button onClick={() => setUploadModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 text-sm">
                <div>
                  <label className="block font-semibold mb-1 text-on-surface">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lipid Profile Report / Cardiac Echo / Discharge Note"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-container-high bg-surface focus:outline-hidden focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-on-surface">Category</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-container-high bg-surface focus:outline-hidden focus:border-primary text-on-surface"
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Report">Diagnostic Report</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Previous Record">Previous Record</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-on-surface">Clinical Notes / Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description or doctor instructions..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-container-high bg-surface focus:outline-hidden focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-on-surface">Attach Document File (PDF, Image, Text)</label>
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 text-center flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.txt,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className="w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
                    />
                    {uploadFile && (
                      <p className="text-xs text-primary font-semibold mt-1">
                        Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Uploading to Local DB...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        Save to Local Storage
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-surface-container shadow-xs">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search prescriptions, diagnoses, or uploaded files by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-on-surface-variant hover:text-primary p-1 font-semibold cursor-pointer">
                Clear
              </button>
            )}
          </div>

          {/* Search Results Summary Banner */}
          {searchQuery && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-primary/5 p-3 rounded-xl border border-primary/20 text-xs font-medium text-primary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                <span>
                  Results for <strong>"{searchQuery}"</strong>: {filteredPrescriptions.length} Prescriptions • {filteredDiagnoses.length} Diagnoses • {filteredRecords.length} Documents
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeRecordTab === 'rx' && filteredPrescriptions.length === 0 && filteredDiagnoses.length > 0 && (
                  <button
                    onClick={() => setActiveRecordTab('history')}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-colors"
                  >
                    View {filteredDiagnoses.length} Diagnoses
                  </button>
                )}
                {activeRecordTab === 'rx' && filteredPrescriptions.length === 0 && filteredRecords.length > 0 && (
                  <button
                    onClick={() => setActiveRecordTab('documents')}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-colors"
                  >
                    View {filteredRecords.length} Documents
                  </button>
                )}
                {activeRecordTab === 'history' && filteredDiagnoses.length === 0 && filteredPrescriptions.length > 0 && (
                  <button
                    onClick={() => setActiveRecordTab('rx')}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-colors"
                  >
                    View {filteredPrescriptions.length} Prescriptions
                  </button>
                )}
                {activeRecordTab === 'documents' && filteredRecords.length === 0 && filteredPrescriptions.length > 0 && (
                  <button
                    onClick={() => setActiveRecordTab('rx')}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-colors"
                  >
                    View {filteredPrescriptions.length} Prescriptions
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-space-md sm:gap-space-lg border-b border-surface-container-highest pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveRecordTab('rx')}
            className={`relative pb-3 flex items-center gap-space-xs font-headline-sm text-[15px] sm:text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeRecordTab === 'rx' ? 'text-primary' : 'text-outline hover:text-on-surface'
            }`}
            id="tab-btn-prescriptions"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">medication</span>
            <span>Prescriptions</span>
            <span className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
              {q ? `${filteredPrescriptions.length} / ${allPrescriptions.length}` : `${allPrescriptions.length} Active`}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[3px] bg-secondary rounded-full ${
                activeRecordTab === 'rx' ? 'block' : 'hidden'
              }`}
              id="tab-indicator-prescriptions"
            ></span>
          </button>

          <button
            onClick={() => setActiveRecordTab('history')}
            className={`relative pb-3 flex items-center gap-space-xs font-headline-sm text-[15px] sm:text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeRecordTab === 'history' ? 'text-primary' : 'text-outline hover:text-on-surface'
            }`}
            id="tab-btn-history"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
            <span>Health History</span>
            <span className="px-space-xs py-space-2xs rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
              {q ? `${filteredDiagnoses.length} / ${allDiagnoses.length}` : `${allDiagnoses.length} Diagnoses`}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[3px] bg-secondary rounded-full ${
                activeRecordTab === 'history' ? 'block' : 'hidden'
              }`}
              id="tab-indicator-history"
            ></span>
          </button>

          <button
            onClick={() => setActiveRecordTab('documents')}
            className={`relative pb-3 flex items-center gap-space-xs font-headline-sm text-[15px] sm:text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeRecordTab === 'documents' ? 'text-primary' : 'text-outline hover:text-on-surface'
            }`}
            id="tab-btn-documents"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            <span>Uploaded Documents</span>
            <span className="px-space-xs py-space-2xs rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
              {q ? `${filteredRecords.length} / ${allUploadedDocuments.length}` : `${allUploadedDocuments.length} Saved`}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full ${
                activeRecordTab === 'documents' ? 'block' : 'hidden'
              }`}
            ></span>
          </button>
        </div>

        {/* PRESCRIPTIONS TAB VIEW */}
        <div className={activeRecordTab === 'rx' ? 'flex flex-col space-y-6' : 'hidden'} id="tab-view-prescriptions">
          {filteredPrescriptions.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
              <h4 className="font-bold text-on-surface text-base">No Prescriptions Match "{searchQuery}"</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Try searching for a different drug name, physician, or hospital, or switch to the Health History tab.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors"
                type="button"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-36 space-y-6 before:absolute before:left-[11px] sm:before:left-[131px] before:top-4 before:bottom-4 before:w-[2px] before:bg-surface-container-highest">
              {filteredPrescriptions.map((rx) => {
                const isUploaded = !!rx.recordType;
                const dateDisplay = rx.date || (rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recorded');
                return (
                  <div key={rx.id} className="relative flex items-start gap-space-md group">
                    <div className="hidden sm:block absolute -left-36 top-1.5 w-28 text-right font-label-md text-label-md text-on-surface-variant font-medium">
                      {dateDisplay}
                    </div>
                    <div className={`absolute -left-[19px] sm:-left-[19px] top-2 w-3.5 h-3.5 rounded-full ${rx.status === 'Active' ? 'bg-secondary' : 'bg-primary'} border-2 border-surface-container-lowest shadow-sm z-10`}></div>
                    <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow border border-surface-container/60">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-xs">
                        <div className="flex flex-col gap-1">
                          <div className="sm:hidden font-label-sm text-label-sm text-on-surface-variant font-medium">
                            {dateDisplay}
                          </div>
                          <div className="flex items-center gap-space-xs flex-wrap">
                            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                              {rx.doctor || 'Attending Physician'}
                            </span>
                            {rx.hospital && (
                              <>
                                <span className="text-outline-variant">•</span>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">{rx.hospital}</span>
                              </>
                            )}
                          </div>
                          <h2 className="font-headline-sm text-headline-sm text-primary font-semibold flex items-center gap-2">
                            <span>{rx.title}</span>
                            {isUploaded && <span className="material-symbols-outlined text-primary text-[18px]">attachment</span>}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {rx.regimen || rx.notes || 'Prescription details logged.'}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between gap-space-sm shrink-0">
                          <span className={`px-space-xs py-space-2xs rounded-full ${rx.status === 'Active' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary/10 text-primary'} font-label-sm text-label-sm font-semibold`}>
                            {rx.status || rx.recordType || 'Active'}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleAnalyzeDocument(rx)}
                              className="inline-flex items-center gap-1 font-label-sm text-xs text-tertiary font-bold hover:underline cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">psychology</span>
                              <span>Analyze with Gemini</span>
                            </button>
                            <button
                              onClick={() => setSelectedRecord(rx)}
                              className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary-container font-medium cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">description</span>
                              <span>Details</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HEALTH HISTORY TAB VIEW */}
        <div className={activeRecordTab === 'history' ? 'flex flex-col space-y-6' : 'hidden'} id="tab-view-history">
          {filteredDiagnoses.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
              <h4 className="font-bold text-on-surface text-base">No Diagnoses Match "{searchQuery}"</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                No health history or clinical diagnostic records match your search filter.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors"
                type="button"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-36 space-y-6 before:absolute before:left-[11px] sm:before:left-[131px] before:top-4 before:bottom-4 before:w-[2px] before:bg-surface-container-highest">
              {filteredDiagnoses.map((diag) => {
                const isUploaded = !!diag.recordType;
                const dateDisplay = diag.date || (diag.createdAt ? new Date(diag.createdAt).toLocaleDateString() : 'Recorded');
                return (
                  <div key={diag.id} className="relative flex items-start gap-space-md group">
                    <div className="hidden sm:block absolute -left-36 top-1.5 w-28 text-right font-label-md text-label-md text-on-surface-variant font-medium">
                      {dateDisplay}
                    </div>
                    <div className={`absolute -left-[19px] sm:-left-[19px] top-2 w-3.5 h-3.5 rounded-full ${diag.status === 'Resolved' ? 'bg-secondary' : 'bg-primary'} border-2 border-surface-container-lowest shadow-sm z-10`}></div>
                    <div className="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow border border-surface-container/60">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-xs">
                        <div className="flex flex-col gap-1">
                          <div className="sm:hidden font-label-sm text-label-sm text-on-surface-variant font-medium">
                            {dateDisplay}
                          </div>
                          <div className="flex items-center gap-space-xs flex-wrap">
                            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                              {diag.doctor || 'Attending Physician'} {diag.specialty ? `— ${diag.specialty}` : ''}
                            </span>
                            {diag.hospital && (
                              <>
                                <span className="text-outline-variant">•</span>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">{diag.hospital}</span>
                              </>
                            )}
                          </div>
                          <h2 className="font-headline-sm text-headline-sm text-primary font-semibold flex items-center gap-2">
                            <span>{diag.title}</span>
                            {isUploaded && <span className="material-symbols-outlined text-primary text-[18px]">attachment</span>}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                            {diag.notes || 'No notes available.'}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between gap-space-sm shrink-0">
                          <span className={`px-space-xs py-space-2xs rounded-full ${diag.status === 'Resolved' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary/10 text-primary'} font-label-sm text-label-sm font-semibold`}>
                            {diag.status || diag.recordType || 'Ongoing'}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleAnalyzeDocument(diag)}
                              className="inline-flex items-center gap-1 text-xs text-tertiary font-bold hover:underline cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">psychology</span>
                              <span>Analyze with Gemini</span>
                            </button>
                            <button
                              onClick={() =>
                                setSelectedRecord({
                                  title: diag.title,
                                  doctor: `${diag.doctor || 'Physician'} ${diag.hospital ? `(${diag.hospital})` : ''}`,
                                  date: dateDisplay,
                                  status: diag.status || 'Active Record',
                                  notes: diag.notes || 'No additional notes.',
                                })
                              }
                              className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary hover:text-primary-container font-medium cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                              <span>View Diagnostic Record</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UPLOADED DOCUMENTS TAB VIEW */}
        <div className={activeRecordTab === 'documents' ? 'flex flex-col space-y-4' : 'hidden'} id="tab-view-documents">
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-surface-container">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-2xl">folder_zip</span>
              </div>
              <div>
                <h3 className="font-bold text-primary text-base">Local System File Storage</h3>
                <p className="text-xs text-on-surface-variant">
                  All documents are securely stored in local disk storage (<code className="bg-surface-container px-1 py-0.5 rounded font-mono">./uploads</code>) and analyzed with Gemini AI.
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs shadow-sm hover:bg-primary-container transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
              <span>Upload New File</span>
            </button>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-outline text-5xl">cloud_off</span>
              <h4 className="font-bold text-on-surface text-base">No Medical Documents Match Your Filter</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Upload lab reports, prescriptions, or discharge summaries using the button above to store them in your local system DB.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map((doc) => {
                const dateStr = new Date(doc.date || doc.createdAt || Date.now()).toLocaleDateString();
                return (
                  <div
                    key={doc.id}
                    className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                          <span className="material-symbols-outlined text-2xl">description</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                              {doc.recordType || 'LAB_REPORT'}
                            </span>
                            <span className="text-xs font-mono text-outline">{dateStr}</span>
                          </div>
                          <h4 className="font-bold text-primary text-base mt-1 line-clamp-1">{doc.title}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{doc.notes || 'No notes provided.'}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteRecord(doc.id, e)}
                        className="text-outline hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete from local storage"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-surface-container-low flex items-center justify-between text-xs flex-wrap gap-2">
                      <button
                        onClick={() => handleAnalyzeDocument(doc)}
                        className="px-2.5 py-1 rounded-md bg-tertiary-container text-on-tertiary-container font-bold text-xs inline-flex items-center gap-1 hover:bg-tertiary-fixed transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">psychology</span>
                        Analyze with Gemini
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(doc)}
                          className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs"
                          type="button"
                        >
                          Details
                        </button>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-md bg-primary text-on-primary font-semibold text-xs inline-flex items-center gap-1 hover:bg-primary-container transition-colors no-underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gemini AI Chatbot Assistant Widget */}
        <aside aria-label="Clinical Navigator Chatbot" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-space-xs pointer-events-none">
          <div
            className={`pointer-events-auto w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-xl p-space-md flex flex-col gap-space-sm transition-all duration-300 transform scale-100 origin-bottom-right ${
              aiChatOpen ? 'block' : 'hidden'
            }`}
            id="ai-chat-card"
          >
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md font-bold text-primary">Gemini Clinical AI</h3>
                  <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Powered by @google/genai
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-space-sm rounded-xl font-body-sm text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary self-end text-right ml-8'
                      : 'bg-surface-container-low text-on-surface mr-4 border border-surface-container'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              ))}
              {isAiChatLoading && (
                <div className="p-2.5 rounded-xl bg-surface-container-low text-primary font-semibold text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Gemini AI is analyzing your medical context...
                </div>
              )}
            </div>

            <div className="flex items-center gap-space-2xs flex-wrap pt-1 border-t border-surface-container">
              <button
                onClick={() => handleSendChat('Check drug interactions among my active prescriptions')}
                className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-[11px] hover:bg-primary/20 transition-colors cursor-pointer"
                type="button"
              >
                Drug Interactions
              </button>
              <button
                onClick={() => handleSendChat('Summarize my uploaded medical records')}
                className="px-2.5 py-1 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold text-[11px] hover:bg-tertiary-fixed transition-colors cursor-pointer"
                type="button"
              >
                Summarize Records
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-space-xs bg-surface-container-low rounded-lg px-space-sm py-space-2xs border border-surface-container"
            >
              <input
                className="bg-transparent border-none outline-none font-body-sm text-xs w-full text-on-surface placeholder:text-outline"
                placeholder="Ask Gemini AI about prescriptions, dosage, or reports..."
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                disabled={isAiChatLoading}
                className="text-primary hover:text-primary-container transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                type="submit"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>

          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="pointer-events-auto flex items-center gap-space-xs px-4 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm shadow-2xl hover:bg-primary-container transition-all cursor-pointer border border-white/20"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">psychology</span>
            <span>Gemini Clinical AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"></span>
          </button>
        </aside>
      </div>
    </div>
  );
}
