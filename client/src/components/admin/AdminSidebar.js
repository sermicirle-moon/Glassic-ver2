import React from 'react';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'classes', label: 'Lớp học' },
    { id: 'schedules', label: 'Lịch học' },
    { id: 'teachers', label: 'Giáo viên' },
    { id: 'students', label: 'Học sinh' },
    { id: 'overview', label: 'Tổng quan' }
  ];

  return (
    <div className="card border rounded-1 bg-white">
      <div className="p-3 border-bottom">
        <div
          className="text-uppercase text-secondary fw-semibold"
          style={{ fontSize: '11px', letterSpacing: '0.75px' }}
        >
          Danh Mục Quản Trị
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
              className={`btn text-start w-100 px-3 py-2 rounded-1 border-0 ${
                isActive
                  ? 'bg-dark text-white fw-semibold'
                  : 'text-dark bg-transparent'
              }`}
              style={{
                fontSize: '14px',
                transition: 'background-color 0.1s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-top mt-auto">
        <div className="text-secondary small" style={{ fontSize: '12px' }}>
          Trạng thái: <span className="text-success fw-semibold">Đang hoạt động</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
