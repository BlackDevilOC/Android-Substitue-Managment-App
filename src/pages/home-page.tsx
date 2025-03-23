import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { useMascot } from '../components/MascotProvider';
import { GuideStep } from '../components/MascotGuide';

export default function HomePage() {
  const { showMascot, showGuide, showFeature, isFirstVisit } = useMascot();

  // Show welcome mascot on first render
  useEffect(() => {
    // Show a welcome message with the mascot
    showMascot({
      message: "Welcome to Schedulizer! I'm Sched, your helpful assistant.",
      expression: 'happy',
      position: 'bottom-right',
      autoHide: true,
      hideAfter: 8000
    });

    // If it's the user's first visit, show a guide tour after a delay
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        showAppTour();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  // Function to show the app tour
  const showAppTour = () => {
    const tourSteps: GuideStep[] = [
      {
        id: 'welcome',
        message: "Hi there! I'm Sched, your personal assistant. Let me show you around!",
        position: 'bottom-right',
        expression: 'excited',
        delay: 500
      },
      {
        id: 'attendance',
        message: "This is where you can view and manage teacher attendance.",
        position: 'top-right',
        expression: 'happy',
        highlightSelector: '#attendance-card',
        delay: 500
      },
      {
        id: 'schedule',
        message: "Here you can see your daily class schedule.",
        position: 'bottom-left',
        expression: 'thinking',
        highlightSelector: '#schedule-card',
        delay: 500
      },
      {
        id: 'sms',
        message: "Need to send messages to teachers? You can do that right from the app!",
        position: 'top-left',
        expression: 'excited',
        highlightSelector: '#sms-card',
        delay: 500
      },
      {
        id: 'substitute',
        message: "Hmm, a teacher is absent? Don't worry, you can assign substitutes here.",
        position: 'bottom-left',
        expression: 'confused',
        highlightSelector: '#substitute-card',
        delay: 500
      },
      {
        id: 'import',
        message: "You can import teacher and schedule data from CSV files. Let me show you!",
        position: 'top-right',
        expression: 'winking',
        highlightSelector: '#import-card',
        delay: 500
      },
      {
        id: 'offline',
        message: "Best of all, this app works completely offline! No internet needed.",
        position: 'bottom-right',
        expression: 'happy',
        delay: 500
      }
    ];
    
    showGuide('app-tour', tourSteps, true);
  };

  // Function to show SMS feature discovery
  const showSmsFeature = () => {
    showFeature('sms-feature', {
      title: 'New SMS Feature!',
      description: 'You can now send SMS messages directly from the app to notify teachers about schedule changes or reminders.',
      mascotExpression: 'excited',
      onAction: () => window.location.href = '/sms-send',
      actionLabel: 'Try it now'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Schedulizer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div 
          id="attendance-card" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold mb-4">Teacher Attendance</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Mark teacher attendance and view attendance history.
          </p>
          <Link href="/attendees">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              Manage Attendance
            </a>
          </Link>
        </div>
        
        {/* Schedule Card */}
        <div 
          id="schedule-card" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold mb-4">Class Schedules</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            View and manage daily class schedules and periods.
          </p>
          <Link href="/schedule">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              View Schedules
            </a>
          </Link>
        </div>
        
        {/* SMS Card */}
        <div 
          id="sms-card" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          onClick={() => showSmsFeature()}
        >
          <h2 className="text-xl font-semibold mb-4">SMS Notifications</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Send SMS notifications to teachers about schedule changes.
          </p>
          <Link href="/sms-send">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              Send Messages
            </a>
          </Link>
        </div>
        
        {/* Substitute Management Card */}
        <div 
          id="substitute-card"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold mb-4">Substitute Management</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Assign substitute teachers to cover absent teachers.
          </p>
          <Link href="/manage-absences">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              Manage Substitutes
            </a>
          </Link>
        </div>
        
        {/* File Upload Card */}
        <div 
          id="import-card"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold mb-4">Import Data</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Import teacher and schedule data from CSV files.
          </p>
          <Link href="/file-upload">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              Upload Files
            </a>
          </Link>
        </div>
        
        {/* Settings Card */}
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Configure app settings and preferences.
          </p>
          <Link href="/settings">
            <a className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
              App Settings
            </a>
          </Link>
        </div>
      </div>
      
      {/* Mascot Controls for Testing */}
      <div className="mt-16 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Mascot Controls (Demo)</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => showMascot({ message: "Need help? Just click me!", expression: 'happy' })}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Happy Mascot
          </button>
          <button 
            onClick={showAppTour}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Start App Tour
          </button>
          <button 
            onClick={showSmsFeature}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          >
            Show SMS Feature
          </button>
          <button 
            onClick={() => showMascot({ message: "I'm thinking...", expression: 'thinking' })}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
          >
            Thinking Mascot
          </button>
          <button 
            onClick={() => showMascot({ message: "Wow! That's amazing!", expression: 'surprised' })}
            className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded"
          >
            Surprised Mascot
          </button>
          <button 
            onClick={() => showMascot({ message: "Hmm, that's strange...", expression: 'confused' })}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded"
          >
            Confused Mascot
          </button>
          <button 
            onClick={() => showMascot({ message: "You're doing great!", expression: 'winking' })}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            Winking Mascot
          </button>
        </div>
      </div>
    </div>
  );
}