import React from 'react';
import MyClassesView from './MyClassesView';

const TeacherDashboard = ({ currentUser }) => {
  return (
    <div className="container py-4" style={{ maxWidth: '1100px' }}>
      <div className="card border rounded-1 p-3 bg-white mb-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">Khu Vực Giáo Viên</h5>
            <div className="small text-secondary">
              Giáo viên: <strong>{currentUser?.username}</strong> | Mã định danh UserID:{' '}
              <code className="text-dark bg-light px-1 border rounded-1">{currentUser?.userId}</code>
            </div>
          </div>
          <span className="badge text-bg-light border text-secondary rounded-1 fw-normal px-2 py-1">
            Vai trò: {currentUser?.role}
          </span>
        </div>
      </div>

      <MyClassesView />
    </div>
  );
};

export default TeacherDashboard;