import { RevisionTask, TopicRevisionGroup } from '../types';

export const FORGETTING_CURVE_INTERVALS = [1, 2, 5, 10, 30] as const;

/**
 * Adds a specified number of days to a date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + days);
    return today.toISOString().split('T')[0];
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Core Integration Function: Triggered when a study task is checked off in the AI Study Planner.
 * Calculates 1, 2, 5, 10, and 30-day interval revision tasks for the completed concept topic.
 */
export function triggerSpacedRepetition(studyTask: {
  id: string;
  topic: string;
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  completionDate?: string;
}): RevisionTask[] {
  return generateRevisionTasksForSession({
    sourceSessionId: studyTask.id,
    topic: studyTask.topic,
    subjectId: studyTask.subjectId,
    subjectCode: studyTask.subjectCode,
    subjectName: studyTask.subjectName,
    completionDate: studyTask.completionDate || new Date().toISOString().split('T')[0],
  });
}

/**
 * Generates 5 spaced repetition revision tasks (Day 1, Day 2, Day 5, Day 10, Day 30)
 * when a study session is marked completed in the AI Study Planner.
 */
export function generateRevisionTasksForSession(params: {
  sourceSessionId: string;
  topic: string;
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  completionDate?: string;
}): RevisionTask[] {
  const completionDate = params.completionDate || new Date().toISOString().split('T')[0];

  return FORGETTING_CURVE_INTERVALS.map((interval) => {
    const scheduledDate = addDaysToDate(completionDate, interval);
    return {
      id: `rev_${params.sourceSessionId}_d${interval}`,
      sourceSessionId: params.sourceSessionId,
      subjectId: params.subjectId,
      subjectCode: params.subjectCode,
      subjectName: params.subjectName,
      topic: params.topic,
      completionDate,
      dayInterval: interval as 1 | 2 | 5 | 10 | 30,
      scheduledDate,
      completed: false,
    };
  });
}

/**
 * Groups revision tasks strictly by Topic and Subject, so the Revision Planner
 * can display spaced repetition progress per concept.
 */
export function groupRevisionTasksByTopic(tasks: RevisionTask[]): TopicRevisionGroup[] {
  const groupsMap = new Map<string, TopicRevisionGroup>();

  for (const task of tasks) {
    if (!task) continue;
    const cleanTopic = (task.topic || 'General Topic').trim();
    const groupKey = `${task.subjectCode || task.subjectId || 'sub'}::${cleanTopic.toLowerCase()}`;

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        topic: cleanTopic,
        subjectId: task.subjectId,
        subjectCode: task.subjectCode || task.subjectId,
        subjectName: task.subjectName,
        sourceSessionId: task.sourceSessionId,
        completionDate: task.completionDate,
        tasks: [],
        completedCount: 0,
        totalCount: 0,
        percent: 0,
      });
    }

    const group = groupsMap.get(groupKey)!;
    group.tasks.push(task);
  }

  const result: TopicRevisionGroup[] = [];

  for (const group of groupsMap.values()) {
    // Sort tasks strictly by Day interval (Day 1, Day 2, Day 5, Day 10, Day 30)
    group.tasks.sort((a, b) => a.dayInterval - b.dayInterval);
    group.totalCount = group.tasks.length;
    group.completedCount = group.tasks.filter((t) => t.completed).length;
    group.percent = group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0;
    result.push(group);
  }

  // Sort groups by completion date (most recent completed concepts first)
  result.sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

  return result;
}

/**
 * Calculates status of a scheduled revision task relative to today
 */
export function getRevisionTaskStatus(scheduledDate: string, completed: boolean): {
  label: string;
  badgeClass: string;
  isDueToday: boolean;
  isOverdue: boolean;
} {
  if (completed) {
    return {
      label: 'Completed',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isDueToday: false,
      isOverdue: false,
    };
  }

  const today = new Date().toISOString().split('T')[0];

  if (scheduledDate === today) {
    return {
      label: 'Due Today',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
      isDueToday: true,
      isOverdue: false,
    };
  } else if (scheduledDate < today) {
    return {
      label: 'Overdue',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      isDueToday: false,
      isOverdue: true,
    };
  } else {
    // Future date
    const d1 = new Date(today);
    const d2 = new Date(scheduledDate);
    const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return {
      label: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
      isDueToday: false,
      isOverdue: false,
    };
  }
}
