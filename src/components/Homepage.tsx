import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, BookOpen, Bot, Layers, Calendar, Trophy, Zap, 
  CheckCircle2, ArrowRight, ShieldCheck, ChevronDown, ChevronUp,
  Brain, FileText, Target, Award, Star, Users, Flame, Lightbulb
} from 'lucide-react';

interface HomepageProps {
  onLaunchApp: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunchApp }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const appsCombined = [
    { name: 'ChatGPT', role: 'AI Tutor & Reasoning', icon: '🤖', color: 'from-emerald-500/20 to-teal-500/20' },
    { name: 'Notion', role: 'Subject Workspaces', icon: '📝', color: 'from-slate-500/20 to-gray-500/20' },
    { name: 'Google Drive', role: 'PDF Document Brain', icon: '📁', color: 'from-blue-500/20 to-indigo-500/20' },
    { name: 'Anki', role: 'Spaced Repetition Flashcards', icon: '🎴', color: 'from-purple-500/20 to-pink-500/20' },
    { name: 'Google Calendar', role: 'Forgetting Curve Planner', icon: '📅', color: 'from-amber-500/20 to-orange-500/20' },
    { name: 'Khan Academy', role: 'Step-by-Step Mastery', icon: '🎓', color: 'from-green-500/20 to-emerald-500/20' },
    { name: 'Duolingo', role: 'Gamification & Streaks', icon: '🦉', color: 'from-rose-500/20 to-red-500/20' },
  ];

  const featuresList = [
    {
      title: 'Multimodal AI Tutor with 6 Modes',
      description: 'Switch between Explain, Beginner, Expert, Exam, Viva Interview, and Feynman Mode to test your true understanding.',
      icon: Bot,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40',
    },
    {
      title: 'Subject Workspaces & Notes',
      description: 'Dedicated hubs for every semester course. Keep notes, PDFs, flashcards, assignments, and AI memory grouped cleanly.',
      icon: BookOpen,
      color: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
    },
    {
      title: 'Smart PDF Brain & Formula Extractor',
      description: 'Upload slides, textbooks, and lab manuals. Extract equations, generate summaries, and ask instant document Q&A.',
      icon: FileText,
      color: 'text-blue-400 bg-blue-950/60 border-blue-800/40',
    },
    {
      title: 'Anki-Style Spaced Repetition',
      description: 'Auto-generate flashcards from your notes and study using mathematical forgetting curves (SM-2 algorithm).',
      icon: Layers,
      color: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
    },
    {
      title: 'Forgetting Curve Revision Calendar',
      description: 'SemOS automatically schedules review sessions on Day 1, 2, 5, 10, and 30 so knowledge stays permanently stored.',
      icon: Calendar,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
    },
    {
      title: 'Gamified Streaks, XP & Leaderboards',
      description: 'Stay motivated with daily study flames, level progression, unlockable badges, and study hours tracking.',
      icon: Trophy,
      color: 'text-pink-400 bg-pink-950/60 border-pink-800/40',
    },
  ];

  const faqItems = [
    {
      q: 'What makes SemOS different from general AI chatbots like ChatGPT or Claude?',
      a: 'General AI chatbots lack context—they forget what subject you are studying, don\'t organize your files, and cannot track your exam deadlines. SemOS is an integrated Operating System that links your uploaded PDFs, subject notes, spaced flashcards, and calendar deadlines into a single persistent memory model.',
    },
    {
      q: 'How does Feynman Mode work?',
      a: 'In Feynman Mode, SemOS asks you to explain a concept in your own words as if teaching a 10-year-old. When you respond, the AI analyzes your explanation, points out hidden gaps or misconceptions, and guides you step-by-step to achieve total mastery.',
    },
    {
      q: 'Can I upload my university lecture PDFs and textbooks?',
      a: 'Yes! SemOS parses uploaded PDFs, extracts key mathematical formulas, creates chapter summaries, auto-generates study flashcards, and lets you ask questions directly to your specific course materials.',
    },
    {
      q: 'How does the spaced repetition flashcard system work?',
      a: 'SemOS implements the SuperMemo SM-2 spaced repetition algorithm. When you review a flashcard and grade its difficulty (Easy, Medium, Hard), SemOS calculates the optimal review interval (e.g. 1 day, 3 days, 7 days, 14 days) so you review right when you\'re about to forget it.',
    },
    {
      q: 'Is my academic data synced and secure?',
      a: 'All your subject data, notes, and study history remain persistent in your private session storage and cloud workspace.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#1A1A1A] font-sans selection:bg-[#A68942]/20 selection:text-[#1A1A1A] pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F6F4F0] border border-[#EAE7E0] text-[#A68942] text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#A68942]" />
            <span>The Academic Operating System Built for Top Students</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1A1A1A] mb-6 leading-tight">
            SemOS – Semester <br className="hidden sm:block" />
            <span className="text-[#A68942] italic">
              Operating System
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-zinc-600 font-normal leading-relaxed mb-8">
            Your AI-Powered Academic OS. Learn concepts step-by-step, organize subject materials, generate flashcards, master Feynman technique, and improve your GPA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1A1A1A] hover:bg-[#333333] text-[#FBFBF9] font-bold text-base shadow-md transition-all flex items-center justify-center gap-3"
              id="hero-launch-app-btn"
            >
              <span>Launch SemOS Dashboard</span>
              <ArrowRight className="w-5 h-5 text-[#A68942]" />
            </button>
            <a
              href="#features-section"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#F6F4F0] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-[#1A1A1A] font-semibold text-base transition-colors"
            >
              Explore Capabilities
            </a>
          </div>

          {/* Unified Tool Showcase Pills */}
          <div className="pt-6 border-t border-[#EAE7E0] max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 font-mono">
              Combining the superpowers of 7 essential student tools into 1 unified platform
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {appsCombined.map((app, index) => (
                <motion.div 
                  key={app.name}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0] text-xs font-medium text-[#1A1A1A] shadow-xs hover:border-[#A68942]/50 transition-colors"
                >
                  <span className="text-base">{app.icon}</span>
                  <span className="font-bold text-[#1A1A1A]">{app.name}</span>
                  <span className="text-zinc-500 text-[11px]">• {app.role}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Interactive App Preview Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="p-2 rounded-3xl bg-[#F6F4F0] border border-[#EAE7E0] shadow-sm">
          <div className="bg-[#FBFBF9] rounded-2xl border border-[#EAE7E0] p-6 text-left">
            <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1A1A1A]" />
                <div className="w-3 h-3 rounded-full bg-[#A68942]" />
                <div className="w-3 h-3 rounded-full bg-[#EAE7E0]" />
                <span className="ml-2 text-xs font-mono text-zinc-500">SemOS Student Workspace</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F6F4F0] border border-[#EAE7E0] text-[#A68942] text-[11px] font-semibold">
                Live AI Memory Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0]">
                <span className="text-xs font-bold text-[#A68942] uppercase tracking-wider block mb-2 font-mono">Subject Workspace</span>
                <p className="font-serif font-bold text-[#1A1A1A] text-sm">Data Structures & C++</p>
                <p className="text-xs text-zinc-600 mt-1">AVL Tree Rotations, Graph Dijkstra, Priority Queues</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0]">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider block mb-2 font-mono">AI Tutor Mode</span>
                <p className="font-serif font-bold text-[#1A1A1A] text-sm">Feynman Technique</p>
                <p className="text-xs text-zinc-600 mt-1">"Explain BJT Voltage Divider Biasing like I'm 10 years old"</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F4F0] border border-[#EAE7E0]">
                <span className="text-xs font-bold text-[#A68942] uppercase tracking-wider block mb-2 font-mono">Spaced Repetition</span>
                <p className="font-serif font-bold text-[#1A1A1A] text-sm">14 Cards Due Today</p>
                <p className="text-xs text-zinc-600 mt-1">Green's Theorem & Fourier Transform Review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
            Everything You Need to Dominate Your Semester
          </h2>
          <p className="text-zinc-600 text-base max-w-2xl mx-auto">
            SemOS eliminates disjointed apps. All notes, AI explanations, flashcards, PDFs, and calendar deadlines exist in harmony.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="p-6 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] hover:border-[#A68942]/60 transition-all hover:-translate-y-0.5 group shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl border border-[#EAE7E0] bg-[#1A1A1A] text-[#A68942] flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-2 group-hover:text-[#A68942] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-zinc-600 text-xs leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#EAE7E0]">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#A68942] uppercase tracking-widest block mb-2 font-mono">Workflow</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">How SemOS Transforms Your Study Habits</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Upload & Organize', desc: 'Add subjects for your current semester and upload lecture slides or textbooks.' },
            { step: '02', title: 'AI Concept Breakdown', desc: 'Ask AI Tutor to teach difficult concepts using Feynman Mode or Beginner analogies.' },
            { step: '03', title: 'Auto-Generate Flashcards', desc: 'Convert notes and PDF chapters into spaced repetition flashcards automatically.' },
            { step: '04', title: 'Master Forgetting Curve', desc: 'Follow automated revision reminders so you retain 95%+ of material before exam day.' },
          ].map((item) => (
            <div 
              key={item.step} 
              className="p-5 rounded-2xl bg-[#F6F4F0] hover:bg-[#FFFFFF] border border-[#EAE7E0] hover:border-[#A68942]/50 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative"
            >
              <span className="text-4xl font-serif font-bold text-[#A68942]/40 group-hover:text-[#A68942]/80 transition-colors block mb-3">{item.step}</span>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A] group-hover:text-[#A68942] transition-colors mb-2">{item.title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#EAE7E0]">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-2">Loved by Engineering & Science Students</h2>
          <p className="text-zinc-500 text-xs">Real outcomes from top universities using SemOS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Feynman Mode alone raised my GPA from 3.2 to 3.9. Explaining C++ tree rotations back to the AI revealed every gap I had.",
              author: "David Chen",
              role: "CS Senior, Berkeley",
              stars: 5,
            },
            {
              quote: "Having my physics PDFs, formula flashcards, and exam countdowns in one Operating System stopped me from losing track of materials.",
              author: "Sophia Martinez",
              role: "Electrical Eng, MIT",
              stars: 5,
            },
            {
              quote: "The forgetting curve revision planner is brilliant. I stopped cramming the night before midterms entirely.",
              author: "Liam O'Connor",
              role: "Biomedical Eng, Oxford",
              stars: 5,
            },
          ].map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] text-left">
              <div className="flex gap-1 mb-3 text-[#A68942]">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#A68942]" />
                ))}
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed italic mb-4">"{t.quote}"</p>
              <div>
                <p className="font-bold text-[#1A1A1A] text-xs">{t.author}</p>
                <p className="text-[11px] text-zinc-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#EAE7E0]">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-2">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-xs">Got questions about SemOS? We've got answers.</p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-[#F6F4F0] border border-[#EAE7E0] overflow-hidden text-left"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-serif font-bold text-[#1A1A1A] text-sm hover:text-[#A68942] transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#A68942] shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-zinc-600 leading-relaxed border-t border-[#EAE7E0] pt-3 bg-[#FBFBF9]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#1A1A1A] text-[#FBFBF9] border border-[#1A1A1A] text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FBFBF9] mb-4">
              Ready to Upgrade Your Academic Life?
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-8">
              Start organizing your semester, practicing with AI Tutor, and staying ahead of every exam deadline today.
            </p>
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 rounded-2xl bg-[#FBFBF9] text-[#1A1A1A] font-bold text-base hover:bg-[#EAE7E0] shadow-md hover:scale-105 transition-all"
              id="cta-launch-semos-btn"
            >
              Open SemOS Dashboard Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 mt-16 border-t border-[#EAE7E0] text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#A68942]" />
          <span className="font-serif font-bold text-[#1A1A1A]">SemOS</span>
          <span>— Your AI-Powered Academic Operating System</span>
        </div>
        <p>© 2026 SemOS Academic Inc. Built for Students Worldwide.</p>
      </footer>

    </div>
  );
};
