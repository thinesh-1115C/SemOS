import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Sparkles, 
  BookOpen, AlertCircle, Search, Filter, Plus, Brain, Trash2, ArrowRight,
  TrendingUp, CheckSquare, Layers, HelpCircle, Layers3, ChevronDown, ChevronRight
} from 'lucide-react';
import { Subject, RevisionTask, TopicRevisionGroup } from '../types';
import { 
  groupRevisionTasksByTopic, 
  getRevisionTaskStatus,
  generateRevisionTasksForSession 
} from '../lib/revisionAlgorithm';

interface RevisionPlannerViewProps {
  subjects: Subject[];
  revisionTasks: RevisionTask[];
  onToggleRevisionTask: (taskId: string) => void;
  onAddRevisionTasks: (tasks: RevisionTask[]) => void;
  onDeleteTopicGroup?: (sourceSessionId: string, topic: string) => void;
  onNavigateToAITutor?: (topic: string, subjectId: string) => void;
}

export const RevisionPlannerView: React.FC<RevisionPlannerViewProps> = ({
  subjects,
  revisionTasks,
  onToggleRevisionTask,
  onAddRevisionTasks,
  onDeleteTopicGroup,
  onNavigateToAITutor,
}) => {
  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'calendar'>('grouped');
  const [showFutureTasks, setShowFutureTasks] = useState<boolean>(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState<boolean>(true);
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const toggleTopicCollapse = (topicKey: string) => {
    setCollapsedTopics(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Overdue Incomplete Tasks
  const overdueTasks = useMemo(() => {
    return revisionTasks.filter(t => !t.completed && t.scheduledDate < todayStr);
  }, [revisionTasks, todayStr]);

  // Manual Concept Creation Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTopic, setNewTopic] = useState<string>('');
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || '');
  const [newCompletionDate, setNewCompletionDate] = useState<string>(todayStr);

  // Derive Topic-Wise Groups
  const topicGroups = useMemo(() => {
    return groupRevisionTasksByTopic(revisionTasks);
  }, [revisionTasks]);

  // Apply Filters to Topic Groups according to Daily Dashboard rules
  const filteredGroups = useMemo(() => {
    return topicGroups.map((group) => {
      // In Focused Daily Mode, filter group tasks to only those scheduled for TODAY (or <= today)
      let displayTasks = group.tasks;
      if (!showFutureTasks) {
        displayTasks = group.tasks.filter((t) => t.scheduledDate === todayStr);
      }

      return {
        ...group,
        displayTasks,
      };
    }).filter((group) => {
      // Skip groups with no tasks matching the daily view filter unless showFutureTasks is explicitly on
      if (!showFutureTasks && group.displayTasks.length === 0) {
        return false;
      }

      // Subject filter
      if (selectedSubjectId !== 'all') {
        const matchesSubject = 
          group.subjectId === selectedSubjectId || 
          group.subjectCode.toLowerCase() === selectedSubjectId.toLowerCase();
        if (!matchesSubject) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          group.topic.toLowerCase().includes(q) ||
          group.subjectCode.toLowerCase().includes(q) ||
          (group.subjectName && group.subjectName.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Status filter
      if (statusFilter === 'due') {
        const hasDueOrOverdue = group.tasks.some((t) => {
          const st = getRevisionTaskStatus(t.scheduledDate, t.completed);
          return !t.completed && (st.isDueToday || st.isOverdue);
        });
        if (!hasDueOrOverdue) return false;
      } else if (statusFilter === 'in_progress') {
        if (group.percent === 100) return false;
      } else if (statusFilter === 'completed') {
        if (group.percent < 100) return false;
      }

      return true;
    });
  }, [topicGroups, selectedSubjectId, searchQuery, statusFilter, showFutureTasks, todayStr]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalTopics = topicGroups.length;
    const today = new Date().toISOString().split('T')[0];
    
    let dueTodayCount = 0;
    let overdueCount = 0;
    let totalCompletedTasks = 0;
    let totalTasks = 0;

    revisionTasks.forEach((t) => {
      totalTasks++;
      if (t.completed) {
        totalCompletedTasks++;
      } else {
        if (t.scheduledDate === today) dueTodayCount++;
        else if (t.scheduledDate < today) overdueCount++;
      }
    });

    const retentionIndex = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

    return {
      totalTopics,
      dueTodayCount,
      overdueCount,
      retentionIndex,
    };
  }, [topicGroups, revisionTasks]);

  // Handler for manual concept creation
  const handleCreateCustomTopicRevision = () => {
    if (!newTopic.trim()) return;

    const subj = subjects.find((s) => s.id === newSubjectId) || subjects[0];
    const sourceSessionId = `custom_${Date.now()}`;

    const newTasks = generateRevisionTasksForSession({
      sourceSessionId,
      topic: newTopic.trim(),
      subjectId: subj?.id || 'general',
      subjectCode: subj?.code || 'GEN101',
      subjectName: subj?.name || 'General Studies',
      completionDate: newCompletionDate,
    });

    onAddRevisionTasks(newTasks);
    setNewTopic('');
    setShowAddModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1A1A1A]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#F6F4F0] p-6 rounded-3xl border border-[#EAE7E0] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#FBFBF9]">
              Forgetting Curve Engine
            </span>
            <span className="text-xs text-zinc-500 font-mono">Spaced Repetition (1 • 2 • 5 • 10 • 30 Days)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Revision Planner & Concept Retention Hub
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm max-w-2xl">
            When you complete study sessions in the AI Study Planner, SemOS automatically generates linked 5-stage spaced revision tasks to move core concepts into long-term memory.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs shadow-md transition-all"
            id="add-custom-revision-topic-btn"
          >
            <Plus className="w-4 h-4 text-[#A68942]" />
            <span>Add Concept Revision</span>
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Active Concepts</span>
            <Layers3 className="w-4 h-4 text-[#A68942]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A]">{metrics.totalTopics}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Grouped by Subject & Topic</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Revisions Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-amber-700">{metrics.dueTodayCount}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Target 100% Daily Completion</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Overdue Milestones</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-rose-700">{metrics.overdueCount}</p>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Catch up to protect memory curve</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Memory Retention Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-800">{metrics.retentionIndex}%</p>
          <p className="text-[10px] text-zinc-500 mt-1">Across 5-stage repetition cycles</p>
        </div>
      </div>

      {/* Control Bar: Search, Subject Filter, View Toggle */}
      <div className="p-4 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: Search & Subject Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs font-medium text-[#1A1A1A] placeholder-zinc-400 focus:outline-none focus:border-[#A68942]"
            />
          </div>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} – {(s?.name || '')}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl bg-[#FBFBF9] border border-[#EAE7E0] text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
          >
            <option value="all">All Statuses</option>
            <option value="due">Due / Overdue Only</option>
            <option value="in_progress">In Progress (&lt;100%)</option>
            <option value="completed">100% Retained</option>
          </select>
        </div>

        {/* Right: Focused Daily vs Future Toggle & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-end md:self-auto">
          <button
            onClick={() => setShowFutureTasks(!showFutureTasks)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showFutureTasks 
                ? 'bg-[#1A1A1A] text-[#FBFBF9] border-[#1A1A1A]' 
                : 'bg-[#FBFBF9] text-zinc-700 border-[#EAE7E0] hover:bg-white'
            }`}
            title="Toggle between today's tasks and future scheduled tasks"
          >
            <Clock className="w-3.5 h-3.5 text-[#A68942]" />
            <span>{showFutureTasks ? 'Showing All Future Tasks' : 'Daily Focused (Today Only)'}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#EAE7E0] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grouped' ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs' : 'text-zinc-600 hover:text-[#1A1A1A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Topic Grouped</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-[#1A1A1A] text-[#FBFBF9] shadow-xs' : 'text-zinc-600 hover:text-[#1A1A1A]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Timeline Feed</span>
            </button>
          </div>
        </div>

      </div>

      {/* Collapsible Overdue Tasks Section */}
      {overdueTasks.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200/90 shadow-xs space-y-3">
          <div 
            onClick={() => setIsOverdueOpen(!isOverdueOpen)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-serif font-bold text-base text-rose-950">
                Overdue Revision Tasks ({overdueTasks.length})
              </h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-bold">
                Prioritise Memory Catch-Up
              </span>
            </div>
            <button 
              type="button"
              className="p-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
            >
              {isOverdueOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {isOverdueOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleRevisionTask(task.id)}
                  className="p-3.5 rounded-2xl bg-[#FBFBF9] border border-rose-200 hover:border-rose-400 cursor-pointer flex items-center justify-between transition-all shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#1A1A1A] text-[#FBFBF9] font-mono text-[10px] font-bold">
                        {task.subjectCode}
                      </span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        Day {task.dayInterval} Overdue
                      </span>
                    </div>
                    <p className="font-serif font-bold text-xs text-[#1A1A1A]">
                      {task.topic}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Scheduled: {task.scheduledDate}
                    </p>
                  </div>

                  <div className="p-1 text-zinc-400 hover:text-emerald-600">
                    <Circle className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'grouped' ? (
        /* Topic-Grouped Spaced Repetition View */
        <div className="space-y-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group, gIdx) => {
              const subject = subjects.find(
                (s) => s.id === group.subjectId || s.code === group.subjectCode
              );
              const groupKey = `${group.subjectCode}_${group.topic}`;
              const isCollapsed = collapsedTopics[groupKey] || false;

              return (
                <div 
                  key={`${group.subjectCode}_${group.topic}_${gIdx}`}
                  className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-5 hover:border-[#A68942]/40 transition-all"
                >
                  
                  {/* Topic Group Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE7E0]">
                    <div 
                      onClick={() => toggleTopicCollapse(groupKey)}
                      className="space-y-1 cursor-pointer flex-1 group/header"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          type="button" 
                          className="p-1 rounded-md bg-[#F6F4F0] text-zinc-600 group-hover/header:bg-[#1A1A1A] group-hover/header:text-[#FBFBF9] transition-colors"
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#1A1A1A] text-[#FBFBF9] font-mono text-xs font-bold">
                          {group.subjectCode}
                        </span>
                        {subject && (
                          <span className="text-xs text-zinc-500 font-medium">
                            {subject.name}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 font-mono">
                          • Learned on {group.completionDate}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#1A1A1A] group-hover/header:text-[#A68942] transition-colors flex items-center gap-2">
                        <span>{group.topic}</span>
                      </h3>
                    </div>

                    {/* Right side: Progress Bar & Actions */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1A1A1A]">
                            {group.completedCount} / {group.totalCount} Stages
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            group.percent === 100 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-[#F6F4F0] text-[#A68942] border border-[#EAE7E0]'
                          }`}>
                            {group.percent}% Retained
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="w-36 h-2 rounded-full bg-[#EAE7E0] mt-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-[#A68942] transition-all duration-500 rounded-full"
                            style={{ width: `${group.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      {onDeleteTopicGroup && (
                        <button
                          onClick={() => onDeleteTopicGroup(group.sourceSessionId, group.topic)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove concept revision schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>
                  </div>

                  {/* 5 Spaced Repetition Milestone Cards */}
                  {!isCollapsed && (
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-serif font-bold text-zinc-700 flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-[#A68942]" />
                          <span>Forgetting Curve Milestones (Days 1, 2, 5, 10, 30)</span>
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          Mark completed as you revise
                        </span>
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {group.displayTasks.map((task) => {
                        const status = getRevisionTaskStatus(task.scheduledDate, task.completed);

                        return (
                          <div
                            key={task.id}
                            onClick={() => onToggleRevisionTask(task.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                              task.completed
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : status.isDueToday
                                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/50'
                                : status.isOverdue
                                ? 'bg-rose-50/80 border-rose-200'
                                : 'bg-[#F6F4F0] border-[#EAE7E0] hover:border-[#A68942]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-[#1A1A1A] text-[#FBFBF9] font-mono text-[10px] font-bold">
                                Day {task.dayInterval}
                              </span>

                              <div className="text-zinc-500">
                                {task.completed ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-zinc-400 hover:text-[#A68942]" />
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="font-mono font-bold text-xs text-[#1A1A1A]">
                                {task.scheduledDate}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                Day {task.dayInterval} Review
                              </p>
                            </div>

                            <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeClass}`}>
                                {status.label}
                              </span>

                              {onNavigateToAITutor && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToAITutor(group.topic, group.subjectId);
                                  }}
                                  className="text-[10px] text-[#A68942] font-bold hover:underline flex items-center gap-0.5"
                                  title="Ask AI Tutor for quick revision explanation"
                                >
                                  <span>Explain</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-12 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#A68942] flex items-center justify-center">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                No Revision Tasks Found
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                Complete a study session in the <strong>AI Study Planner</strong> or click <strong>"Add Concept Revision"</strong> to automatically generate Day 1, 2, 5, 10, 30 spaced repetition schedules.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Chronological Timeline Feed View */
        <div className="p-6 rounded-3xl bg-[#FBFBF9] border border-[#EAE7E0] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A68942]" />
            <span>Upcoming Revision Timeline</span>
          </h3>

          <div className="space-y-3">
            {[...revisionTasks]
              .filter((task) => showFutureTasks || task.scheduledDate === todayStr)
              .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
              .map((task) => {
                const status = getRevisionTaskStatus(task.scheduledDate, task.completed);
                return (
                  <div
                    key={task.id}
                    onClick={() => onToggleRevisionTask(task.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      task.completed
                        ? 'bg-emerald-50/50 border-emerald-200 opacity-75'
                        : status.isDueToday
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-[#F6F4F0] border-[#EAE7E0] hover:border-[#A68942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        {task.completed ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#1A1A1A] text-[#FBFBF9] font-mono text-[10px] font-bold">
                            {task.subjectCode}
                          </span>
                          <span className="text-xs font-bold text-[#1A1A1A] font-mono">
                            Day {task.dayInterval} Review
                          </span>
                        </div>
                        <p className={`text-xs font-serif font-bold mt-0.5 ${task.completed ? 'line-through text-zinc-400' : 'text-[#1A1A1A]'}`}>
                          {task.topic}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-zinc-600">
                        {task.scheduledDate}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </div>

                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Manual Concept Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FBFBF9] border border-[#EAE7E0] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#A68942]" />
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Add Concept Revision
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-[#1A1A1A] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Enter a core concept or chapter topic. SemOS will automatically generate 5 scheduled revision tasks at <strong>Day 1, Day 2, Day 5, Day 10, and Day 30</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Target Subject</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                >
                  {subjects.length === 0 ? (
                    <option value="">General Subject</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} – {(s?.name || '')}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Topic / Concept Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fourier Series Harmonic Decomposition"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Original Completion Date</label>
                <input
                  type="date"
                  value={newCompletionDate}
                  onChange={(e) => setNewCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] focus:outline-none focus:border-[#A68942]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE7E0]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F6F4F0] text-zinc-700 text-xs font-bold hover:bg-[#EAE7E0]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomTopicRevision}
                disabled={!newTopic.trim()}
                className="px-5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-xs disabled:opacity-50"
              >
                Generate 5 Revision Tasks
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
