import React from 'react';
import { Link } from 'wouter';

export default function HomePage() {

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
    </div>
  );
}