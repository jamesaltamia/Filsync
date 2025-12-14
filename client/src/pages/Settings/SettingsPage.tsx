import React from 'react';
import { Card } from '../../components/Card';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card title="Settings">
        <p className="text-gray-600">Settings page coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This section will allow you to configure system settings such as:
        </p>
        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
          <li>School Information</li>
          <li>Tax Rate</li>
          <li>Receipt Settings</li>
          <li>Low Stock Threshold</li>
          <li>User Management</li>
        </ul>
      </Card>
    </div>
  );
};

