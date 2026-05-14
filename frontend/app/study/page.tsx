'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'

type Subject = {
  id: number
  name: string
  lessons: number
  priority: number
}

type StudyTask = {
  id: string
  originalDay: number
  subject: string
  lessons: number
}

type SavedPlanner = {
  startDate: string
  endDate: string
  subjects: Subject[]
  currentDay: number
  completedTasks: Record<string, boolean>
}

const storageKey = 'manage-your-study-planner'

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
})

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateInputToDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(value: string, days: number) {
  const date = dateInputToDate(value)
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

function countInclusiveDays(startDate: string, endDate: string) {
  const start = dateInputToDate(startDate).getTime()
  const end = dateInputToDate(endDate).getTime()
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return Math.max(1, Math.round((end - start) / millisecondsPerDay) + 1)
}

const today = toDateInputValue(new Date())
const defaultEndDate = addDays(today, 6)

function buildStudyPlan(subjects: Subject[], days: number) {
  const safeDays = Math.max(1, Math.floor(days || 1))
  const normalized = subjects
    .filter(subject => subject.name.trim() && subject.lessons > 0)
    .map(subject => ({
      ...subject,
      name: subject.name.trim(),
      remaining: Math.max(0, Math.floor(subject.lessons)),
    }))

  const plan: StudyTask[][] = Array.from({ length: safeDays }, () => [])

  for (let day = 0; day < safeDays; day += 1) {
    const openSubjects = normalized.filter(subject => subject.remaining > 0)
    if (openSubjects.length === 0) break

    const daysLeft = safeDays - day
    const targetLessons = Math.max(1, Math.ceil(openSubjects.reduce((sum, subject) => sum + subject.remaining, 0) / daysLeft))
    let assigned = 0

    while (assigned < targetLessons) {
      const usedToday = new Map(plan[day].map(task => [task.subject, task.lessons]))
      const nextSubject = normalized
        .filter(subject => subject.remaining > 0)
        .sort((a, b) => {
          const aToday = usedToday.get(a.name) || 0
          const bToday = usedToday.get(b.name) || 0
          const aPressure = (a.remaining / daysLeft) + (a.priority * 0.18) - (aToday * 1.4)
          const bPressure = (b.remaining / daysLeft) + (b.priority * 0.18) - (bToday * 1.4)
          return bPressure - aPressure
        })[0]

      if (!nextSubject) break

      const existing = plan[day].find(task => task.subject === nextSubject.name)
      if (existing) {
        existing.lessons += 1
      } else {
        plan[day].push({
          id: `${day}-${nextSubject.id}-${nextSubject.name}`,
          originalDay: day,
          subject: nextSubject.name,
          lessons: 1,
        })
      }

      nextSubject.remaining -= 1
      assigned += 1
    }
  }

  return plan
}

export default function StudyPlannerPage() {
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [currentDay, setCurrentDay] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})
  const [hasLoadedSavedPlan, setHasLoadedSavedPlan] = useState(false)

  const days = countInclusiveDays(startDate, endDate)
  const totalLessons = subjects.reduce((sum, subject) => sum + Math.max(0, subject.lessons), 0)
  const basePlan = useMemo(() => buildStudyPlan(subjects, days), [subjects, days])
  const allTasks = basePlan.flat()
  const finishedLessons = allTasks.reduce((sum, task) => sum + (completedTasks[task.id] ? task.lessons : 0), 0)
  const averageDailyLessons = totalLessons > 0 ? Math.ceil(totalLessons / Math.max(1, days)) : 0

  const currentDate = dateFormatter.format(dateInputToDate(addDays(startDate, currentDay)))
  const rolledTasks = allTasks.filter(task => task.originalDay < currentDay && !completedTasks[task.id])
  const todayTasks = basePlan[currentDay] || []
  const visibleTasks = [...rolledTasks, ...todayTasks]
  const activeLessons = visibleTasks.reduce((sum, task) => sum + task.lessons, 0)

  useEffect(() => {
    setCurrentDay(day => Math.min(day, days - 1))
  }, [days])

  useEffect(() => {
    const savedPlanner = window.localStorage.getItem(storageKey)

    if (savedPlanner) {
      try {
        const parsed = JSON.parse(savedPlanner) as Partial<SavedPlanner>

        if (parsed.startDate) setStartDate(parsed.startDate)
        if (parsed.endDate) setEndDate(parsed.endDate)
        if (Array.isArray(parsed.subjects)) setSubjects(parsed.subjects)
        if (typeof parsed.currentDay === 'number') setCurrentDay(Math.max(0, parsed.currentDay))
        if (parsed.completedTasks && typeof parsed.completedTasks === 'object') {
          setCompletedTasks(parsed.completedTasks)
        }
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    setHasLoadedSavedPlan(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedSavedPlan) return

    const planner: SavedPlanner = {
      startDate,
      endDate,
      subjects,
      currentDay,
      completedTasks,
    }

    window.localStorage.setItem(storageKey, JSON.stringify(planner))
  }, [completedTasks, currentDay, endDate, hasLoadedSavedPlan, startDate, subjects])

  const addSubject = () => {
    setSubjects(current => [
      ...current,
      { id: Date.now(), name: '', lessons: 1, priority: 2 },
    ])
  }

  const updateSubject = (id: number, updates: Partial<Subject>) => {
    setSubjects(current => current.map(subject => subject.id === id ? { ...subject, ...updates } : subject))
    setCompletedTasks({})
  }

  const removeSubject = (id: number) => {
    setSubjects(current => current.filter(subject => subject.id !== id))
    setCompletedTasks({})
  }

  const resetPlanner = () => {
    window.localStorage.removeItem(storageKey)
    setStartDate(today)
    setEndDate(defaultEndDate)
    setSubjects([])
    setCurrentDay(0)
    setCompletedTasks({})
  }

  const changeStartDate = (value: string) => {
    setStartDate(value)
    setCompletedTasks({})
    setCurrentDay(0)
    if (dateInputToDate(value) > dateInputToDate(endDate)) {
      setEndDate(value)
    }
  }

  const changeEndDate = (value: string) => {
    setEndDate(value)
    setCompletedTasks({})
    setCurrentDay(0)
  }

  const toggleTask = (taskId: string) => {
    setCompletedTasks(current => ({
      ...current,
      [taskId]: !current[taskId],
    }))
  }

  return (
    <div className="py-3 sm:py-4 space-y-4 sm:space-y-6">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full">
          <BookOpen className="w-4 h-4" />
          Study manager
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy leading-tight">
              Manage your study day by day.
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-2xl mt-2 leading-relaxed">
              Add your subjects, choose the dates, and check off each day. Unfinished material moves forward automatically.
            </p>
          </div>
          <button onClick={resetPlanner} className="btn-outline md:w-auto flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card min-w-0">
          <CalendarDays className="w-5 h-5 text-teal mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-navy">{days}</div>
          <div className="text-xs text-muted">Study days</div>
        </div>
        <div className="card min-w-0">
          <BookOpen className="w-5 h-5 text-gold mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-navy">{subjects.length}</div>
          <div className="text-xs text-muted">Subjects</div>
        </div>
        <div className="card min-w-0">
          <CheckCircle2 className="w-5 h-5 text-low mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-navy break-words">{finishedLessons}/{totalLessons}</div>
          <div className="text-xs text-muted">Lessons finished</div>
        </div>
        <div className="card min-w-0">
          <Clock className="w-5 h-5 text-crit mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-navy">{averageDailyLessons}</div>
          <div className="text-xs text-muted">Target per day</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] gap-4 sm:gap-5 items-start">
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block" htmlFor="study-start-date">
                <span className="label">From this day</span>
                <input
                  id="study-start-date"
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={event => changeStartDate(event.target.value)}
                />
              </label>
              <label className="block" htmlFor="study-end-date">
                <span className="label">To this day</span>
                <input
                  id="study-end-date"
                  className="input"
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={event => changeEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">Subjects</h2>
              <button onClick={addSubject} className="bg-teal text-white h-10 px-3 sm:px-4 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shrink-0">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="text-sm text-muted border border-dashed border-light rounded-xl p-5 text-center">
                Add your first subject to build a study plan.
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="border border-light rounded-xl p-3 space-y-3 bg-surface/50">
                    <div className="flex gap-2 min-w-0">
                      <input
                        aria-label="Subject name"
                        className="input"
                        placeholder="Subject name"
                        value={subject.name}
                        onChange={event => updateSubject(subject.id, { name: event.target.value })}
                      />
                      <button
                        aria-label={`Remove ${subject.name || 'subject'}`}
                        onClick={() => removeSubject(subject.id)}
                        className="h-11 sm:h-12 w-11 sm:w-12 shrink-0 rounded-xl border border-light bg-white text-crit flex items-center justify-center hover:bg-crit hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="label">Lessons</span>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="200"
                          value={subject.lessons}
                          onChange={event => updateSubject(subject.id, { lessons: Math.max(1, Number(event.target.value)) })}
                        />
                      </label>
                      <label className="block">
                        <span className="label">Priority</span>
                        <select
                          className="input"
                          value={subject.priority}
                          onChange={event => updateSubject(subject.id, { priority: Number(event.target.value) })}
                        >
                          <option value={1}>Normal</option>
                          <option value={2}>Important</option>
                          <option value={3}>Hard</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-4 min-w-0">
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] sm:grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2 sm:gap-3">
            <button
              aria-label="Previous day"
              disabled={currentDay === 0}
              onClick={() => setCurrentDay(day => Math.max(0, day - 1))}
              className="h-10 w-10 rounded-xl border border-light bg-white text-navy flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center min-w-0">
              <p className="text-sm text-muted">{currentDate}</p>
              <h2 className="text-lg sm:text-xl font-bold text-navy">Day {currentDay + 1}</h2>
            </div>

            <button
              aria-label="Next day"
              disabled={currentDay === days - 1}
              onClick={() => setCurrentDay(day => Math.min(days - 1, day + 1))}
              className="h-10 w-10 rounded-xl border border-light bg-white text-navy flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-y border-light py-3">
            <span className="text-sm text-muted">Material on this day</span>
            <span className="badge-open">{activeLessons} lesson{activeLessons === 1 ? '' : 's'}</span>
          </div>

          {totalLessons === 0 ? (
            <div className="text-sm text-muted border border-dashed border-light rounded-xl p-6 text-center">
              Add subjects on the left, then this page will show what to study each day.
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="text-sm text-muted border border-dashed border-light rounded-xl p-6 text-center">
              Nothing scheduled here. Use this day for revision or rest.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map(task => {
                const isDone = Boolean(completedTasks[task.id])
                const isMoved = task.originalDay < currentDay

                return (
                  <label
                    key={`${currentDay}-${task.id}`}
                    className={`flex items-center gap-3 border rounded-xl p-3 transition-colors min-w-0 ${isDone ? 'border-low bg-low/10' : 'border-light bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTask(task.id)}
                      className="h-5 w-5 shrink-0 accent-teal"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block font-semibold ${isDone ? 'text-muted line-through' : 'text-navy'}`}>
                        {task.subject} {task.lessons}
                      </span>
                      {isMoved && (
                        <span className="text-xs text-crit">
                          Moved from {dateFormatter.format(dateInputToDate(addDays(startDate, task.originalDay)))}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
