import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ScheduleMonthView from '../admin/schedule/ScheduleMonthView';
import ScheduleWeekView from '../admin/schedule/ScheduleWeekView';
import ScheduleDayView from '../admin/schedule/ScheduleDayView';
import ScheduleDetailModal from './ScheduleDetailModal';

const StudentScheduleView = ({ activeClass }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week' | 'day'
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const fetchSchedules = useCallback(async () => {
    if (!activeClass?.classId) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/users/schedules', {
        params: { classId: activeClass.classId }
      });
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải thời khóa biểu:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClass?.classId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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

  if (!activeClass) {
    return (
      <div className="card border rounded-1 p-4 bg-white text-center">
        <div className="text-secondary small mb-2">Thông báo học vụ</div>
        <h5 className="fw-bold text-dark">Bạn chưa được phân bổ vào lớp học</h5>
        <p className="text-muted small mb-0">
          Vui lòng liên hệ với ban giám hiệu hoặc giáo viên quản trị để được xếp lớp học trước khi tra cứu thời khóa biểu.
        </p>
      </div>
    );
  }

  return (
    <div className="card border rounded-1 bg-white">
      {/* Thanh Header Điều Hướng */}
      <div className="p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="btn-group btn-group-sm" role="group">
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

          <span className="fw-bold text-dark px-1" style={{ fontSize: '15px' }}>
            {getHeaderTitle()}
          </span>

          <span className="badge text-bg-light border text-secondary rounded-1 fw-normal px-2 py-1" style={{ fontSize: '11px' }}>
            Lớp: {activeClass.className}
          </span>
        </div>

        {/* Nút chuyển chế độ xem Tháng / Tuần / Ngày */}
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
            Đang tải dữ liệu thời khóa biểu...
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <ScheduleMonthView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={(s) => setSelectedSchedule(s)}
                onEmptySlotClick={() => {}}
                onScheduleMove={() => {}}
              />
            )}

            {viewMode === 'week' && (
              <ScheduleWeekView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={(s) => setSelectedSchedule(s)}
                onEmptySlotClick={() => {}}
                onScheduleMove={() => {}}
              />
            )}

            {viewMode === 'day' && (
              <ScheduleDayView
                currentDate={currentDate}
                schedules={schedules}
                onScheduleClick={(s) => setSelectedSchedule(s)}
                onEmptySlotClick={() => {}}
                onScheduleMove={() => {}}
              />
            )}
          </>
        )}
      </div>

      {/* Footer ghi chú */}
      <div className="p-3 border-top bg-light text-secondary small d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div style={{ fontSize: '12px' }}>
          💡 Bấm vào một buổi học trên bảng để xem chi tiết thông tin phòng học và giáo viên giảng dạy.
        </div>
        <div className="font-monospace text-muted" style={{ fontSize: '11px' }}>
          Tổng cộng: {schedules.length} buổi học
        </div>
      </div>

      {/* Modal chi tiết buổi học khi bấm vào */}
      {selectedSchedule && (
        <ScheduleDetailModal
          isOpen={Boolean(selectedSchedule)}
          onClose={() => setSelectedSchedule(null)}
          schedule={selectedSchedule}
        />
      )}
    </div>
  );
};

export default StudentScheduleView;
