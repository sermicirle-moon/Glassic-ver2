import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RecurringScheduleModal from './schedule/RecurringScheduleModal';
import SingleScheduleModal from './schedule/SingleScheduleModal';
import ScheduleMonthView from './schedule/ScheduleMonthView';
import ScheduleWeekView from './schedule/ScheduleWeekView';
import ScheduleDayView from './schedule/ScheduleDayView';

const ScheduleManagementView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week' | 'day'

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [prefillSlot, setPrefillSlot] = useState(null);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Tải danh sách lớp và giáo viên để dùng cho bộ lọc và modal
  const fetchMetadata = async () => {
    try {
      const [classesRes, teachersRes] = await Promise.all([
        axios.get('/api/users/classes'),
        axios.get('/api/users/teachers')
      ]);
      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err) {
      console.error('Lỗi khi tải metadata:', err);
    }
  };

  // Tải lịch học từ API theo các bộ lọc
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedTeacherId) params.teacherId = selectedTeacherId;

      const res = await axios.get('/api/users/schedules', { params });
      setSchedules(res.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('Lỗi khi tải lịch học:', err);
      showNotification('Không thể tải dữ liệu lịch học.', 'danger');
    }
  }, [selectedClassId, selectedTeacherId]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Điều hướng thời gian (Trước / Hôm nay / Sau)
  const handleNavigate = (direction) => {
    const next = new Date(currentDate);
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const step = direction === 'next' ? 1 : -1;
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + step);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + step * 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + step);
    }
    setCurrentDate(next);
  };

  // Format tiêu đề thời gian theo chế độ xem
  const getHeaderTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    if (viewMode === 'month') {
      return `Tháng ${month}, ${year}`;
    }
    if (viewMode === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), diff);
      const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);

      const pad = (n) => String(n).padStart(2, '0');
      const startStr = `${pad(startOfWeek.getDate())}/${pad(startOfWeek.getMonth() + 1)}`;
      const endStr = `${pad(endOfWeek.getDate())}/${pad(endOfWeek.getMonth() + 1)}/${endOfWeek.getFullYear()}`;
      return `Tuần: ${startStr} - ${endStr}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return '';
  };

  // Xử lý kéo thả buổi học (Drag and drop)
  const handleScheduleMove = async (schedule, targetDate, targetHour) => {
    const origStart = new Date(schedule.startTime);
    const origEnd = new Date(schedule.endTime);
    const durationMs = origEnd.getTime() - origStart.getTime();

    let newStart;
    if (targetHour !== undefined && targetHour !== null) {
      newStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        targetHour,
        origStart.getMinutes(),
        0,
        0
      );
    } else {
      newStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        origStart.getHours(),
        origStart.getMinutes(),
        0,
        0
      );
    }

    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      const res = await axios.put(`/api/users/schedules/${schedule.scheduleId}`, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString()
      });

      // Cập nhật state danh sách ngay lập tức
      setSchedules((prev) =>
        prev.map((s) => (s.scheduleId === schedule.scheduleId ? res.data : s))
      );

      showNotification(
        `Đã chuyển lịch lớp ${schedule.className} sang ${newStart.toLocaleDateString('vi-VN')} (${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}).`
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Không thể dời lịch học do xung đột trùng lịch.';
      showNotification(errMsg, 'danger');
    }
  };

  // Mở modal sửa khi click vào buổi học
  const handleScheduleClick = (schedule) => {
    setEditingSchedule(schedule);
    setPrefillSlot(null);
    setIsSingleModalOpen(true);
  };

  // Mở modal tạo mới khi click vào ô trống
  const handleEmptySlotClick = ({ date, startTime, endTime }) => {
    setEditingSchedule(null);
    setPrefillSlot({
      classId: selectedClassId || classes[0]?.classId || '',
      date,
      startTime: startTime || '07:00',
      endTime: endTime || '09:00'
    });
    setIsSingleModalOpen(true);
  };

  return (
    <div className="card border rounded-1 bg-white">
      {/* Thanh tiêu đề và các nút thao tác chính */}
      <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h5 className="fw-bold text-dark mb-1">Quản Lý Lịch Học Các Lớp</h5>
          <div className="text-secondary small">
            Hỗ trợ lập lịch tự động lặp lại theo khóa, tạo thủ công, kéo thả dời lịch linh hoạt và kiểm tra trùng lớp / giáo viên.
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsRecurringModalOpen(true)}
            className="btn btn-dark btn-sm rounded-1 px-3 fw-semibold"
          >
            Lập Lịch Lặp Lại
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingSchedule(null);
              setPrefillSlot(null);
              setIsSingleModalOpen(true);
            }}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            + Thêm Lịch Thủ Công
          </button>
        </div>
      </div>

      {/* Thông báo thông tin (Toast / Alert) */}
      {notification && (
        <div
          className={`alert alert-${notification.type} rounded-0 border-0 border-bottom py-2 px-3 small mb-0 d-flex justify-content-between align-items-center`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            className="btn-close btn-close-sm"
            aria-label="Close"
            onClick={() => setNotification(null)}
          ></button>
        </div>
      )}

      {/* Thanh điều khiển Calendar: Bộ lọc + Chuyển chế độ xem + Điều hướng */}
      <div className="p-3 border-bottom bg-light d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
        {/* Bộ lọc: Lớp học & Giáo viên */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <select
            className="form-select form-select-sm rounded-1"
            style={{ width: '180px' }}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.className} ({c.grade})
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm rounded-1"
            style={{ width: '180px' }}
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map((t) => (
              <option key={t.teacherId} value={t.teacherId}>
                {t.teacherName}
              </option>
            ))}
          </select>

          {(selectedClassId || selectedTeacherId) && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassId('');
                setSelectedTeacherId('');
              }}
              className="btn btn-outline-secondary btn-sm rounded-1 px-2"
              style={{ fontSize: '12px' }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Khu vực tiêu đề ngày tháng & Điều hướng */}
        <div className="d-flex align-items-center justify-content-center gap-2">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-start-1"
              onClick={() => handleNavigate('prev')}
              title="Kỳ trước"
            >
              &lt;
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => handleNavigate('today')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-end-1"
              onClick={() => handleNavigate('next')}
              title="Kỳ sau"
            >
              &gt;
            </button>
          </div>

          <span className="fw-bold text-dark px-2" style={{ fontSize: '15px' }}>
            {getHeaderTitle()}
          </span>
        </div>

        {/* Chuyển đổi View: Tháng / Tuần / Ngày */}
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn rounded-start-1 ${
                viewMode === 'month' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode('month')}
            >
              Tháng
            </button>
            <button
              type="button"
              className={`btn ${
                viewMode === 'week' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode('week')}
            >
              Tuần
            </button>
            <button
              type="button"
              className={`btn rounded-end-1 ${
                viewMode === 'day' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode('day')}
            >
              Ngày
            </button>
          </div>
        </div>
      </div>

      {/* Vùng hiển thị Lịch tương ứng chế độ xem */}
      <div className="p-3">
        {loading ? (
          <div className="py-5 text-center text-secondary small">
            Đang tải dữ liệu lịch học...
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <ScheduleMonthView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={handleScheduleClick}
                onEmptySlotClick={handleEmptySlotClick}
                onScheduleMove={handleScheduleMove}
              />
            )}

            {viewMode === 'week' && (
              <ScheduleWeekView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={handleScheduleClick}
                onEmptySlotClick={handleEmptySlotClick}
                onScheduleMove={handleScheduleMove}
              />
            )}

            {viewMode === 'day' && (
              <ScheduleDayView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={handleScheduleClick}
                onEmptySlotClick={handleEmptySlotClick}
                onScheduleMove={handleScheduleMove}
              />
            )}
          </>
        )}
      </div>

      {/* Chú thích hướng dẫn thao tác ở footer */}
      <div className="p-3 border-top bg-light text-secondary small d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div style={{ fontSize: '12px' }}>
          Mẹo thao tác: <strong>Kéo thả</strong> thẻ buổi học sang ô khác để dời ngày/giờ. <strong>Bấm vào</strong> buổi học để sửa hoặc xóa. <strong>Bấm vào ô trống</strong> để tạo lịch nhanh.
        </div>
        <div className="font-monospace" style={{ fontSize: '11px' }}>
          Tổng cộng: {schedules.length} buổi học
        </div>
      </div>

      {/* Modal lập lịch lặp lại */}
      {isRecurringModalOpen && (
        <RecurringScheduleModal
          isOpen={isRecurringModalOpen}
          onClose={() => setIsRecurringModalOpen(false)}
          classes={classes}
          onSuccess={(msg) => {
            showNotification(msg, 'success');
            fetchSchedules();
          }}
        />
      )}

      {/* Modal tạo / sửa lịch đơn lẻ */}
      {isSingleModalOpen && (
        <SingleScheduleModal
          isOpen={isSingleModalOpen}
          onClose={() => {
            setIsSingleModalOpen(false);
            setEditingSchedule(null);
            setPrefillSlot(null);
          }}
          classes={classes}
          schedule={editingSchedule}
          prefill={prefillSlot}
          onSuccess={(msg) => {
            showNotification(msg, 'success');
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
};

export default ScheduleManagementView;

