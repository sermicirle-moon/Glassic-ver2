import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import StudentSidebar from './StudentSidebar';
import StudentScheduleView from './StudentScheduleView';
import StudentOverviewView from './StudentOverviewView';
import StudentClassView from './StudentClassView';
import StudentAttendanceView from './StudentAttendanceView';
import StudentProfileView from './StudentProfileView';

const StudentDashboard = ({ currentUser }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('schedule');
  const [studentData, setStudentData] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users/students/me');
      setStudentData(res.data);
      if (res.data?.activeClasses?.length > 0 && !selectedClassId) {
        setSelectedClassId(res.data.activeClasses[0].classId);
      }
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu học sinh:', err);
      setError('Không thể tải thông tin hồ sơ học sinh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/?tab=${tabId}`, undefined, { shallow: true });
  };

  const handleProfileUpdated = (updatedStudent) => {
    setStudentData((prev) => ({
      ...prev,
      student: {
        ...prev.student,
        ...updatedStudent
      }
    }));
  };

  const activeClasses = studentData?.activeClasses || (studentData?.activeClass ? [studentData.activeClass] : []);
  const currentClass = activeClasses.find((c) => c.classId === selectedClassId) || activeClasses[0] || null;

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="card border rounded-1 p-5 bg-white text-center">
          <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
          <span className="text-secondary small">Đang đồng bộ dữ liệu học sinh...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card border rounded-1 p-4 bg-white text-center">
          <div className="text-danger small mb-2">Đã xảy ra lỗi</div>
          <h5 className="fw-bold text-dark">{error}</h5>
          <button
            onClick={fetchStudentData}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3 mt-2"
          >
            Thử lại
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <StudentOverviewView
            student={studentData?.student}
            activeClass={currentClass}
            attendance={studentData?.attendance}
            setActiveTab={handleTabChange}
          />
        );
      case 'my-class':
        return (
          <StudentClassView
            activeClass={currentClass}
            currentStudentId={studentData?.student?.studentId}
          />
        );
      case 'attendance':
        return (
          <StudentAttendanceView
            attendance={studentData?.attendance}
          />
        );
      case 'profile':
        return (
          <StudentProfileView
            student={studentData?.student}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      case 'schedule':
      default:
        return (
          <StudentScheduleView
            activeClass={currentClass}
          />
        );
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="row g-4">
        {/* Menu bên trái gọn gàng (~220px - 250px) tương tự Admin */}
        <div className="col-12 col-md-3 col-xl-2">
          <StudentSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            activeClass={currentClass}
            activeClasses={activeClasses}
            onSelectClass={setSelectedClassId}
          />
        </div>

        {/* Phân hệ nội dung bên phải */}
        <div className="col-12 col-md-9 col-xl-10">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
