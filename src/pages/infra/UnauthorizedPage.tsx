import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="text-lg text-gray-700">You do not have the necessary permissions to view this page.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;