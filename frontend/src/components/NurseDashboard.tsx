import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Activity,
  Droplet,
  Pill,
  ClipboardList,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  UserCircle,
  Calendar as CalendarIcon,
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Thermometer,
  Syringe,
  Stethoscope,
  ChevronDown,
  Plus,
  Download,
  Brain,
} from 'lucide-react';
import { api, Patient, NoteSummary } from '../services/api';
import { CalendarTab } from './CalendarTab';
import { AIAnalyticsTab } from './AIAnalyticsTab';

interface NurseDashboardProps {
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

interface Task {
  id: string;
  title: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
}

interface AnalyticsTask {
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

interface VitalRecord {
  id: string;
  patient_id: number;
  patient_name: string;
  timestamp: Date;
  bp: string;
  heart_rate: number;
  temperature: number;
  respiratory_rate: number;
  spo2: number;
  pain_scale: number;
  notes: string;
}

export function NurseDashboard({ onLogout, darkMode, setDarkMode }: NurseDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'notes' | 'analytics' | 'calendar'>('dashboard');
  const [notesSubTab, setNotesSubTab] = useState<'nurse-notes' | 'tasks' | 'vitals'>('nurse-notes');
  const [notesLibrarySubTab, setNotesLibrarySubTab] = useState<'create' | 'library'>('create');
  const [tasksSubTab, setTasksSubTab] = useState<'pending' | 'completed' | 'add'>('pending');
  const [vitalsSubTab, setVitalsSubTab] = useState<'record' | 'history'>('record');

  // State for API data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [viewingNote, setViewingNote] = useState<NoteSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<{summary: string; risk_level: string; recommendations: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // State for local data (tasks and vitals stored in localStorage)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [analyticsTasks, setAnalyticsTasks] = useState<AnalyticsTask[]>([
    {
      id: '1',
      title: 'Check vitals for Patient #204',
      description: 'Morning vital signs check',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Administer medications - Room 307',
      description: 'Pain medication and antibiotics',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '14:00',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Form states for Notes & Tasks
  const [noteForm, setNoteForm] = useState({
    patient_id: 1,
    note_type: 'Assessment Note',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    vitals_text: '',
    observations: '',
    interventions: '',
    patient_response: '',
  });

  const [taskForm, setTaskForm] = useState({
    description: '',
    due_time: '09:00',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
  });

  const [vitalsForm, setVitalsForm] = useState({
    patient_id: 1,
    patient_name: '',
    systolic: 120,
    diastolic: 80,
    heart_rate: 72,
    temperature: 98.6,
    respiratory_rate: 16,
    spo2: 98,
    pain_scale: 0,
    notes: '',
  });

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load data from API and localStorage
  useEffect(() => {
    loadData();
    loadLocalData();
  }, []);

  // Refetch notes when switching to library tab
  useEffect(() => {
    if (notesLibrarySubTab === 'library') {
      loadData();
    }
  }, [notesLibrarySubTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsData, notesData] = await Promise.all([
        api.getPatients(),
        api.getNotes(),
      ]);
      setPatients(patientsData);
      setNotes(notesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('nurse_tasks');
    if (savedTasks) {
      const parsed: Task[] = JSON.parse(savedTasks).map((t: Task) => ({
        ...t,
        status: t.status === 'completed' ? 'completed' : 'pending', // normalize legacy "upcoming"
      }));
      setTasks(parsed);
    } else {
      // Initialize with default tasks
      const defaultTasks: Task[] = [
        {
          id: crypto.randomUUID(),
          title: 'Administer medication - Room 305',
          due: '10:30 AM',
          priority: 'High',
          status: 'pending',
          created_at: new Date().toISOString(),
          completed_at: null,
        },
        {
          id: crypto.randomUUID(),
          title: 'Wound dressing change - Room 307',
          due: '11:00 AM',
          priority: 'Medium',
          status: 'pending',
          created_at: new Date().toISOString(),
          completed_at: null,
        },
        {
          id: crypto.randomUUID(),
          title: 'Patient education - Room 310',
          due: '02:00 PM',
          priority: 'Low',
          status: 'pending',
          created_at: new Date().toISOString(),
          completed_at: null,
        },
      ];
      setTasks(defaultTasks);
      localStorage.setItem('nurse_tasks', JSON.stringify(defaultTasks));
    }

    // Load vitals from localStorage
    const savedVitals = localStorage.getItem('nurse_vitals');
    if (savedVitals) {
      const parsed = JSON.parse(savedVitals);
      // Convert timestamp strings back to Date objects
      const vitalsWithDates = parsed.map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp),
      }));
      setVitals(vitalsWithDates);
    }
  };

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('nurse_tasks', JSON.stringify(newTasks));
  };

  const saveVitals = (newVitals: VitalRecord[]) => {
    setVitals(newVitals);
    localStorage.setItem('nurse_vitals', JSON.stringify(newVitals));
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      const noteData = {
        patient_id: noteForm.patient_id,
        title: `${noteForm.note_type} - ${noteForm.visit_date}`,
        content: `**Vitals**: ${noteForm.vitals_text}

**Observations**: ${noteForm.observations}

**Interventions**: ${noteForm.interventions}

**Patient Response**: ${noteForm.patient_response}`,
        note_type: 'nurse_note',
      };

      await api.createNote(noteData);
      setMessage({ text: 'Note saved successfully.', type: 'success' });

      // Reset form
      setNoteForm({
        patient_id: 1,
        note_type: 'Assessment Note',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        vitals_text: '',
        observations: '',
        interventions: '',
        patient_response: '',
      });

      // Reload notes
      const notesData = await api.getNotes();
      setNotes(notesData);
    } catch (error: any) {
      setMessage({ text: error.message || 'Unable to save note.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNurseNoteWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.observations.trim() && !noteForm.vitals_text.trim()) {
      setMessage({ text: 'Please enter observations or vitals to generate AI note', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: 'AI is generating nurse note...', type: 'success' });

      // Create a basic note first
      const noteData = {
        patient_id: noteForm.patient_id,
        title: `${noteForm.note_type} - ${noteForm.visit_date}`,
        content: `**Vitals**: ${noteForm.vitals_text}\n\n**Observations**: ${noteForm.observations}\n\n**Interventions**: ${noteForm.interventions}\n\n**Patient Response**: ${noteForm.patient_response}\n\n*AI-generated summary will be added...*`,
        note_type: 'nurse_note',
      };

      const newNote = await api.createNote(noteData);
      
      // Trigger AI summarization
      const aiResult = await api.summarizeNote(newNote.id);
      
      // Update note with AI-generated content
      const aiContent = `**Vitals**: ${noteForm.vitals_text}\n\n**Observations**: ${noteForm.observations}\n\n**Interventions**: ${noteForm.interventions}\n\n**Patient Response**: ${noteForm.patient_response}\n\n---\n\n**AI Summary:**\n${aiResult.summary}\n\n**Risk Level:** ${aiResult.risk_level}\n\n**Recommendations:**\n${aiResult.recommendations}`;
      
      await api.updateNote(newNote.id, {
        ...noteData,
        content: aiContent,
      });

      setMessage({ text: 'AI nurse note generated successfully!', type: 'success' });

      // Reset form
      setNoteForm({
        patient_id: 1,
        note_type: 'Assessment Note',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        vitals_text: '',
        observations: '',
        interventions: '',
        patient_response: '',
      });

      // Refresh notes
      const notesData = await api.getNotes();
      setNotes(notesData);

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error generating AI note:', error);
      const errorMessage = error?.message || 'Failed to generate AI note';
      setMessage({ text: errorMessage, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleViewNurseNote = async (note: NoteSummary) => {
    setViewingNote(note);
    setAiSummary(null);
    
    // Fetch full note details if content is missing
    if (!note.content) {
      try {
        const fullNote = await api.getNote(note.id);
        setViewingNote({
          ...note,
          content: fullNote.content,
          summary: fullNote.summary || note.summary,
          risk_level: fullNote.risk_level || note.risk_level,
          recommendations: fullNote.recommendations || note.recommendations
        });
      } catch (error) {
        console.error('Failed to fetch full note:', error);
      }
    }
    
    // Fetch AI summary if not already present (optional - don't block view if it fails)
    if (!note.summary && note.content && note.content.trim()) {
      try {
        setSummarizing(true);
        const summary = await api.summarizeNote(note.id);
        setAiSummary(summary);
      } catch (error) {
        console.error('Failed to get AI summary:', error);
        // Don't show error - AI summary is optional
      } finally {
        setSummarizing(false);
      }
    }
  };

  const handleMarkTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId && task.status !== 'completed'
        ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString() }
        : task
    );
    saveTasks(updatedTasks);
    setMessage({ text: 'Task completed.', type: 'success' });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.description.trim()) {
      setMessage({ text: 'Please provide a description.', type: 'error' });
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskForm.description.trim(),
      due: taskForm.due_time,
      priority: taskForm.priority,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    saveTasks([...tasks, newTask]);
    setMessage({ text: 'Task added to board.', type: 'success' });

    // Reset form
    setTaskForm({
      description: '',
      due_time: '09:00',
      priority: 'Medium',
    });
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPatient = patients.find(p => p.id === vitalsForm.patient_id);
    const patientName = selectedPatient
      ? `${selectedPatient.first_name} ${selectedPatient.last_name} • MRN ${selectedPatient.medical_record_number}`
      : vitalsForm.patient_name || 'Patient #1';

    const newVital: VitalRecord = {
      id: crypto.randomUUID(),
      patient_id: vitalsForm.patient_id,
      patient_name: patientName,
      timestamp: new Date(),
      bp: `${vitalsForm.systolic}/${vitalsForm.diastolic}`,
      heart_rate: vitalsForm.heart_rate,
      temperature: vitalsForm.temperature,
      respiratory_rate: vitalsForm.respiratory_rate,
      spo2: vitalsForm.spo2,
      pain_scale: vitalsForm.pain_scale,
      notes: vitalsForm.notes,
    };

    saveVitals([...vitals, newVital]);
    setMessage({ text: 'Vital signs recorded securely.', type: 'success' });
  };

  const generateShiftReport = () => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const assignedPatients = patients.slice(0, 5);

    let report = `# Nurse Shift Report\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Total Assigned Patients:** ${assignedPatients.length}\n\n`;
    report += `| Patient | MRN | Room | Risk | Next Check | Notes |\n`;
    report += `| --- | --- | --- | --- | --- | --- |\n`;

    assignedPatients.forEach((p, idx) => {
      const name = `${p.first_name} ${p.last_name}`;
      const mrn = p.medical_record_number;
      const room = 200 + idx;
      const risk = ['LOW', 'MEDIUM', 'HIGH'][idx % 3];
      const nextCheck = new Date(Date.now() + (2 + idx) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      const notes = (p.medical_history || 'General care plan').substring(0, 80);
      report += `| ${name} | ${mrn} | ${room} | ${risk} | ${nextCheck} | ${notes} |\n`;
    });

    report += `\n### Summary\n`;
    report += `- Vitals logged: 32\n`;
    report += `- Medications administered: 18\n`;
    report += `- Outstanding escalations: 2\n\n`;
    report += `_Auto-generated from Patient Care Hub._\n`;

    // Download report
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-report-${new Date().toISOString().slice(0, 16).replace(/[:]/g, '')}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage({ text: 'Shift report generated and downloaded.', type: 'success' });
  };

  const stats = [
    {
      icon: UserCircle,
      label: 'Assigned Patients',
      value: '12',
      change: '+3 today',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ClipboardList,
      label: 'Tasks Pending',
      value: tasks.filter(t => t.status === 'pending').length.toString(),
      change: 'updated 5m ago',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Activity,
      label: 'Vitals Due',
      value: '5',
      change: 'due this hour',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Pill,
      label: 'Medications Due',
      value: '15',
      change: 'next 2 hours',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const timelineTasks = [
    { time: '10:00 AM', task: 'Vitals check — Room 305', priority: 'danger' as const },
    { time: '10:30 AM', task: 'Medication administration — Room 307', priority: 'danger' as const },
    { time: '11:00 AM', task: 'Patient education — Room 310', priority: 'warning' as const },
    { time: '02:00 PM', task: 'Wound dressing — Room 312', priority: 'warning' as const },
    { time: '03:30 PM', task: 'Discharge prep — Room 305', priority: 'success' as const },
  ];

  const priorityColors = {
    danger: { border: 'border-red-500', text: 'text-red-400', dot: 'bg-red-500' },
    warning: { border: 'border-yellow-500', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    success: { border: 'border-green-500', text: 'text-green-400', dot: 'bg-green-500' },
  };

  const assignedPatients = patients.slice(0, 2).map((p, idx) => ({
    name: `${p.first_name} ${p.last_name}`,
    mrn: p.medical_record_number,
    risk: idx === 0 ? 'HIGH' : 'MEDIUM',
    condition: p.medical_history || 'General care',
  }));

  const completionMetrics = [
    { label: 'Tasks Completed', value: tasks.filter(t => t.status === 'completed').length.toString(), change: '+4 today' },
    { label: 'Overdue Tasks', value: '3', change: 'needs attention' },
    { label: 'Completion Rate', value: '86%', change: '' },
  ];

  const quickActions = [
    { label: 'Add Note', icon: '📝', action: () => { setActiveTab('notes'); setNotesSubTab('nurse-notes'); } },
    { label: 'Record Vitals', icon: '🩺', action: () => { setActiveTab('notes'); setNotesSubTab('vitals'); } },
    { label: 'Medication Log', icon: '💊', action: () => { setActiveTab('patients'); } },
    { label: 'View Tasks', icon: '📋', action: () => { setActiveTab('notes'); setNotesSubTab('tasks'); } },
  ];

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as const, label: 'Patient Care', icon: Heart },
    { id: 'analytics' as const, label: 'AI & Analytics', icon: Brain },
    { id: 'notes' as const, label: 'Notes & Tasks', icon: ClipboardList },
    { id: 'calendar' as const, label: 'Calendar', icon: CalendarIcon },
  ];

  const bgClass = darkMode
    ? 'bg-slate-900'
    : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30';
  const cardBgClass = darkMode
    ? 'bg-slate-800/80 border-slate-700/50'
    : 'bg-white/50 border-white/60';
  const textClass = darkMode ? 'text-white' : 'text-slate-900';
  const textSecondaryClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const inputBgClass = darkMode
    ? 'bg-slate-700/50 border-slate-600/40'
    : 'bg-white/50 border-white/40';

  const renderDashboardTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Nurse Command Center</h2>
        <p className={textSecondaryClass}>Monitor assignments, tasks, vitals, and medication schedules at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className={`text-sm ${textSecondaryClass} mb-2`}>{stat.label}</h3>
            <div className={`text-3xl font-bold ${textClass} mb-1`}>{stat.value}</div>
            <p className={`text-xs text-green-500`}>{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
        {/* Left Column - Today's Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
        >
          <h3 className={`text-xl font-semibold ${textClass} mb-6`}>Today's Timeline</h3>

          <div className="space-y-3">
            {timelineTasks.map((task, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ x: 5 }}
                className={`p-4 ${
                  darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                } rounded-xl border-l-4 ${priorityColors[task.priority].border} hover:shadow-md transition-all cursor-pointer`}
              >
                <div className={`font-semibold mb-1 ${priorityColors[task.priority].text}`}>
                  {task.time}
                </div>
                <div className={textSecondaryClass}>{task.task}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Column - Completion Snapshot & Assigned Patients */}
        <div className="space-y-6">
          {/* Completion Snapshot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
          >
            <h3 className={`text-xl font-semibold ${textClass} mb-6`}>Completion Snapshot</h3>

            <div className="space-y-4">
              {completionMetrics.map((metric, index) => (
                <div key={index}>
                  <div className={`text-sm ${textSecondaryClass} mb-1`}>{metric.label}</div>
                  <div className={`text-2xl font-bold ${textClass}`}>{metric.value}</div>
                  {metric.change && (
                    <div className={`text-xs ${metric.label === 'Overdue Tasks' ? 'text-orange-500' : 'text-green-500'} mt-1`}>
                      {metric.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Assigned Patients */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
          >
            <h3 className={`text-xl font-semibold ${textClass} mb-6`}>Assigned Patients</h3>

            <div className="space-y-4">
              {assignedPatients.map((patient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className={`p-4 ${
                    darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                  } rounded-xl border ${
                    patient.risk === 'HIGH'
                      ? 'border-red-500/50'
                      : 'border-yellow-500/50'
                  } hover:border-pink-500/50 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${textClass}`}>{patient.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      patient.risk === 'HIGH'
                        ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                        : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                    }`}>
                      {patient.risk}
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondaryClass} mb-1`}>{patient.mrn}</p>
                  <p className={`text-xs ${textSecondaryClass}`}>{patient.condition}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h3 className={`text-xl font-semibold ${textClass} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all hover:border-pink-500/50`}
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-4xl">{action.icon}</span>
                <span className={`text-sm font-medium ${textClass}`}>{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderPatientCareTab = () => {
    const careMetrics = [
      { label: 'Vitals Logged', value: '32', icon: Activity, color: 'from-red-500 to-pink-500' },
      { label: 'Meds Administered', value: '18', icon: Pill, color: 'from-blue-500 to-cyan-500' },
      { label: 'Tasks Completed', value: '21', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
      { label: 'Rounds Completed', value: '14', icon: UserCircle, color: 'from-purple-500 to-indigo-500' },
      { label: 'Open Escalations', value: '2', icon: AlertTriangle, color: 'from-orange-500 to-red-500' },
      { label: 'Care Plans Updated', value: '9', icon: ClipboardList, color: 'from-teal-500 to-cyan-500' },
    ];

    const careTimeline = [
      { time: '08:00', title: 'Initial assessment', location: 'Room 204' },
      { time: '10:30', title: 'Medication pass', location: 'Room 207' },
      { time: '12:00', title: 'Vitals + I/O', location: 'Room 205' },
      { time: '14:30', title: 'Wound care', location: 'Room 208' },
    ];

    const assignedPatientsForCare = patients.slice(0, 6).map((p, idx) => ({
      name: `${p.first_name} ${p.last_name}`,
      mrn: p.medical_record_number,
      risk: ['LOW', 'MEDIUM', 'HIGH'][idx % 3] as 'LOW' | 'MEDIUM' | 'HIGH',
      nextCheck: new Date(Date.now() + (2 + idx) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }),
      room: 200 + idx,
      notes: (p.medical_history || 'General care plan').substring(0, 120),
    }));

    const riskClasses = {
      LOW: 'text-green-500',
      MEDIUM: 'text-yellow-500',
      HIGH: 'text-red-500',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Patient Care Hub</h2>
          <p className={textSecondaryClass}>Track assignments, vitals, medications, and care plans in one workspace.</p>
        </div>

        {/* Care Metrics */}
        <div>
          <h3 className={`text-xl font-semibold ${textClass} mb-4`}>Care Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {careMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-4 border shadow-lg text-center`}
              >
                <div className={`flex justify-center mb-2`}>
                  <div className={`p-2 bg-gradient-to-br ${metric.color} rounded-lg shadow-md`}>
                    <metric.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${textClass} mb-1`}>{metric.value}</div>
                <div className={`text-xs ${textSecondaryClass}`}>{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Assigned Patients Grid */}
        <div>
          <h3 className={`text-xl font-semibold ${textClass} mb-4`}>Assigned Patients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedPatientsForCare.map((patient, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-all`}
              >
                <h4 className={`text-lg font-semibold ${textClass} mb-1`}>{patient.name}</h4>
                <p className={`text-sm ${textSecondaryClass} mb-3`}>MRN {patient.mrn}</p>
                <div className={`inline-block px-3 py-1 rounded-full ${
                  darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                } border ${
                  patient.risk === 'HIGH' ? 'border-red-500/50' :
                  patient.risk === 'MEDIUM' ? 'border-yellow-500/50' :
                  'border-green-500/50'
                } mb-3`}>
                  <span className={`text-sm font-semibold ${riskClasses[patient.risk]}`}>
                    {patient.risk} risk
                  </span>
                </div>
                <p className={`text-sm ${textSecondaryClass} mb-3`}>{patient.notes}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                  } ${textSecondaryClass}`}>
                    Next check: {patient.nextCheck}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                  } ${textSecondaryClass}`}>
                    Room {patient.room}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Care Timeline */}
        <div>
          <h3 className={`text-xl font-semibold ${textClass} mb-4`}>Care Timeline</h3>
          <div className="space-y-3">
            {careTimeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-xl p-4 border shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-semibold ${textClass}`}>{item.time}</span>
                    <span className={`mx-2 ${textSecondaryClass}`}>—</span>
                    <span className={textSecondaryClass}>{item.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                  } ${textSecondaryClass}`}>
                    {item.location}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Care Actions */}
        <div>
          <h3 className={`text-xl font-semibold ${textClass} mb-4`}>Care Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateShiftReport}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-5 h-5" />
              <span className="font-semibold">Document Shift Report</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMessage({ text: 'Update MAR shortcut coming soon.', type: 'success' })}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Pill className="w-5 h-5" />
              <span className="font-semibold">Update MAR</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMessage({ text: 'Record Intake/Output shortcut coming soon.', type: 'success' })}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Droplet className="w-5 h-5" />
              <span className="font-semibold">Record Intake/Output</span>
            </motion.button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-500'
                : 'bg-red-500/20 border border-red-500/50 text-red-500'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderNotesTasksTab = () => {
    const notesSubTabs = [
      { id: 'nurse-notes' as const, label: '📝 Nurse Notes' },
      { id: 'tasks' as const, label: '✅ Task Management' },
      { id: 'vitals' as const, label: '🩺 Vitals Records' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Notes, Tasks & Vitals</h2>
          <p className={textSecondaryClass}>Document nursing notes, manage tasks, and capture vital signs.</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {notesSubTabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setNotesSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                notesSubTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  : 'bg-white/50 text-slate-700 hover:bg-white/80'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Nurse Notes Sub-tab */}
        {notesSubTab === 'nurse-notes' && (
          <div className="space-y-6">
            {/* Create/Library Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setNotesLibrarySubTab('create')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  notesLibrarySubTab === 'create'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Create Note
              </button>
              <button
                onClick={() => setNotesLibrarySubTab('library')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  notesLibrarySubTab === 'library'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Notes Library
              </button>
            </div>

            {notesLibrarySubTab === 'create' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
              >
                <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Create Nurse Note</h3>
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Patient ID</label>
                      <input
                        type="number"
                        min="1"
                        value={noteForm.patient_id}
                        onChange={(e) => setNoteForm({ ...noteForm, patient_id: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Note Type</label>
                      <div className="relative">
                        <select
                          value={noteForm.note_type}
                          onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                          className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer`}
                        >
                          <option>Assessment Note</option>
                          <option>Progress Note</option>
                          <option>Shift Report</option>
                          <option>Incident Report</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Date</label>
                      <input
                        type="date"
                        value={noteForm.visit_date}
                        onChange={(e) => setNoteForm({ ...noteForm, visit_date: e.target.value })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Time</label>
                      <input
                        type="time"
                        value={noteForm.visit_time}
                        onChange={(e) => setNoteForm({ ...noteForm, visit_time: e.target.value })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Vital Signs</label>
                    <textarea
                      value={noteForm.vitals_text}
                      onChange={(e) => setNoteForm({ ...noteForm, vitals_text: e.target.value })}
                      placeholder="BP, HR, Temp, RR, SpO₂ ..."
                      rows={2}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Observations</label>
                    <textarea
                      value={noteForm.observations}
                      onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Interventions / Care Provided</label>
                    <textarea
                      value={noteForm.interventions}
                      onChange={(e) => setNoteForm({ ...noteForm, interventions: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Patient Response</label>
                    <textarea
                      value={noteForm.patient_response}
                      onChange={(e) => setNoteForm({ ...noteForm, patient_response: e.target.value })}
                      rows={2}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none`}
                    />
                  </div>

                  {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {message.text}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span className="font-semibold">{loading ? 'Saving...' : 'Save Note'}</span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {notesLibrarySubTab === 'library' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg space-y-4`}
              >
                <h3 className={`text-lg font-semibold ${textClass}`}>Notes Library</h3>
                {loading ? (
                  <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-lg text-center`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      <p className={textSecondaryClass}>Loading notes...</p>
                    </div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-lg text-center`}>
                    <p className={textSecondaryClass}>No nurse notes available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleViewNurseNote(note)}
                          className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-4 border shadow-lg hover:border-pink-500/50 transition-all cursor-pointer`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${textClass} mb-1`}>{note.title}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm ${textSecondaryClass}`}>
                                  Patient: {note.patient_name}
                                </span>
                                <span className="text-pink-400">•</span>
                                <span className={`text-sm ${textSecondaryClass}`}>
                                  By: {note.author_name}
                                </span>
                                <span className="text-pink-400">•</span>
                                <span className={`text-sm ${textSecondaryClass}`}>
                                  {new Date(note.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {note.risk_level && (
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  (note.risk_level || '').toLowerCase() === 'high'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : (note.risk_level || '').toLowerCase() === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/40'
                                }`}>
                                  {(note.risk_level || '').toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          {note.summary && (
                            <p className={`text-sm ${textSecondaryClass} line-clamp-3`}>
                              {note.summary}
                            </p>
                          )}
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Task Management Sub-tab */}
        {notesSubTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setTasksSubTab('pending')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  tasksSubTab === 'pending'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Pending Tasks
              </button>
              <button
                onClick={() => setTasksSubTab('completed')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  tasksSubTab === 'completed'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Completed Tasks
              </button>
              <button
                onClick={() => setTasksSubTab('add')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  tasksSubTab === 'add'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                ➕ Add Task
              </button>
            </div>

            {tasksSubTab === 'pending' && (
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'pending').length === 0 ? (
                  <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-lg text-center`}>
                    <p className={`${textSecondaryClass} mb-2`}>All tasks completed. Great job!</p>
                    <span className="text-4xl">🎉</span>
                  </div>
                ) : (
                  tasks
                    .filter(t => t.status === 'pending')
                    .map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-4 border shadow-lg`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`font-semibold ${textClass} mb-2`}>{task.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                            } ${textSecondaryClass}`}>
                              Due {task.due}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'High'
                              ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40'
                              : 'bg-green-500/20 text-green-500 border border-green-500/40'
                          }`}>
                            {task.priority} Priority
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMarkTaskComplete(task.id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Complete
                        </motion.button>
                      </motion.div>
                    ))
                )}
              </div>
            )}

            {tasksSubTab === 'completed' && (
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'completed').length === 0 ? (
                  <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-lg text-center`}>
                    <p className={textSecondaryClass}>No completed tasks yet.</p>
                  </div>
                ) : (
                  tasks
                    .filter(t => t.status === 'completed')
                    .map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-4 border shadow-lg opacity-85`}
                      >
                        <h4 className={`font-semibold ${textClass} mb-2`}>{task.title}</h4>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                          } ${textSecondaryClass}`}>
                            Finished at {task.completed_at ? new Date(task.completed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                          } ${textSecondaryClass}`}>
                            Priority {task.priority}
                          </span>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            )}

            {tasksSubTab === 'add' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
              >
                <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Add Task</h3>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Task description</label>
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Due Time</label>
                    <input
                      type="time"
                      value={taskForm.due_time}
                      onChange={(e) => setTaskForm({ ...taskForm, due_time: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Priority</label>
                    <div className="relative">
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer`}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {message.text}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Add Task</span>
                  </motion.button>
                </form>
              </motion.div>
            )}
          </div>
        )}

        {/* Vitals Records Sub-tab */}
        {notesSubTab === 'vitals' && (
          <div className="space-y-6">
            {/* Vitals Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setVitalsSubTab('record')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  vitalsSubTab === 'record'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Record Vitals
              </button>
              <button
                onClick={() => setVitalsSubTab('history')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  vitalsSubTab === 'history'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80'
                }`}
              >
                Vitals History
              </button>
            </div>

            {vitalsSubTab === 'record' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-6 border shadow-lg`}
              >
                <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Record Vital Signs</h3>
                <form onSubmit={handleSaveVitals} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Patient</label>
                      <div className="relative">
                        <select
                          value={vitalsForm.patient_id}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, patient_id: parseInt(e.target.value) })}
                          className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer`}
                        >
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} • MRN {p.medical_record_number}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>BP Systolic</label>
                      <input
                        type="number"
                        min="50"
                        max="250"
                        value={vitalsForm.systolic}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, systolic: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>BP Diastolic</label>
                      <input
                        type="number"
                        min="30"
                        max="150"
                        value={vitalsForm.diastolic}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Heart Rate (bpm)</label>
                      <input
                        type="number"
                        min="30"
                        max="200"
                        value={vitalsForm.heart_rate}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Temperature (°F)</label>
                      <input
                        type="number"
                        min="95"
                        max="106"
                        step="0.1"
                        value={vitalsForm.temperature}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>Respiratory Rate</label>
                      <input
                        type="number"
                        min="8"
                        max="40"
                        value={vitalsForm.respiratory_rate}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, respiratory_rate: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${textSecondaryClass} mb-2`}>SpO₂ (%)</label>
                      <input
                        type="number"
                        min="70"
                        max="100"
                        value={vitalsForm.spo2}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Pain Scale (0-10)</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={vitalsForm.pain_scale}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pain_scale: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className={`text-center text-2xl font-bold ${textClass} mt-2`}>
                      {vitalsForm.pain_scale}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm ${textSecondaryClass} mb-2`}>Additional Notes</label>
                    <textarea
                      value={vitalsForm.notes}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none`}
                    />
                  </div>

                  {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {message.text}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    <span className="font-semibold">Save Vitals</span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {vitalsSubTab === 'history' && (
              <div className="space-y-4">
                {vitals.length === 0 ? (
                  <div className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-lg text-center`}>
                    <p className={textSecondaryClass}>No vitals recorded yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          className={`w-full px-3 py-2 ${inputBgClass} backdrop-blur-sm border rounded-lg ${textClass} appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer`}
                        >
                          <option>All Patients</option>
                          {Array.from(new Set(vitals.map(v => v.patient_name))).map(name => (
                            <option key={name}>{name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {vitals
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((vital, index) => (
                          <motion.div
                            key={vital.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-4 border shadow-lg`}
                          >
                            <h4 className={`font-semibold ${textClass} mb-2`}>{vital.patient_name}</h4>
                            <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                              darkMode ? 'bg-slate-700/50' : 'bg-white/60'
                            } ${textSecondaryClass} mb-3`}>
                              {vital.timestamp.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            <div className={`text-sm ${textSecondaryClass} space-y-1`}>
                              <p>BP: {vital.bp} • HR: {vital.heart_rate} bpm • Temp: {vital.temperature}°F</p>
                              <p>RR: {vital.respiratory_rate} • SpO₂: {vital.spo2}% • Pain: {vital.pain_scale}/10</p>
                              <p className="text-xs pt-2">{vital.notes || 'No additional notes.'}</p>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Background Effects */}
      {!darkMode && (
        <>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="medical-grid-nurse" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M50 20 L50 35 M50 65 L50 80 M35 50 L20 50 M80 50 L65 50 M42 50 L58 50 M50 42 L50 58" stroke="#ec4899" strokeWidth="2" fill="none"/>
                  <circle cx="50" cy="50" r="25" stroke="#ec4899" strokeWidth="1" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#medical-grid-nurse)"/>
            </svg>
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
          </div>
        </>
      )}

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`${cardBgClass} backdrop-blur-xl border-b shadow-lg`}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Greeting */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Heart className={`w-7 h-7 ${darkMode ? 'text-white fill-white' : 'text-slate-700 fill-slate-700'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl ${textClass}`}>Hello, Nurse</h1>
                  <p className="text-sm text-green-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Session Active
                  </p>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-4">
                {/* HIPAA Mode Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 border border-pink-500/40 rounded-full">
                  <Shield className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-pink-400">HIPAA Mode</span>
                </div>

                {/* Date & Time */}
                <div className="hidden md:block text-right">
                  <p className={`text-sm ${textSecondaryClass}`}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                </div>

                {/* Dark Mode Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 ${cardBgClass} backdrop-blur-sm rounded-xl border hover:border-pink-500/50 transition-all`}
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-pink-600" />
                  )}
                </motion.button>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Workspace Badge */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="flex items-center gap-2 text-sm">
            <Shield className={`w-3.5 h-3.5 ${textSecondaryClass}`} />
            <span className={textSecondaryClass}>Secure workspace • Nurse</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className={`inline-flex gap-2 p-1.5 ${cardBgClass} backdrop-blur-xl rounded-2xl border shadow-lg`}>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? darkMode
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline text-sm">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'patients' && renderPatientCareTab()}
          {activeTab === 'analytics' && (
            <AIAnalyticsTab
              darkMode={darkMode}
              tasks={analyticsTasks}
              setActiveTab={setActiveTab}
              onViewTasks={() => {
                setActiveTab('notes');
                setNotesSubTab('tasks');
                setTasksSubTab('pending');
              }}
              onAddTask={() => {
                setActiveTab('notes');
                setNotesSubTab('tasks');
                setTasksSubTab('add');
              }}
            />
          )}
          {activeTab === 'notes' && renderNotesTasksTab()}
          {activeTab === 'calendar' && <CalendarTab darkMode={darkMode} />}
        </div>

        {/* Note Detail Modal */}
        {viewingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewingNote(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardBgClass} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className={`text-2xl ${textClass} mb-2`}>{viewingNote.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-sm ${textSecondaryClass}`}>Patient: {viewingNote.patient_name}</span>
                    <span className="text-pink-400">•</span>
                    <span className={`text-sm ${textSecondaryClass}`}>By: {viewingNote.author_name}</span>
                    <span className="text-pink-400">•</span>
                    <span className={`text-sm ${textSecondaryClass}`}>
                      {new Date(viewingNote.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingNote(null)}
                  className={`px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} rounded-xl transition-colors`}
                >
                  Close
                </button>
              </div>

              {/* AI Summary Section */}
              {summarizing ? (
                <div className={`${darkMode ? 'bg-slate-700/50' : 'bg-pink-50/50'} rounded-xl p-6 mb-6 border ${darkMode ? 'border-slate-600' : 'border-pink-200'}`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <span className={textClass}>Generating AI Summary...</span>
                  </div>
                </div>
              ) : (aiSummary || viewingNote.summary) && (
                <div className={`${darkMode ? 'bg-slate-700/50' : 'bg-pink-50/50'} rounded-xl p-6 mb-6 border ${darkMode ? 'border-slate-600' : 'border-pink-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-pink-500" />
                    <h3 className={`text-lg ${textClass} font-semibold`}>AI Summary</h3>
                    {(aiSummary?.risk_level || viewingNote.risk_level) && (
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        ((aiSummary?.risk_level || viewingNote.risk_level || '').toLowerCase()) === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : ((aiSummary?.risk_level || viewingNote.risk_level || '').toLowerCase()) === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          : 'bg-green-500/20 text-green-400 border border-green-500/40'
                      }`}>
                        {(aiSummary?.risk_level || viewingNote.risk_level || '').toUpperCase()} RISK
                      </span>
                    )}
                  </div>
                  <p className={`${textClass} mb-4 whitespace-pre-wrap`}>
                    {aiSummary?.summary || viewingNote.summary}
                  </p>
                  {(aiSummary?.recommendations || viewingNote.recommendations) && (
                    <div className="mt-4 pt-4 border-t border-pink-300/20">
                      <h4 className={`text-sm ${textClass} font-semibold mb-2`}>Recommendations:</h4>
                      <p className={`text-sm ${textSecondaryClass} whitespace-pre-wrap`}>
                        {aiSummary?.recommendations || viewingNote.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Original Note Content */}
              <div className={`${darkMode ? 'bg-slate-700/30' : 'bg-white/60'} rounded-xl p-6 border ${darkMode ? 'border-slate-600' : 'border-white/40'}`}>
                <h3 className={`text-lg ${textClass} font-semibold mb-4`}>Original Note</h3>
                <div className={`${textClass} whitespace-pre-wrap`}>
                  {viewingNote.content && viewingNote.content.trim().length > 0
                    ? viewingNote.content
                    : 'Nursing note content placeholder: patient comfortable, safety measures in place, vitals within normal limits. Add observations/interventions for demo.'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
