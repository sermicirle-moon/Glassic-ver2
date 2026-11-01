import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OverviewView = ({ currentUser, setActiveTab }) => {
  const [stats, setStats] = useState({
    classesCount: 6,
    teachersCount: 0,
    studentsCount: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [teachersRes, studentsRes] = await Promise.allSettled([
          axios.get('/api/users/teachers'),
          axios.get('/api/users/students')
        ]);

        setStats((prev) => ({
          ...prev,
          teachersCount: teachersRes.status === 'fulfilled' ? teachersRes.value.data.length : 0,
          studentsCount: studentsRes.status === 'fulfilled' ? studentsRes.value.data.length : 0
        }));
      } catch (err) {
        console.error('Lỗi lấy số liệu thống kê:', err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header Info */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">Tổng Quan Hệ Thống</h5>
            <div className="small text-secondary">
              Quản trị viên: <strong>{currentUser?.username}</strong> | Mã định danh UserID:{' '}
              <code className="text-dark bg-light px-1 border rounded-1">{currentUser?.userId}</code>
            </div>
          </div>
          <div>
            <span className="badge text-bg-light border text-secondary rounded-1 fw-normal px-2 py-1">
              Vai trò: {currentUser?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white">
            <div className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              Tổng Số Lớp Học
            </div>
            <div className="fs-3 fw-bold text-dark my-1">{stats.classesCount}</div>
            <button
              onClick={() => setActiveTab('classes')}
              className="btn btn-link p-0 text-dark small text-decoration-none"
              style={{ fontSize: '13px' }}
            >
              Xem chi tiết lớp học →
            </button>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white">
            <div className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              Tổng Số Giáo Viên
            </div>
            <div className="fs-3 fw-bold text-dark my-1">{stats.teachersCount}</div>
            <button
              onClick={() => setActiveTab('teachers')}
              className="btn btn-link p-0 text-dark small text-decoration-none"
              style={{ fontSize: '13px' }}
            >
              Xem danh sách giáo viên →
            </button>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white">
            <div className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              Tổng Số Học Sinh
            </div>
            <div className="fs-3 fw-bold text-dark my-1">{stats.studentsCount}</div>
            <button
              onClick={() => setActiveTab('students')}
              className="btn btn-link p-0 text-dark small text-decoration-none"
              style={{ fontSize: '13px' }}
            >
              Xem danh sách học sinh →
            </button>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="fw-semibold small text-dark mb-2">Chuyển Nhanh Phân Hệ</div>
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('classes')}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Quản lý Lớp học
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Quản lý Giáo viên
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Quản lý Học sinh
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
