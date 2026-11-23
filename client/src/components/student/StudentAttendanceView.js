import React, { useState } from 'react';

const formatTimeShort = (dStr) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateShort = (dStr) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const StudentAttendanceView = ({ attendance = [] }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const totalCount = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const excusedCount = attendance.filter((a) => a.status === 'EXCUSED').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  const filteredAttendance = attendance.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Thẻ Thống kê Chuyên cần */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-0">Sổ Điểm Danh & Chuyên Cần</h5>
            <small className="text-secondary">Theo dõi chi tiết tình hình tham gia các buổi học của bạn</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small">Tỷ lệ chuyên cần:</span>
            <span className="badge text-bg-success rounded-1 px-2 py-1 fs-6">{attendanceRate}%</span>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded-1 bg-light text-center">
              <div className="text-secondary small fw-semibold" style={{ fontSize: '11px' }}>
                TỔNG BUỔI ĐIỂM DANH
              </div>
              <div className="fs-5 fw-bold text-dark">{totalCount}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded-1 bg-light text-center">
              <div className="text-success small fw-semibold" style={{ fontSize: '11px' }}>
                CÓ MẶT
              </div>
              <div className="fs-5 fw-bold text-success">{presentCount}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded-1 bg-light text-center">
              <div className="text-warning small fw-semibold" style={{ fontSize: '11px' }}>
                CÓ PHÉP
              </div>
              <div className="fs-5 fw-bold text-warning">{excusedCount}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded-1 bg-light text-center">
              <div className="text-danger small fw-semibold" style={{ fontSize: '11px' }}>
                VẮNG KHÔNG PHÉP
              </div>
              <div className="fs-5 fw-bold text-danger">{absentCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách bản ghi điểm danh */}
      <div className="card border rounded-1 bg-white">
        <div className="p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
              Lịch Sử Điểm Danh ({filteredAttendance.length})
            </h6>
          </div>

          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn rounded-start-1 ${filterStatus === 'ALL' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'PRESENT' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('PRESENT')}
            >
              Có mặt
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'EXCUSED' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('EXCUSED')}
            >
              Có phép
            </button>
            <button
              type="button"
              className={`btn rounded-end-1 ${filterStatus === 'ABSENT' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('ABSENT')}
            >
              Vắng mặt
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary" style={{ fontSize: '11.5px' }}>
                <th className="py-2 ps-3" style={{ width: '60px' }}>STT</th>
                <th className="py-2">NGÀY HỌC</th>
                <th className="py-2">KHUNG GIỜ</th>
                <th className="py-2">CHỦ ĐỀ BÀI HỌC</th>
                <th className="py-2">PHÒNG</th>
                <th className="py-2">TRẠNG THÁI</th>
                <th className="py-2 text-end pe-3">GHI CHÚ CỦA GV</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Chưa có bản ghi điểm danh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec, idx) => {
                  let statusBadge = (
                    <span className="badge text-bg-success rounded-1 px-2 py-1">
                      Có mặt
                    </span>
                  );
                  if (rec.status === 'EXCUSED') {
                    statusBadge = (
                      <span className="badge text-bg-warning text-dark rounded-1 px-2 py-1">
                        Có phép
                      </span>
                    );
                  } else if (rec.status === 'ABSENT') {
                    statusBadge = (
                      <span className="badge text-bg-danger rounded-1 px-2 py-1">
                        Vắng mặt
                      </span>
                    );
                  }

                  return (
                    <tr key={rec.id}>
                      <td className="ps-3 text-secondary">{idx + 1}</td>
                      <td className="fw-semibold text-dark">
                        {formatDateShort(rec.startTime || rec.recordedAt)}
                      </td>
                      <td className="font-monospace text-secondary">
                        {rec.startTime && rec.endTime ? `${formatTimeShort(rec.startTime)} - ${formatTimeShort(rec.endTime)}` : '—'}
                      </td>
                      <td className="text-dark">
                        {rec.lessonTopic || 'Tiết học theo phân phối chương trình'}
                      </td>
                      <td>
                        <span className="badge text-bg-light border text-dark rounded-1">
                          {rec.room || 'P.Học'}
                        </span>
                      </td>
                      <td>{statusBadge}</td>
                      <td className="text-end pe-3 text-secondary small">
                        {rec.notes || '—'}
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

export default StudentAttendanceView;
