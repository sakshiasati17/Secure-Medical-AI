import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  Users,
  FileText,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Loader,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Heart,
  LineChart,
  X,
} from 'lucide-react';
import { api, Patient, Note, Appointment } from '../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  dueTime: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

interface AIAnalyticsTabProps {
  darkMode: boolean;
  tasks: Task[];
  setActiveTab: (tab: 'dashboard' | 'patients' | 'notes' | 'tasks' | 'analytics' | 'calendar') => void;
  onViewTasks?: () => void;
  onAddTask?: () => void;
}

interface HighRiskPatient {
  patient_id: number;
  patient_name: string;
  risk_level: string;
  risk_score: number;
  recent_notes_count: number;
  last_visit: string;
  primary_concerns: string[];
}

interface PatientTimeline {
  patient: {
    id: number;
    name: string;
    mrn: string;
    dob: string;
    allergies: string;
    medical_history: string;
  };
  timeline: Array<{
    type: 'note' | 'appointment';
    id: number;
    date: string;
    title: string;
    content?: string;
    summary?: string;
    risk_level?: string;
    author?: string;
    reason?: string;
    status?: string;
  }>;
  ai_summary: string;
  statistics: {
    total_visits: number;
    total_appointments: number;
    risk_distribution: Record<string, number>;
    last_visit: string;
  };
}

