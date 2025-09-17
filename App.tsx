import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import FirstTimeSetup from './components/FirstTimeSetup';
import FocusTimer from './components/FocusTimer';
import HomeDashboard from './components/HomeDashboard';
import StudyView from './components/StudyView';
import PlannerView from './components/PlannerView';
import LeaderboardView from './components/LeaderboardView';
import ProfileView from './components/ProfileView';
import AnnouncementsView from './components/AnnouncementsView';
import CommunityView from './components/CommunityView';
import ExamInsights from './components/ExamInsights';
import ReminderModal from './components/ReminderModal';
import RescueQuizModal from './components/RescueQuizModal';
import { HomeIcon, BookOpenIcon, CalendarIcon, TrophyIcon, UserIcon, SunIcon, MoonIcon, TimerIcon, BrainCircuitIcon, MegaphoneIcon, UsersIcon, ChartBarIcon } from './components/IconComponents';
import type { GamificationStats, MockTest, UserSettings, TrackingProgress, CompletionHistory, View, Reminder, ChaptersCompleted, HoursStudied, QuizHistory, Doubt } from './types';
import useTheme from './hooks/useTheme';
import { getWeekStartDate } from './utils/dateUtils';
import { createPageTransition } from './utils/animations';

const App: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage('isSetupComplete', false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isRescueOpen, setIsRescueOpen] = useState(false);

  // Centralized state management in the App component
  const [settings, setSettings] = useLocalStorage<UserSettings>('userSettings', {
    name: 'Student',
    level: 'intermediate',
    weeklyChapterGoal: 10,
    dailyHoursGoal: 4,
    revisions: 3,
    focusedGroup: 'both',
    examAttempt: 'jan26'
  });
  const [gamificationStats, setGamificationStats] = useLocalStorage<GamificationStats>('gamificationStats', { xp: 0, level: 1, streak: 0, lastStudiedDate: '' });
  const [mockTests, setMockTests] = useLocalStorage<MockTest[]>('mockTests', []);
  const [progress, setProgress] = useLocalStorage<TrackingProgress>('trackingProgress', {});
  const [completionHistory, setCompletionHistory] = useLocalStorage<CompletionHistory[]>('completionHistory', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [quizHistory, setQuizHistory] = useLocalStorage<QuizHistory[]>('quizHistory', []);
  const [doubts, setDoubts] = useLocalStorage<Doubt[]>('doubts', []);
  const [chaptersCompletedThisWeek, setChaptersCompletedThisWeek] = useLocalStorage<ChaptersCompleted>('chaptersCompletedThisWeek', { count: 0, startDate: getWeekStartDate().toISOString() });
  const [hoursStudiedToday, setHoursStudiedToday] = useLocalStorage<HoursStudied>('hoursStudiedToday', { hours: 0, date: new Date().toDateString() });
  const [autoSelectMCQ, setAutoSelectMCQ] = useState<{ subjectId: string; chapterId: string } | undefined>(undefined);
  
  const [theme, setTheme] = useTheme(settings.level);

  
  // Effect to reset weekly chapter count if the week has changed
  useEffect(() => {
    const weekStart = getWeekStartDate();
    if (new Date(chaptersCompletedThisWeek.startDate).getTime() < weekStart.getTime()) {
      setChaptersCompletedThisWeek({ count: 0, startDate: weekStart.toISOString() });
    }
    // Effect to reset daily hours if the date has changed
    const todayString = new Date().toDateString();
    if (hoursStudiedToday.date !== todayString) {
      setHoursStudiedToday({ hours: 0, date: todayString });
    }
  }, []); // Run once on app load to check dates

  const handleSettingsSave = (newSettings: UserSettings) => {
    const levelChanged = newSettings.level !== settings.level;
    if (levelChanged) {
      if (window.confirm("Changing your CA level will reset your study progress to match the new syllabus. Are you sure you want to continue?")) {
        setProgress({});
        setGamificationStats({ xp: 0, level: 1, streak: 0, lastStudiedDate: '' });
        setMockTests([]);
        setCompletionHistory([]);
        setReminders([]);
        setQuizHistory([]);
        setDoubts([]);
        setSettings(newSettings); // This will trigger re-render, key change, and theme change
      }
    } else {
      setSettings(newSettings);
      alert("Settings have been saved successfully!");
    }
  };

  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to reset all your data? This action will clear your progress, notes, and settings and cannot be undone.")) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  // Detect streak break and offer rescue
  useEffect(() => {
    // if lastStudiedDate is not today or yesterday and streak > 0, allow rescue once per load
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const last = gamificationStats.lastStudiedDate;
    if (gamificationStats.streak > 0 && last && last !== today && last !== yesterday) {
      setIsRescueOpen(true);
    }
  }, []);

  
  if (!isSetupComplete) {
    return <FirstTimeSetup onSetupComplete={(initialSettings) => {
      setSettings(initialSettings);
      setIsSetupComplete(true);
    }} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpenIcon /> },
    { id: 'planner', label: 'Planner', icon: <CalendarIcon /> },
    { id: 'announcements', label: 'Announcements', icon: <MegaphoneIcon /> },
    { id: 'community', label: 'Community', icon: <UsersIcon /> },
    { id: 'exam-insights', label: 'Exam Insights', icon: <ChartBarIcon /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <TrophyIcon /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  ];

  const handleViewChange = (newView: View) => {
    if (newView !== activeView) {
      createPageTransition(() => {
        setActiveView(newView);
      });
    }
  };

  const ThemeToggleButton = () => (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative flex items-center justify-center md:justify-start space-x-3 w-full text-left p-3 rounded-lg transition-all duration-200 group text-text-secondary hover:bg-surface/50 hover:text-text-primary"
    >
      <div className="transition-transform duration-300 group-hover:scale-110">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </div>
      <span className="hidden group-hover:inline absolute left-14 bg-surface text-text-primary px-2 py-1 rounded-md text-sm shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <aside className="hidden md:flex flex-col w-20 bg-surface/80 backdrop-blur-sm border-r border-border-color flex-shrink-0 z-30 transition-all duration-300 hover:w-56 group">
        <div className="flex items-center justify-center p-5 border-b border-border-color h-[73px]">
           <BrainCircuitIcon className="h-8 w-8 text-brand-primary" />
           <span className="text-lg font-bold ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">CA Prep Tracker</span>
        </div>
        <nav className="flex flex-col p-4 space-y-2 flex-grow">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as View)}
              className={`relative flex items-center justify-center md:justify-start space-x-4 w-full text-left p-3 rounded-lg transition-all duration-300 group/nav micro-bounce ${
                activeView === item.id
                  ? 'bg-brand-primary text-white shadow-lg transform scale-105'
                  : 'text-text-secondary hover:bg-surface/50 hover:text-text-primary'
              }`}
              title={item.label}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 flex-shrink-0">{item.icon}</div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border-color">
            <ThemeToggleButton />
        </div>
      </aside>

      {/* CRITICAL FIX: The `key` prop forces React to unmount and remount the entire main content area when the user's level changes. This ensures all child components re-initialize with fresh state and props, fixing the theme and data refresh bug. */}
      <main key={settings.level} id="main-content" className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0">
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-primary text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>
        {activeView === 'dashboard' && <HomeDashboard {...{gamificationStats, settings, setSettings, progress, setProgress, onOpenReminders: () => setIsReminderModalOpen(true), chaptersCompletedThisWeek, hoursStudiedToday, setAutoSelectMCQ }} />}
        {activeView === 'subjects' && <StudyView {...{ progress, setProgress, gamificationStats, setGamificationStats, completionHistory, setCompletionHistory, mockTests, setMockTests, settings, chaptersCompletedThisWeek, setChaptersCompletedThisWeek, quizHistory, setQuizHistory, doubts, setDoubts, autoSelectMCQ, clearAutoSelectMCQ: () => setAutoSelectMCQ(undefined) }} />}
        {activeView === 'planner' && <PlannerView {...{ progress, setProgress, gamificationStats, setGamificationStats, completionHistory, setCompletionHistory, mockTests, settings, chaptersCompletedThisWeek, setChaptersCompletedThisWeek, quizHistory }} />}
        {activeView === 'announcements' && <AnnouncementsView />}
        {activeView === 'community' && <CommunityView />}
        {activeView === 'exam-insights' && <ExamInsights settings={settings} />}
        {activeView === 'leaderboard' && <LeaderboardView gamificationStats={gamificationStats} settings={settings} />}
        {activeView === 'profile' && <ProfileView gamificationStats={gamificationStats} settings={settings} onSettingsSave={handleSettingsSave} onReset={handleResetApp} progress={progress}/>}
      </main>
      
      <button 
        onClick={() => setShowFocusTimer(true)}
        className="fixed bottom-20 md:bottom-8 right-8 bg-brand-secondary hover:bg-brand-primary text-white rounded-full p-4 shadow-lg z-40 transform transition-transform hover:scale-110"
        aria-label="Start Focus Session"
      >
        <TimerIcon />
      </button>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-sm border-t border-border-color flex justify-around p-2 z-30">
        {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as View)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 w-16 ${
                activeView === item.id ? 'text-brand-primary transform scale-110' : 'text-text-secondary hover:scale-105'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
      </nav>

      {showFocusTimer && <FocusTimer {...{setGamificationStats, onClose: () => setShowFocusTimer(false), setHoursStudiedToday}} />}
      {isReminderModalOpen && <ReminderModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} reminders={reminders} setReminders={setReminders} settings={settings} />}
      {isRescueOpen && (
        <RescueQuizModal
          isOpen={isRescueOpen}
          onClose={() => setIsRescueOpen(false)}
          settings={settings}
          onRescueSuccess={(h) => {
            // If user scores >=6, revive streak to 1 today
            const passed = h.score >= Math.ceil(h.total * 0.6);
            if (passed) {
              setGamificationStats(prev => ({ ...prev, streak: 1, lastStudiedDate: new Date().toDateString() }));
              alert('Great job! Your streak is rescued and set to 1. Keep going!');
            } else {
              alert('Rescue attempt failed. Try studying a chapter or attempt again tomorrow.');
            }
          }}
        />
      )}


    </div>
  );
};

export default App;