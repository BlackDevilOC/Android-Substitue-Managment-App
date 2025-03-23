import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from './button';

const Navigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const visibleRoutes = [
    { path: '/', label: 'Dashboard' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/substitutes', label: 'Substitutes' },
    { path: '/file-upload', label: 'Upload Files' },
    { path: '/sms-history', label: 'SMS History' },
  ];

  return (
    <nav className="flex space-x-2 mb-4 p-4 bg-secondary">
      {visibleRoutes.map((route) => (
        <Button
          key={route.path}
          variant={isActive(route.path) ? "default" : "secondary"}
          asChild
        >
          <Link href={route.path}>{route.label}</Link>
        </Button>
      ))}
    </nav>
  );
};

export default Navigation; 