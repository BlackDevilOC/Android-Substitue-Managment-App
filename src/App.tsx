import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Router } from 'wouter';
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from './hooks/use-auth';
import { MobileServerProvider } from './components/MobileServerProvider';
import { MascotProvider } from './components/MascotProvider';
import { queryClient } from './lib/queryClient';

// Import pages 
import NotFound from './pages/not-found';
import HomePage from './pages/home-page';
import SchedulePage from './pages/schedule-page';
import Attendees from './pages/Attendees';
import FileUploadPage from './pages/file-upload';
import ProfilePage from './pages/profile-page';
import ManageAbsencesPage from './pages/manage-absences';
import TeacherDetailsPage from './pages/teacher-details';
import SecondaryNavPage from './pages/secondary-nav';
import SmsHistoryPage from './pages/sms-history';
import SettingsPage from './pages/settings';
import PeriodsPage from './pages/periods';
import AssignedSubstitutesPage from './pages/assigned-substitutes';
import NotificationsPage from './pages/notifications';
import ExperimentScreen from './pages/experiment-screen';
import SmsSendPage from './pages/sms-send';
import TestingPage from './pages/testing-page';
import LookupPage from './pages/lookup-page';
import SmsConfirmPage from './pages/sms-confirm';
import ApiSettingsPage from './pages/api-settings';
import SmsTestPage from './pages/sms-test';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Network status indicator
function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (Capacitor.isNativePlatform()) {
    // In native mode, don't show the indicator (we're designed for offline use)
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 m-2 px-2 py-1 rounded text-xs font-medium ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}

// Server status indicator
function ServerStatus() {
  const [showMessage, setShowMessage] = React.useState(false);
  
  React.useEffect(() => {
    // Only show in native mode after a delay
    if (Capacitor.isNativePlatform()) {
      const timer = setTimeout(() => setShowMessage(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  if (!Capacitor.isNativePlatform() || !showMessage) {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 left-0 right-0 mx-auto w-max px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
      Local server is active
    </div>
  );
}

// Router component
function Router() {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Route path="/" component={HomePage} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/attendees" component={Attendees} />
      <Route path="/file-upload" component={FileUploadPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/manage-absences" component={ManageAbsencesPage} />
      <Route path="/teacher/:id" component={TeacherDetailsPage} />
      <Route path="/navigation" component={SecondaryNavPage} />
      <Route path="/sms-history" component={SmsHistoryPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/periods" component={PeriodsPage} />
      <Route path="/assigned-substitutes" component={AssignedSubstitutesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/experiment" component={ExperimentScreen} />
      <Route path="/sms-send" component={SmsSendPage} />
      <Route path="/testing" component={TestingPage} />
      <Route path="/lookup" component={LookupPage} />
      <Route path="/sms-confirm" component={SmsConfirmPage} />
      <Route path="/api-settings" component={ApiSettingsPage} />
      <Route path="/sms-test" component={SmsTestPage} />
      <Route path="/:rest*" component={NotFound} />
    </React.Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileServerProvider>
          <MascotProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <NetworkStatus />
              <ServerStatus />
              <Router />
            </div>
          </MascotProvider>
        </MobileServerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;