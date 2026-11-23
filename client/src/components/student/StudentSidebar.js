import React from 'react';

const StudentSidebar = ({ activeTab, setActiveTab, activeClass, activeClasses = [], onSelectClass }) => {
  const menuItems = [
    { id: 'schedule', label: 'Thời khóa biểu', icon: '📅' },
    { id: 'overview', label: 'Tổng quan', icon: '📊' },
    { id: 'my-class', label: 'Lớp học của tôi', icon: '🏫' },
    { id: 'attendance', label: 'Điểm danh', icon: '📋' },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: '👤' }
  ];

  return (
    <div className="card border rounded-1 bg-white">
      <div className="p-3 border-bottom">
        <div
          className="text-uppercase text-secondary fw-semibold"
          style={{ fontSize: '11px', letterSpacing: '0.75px' }}
        >
          Danh Mục Học Viên
        </div>
      </div>

      <div className="p-2 d-flex flex-column gap-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              type="button"
              className={`btn text-start w-100 px-3 py-2 rounded-1 border-0 d-flex align-items-center justify-content-between ${
                isActive
                  ? 'bg-dark text-white fw-semibold'
                  : 'text-dark bg-transparent'
              }`}
              style={{
                fontSize: '13.5px',
                transition: 'background-color 0.1s ease',
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: '12px', opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-top mt-auto">
        <div className="text-secondary small mb-1" style={{ fontSize: '11px' }}>
          Lớp đang theo học:
        </div>
        {activeClasses.length > 1 ? (
          <div>
            <select
              className="form-select form-select-sm rounded-1 mb-1"
              style={{ fontSize: '12px' }}
              value={activeClass?.classId || ''}
              onChange={(e) => onSelectClass && onSelectClass(e.target.value)}
            >
              {activeClasses.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className} ({c.grade})
                </option>
              ))}
            </select>
            <div className="text-muted small" style={{ fontSize: '11px' }}>
              Bạn đang học {activeClasses.length} lớp
            </div>
          </div>
        ) : (
          <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
            {activeClass ? `${activeClass.className} (${activeClass.grade})` : 'Chưa xếp lớp'}
          </div>
        )}
        <div className="text-success small mt-1" style={{ fontSize: '11px' }}>
          ● Đang theo học
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar;
