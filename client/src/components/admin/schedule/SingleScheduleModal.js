import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MINUTE_PRESETS = ['00', '15', '30', '45'];

const formatDateForInput = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  } catch (e) {
    return '';
  }
};

const formatTimeForInput = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch (e) {
    return '';
  }
};

const calculateDurationStr = (start, end) => {
  if (!start || !end) return '';
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const diffMinutes = eH * 60 + eM - (sH * 60 + sM);
  if (diffMinutes <= 0) return 'Giờ kết thúc phải sau giờ bắt đầu';
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `Thời lượng ca: ${hours > 0 ? `${hours} giờ ` : ''}${mins > 0 ? `${mins} phút ` : ''}(tổng ${diffMinutes} phút)`;
};

const SingleScheduleModal = ({
  isOpen = false,
  onClose,
  classes = [],
  schedule = null, // null nếu là tạo mới, object nếu là sửa
  prefill = null,  // { classId, date, startTime, endTime }
  onSuccess
}) => {
  // KHAI BÁO TOÀN BỘ HOOKS Ở ĐẦU COMPONENT
  const isEditing = Boolean(schedule);

  const [classId, setClassId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing && schedule) {
      setClassId(schedule.classId || '');
      setDate(formatDateForInput(schedule.startTime));
      setStartTime(formatTimeForInput(schedule.startTime));
      setEndTime(formatTimeForInput(schedule.endTime));
      setRoom(schedule.room || '');
      setLessonTopic(schedule.lessonTopic || '');
    } else if (prefill) {
      setClassId(prefill.classId || classes[0]?.classId || '');
      setDate(prefill.date || formatDateForInput(new Date()));
      setStartTime(prefill.startTime || '07:00');
      setEndTime(prefill.endTime || '09:00');
      setRoom('');
      setLessonTopic('');
    } else {
      setClassId(classes[0]?.classId || '');
      setDate(formatDateForInput(new Date()));
      setStartTime('07:00');
      setEndTime('09:00');
      setRoom('');
      setLessonTopic('');
    }
  }, [schedule, prefill, isEditing, classes]);

  if (!isOpen) return null;

  const selectedClass = classes.find((c) => c.classId === classId);

  const setStartMinute = (mStr) => {
    const [h] = startTime.split(':');
    setStartTime(`${h || '07'}:${mStr}`);
  };

  const setEndMinute = (mStr) => {
    const [h] = endTime.split(':');
    setEndTime(`${h || '09'}:${mStr}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Ghép date và time thành ISO string chuẩn dựa trên local timezone của browser
      const [year, month, day] = date.split('-').map(Number);
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, sH, sM, 0, 0);
      const endDateTime = new Date(year, month - 1, day, eH, eM, 0, 0);

      if (startDateTime >= endDateTime) {
        setError('Thời gian bắt đầu phải trước thời gian kết thúc');
        setLoading(false);
        return;
      }

      if (isEditing) {
        await axios.put(`/api/users/schedules/${schedule.scheduleId}`, {
          classId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          room: room.trim() || null,
          lessonTopic: lessonTopic.trim() || null
        });
        onSuccess('Đã cập nhật buổi học thành công.');
      } else {
        await axios.post('/api/users/schedules', {
          classId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          room: room.trim() || undefined,
          lessonTopic: lessonTopic.trim() || undefined
        });
        onSuccess('Đã tạo buổi học mới thành công.');
      }

      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Có lỗi xảy ra khi lưu lịch học.';
      setError(errMsg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi học này không?')) return;

    setError(null);
    setLoading(true);
    try {
      await axios.delete(`/api/users/schedules/${schedule.scheduleId}`);
      setLoading(false);
      onSuccess('Đã xóa buổi học thành công.');
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Không thể xóa buổi học.';
      setError(errMsg);
    }
  };

  const durationText = calculateDurationStr(startTime, endTime);

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-1 border shadow-sm">
          <div className="modal-header border-bottom py-2 px-3 bg-light">
            <h6 className="modal-title fw-bold text-dark mb-0">
              {isEditing ? 'Chi Tiết / Chỉnh Sửa Buổi Học' : 'Thêm Buổi Học Đơn Lẻ'}
            </h6>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && (
                <div className="alert alert-danger rounded-1 py-2 px-3 small mb-3">
                  <div className="fw-semibold">Lỗi:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="row g-3">
                {/* Lớp học */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Lớp học <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm rounded-1"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.grade})
                      </option>
                    ))}
                  </select>
                  <div className="text-secondary mt-1" style={{ fontSize: '12px' }}>
                    Giáo viên phụ trách:{' '}
                    <strong>
                      {selectedClass?.homeroomTeacher?.teacherName ||
                        selectedClass?.homeroomTeacherName ||
                        'Chưa phân công'}
                    </strong>
                  </div>
                </div>

                {/* Ngày học */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Ngày học <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-1 font-monospace"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Giờ bắt đầu & kết thúc hỗ trợ giờ lẻ */}
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">
                    Giờ bắt đầu <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    step="300"
                    className="form-control form-control-sm rounded-1 font-monospace"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                  <div className="d-flex gap-1 mt-1">
                    <span className="text-secondary" style={{ fontSize: '10px' }}>Phút lẻ:</span>
                    {MINUTE_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setStartMinute(m)}
                        className={`btn btn-link p-0 text-decoration-none font-monospace ${
                          startTime.endsWith(`:${m}`) ? 'fw-bold text-dark' : 'text-secondary'
                        }`}
                        style={{ fontSize: '10.5px' }}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">
                    Giờ kết thúc <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    step="300"
                    className="form-control form-control-sm rounded-1 font-monospace"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                  <div className="d-flex gap-1 mt-1">
                    <span className="text-secondary" style={{ fontSize: '10px' }}>Phút lẻ:</span>
                    {MINUTE_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEndMinute(m)}
                        className={`btn btn-link p-0 text-decoration-none font-monospace ${
                          endTime.endsWith(`:${m}`) ? 'fw-bold text-dark' : 'text-secondary'
                        }`}
                        style={{ fontSize: '10.5px' }}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hiển thị thời lượng */}
                <div className="col-12 mt-0">
                  <div className="small font-monospace text-primary fw-semibold" style={{ fontSize: '11px' }}>
                    {durationText}
                  </div>
                </div>

                {/* Phòng học */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Phòng học <span className="text-muted fw-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Ví dụ: P.102, Phòng thí nghiệm..."
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>

                {/* Chủ đề bài học */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Chủ đề bài học / Ghi chú <span className="text-muted fw-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Ví dụ: Đại số chương 2, Kiểm tra 15 phút..."
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top py-2 px-3 bg-light d-flex justify-content-between">
              <div>
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-1 px-3"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Xóa buổi học
                  </button>
                )}
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-1 px-3"
                  onClick={onClose}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-dark btn-sm rounded-1 px-4 fw-semibold"
                  disabled={loading}
                >
                  {loading
                    ? 'Đang lưu...'
                    : isEditing
                    ? 'Lưu thay đổi'
                    : 'Thêm buổi học'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SingleScheduleModal;
