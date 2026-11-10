import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRequest from '../../hooks/use-request';

const getMessage = (err) =>
  err.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';

// Danh sách học sinh của một lớp.
// canManage = true (Admin): được xếp thêm / chuyển lớp / thôi học / xóa học sinh.
// canManage = false (Giáo viên chủ nhiệm): chỉ xem.
const ClassStudentsPanel = ({ classInfo, canManage, onClose, onChanged }) => {
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Quản lý tìm kiếm & gợi ý học sinh để thêm vào lớp
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get(`/api/users/classes/${classInfo.classId}/students`);
      setStudents(data);

      if (canManage) {
        const res = await axios.get('/api/users/students');
        // Học sinh chưa có lớp hoặc có trạng thái chuyển lớp/thôi học/hoàn thành đều có thể xếp lớp
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
    body: { studentId: selectedStudent?.studentId },
    onSuccess: () => {
      setSelectedStudent(null);
      setSearchKeyword('');
      setSearchResults([]);
      setHasSearched(false);
      fetchStudents();
      if (onChanged) onChanged();
    }
  });

  const handleSearchStudents = (e) => {
    if (e) e.preventDefault();
    const term = searchKeyword.trim().toLowerCase();
    if (!term) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const results = availableStudents.filter((s) => {
      const name = (s.studentName || '').toLowerCase();
      const id = (s.studentId || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = s.phoneNumber || '';
      return name.includes(term) || id.includes(term) || email.includes(term) || phone.includes(term);
    });

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleClearSelected = () => {
    setSelectedStudent(null);
  };

  const handleAssign = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStudent) return;
    await doRequest();
  };

  const handleTransfer = async (student) => {
    if (
      !window.confirm(
        `Xác nhận chuyển lớp cho học sinh ${student.studentName} (${student.studentId})?\n` +
          `Lịch sử học tập ở lớp này sẽ được bảo toàn và học sinh có thể được thêm vào lớp học mới ngay lập tức.`
      )
    ) {
      return;
    }
    try {
      setActionError('');
      await axios.delete(
        `/api/users/classes/${classInfo.classId}/students/${student.studentId}?action=TRANSFERRED`
      );
      fetchStudents();
      if (onChanged) onChanged();
    } catch (err) {
      setActionError(getMessage(err));
    }
  };

  const handleDrop = async (student) => {
    if (
      !window.confirm(
        `Xác nhận đánh dấu thôi học cho học sinh ${student.studentName} (${student.studentId})?\n` +
          `Lịch sử học tập ở lớp này sẽ được bảo toàn.`
      )
    ) {
      return;
    }
    try {
      setActionError('');
      await axios.delete(
        `/api/users/classes/${classInfo.classId}/students/${student.studentId}?action=DROPPED`
      );
      fetchStudents();
      if (onChanged) onChanged();
    } catch (err) {
      setActionError(getMessage(err));
    }
  };

  const handleDelete = async (student) => {
    if (
      !window.confirm(
        `Xóa hoàn toàn học sinh ${student.studentName} khỏi lớp này (do xếp nhầm)?\n` +
          `Lưu ý: Chỉ thực hiện được nếu học sinh chưa có dữ liệu điểm danh trong lớp.`
      )
    ) {
      return;
    }
    try {
      setActionError('');
      await axios.delete(
        `/api/users/classes/${classInfo.classId}/students/${student.studentId}?action=DELETE`
      );
      fetchStudents();
      if (onChanged) onChanged();
    } catch (err) {
      setActionError(getMessage(err));
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="badge text-bg-light border text-success rounded-1 fw-normal">
            Đang học
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge text-bg-light border text-primary rounded-1 fw-normal">
            Hoàn thành
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="badge text-bg-light border text-secondary rounded-1 fw-normal">
            Đã chuyển
          </span>
        );
      case 'DROPPED':
        return (
          <span className="badge text-bg-light border text-danger rounded-1 fw-normal">
            Thôi học
          </span>
        );
      default:
        return (
          <span className="badge text-bg-light border text-secondary rounded-1 fw-normal">
            {status || 'Đang học'}
          </span>
        );
    }
  };

  const activeCount = students.filter((s) => s.enrollmentStatus === 'ACTIVE').length;
  const completedCount = students.filter((s) => s.enrollmentStatus === 'COMPLETED').length;
  const historyCount = students.filter(
    (s) => s.enrollmentStatus === 'TRANSFERRED' || s.enrollmentStatus === 'DROPPED'
  ).length;

  const filteredStudents = students.filter((s) => {
    if (filterStatus === 'ACTIVE') return s.enrollmentStatus === 'ACTIVE';
    if (filterStatus === 'COMPLETED') return s.enrollmentStatus === 'COMPLETED';
    if (filterStatus === 'HISTORY')
      return s.enrollmentStatus === 'TRANSFERRED' || s.enrollmentStatus === 'DROPPED';
    return true;
  });

  return (
    <div className="card border rounded-1 bg-white">
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div>
          <div className="fw-semibold text-dark">
            Học sinh lớp {classInfo.classId} - {classInfo.className}
          </div>
          <small className="text-secondary">
            Đang học: {activeCount} / {classInfo.maxStudents} | Tổng danh sách: {students.length}
            {(classInfo.startDate || classInfo.endDate) && (
              <span className="ms-2">
                (Thời gian: {classInfo.startDate ? new Date(classInfo.startDate).toLocaleDateString('vi-VN') : '...'} →{' '}
                {classInfo.endDate ? new Date(classInfo.endDate).toLocaleDateString('vi-VN') : 'Chưa định'})
              </span>
            )}
          </small>
        </div>
        <button onClick={onClose} className="btn btn-outline-secondary btn-sm rounded-1 px-3">
          Đóng
        </button>
      </div>

      <div className="p-3 d-flex flex-column gap-3">
        {/* Khu vực Tìm kiếm & Gợi ý học sinh để thêm vào lớp */}
        {canManage && classInfo.status !== 'Đã hoàn thành' && (
          <div className="card border rounded-1 p-3 bg-light">
            <div className="fw-semibold small text-dark mb-2">
              Tìm kiếm và thêm học sinh vào lớp này
            </div>

            <form onSubmit={handleSearchStudents} className="mb-2">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập mã học sinh hoặc tên (nhấn Enter hoặc bấm Tìm)..."
                  className="form-control form-control-sm rounded-1"
                />
                <button
                  type="submit"
                  disabled={!searchKeyword.trim()}
                  className="btn btn-outline-dark btn-sm rounded-1 px-3 text-nowrap"
                >
                  Tìm
                </button>
              </div>
            </form>

            {/* Danh sách gợi ý xổ xuống khi ấn tìm/enter */}
            {hasSearched && (
              <div
                className="border rounded-1 bg-white mb-2 overflow-hidden"
                style={{ maxHeight: '220px', overflowY: 'auto' }}
              >
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-muted small">
                    Không tìm thấy học sinh phù hợp (hoặc học sinh đã thuộc lớp khác).
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {searchResults.map((s) => (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom text-start"
                        style={{ fontSize: '13px' }}
                      >
                        <div>
                          <span className="fw-semibold text-dark font-monospace me-2">
                            {s.studentId}
                          </span>
                          <span className="text-dark fw-semibold me-2">{s.studentName}</span>
                          <span className="text-secondary small">
                            ({s.gender || 'Nam'} - {s.phoneNumber || s.email})
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {s.lastStatus === 'TRANSFERRED' ? (
                            <span className="badge text-bg-light border text-secondary rounded-1 fw-normal">
                              Chuyển từ lớp {s.lastClassId}
                            </span>
                          ) : s.lastStatus === 'DROPPED' ? (
                            <span className="badge text-bg-light border text-danger rounded-1 fw-normal">
                              Thôi học từ lớp {s.lastClassId}
                            </span>
                          ) : s.lastStatus === 'COMPLETED' ? (
                            <span className="badge text-bg-light border text-primary rounded-1 fw-normal">
                              Đã hoàn thành lớp {s.lastClassId}
                            </span>
                          ) : (
                            <span className="badge text-bg-light border text-success rounded-1 fw-normal">
                              Học sinh mới
                            </span>
                          )}
                          <span
                            className="btn btn-outline-dark btn-sm py-0 px-2 rounded-1"
                            style={{ fontSize: '11px' }}
                          >
                            Chọn
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Học sinh đã chọn và nút xác nhận thêm */}
            {selectedStudent ? (
              <div className="d-flex justify-content-between align-items-center p-2 border rounded-1 bg-white">
                <div className="small">
                  <span className="text-secondary me-1">Đã chọn:</span>
                  <strong className="text-dark me-2">{selectedStudent.studentName}</strong>
                  <code className="text-dark bg-light px-1 border rounded-1 me-2">
                    {selectedStudent.studentId}
                  </code>
                  {selectedStudent.lastStatus === 'TRANSFERRED' && (
                    <span className="badge text-bg-light border text-secondary rounded-1 fw-normal">
                      Chuyển từ lớp {selectedStudent.lastClassId}
                    </span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="btn btn-outline-secondary btn-sm rounded-1 py-1 px-2"
                    style={{ fontSize: '12px' }}
                  >
                    Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={assigning}
                    className="btn btn-dark btn-sm rounded-1 py-1 px-3 fw-semibold"
                    style={{ fontSize: '12px' }}
                  >
                    {assigning ? 'Đang thêm...' : 'Xác nhận thêm vào lớp'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="small text-secondary fst-italic">
                Gõ tìm kiếm, nhấn Enter hoặc bấm "Tìm" để chọn học sinh từ danh sách gợi ý.
              </div>
            )}

            {errors}
          </div>
        )}

        {actionError && (
          <div className="alert alert-danger rounded-1 border small mb-0" role="alert">
            {actionError}
          </div>
        )}

        {/* Bộ lọc trạng thái trong lớp */}
        <div className="d-flex gap-1 border-bottom pb-2">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`btn btn-sm rounded-1 py-1 px-2 border-0 ${
              filterStatus === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'
            }`}
            style={{ fontSize: '12px' }}
          >
            Tất cả ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ACTIVE')}
            className={`btn btn-sm rounded-1 py-1 px-2 border-0 ${
              filterStatus === 'ACTIVE' ? 'btn-dark' : 'btn-outline-secondary'
            }`}
            style={{ fontSize: '12px' }}
          >
            Đang học ({activeCount})
          </button>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('COMPLETED')}
              className={`btn btn-sm rounded-1 py-1 px-2 border-0 ${
                filterStatus === 'COMPLETED' ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '12px' }}
            >
              Hoàn thành ({completedCount})
            </button>
          )}
          {historyCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('HISTORY')}
              className={`btn btn-sm rounded-1 py-1 px-2 border-0 ${
                filterStatus === 'HISTORY' ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '12px' }}
            >
              Đã chuyển / Thôi học ({historyCount})
            </button>
          )}
        </div>

        <div className="border rounded-1 overflow-hidden">
          <table
            className="table table-sm table-hover align-middle mb-0"
            style={{ fontSize: '13.5px' }}
          >
            <thead className="table-light">
              <tr className="text-secondary" style={{ fontSize: '12px' }}>
                <th className="py-2 ps-3">MÃ HS</th>
                <th className="py-2">HỌ VÀ TÊN</th>
                <th className="py-2">TRẠNG THÁI</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">SỐ ĐIỆN THOẠI</th>
                <th className="py-2">GIỚI TÍNH</th>
                {canManage && <th className="py-2 text-end pe-3">THAO TÁC</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center py-4 text-muted">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center py-4 text-muted">
                    {students.length === 0
                      ? 'Lớp chưa có học sinh nào.'
                      : 'Không có học sinh nào phù hợp bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.studentId}>
                    <td className="ps-3 fw-semibold text-dark font-monospace">{s.studentId}</td>
                    <td className="fw-semibold text-dark">{s.studentName}</td>
                    <td>{renderStatusBadge(s.enrollmentStatus)}</td>
                    <td className="text-secondary">{s.email}</td>
                    <td>{s.phoneNumber}</td>
                    <td>{s.gender}</td>
                    {canManage && (
                      <td className="text-end pe-3">
                        {s.enrollmentStatus === 'ACTIVE' ? (
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              onClick={() => handleTransfer(s)}
                              className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2"
                              style={{ fontSize: '11px' }}
                              title="Chuyển học sinh sang lớp khác (giữ nguyên lịch sử)"
                            >
                              Chuyển lớp
                            </button>
                            <button
                              onClick={() => handleDrop(s)}
                              className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2"
                              style={{ fontSize: '11px' }}
                              title="Đánh dấu học sinh thôi học"
                            >
                              Thôi học
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="btn btn-outline-danger btn-sm rounded-1 py-0 px-2"
                              style={{ fontSize: '11px' }}
                              title="Xóa hẳn khỏi lớp (chỉ khi xếp nhầm)"
                            >
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <span
                            className="small text-muted fst-italic"
                            style={{ fontSize: '11px' }}
                          >
                            Đã lưu lịch sử
                          </span>
                        )}
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
