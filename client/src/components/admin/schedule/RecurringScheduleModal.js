import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DAYS_OF_WEEK = [
  { val: 1, label: 'Thứ 2' },
  { val: 2, label: 'Thứ 3' },
  { val: 3, label: 'Thứ 4' },
  { val: 4, label: 'Thứ 5' },
  { val: 5, label: 'Thứ 6' },
  { val: 6, label: 'Thứ 7' },
  { val: 0, label: 'Chủ Nhật' }
];

const MINUTE_PRESETS = ['00', '15', '30', '45'];

const formatDateForInput = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toISOString().slice(0, 10);
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

const RecurringScheduleModal = ({ isOpen = false, onClose, classes = [], onSuccess }) => {
  // KHAI BÁO TOÀN BỘ HOOKS Ở ĐẦU COMPONENT (Tuân thủ tuyệt đối quy tắc của React)
  const [classId, setClassId] = useState(classes[0]?.classId || '');
  const [daysOfWeek, setDaysOfWeek] = useState([2]); // Mặc định Thứ 3
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [room, setRoom] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [skipConflicts, setSkipConflicts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Khi chọn lớp, tự động điền ngày bắt đầu và kết thúc nếu lớp đã có sẵn
  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(classes[0].classId);
    }
  }, [classes, classId]);

  useEffect(() => {
    const target = classes.find((c) => c.classId === classId);
    if (target) {
      if (target.startDate) {
        setStartDate(formatDateForInput(target.startDate));
      } else {
        setStartDate(formatDateForInput(new Date()));
      }

      if (target.endDate) {
        setEndDate(formatDateForInput(target.endDate));
      } else {
        const next90 = new Date();
        next90.setDate(next90.getDate() + 90);
        setEndDate(formatDateForInput(next90));
      }
    }
  }, [classId, classes]);

  if (!isOpen) return null;

  const selectedClass = classes.find((c) => c.classId === classId);

  const toggleDay = (dayVal) => {
    if (daysOfWeek.includes(dayVal)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== dayVal));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayVal].sort());
    }
  };

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
      const res = await axios.post('/api/users/schedules/recurring', {
        classId,
        daysOfWeek,
        startTime,
        endTime,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        room: room.trim() || undefined,
        lessonTopic: lessonTopic.trim() || undefined,
        skipConflicts,
        clientTzOffset: new Date().getTimezoneOffset() // Đồng bộ múi giờ người dùng
      });

      setLoading(false);
      onSuccess(res.data.message || 'Lập lịch lặp lại thành công.');
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Có lỗi xảy ra khi tạo lịch lặp lại.';
      setError(errMsg);
    }
  };

  const selectedDayLabels = DAYS_OF_WEEK.filter((d) => daysOfWeek.includes(d.val))
    .map((d) => d.label)
    .join(', ');

  const durationText = calculateDurationStr(startTime, endTime);

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-1 border shadow-sm">
          <div className="modal-header border-bottom py-2 px-3 bg-light">
            <h6 className="modal-title fw-bold text-dark mb-0">
              Lập Lịch Lặp Lại Toàn Khóa
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
                  <div className="fw-semibold">Lỗi lập lịch:</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="row g-3">
                {/* Chọn lớp học */}
                <div className="col-md-6">
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
                    Giáo viên đứng lớp:{' '}
                    <strong>
                      {selectedClass?.homeroomTeacher?.teacherName ||
                        selectedClass?.homeroomTeacherName ||
                        'Chưa phân công'}
                    </strong>
                  </div>
                </div>

                {/* Phòng học */}
                <div className="col-md-6">
                  <label className="form-label small text-secondary mb-1">
                    Phòng học <span className="text-muted fw-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Ví dụ: P.201, Hội trường A..."
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>

                {/* Chọn các thứ trong tuần */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Các ngày học trong tuần <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = daysOfWeek.includes(day.val);
                      return (
                        <button
                          key={day.val}
                          type="button"
                          onClick={() => toggleDay(day.val)}
                          className={`btn btn-sm rounded-1 px-3 py-1 ${
                            isSelected
                              ? 'btn-dark text-white fw-semibold'
                              : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: '13px' }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-secondary mt-1" style={{ fontSize: '11px' }}>
                    Có thể chọn một hoặc nhiều thứ trong tuần (ví dụ: Thứ 3 và Thứ 5).
                  </div>
                </div>

                {/* Khung giờ học với hỗ trợ thời gian lẻ tiện lợi */}
                <div className="col-md-3">
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

                <div className="col-md-3">
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

                {/* Khoảng ngày lặp */}
                <div className="col-md-3">
                  <label className="form-label small text-secondary mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-1 font-monospace"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small text-secondary mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-1 font-monospace"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Hiển thị thời lượng ca học */}
                <div className="col-12 mt-0">
                  <div className="small font-monospace text-primary fw-semibold" style={{ fontSize: '11px' }}>
                    {durationText}
                  </div>
                </div>

                {/* Chủ đề bài học */}
                <div className="col-12">
                  <label className="form-label small text-secondary mb-1">
                    Tiết học / Chủ đề định kỳ <span className="text-muted fw-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Ví dụ: Tiết học chính khóa, Chuyên đề ôn tập..."
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                  />
                </div>

                {/* Tùy chọn xử lý trùng lịch */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input rounded-1"
                      type="checkbox"
                      id="skipConflictsCheck"
                      checked={skipConflicts}
                      onChange={(e) => setSkipConflicts(e.target.checked)}
                    />
                    <label
                      className="form-check-label small text-dark"
                      htmlFor="skipConflictsCheck"
                    >
                      Tự động bỏ qua các buổi bị trùng lịch và tạo các buổi còn lại
                    </label>
                  </div>
                  <div className="text-secondary small ps-4" style={{ fontSize: '11px' }}>
                    Quy tắc không trùng: Lớp không trùng giờ và Giáo viên không trùng lịch dạy. Hỗ trợ đầy đủ các ca giờ lẻ (như 07:15 - 08:45).
                  </div>
                </div>

                {/* Box tóm tắt kế hoạch tạo lịch */}
                <div className="col-12">
                  <div className="p-2 border rounded-1 bg-light small text-secondary">
                    <div className="fw-semibold text-dark mb-1">Tóm tắt thiết lập:</div>
                    Lớp: <strong>{selectedClass?.className || '...'}</strong> | Ngày học:{' '}
                    <strong>{selectedDayLabels || 'Chưa chọn'}</strong> | Khung giờ:{' '}
                    <strong className="font-monospace">
                      {startTime} - {endTime}
                    </strong>{' '}
                    | Khoảng thời gian: <strong className="font-monospace">{startDate || '...'}</strong> →{' '}
                    <strong className="font-monospace">{endDate || '...'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top py-2 px-3 bg-light">
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
                {loading ? 'Đang tạo lịch...' : 'Bắt đầu tạo lịch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecurringScheduleModal;
