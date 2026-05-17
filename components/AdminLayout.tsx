import React from 'react';
import { Outlet } from 'react-router-dom';

interface AdminLayoutProps {
  userData: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ userData }) => {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
