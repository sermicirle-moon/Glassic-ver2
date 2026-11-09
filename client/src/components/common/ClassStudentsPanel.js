import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRequest from '../../hooks/use-request';

const getMessage = (err) =>
  err.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';

// Danh sách học sinh của một lớp.
// canManage = true (Admin): được xếp thêm / đưa học sinh ra khỏi lớp.
// canManage = false (Giáo viên chủ nhiệm): chỉ xem.
// Component cha nên truyền key={classInfo.classId} để reset trạng thái khi đổi lớp.
const ClassStudentsPanel = ({ classInfo, canManage, onClose, onChanged }) => {
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get(`/api/users/classes/${classInfo.classId}/students`);
      setStudents(data);

      if (canManage) {
        const res = await axios.get('/api/users/students');
        setAvailableStudents(res.data.filter((s) => !s.classId));
      }
    } catch (err) {
      setActionError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const { doRequest, errors, loading: assigning } = useRequest({
    url: `/api/users/classes/${classInfo.classId}/students`,
    method: 'post',
    body: { studentId: selectedStudentId },
    onSuccess: () => {
      setSelectedStudentId('');
      fetchStudents();
      if (onChanged) onChanged();
    }
  });

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    await doRequest();
  };

  const handleRemove = async (student) => {
    if (!window.confirm(`Đưa học sinh ${student.studentName} (${student.studentId}) ra khỏi lớp?`)) {
      return;
    }
    try {
      setActionError('');
      await axios.delete(`/api/users/classes/${classInfo.classId}/students/${student.studentId}`);
      fetchStudents();
      if (onChanged) onChanged();
    } catch (err) {
      setActionError(getMessage(err));
    }
  };

  return (
    <div className="card border rounded-1 bg-white">
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div>
          <div className="fw-semibold text-dark">
            Học sinh lớp {classInfo.classId} - {classInfo.className}
          </div>
          <small className="text-secondary">
            Sĩ số: {students.length} / {classInfo.maxStudents}
          </small>
        </div>
        <button onClick={onClose} className="btn btn-outline-secondary btn-sm rounded-1 px-3">
          Đóng
        </button>
      </div>

      <div className="p-3 d-flex flex-column gap-3">
        {canManage && (
          <form onSubmit={handleAssign}>
            <label className="form-label small text-secondary mb-1">
              Xếp học sinh chưa có lớp vào lớp này
            </label>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm rounded-1"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- Chọn học sinh --</option>
                {availableStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.studentName} ({s.studentId})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedStudentId || assigning}
                className="btn btn-dark btn-sm rounded-1 px-3 text-nowrap"
              >
                {assigning ? 'Đang thêm...' : 'Thêm vào lớp'}
              </button>
            </div>
            {errors}
          </form>
        )}

        {actionError && (
          <div className="alert alert-danger rounded-1 border small mb-0" role="alert">
            {actionError}
          </div>
        )}

        <div className="border rounded-1 overflow-hidden">
          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr className="text-secondary" style={{ fontSize: '12px' }}>
                <th className="py-2 ps-3">MÃ HS</th>
                <th className="py-2">HỌ VÀ TÊN</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">SỐ ĐIỆN THOẠI</th>
                <th className="py-2">GIỚI TÍNH</th>
                {canManage && <th className="py-2 text-end pe-3">THAO TÁC</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="text-center py-4 text-muted">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="text-center py-4 text-muted">
                    Lớp chưa có học sinh nào.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.studentId}>
                    <td className="ps-3 fw-semibold text-dark font-monospace">{s.studentId}</td>
                    <td className="fw-semibold text-dark">{s.studentName}</td>
                    <td className="text-secondary">{s.email}</td>
                    <td>{s.phoneNumber}</td>
                    <td>{s.gender}</td>
                    {canManage && (
                      <td className="text-end pe-3">
                        <button
                          onClick={() => handleRemove(s)}
                          className="btn btn-outline-danger btn-sm rounded-1 py-0 px-2"
                          style={{ fontSize: '12px' }}
                        >
                          Đưa ra khỏi lớp
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassStudentsPanel;