import React from 'react';
import { UserProfile, StudyAnalyticsData } from '../types';
import { 
  Trophy, Flame, BarChart3, Target, Award, Sparkles, 
  CheckCircle2, Clock, Brain, Zap 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts';

interface AnalyticsViewProps {
  user: UserProfile;
  analytics: StudyAnalyticsData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ user, analytics }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Study Analytics & Gamification</h1>
            <p className="text-xs text-slate-400">Track daily consistency, subject mastery trends, and level progression</p>
          </div>
        </div>

        {/* Level XP Banner */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Level {user.level} Architect</p>
            <p className="text-[10px] text-indigo-400 font-mono">{user.xp} XP / 3000 XP</p>
          </div>
        </div>
      </div>

      {/* Gamification Badges Row */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Unlocked Achievement Badges</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {user.badges.map((badge) => (
            <div key={badge.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-md">
              <span className="text-3xl">{badge.icon}</span>
              <div>
                <p className="font-bold text-xs text-white">{badge.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Study Hours Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <h2 className="font-bold text-sm text-white">Daily Study Hours vs Target</h2>
            <p className="text-[11px] text-slate-400">Weekly consistency tracker (Goal: 4.0 hrs/day)</p>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery Radar / Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <h2 className="font-bold text-sm text-white">Subject Mastery Scores (%)</h2>
            <p className="text-[11px] text-slate-400">Calculated across quizzes, flashcard reviews & notes</p>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.subjectMastery} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="subject" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Accuracy Trend Line Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <h2 className="font-bold text-sm text-white">Quiz Accuracy Trend Over Weeks</h2>
            <p className="text-[11px] text-slate-400">Steady score improvement from Wk 1 to Wk 4</p>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.quizAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forgetting Curve Area Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <h2 className="font-bold text-sm text-white">Ebbinghaus Memory Retention Curve (%)</h2>
            <p className="text-[11px] text-slate-400">Why spaced repetition reviews are critical over 30 days</p>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.forgettingCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="retention" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
