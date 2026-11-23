import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentClassView = ({ activeClass, currentStudentId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!activeClass?.classId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`/api/users/classes/${activeClass.classId}/students`);
        setStudents(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách bạn học:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassStudents();
  }, [activeClass?.classId]);

  if (!activeClass) {
    return (
      <div className="card border rounded-1 p-4 bg-white text-center">
        <div className="text-secondary small mb-2">Thông tin lớp học</div>
        <h5 className="fw-bold text-dark">Bạn chưa tham gia lớp học nào</h5>
        <p className="text-muted small mb-0">
          Vui lòng đợi nhà trường xếp lớp hoặc liên hệ quản trị viên để cập nhật danh sách.
        </p>
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const name = (s.studentName || '').toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const teacher = activeClass.homeroomTeacher;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Thẻ Thông tin Lớp học & Giáo viên chủ nhiệm */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 border-end-md">
            <div className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              THÔNG TIN LỚP HỌC
            </div>
            <h4 className="fw-bold text-dark mb-1 mt-1">
              Lớp {activeClass.className} <span className="badge text-bg-light border text-secondary fw-normal fs-6">{activeClass.grade}</span>
            </h4>
            <div className="small text-secondary">
              Mã lớp: <code>{activeClass.classId}</code> | Sĩ số hiện tại: <strong>{students.length} / {activeClass.maxStudents}</strong> học sinh
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              GIÁO VIÊN CHỦ NHIỆM (GVCN)
            </div>
            {teacher ? (
              <div className="mt-1">
                <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                  👨‍🏫 {teacher.teacherName}
                </div>
                <div className="small text-secondary mt-1" style={{ fontSize: '12px' }}>
                  Email: <a href={`mailto:${teacher.email}`} className="text-decoration-none text-dark">{teacher.email}</a>
                  {teacher.phoneNumber && (
                    <> | SĐT: <a href={`tel:${teacher.phoneNumber}`} className="text-decoration-none text-dark">{teacher.phoneNumber}</a></>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted small mt-1">Lớp hiện chưa có giáo viên chủ nhiệm.</div>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách bạn học trong lớp */}
      <div className="card border rounded-1 bg-white">
        <div className="p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
              Danh Sách Học Sinh Trong Lớp ({filteredStudents.length})
            </h6>
            <small className="text-secondary" style={{ fontSize: '12px' }}>
              Bạn bè và các bạn cùng lớp học của bạn
            </small>
          </div>

          <div style={{ maxWidth: '260px', width: '100%' }}>
            <input
              type="text"
              className="form-control form-control-sm rounded-1"
              placeholder="Tìm theo tên hoặc mã HS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary" style={{ fontSize: '11.5px' }}>
                <th className="py-2 ps-3" style={{ width: '60px' }}>STT</th>
                <th className="py-2">MÃ HỌC SINH</th>
                <th className="py-2">HỌ VÀ TÊN</th>
                <th className="py-2">GIỚI TÍNH</th>
                <th className="py-2">NGÀY SINH</th>
                <th className="py-2 text-end pe-3">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    Đang tải danh sách học sinh...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    {searchTerm ? 'Không tìm thấy học sinh phù hợp.' : 'Chưa có học sinh nào trong lớp.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const isCurrent = s.studentId === currentStudentId;
                  return (
                    <tr key={s.studentId} className={isCurrent ? 'table-light fw-semibold' : ''}>
                      <td className="ps-3 text-secondary">{idx + 1}</td>
                      <td>
                        <code className="text-dark bg-light px-1 border rounded-1">
                          {s.studentId}
                        </code>
                      </td>
                      <td className="text-dark">
                        {s.studentName}
                        {isCurrent && (
                          <span className="badge text-bg-dark rounded-1 ms-2" style={{ fontSize: '10px' }}>
                            Bạn
                          </span>
                        )}
                      </td>
                      <td className="text-secondary">{s.gender || '—'}</td>
                      <td className="text-secondary">{s.dateOfBirth || '—'}</td>
                      <td className="text-end pe-3">
                        <span className="badge text-bg-light border text-success rounded-1">
                          ● Đang học
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentClassView;
