import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClassStudentsPanel from '../common/ClassStudentsPanel';

const MyClassesView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const fetchMyClasses = async () => {
    try {
      const { data } = await axios.get('/api/users/classes/my');
      setClasses(data);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp chủ nhiệm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const selectedClass = classes.find((c) => c.classId === selectedClassId) || null;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0">Lớp Chủ Nhiệm</h5>
          <small className="text-secondary">Các lớp bạn phụ trách và danh sách học sinh trong lớp</small>
        </div>
        <button
          onClick={fetchMyClasses}
          className="btn btn-outline-secondary btn-sm rounded-1 px-3"
        >
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="card border rounded-1 overflow-hidden bg-white">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr className="text-secondary" style={{ fontSize: '12px' }}>
              <th className="py-2 ps-3">MÃ LỚP</th>
              <th className="py-2">TÊN LỚP</th>
              <th className="py-2">KHỐI</th>
              <th className="py-2">SĨ SỐ</th>
              <th className="py-2">TRẠNG THÁI</th>
              <th className="py-2 text-end pe-3">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : classes.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  Bạn chưa được phân công chủ nhiệm lớp nào.
                </td>
              </tr>
            ) : (
              classes.map((c) => (
                <tr key={c.classId}>
                  <td className="ps-3 fw-semibold text-dark font-monospace">{c.classId}</td>
                  <td>{c.className}</td>
                  <td>
                    <span className="badge text-bg-light border rounded-1 fw-normal text-secondary">
                      {c.grade}
                    </span>
                  </td>
                  <td>
                    {c.totalStudents} / {c.maxStudents}
                  </td>
                  <td>
                    <span
                      className={`small fw-semibold ${
                        c.status === 'Hoạt động' ? 'text-success' : 'text-secondary'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button
                      onClick={() => setSelectedClassId(c.classId)}
                      className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2"
                      style={{ fontSize: '12px' }}
                    >
                      Xem học sinh
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedClass && (
        <ClassStudentsPanel
          key={selectedClass.classId}
          classInfo={selectedClass}
          canManage={false}
          onClose={() => setSelectedClassId(null)}
        />
      )}
    </div>
  );
};

export default MyClassesView;