export function AIAnalyticsTab({ darkMode, tasks, setActiveTab, onViewTasks, onAddTask }: AIAnalyticsTabProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAIView, setActiveAIView] = useState<'summary' | 'high-risk' | 'timeline'>('summary');
  const [highRiskPatients, setHighRiskPatients] = useState<HighRiskPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<PatientTimeline | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [loadingHighRisk, setLoadingHighRisk] = useState(false);
  const [patientSummaries, setPatientSummaries] = useState<Record<number, string>>({});
  const [patientSummaryLoading, setPatientSummaryLoading] = useState<number | null>(null);
  const [noteSummaries, setNoteSummaries] = useState<Record<number, string>>({});
  const [noteSummaryLoading, setNoteSummaryLoading] = useState<number | null>(null);

  // Task helpers
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const upcomingTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(`${t.dueDate} ${t.dueTime || '00:00'}`);
    return due.getTime() >= Date.now();
  });
  const sortedPending = [...pendingTasks].sort((a, b) => {
    const aDate = new Date(`${a.dueDate} ${a.dueTime || '00:00'}`).getTime();
    const bDate = new Date(`${b.dueDate} ${b.dueTime || '00:00'}`).getTime();
    return aDate - bDate;
  });
  const quickTasks = sortedPending.slice(0, 3);

  const cardBgClass = darkMode
    ? 'bg-slate-800/80 border-slate-700/50'
    : 'bg-white/50 border-white/60';
  const textClass = darkMode ? 'text-white' : 'text-slate-900';
  const textSecondaryClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const activeTabGradient = 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg';
  const inactiveTabClass = darkMode
    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
    : 'bg-white/50 text-slate-600 hover:bg-white/80';
  const quickActionClass = `${darkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80' : 'bg-white/60 text-slate-700 hover:bg-white/80'} rounded-xl border ${darkMode ? 'border-slate-700' : 'border-white/50'} px-4 py-2.5 transition-all flex items-center justify-center gap-2 text-sm font-semibold`;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [patientsData, notesData, appointmentsData] = await Promise.all([
        api.getPatients(),
        api.getNotes(),
        api.getAppointments(),
      ]);
      setPatients(patientsData);
      setNotes(notesData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighRiskPatients = async () => {
    try {
      setLoadingHighRisk(true);
      const token = api.getToken();
      const response = await fetch(`${api.getBaseUrl()}/ai/high-risk-patients?limit=10`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHighRiskPatients(data.high_risk_patients || []);
      }
    } catch (error) {
      console.error('Failed to fetch high-risk patients:', error);
    } finally {
      setLoadingHighRisk(false);
    }
  };

  const handleGeneratePatientSummary = async (patientId: number) => {
    try {
      setPatientSummaryLoading(patientId);
      const result = await api.getPatientSummary(patientId);
      setPatientSummaries((prev) => ({ ...prev, [patientId]: result.summary }));
    } catch (error) {
      console.error('Failed to generate patient summary:', error);
    } finally {
      setPatientSummaryLoading(null);
    }
  };

  const fetchPatientTimeline = async (patientId: number) => {
    try {
      setLoadingTimeline(true);
      const token = api.getToken();
      const response = await fetch(`${api.getBaseUrl()}/ai/patient-timeline/${patientId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientTimeline(data);
      }
    } catch (error) {
      console.error('Failed to fetch patient timeline:', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleViewPatientTimeline = async (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveAIView('timeline');
    await fetchPatientTimeline(patient.id);
  };

  const handleGenerateNoteSummary = async (noteId: number) => {
    try {
      setNoteSummaryLoading(noteId);
      const result = await api.summarizeNote(noteId);
      const riskLevel = (result.risk_level || '').toUpperCase();

      // Update local display cache
      setNoteSummaries((prev) => ({ ...prev, [noteId]: result.summary }));

      // Update local notes state so counts/badges refresh
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                summary: result.summary || n.summary,
                risk_level: riskLevel || n.risk_level,
              }
            : n
        )
      );

      // Persist back to backend to keep counts consistent after reload (best effort)
      try {
        await api.updateNote(noteId, {
          summary: result.summary,
          risk_level: riskLevel.toLowerCase(),
          recommendations: result.recommendations,
        });
      } catch (persistError) {
        console.warn('Unable to persist AI summary to backend (non-blocking):', persistError);
      }
    } catch (error) {
      console.error('Failed to generate note summary:', error);
    } finally {
      setNoteSummaryLoading(null);
    }
  };

  useEffect(() => {
    if (activeAIView === 'high-risk') {
      fetchHighRiskPatients();
    }
  }, [activeAIView]);

  if (loading) {
    return (
      <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-12 border shadow-lg text-center`}>
        <Loader className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
        <p className={textSecondaryClass}>Loading AI analytics...</p>
      </div>
    );
  }

  // Calculate insights
  const totalPatients = patients.length;
  const recentNotes = notes.slice(0, 5);
  const notesWithAISummary = notes.filter(n => n.summary).length;
  const highRiskNotes = notes.filter(n => (n.risk_level || '').toUpperCase() === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-4 items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${textClass}`}>AI Medical Intelligence</h2>
                <p className={textSecondaryClass}>
                  AI-powered patient insights, risk assessment, and clinical decision support
                </p>
              </div>
            </div>
            <p className={`${textSecondaryClass} text-sm`}>
              Explore summaries, risk cohorts, and patient timelines with consistent controls.
            </p>
          </div>

          {/* Quick To-Do (Doctor) */}
          <div className={`${darkMode ? 'bg-slate-900/60 border-slate-800/70' : 'bg-white/70 border-white/60'} rounded-xl border p-4 shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-xs uppercase tracking-wide ${textSecondaryClass}`}>Quick To-Do</p>
                <h3 className={`text-lg font-semibold ${textClass}`}>Tasks Overview</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onAddTask?.();
                    setActiveTab('tasks');
                  }}
                  className={quickActionClass}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
                <button
                  onClick={() => {
                    onViewTasks?.();
                    setActiveTab('tasks');
                  }}
                  className={quickActionClass}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Tasks
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                Pending: {pendingTasks.length}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                Upcoming: {upcomingTasks.length}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600">
                Completed: {completedTasks.length}
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {quickTasks.length === 0 ? (
                <p className={`text-sm ${textSecondaryClass}`}>No pending tasks. Add a new one to get started.</p>
              ) : (
                quickTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${darkMode ? 'bg-slate-800/70' : 'bg-white/80'} rounded-lg border ${darkMode ? 'border-slate-700' : 'border-slate-200'} px-3 py-2 flex items-start justify-between gap-3`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${textClass}`}>{task.title}</p>
                      <p className={`text-xs ${textSecondaryClass}`}>
                        {task.dueDate} {task.dueTime ? `• ${task.dueTime}` : ''}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                        task.priority === 'high'
                          ? 'bg-red-500/10 text-red-600'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI View Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveAIView('summary')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeAIView === 'summary' ? activeTabGradient : inactiveTabClass
          }`}
        >
          <Sparkles className="w-5 h-5 inline mr-2" />
          AI Summary
        </button>
        <button
          onClick={() => setActiveAIView('high-risk')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeAIView === 'high-risk' ? activeTabGradient : inactiveTabClass
          }`}
        >
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          High-Risk Patients
        </button>
        <button
          onClick={() => setActiveAIView('timeline')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeAIView === 'timeline' ? activeTabGradient : inactiveTabClass
          }`}
        >
          <LineChart className="w-5 h-5 inline mr-2" />
          Patient Timeline
        </button>
      </div>

      {/* AI Summary View */}
      {activeAIView === 'summary' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* AI Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -4 }}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
            >
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg w-fit mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${textClass}`}>{notesWithAISummary}</h3>
              <p className={`text-sm ${textSecondaryClass}`}>AI-Analyzed Notes</p>
              <p className="text-xs text-purple-500 mt-1">
                {notes.length > 0 ? Math.round((notesWithAISummary / notes.length) * 100) : 0}% of all notes
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
            >
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg w-fit mb-4">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${textClass}`}>{highRiskNotes}</h3>
              <p className={`text-sm ${textSecondaryClass}`}>High-Risk Cases</p>
              <p className="text-xs text-red-500 mt-1">Requires immediate attention</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
            >
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg w-fit mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${textClass}`}>{totalPatients}</h3>
              <p className={`text-sm ${textSecondaryClass}`}>Total Patients</p>
              <p className="text-xs text-green-500 mt-1">Under AI monitoring</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg w-fit mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${textClass}`}>AI Active</h3>
              <p className={`text-sm ${textSecondaryClass}`}>System Status</p>
              <p className="text-xs text-blue-500 mt-1">GPT-4 Enabled</p>
            </motion.div>
          </div>

          {/* Recent AI-Analyzed Notes */}
          <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className={`text-lg font-semibold ${textClass}`}>Recent AI-Analyzed Notes</h3>
            </div>
            <div className="space-y-3">
              {recentNotes.filter(n => n.summary).map((note) => {
                const patient = patients.find(p => p.id === note.patient_id);
                const summaryText = noteSummaries[note.id] || note.summary;
                return (
                  <div
                    key={note.id}
                    className={`p-4 ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-white/60 hover:bg-white/80'} rounded-xl border ${
                      darkMode ? 'border-slate-600' : 'border-white/40'
                    } cursor-pointer transition-all`}
                    onClick={() => handleGenerateNoteSummary(note.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${textClass}`}>{note.title}</h4>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          {patient && `${patient.first_name} ${patient.last_name}`} • {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {note.risk_level && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          note.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          note.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                          'bg-green-500/20 text-green-400 border border-green-500/40'
                        }`}>
                          {note.risk_level}
                        </span>
                      )}
                    </div>
                    {summaryText && (
                      <p className={`text-sm ${textSecondaryClass} whitespace-pre-wrap line-clamp-4`}>
                        {noteSummaryLoading === note.id ? 'AI… generating summary...' : summaryText}
                      </p>
                    )}
                    <p className="text-xs text-purple-500 mt-2">Click to refresh AI summary (3-4 lines)</p>
                  </div>
                );
              })}
              {recentNotes.filter(n => n.summary).length === 0 && (
                <p className={`text-center py-8 ${textSecondaryClass}`}>No AI-analyzed notes yet</p>
              )}
            </div>
          </div>

          {/* Patient List for Timeline Access */}
          <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${textClass}`}>Patient Visit History</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {patients.slice(0, 6).map((patient) => {
                const patientNotes = notes.filter(n => n.patient_id === patient.id);
                return (
                  <div
                    key={patient.id}
                    className={`p-4 ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-white/60 hover:bg-white/80'} rounded-xl border ${
                      darkMode ? 'border-slate-600' : 'border-white/40'
                    } transition-all space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-semibold ${textClass}`}>{patient.first_name} {patient.last_name}</h4>
                        <p className={`text-sm ${textSecondaryClass}`}>{patientNotes.length} visits</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGeneratePatientSummary(patient.id)}
                          className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold disabled:opacity-60"
                          disabled={patientSummaryLoading === patient.id}
                        >
                          {patientSummaryLoading === patient.id ? 'AI…' : 'AI Summary'}
                        </button>
                        <button
                          onClick={() => handleViewPatientTimeline(patient)}
                          className="p-2 rounded-lg hover:bg-white/30"
                          aria-label="View timeline"
                        >
                          <LineChart className="w-5 h-5 text-blue-400" />
                        </button>
                      </div>
                    </div>
                    {patientSummaries[patient.id] && (
                      <p className={`text-sm ${textSecondaryClass} whitespace-pre-wrap`}>
                        {patientSummaries[patient.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* High-Risk Patients View */}
      {activeAIView === 'high-risk' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className={`text-lg font-semibold ${textClass}`}>High-Risk Patients</h3>
              </div>
              <button
                onClick={fetchHighRiskPatients}
                disabled={loadingHighRisk}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loadingHighRisk ? (
                  <><Loader className="w-4 h-4 inline mr-2 animate-spin" /> Loading...</>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>

            {loadingHighRisk ? (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 mx-auto mb-4 text-red-500 animate-spin" />
                <p className={textSecondaryClass}>Analyzing high-risk patients...</p>
              </div>
            ) : highRiskPatients.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className={textSecondaryClass}>No high-risk patients identified</p>
              </div>
            ) : (
              <div className="space-y-4">
                {highRiskPatients.map((patient) => (
                  <div
                    key={patient.patient_id}
                    className={`p-4 ${darkMode ? 'bg-slate-700/50' : 'bg-white/60'} rounded-xl border border-red-500/50 hover:border-red-500 transition-all space-y-3`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-semibold ${textClass}`}>{patient.patient_name}</h4>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          {patient.recent_notes_count} recent visits • Last: {new Date(patient.last_visit).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
                        RISK: {patient.risk_score}
                      </span>
                    </div>
                    {patient.primary_concerns && patient.primary_concerns.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {patient.primary_concerns.map((concern, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-lg text-xs ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} ${textSecondaryClass}`}
                          >
                            {concern}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePatientSummary(patient.patient_id)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold disabled:opacity-60"
                        disabled={patientSummaryLoading === patient.patient_id}
                      >
                        {patientSummaryLoading === patient.patient_id ? 'AI…' : 'AI Summary'}
                      </button>
                    </div>
                    {patientSummaries[patient.patient_id] && (
                      <p className={`text-sm ${textSecondaryClass} whitespace-pre-wrap`}>
                        {patientSummaries[patient.patient_id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Patient Timeline View */}
      {activeAIView === 'timeline' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!selectedPatient ? (
            <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-blue-500" />
                <h3 className={`text-lg font-semibold ${textClass}`}>Select a Patient</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {patients.map((patient) => {
                  const patientNotes = notes.filter(n => n.patient_id === patient.id);
                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleViewPatientTimeline(patient)}
                      className={`p-4 ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-white/60 hover:bg-white/80'} rounded-xl border ${
                        darkMode ? 'border-slate-600' : 'border-white/40'
                      } cursor-pointer transition-all`}
                    >
                      <h4 className={`font-semibold ${textClass} mb-1`}>{patient.first_name} {patient.last_name}</h4>
                      <p className={`text-sm ${textSecondaryClass}`}>{patientNotes.length} visits</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : loadingTimeline ? (
            <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-12 border shadow-lg text-center`}>
              <Loader className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className={textSecondaryClass}>Generating AI-powered timeline...</p>
            </div>
          ) : patientTimeline ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-2xl font-bold ${textClass}`}>{patientTimeline.patient.name}</h3>
                    <p className={textSecondaryClass}>MRN: {patientTimeline.patient.mrn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGeneratePatientSummary(patientTimeline.patient.id)}
                      className="px-3 py-2 text-xs rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold disabled:opacity-60"
                      disabled={patientSummaryLoading === patientTimeline.patient.id}
                    >
                      {patientSummaryLoading === patientTimeline.patient.id ? 'AI…' : 'AI Summary'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientTimeline(null);
                      }}
                      className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-white/80'} transition-all`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {patientSummaries[patientTimeline.patient.id] && (
                  <div className={`mb-4 p-3 rounded-xl ${darkMode ? 'bg-slate-700/60' : 'bg-white/70'} border ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                    <p className={`text-sm ${textSecondaryClass} whitespace-pre-wrap`}>
                      {patientSummaries[patientTimeline.patient.id]}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className={`text-sm ${textSecondaryClass}`}>Total Visits</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{patientTimeline.statistics.total_visits}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${textSecondaryClass}`}>Appointments</p>
                    <p className={`text-2xl font-bold ${textClass}`}>{patientTimeline.statistics.total_appointments}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${textSecondaryClass}`}>Last Visit</p>
                    <p className={`text-sm font-semibold ${textClass}`}>
                      {patientTimeline.statistics.last_visit && new Date(patientTimeline.statistics.last_visit).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg border-purple-500/50`}>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className={`text-lg font-semibold ${textClass}`}>AI-Generated Patient Summary</h3>
                </div>
                <div className={`p-4 ${darkMode ? 'bg-slate-700/50' : 'bg-white/60'} rounded-xl`}>
                  <p className={`${textClass} whitespace-pre-wrap leading-relaxed`}>{patientTimeline.ai_summary}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-lg font-semibold ${textClass}`}>Medical Timeline</h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {patientTimeline.timeline.map((item, idx) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`p-4 ${darkMode ? 'bg-slate-700/50' : 'bg-white/60'} rounded-xl border ${
                        darkMode ? 'border-slate-600' : 'border-white/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'note'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {item.type === 'note' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <CalendarIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className={`font-semibold ${textClass}`}>{item.title}</h4>
                              <p className={`text-sm ${textSecondaryClass}`}>
                                {new Date(item.date).toLocaleDateString()} • {item.author || item.status}
                              </p>
                            </div>
                            {item.risk_level && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                item.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                item.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {item.risk_level}
                              </span>
                            )}
                          </div>
                          {item.summary && (
                            <p className={`text-sm ${textSecondaryClass} mb-2`}>{item.summary}</p>
                          )}
                          {item.content && !item.summary && (
                            <p className={`text-sm ${textSecondaryClass} line-clamp-2`}>{item.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
