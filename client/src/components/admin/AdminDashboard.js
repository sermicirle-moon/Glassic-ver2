import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminSidebar from './AdminSidebar';
import ClassManagementView from './ClassManagementView';
import TeacherManagementView from './TeacherManagementView';
import StudentManagementView from './StudentManagementView';
import OverviewView from './OverviewView';

const AdminDashboard = ({ currentUser }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('classes');

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/?tab=${tabId}`, undefined, { shallow: true });
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'classes':
        return <ClassManagementView />;
      case 'teachers':
        return <TeacherManagementView />;
      case 'students':
        return <StudentManagementView />;
      case 'overview':
      default:
        return <OverviewView currentUser={currentUser} setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="row g-4">
        {/* Menu bên trái gọn gàng (~220px - 250px) */}
        <div className="col-12 col-md-3 col-xl-2">
          <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>

        {/* Phân hệ quản lý bên phải */}
        <div className="col-12 col-md-9 col-xl-10">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
