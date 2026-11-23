import React from 'react';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
};

const ScheduleDetailModal = ({ isOpen, onClose, schedule }) => {
  if (!isOpen || !schedule) return null;

  const start = formatDateTime(schedule.startTime);
  const end = formatDateTime(schedule.endTime);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border rounded-1 shadow-sm">
          <div className="modal-header py-2 px-3 bg-light border-bottom">
            <h6 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
              Chi Tiết Buổi Học
            </h6>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              style={{ fontSize: '11px' }}
            />
          </div>

          <div className="modal-body p-3">
            <div className="mb-3">
              <span className="badge text-bg-dark rounded-1 me-2 px-2 py-1" style={{ fontSize: '11px' }}>
                {schedule.className || schedule.classId}
              </span>
              {schedule.grade && (
                <span className="badge text-bg-light border text-secondary rounded-1 px-2 py-1" style={{ fontSize: '11px' }}>
                  {schedule.grade}
                </span>
              )}
            </div>

            <div className="mb-3">
              <label className="text-secondary small fw-semibold d-block mb-1" style={{ fontSize: '11px' }}>
                CHỦ ĐỀ BÀI HỌC
              </label>
              <div className="fw-semibold text-dark fs-6">
                {schedule.lessonTopic || 'Chưa cập nhật chủ đề bài học'}
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="p-2 border rounded-1 bg-light">
                  <div className="text-secondary small fw-semibold" style={{ fontSize: '10px' }}>
                    THỜI GIAN
                  </div>
                  <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                    {start.time} - {end.time}
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    {start.date}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded-1 bg-light">
                  <div className="text-secondary small fw-semibold" style={{ fontSize: '10px' }}>
                    PHÒNG HỌC
                  </div>
                  <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                    {schedule.room || 'Chưa xếp phòng'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    Khu vực học trực tiếp
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-secondary small fw-semibold d-block mb-1" style={{ fontSize: '11px' }}>
                GIÁO VIÊN PHỤ TRÁCH
              </label>
              <div className="text-dark small" style={{ fontSize: '13px' }}>
                {schedule.homeroomTeacherName ? (
                  <span>👨‍🏫 {schedule.homeroomTeacherName}</span>
                ) : (
                  <span className="text-muted">Chưa phân công giáo viên</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 px-3 border-top bg-light">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-1 px-3"
              onClick={onClose}
              style={{ fontSize: '12px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal;
