import React, { useState } from 'react';
import { getClassTheme, formatTimeShort, formatDuration, pad } from './scheduleTheme';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const toDateKey = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const ScheduleMonthView = ({
  currentDate,
  schedules = [],
  onScheduleClick,
  onEmptySlotClick,
  onScheduleMove
}) => {
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDayOffset = (firstDay.getDay() + 6) % 7; // 0 = Thứ 2, 6 = Chủ Nhật

  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Các ngày của tháng trước (padding đầu)
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthTotalDays - i);
    calendarDays.push({
      date: d,
      dateKey: toDateKey(d),
      dayNumber: prevMonthTotalDays - i,
      isCurrentMonth: false
    });
  }

  // Các ngày của tháng hiện tại
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    calendarDays.push({
      date: dateObj,
      dateKey: toDateKey(dateObj),
      dayNumber: d,
      isCurrentMonth: true,
      isToday: toDateKey(dateObj) === toDateKey(new Date())
    });
  }

  // Các ngày của tháng sau (padding đuôi để tròn hàng 7 cột)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const dateObj = new Date(year, month + 1, d);
      calendarDays.push({
        date: dateObj,
        dateKey: toDateKey(dateObj),
        dayNumber: d,
        isCurrentMonth: false
      });
    }
  }

  // Gom nhóm schedules theo dateKey
  const schedulesByDate = schedules.reduce((acc, s) => {
    const key = toDateKey(new Date(s.startTime));
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const handleDragStart = (e, s) => {
    e.stopPropagation();
    setDraggedSchedule(s);
    e.dataTransfer.setData('text/plain', String(s.scheduleId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dateKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== dateKey) {
      setDragOverKey(dateKey);
    }
  };

  const handleDrop = (e, cellDate) => {
    e.preventDefault();
    setDragOverKey(null);
    if (!draggedSchedule) return;
    onScheduleMove(draggedSchedule, cellDate);
    setDraggedSchedule(null);
  };

  return (
    <div className="border rounded-1 bg-white overflow-hidden shadow-sm" style={{ borderColor: '#e2e8f0' }}>
      {/* Header thứ trong tuần */}
      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEKDAYS.map((name, idx) => (
          <div
            key={name}
            className={`py-2 px-1 text-center small fw-semibold border-bottom ${
              idx > 4 ? 'bg-light text-secondary' : 'bg-white text-dark'
            } ${idx < 6 ? 'border-end' : ''}`}
            style={{ fontSize: '12px', borderColor: '#e2e8f0' }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Lưới các ô ngày */}
      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {calendarDays.map((cell, idx) => {
          const daySchedules = schedulesByDate[cell.dateKey] || [];
          const isOver = dragOverKey === cell.dateKey;

          return (
            <div
              key={cell.dateKey}
              onDragOver={(e) => handleDragOver(e, cell.dateKey)}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => handleDrop(e, cell.date)}
              onClick={() => onEmptySlotClick({ date: cell.dateKey })}
              className={`p-1 border-bottom ${idx % 7 < 6 ? 'border-end' : ''}`}
              style={{
                minHeight: '120px',
                cursor: 'pointer',
                borderColor: '#e2e8f0',
                backgroundColor: isOver
                  ? '#eff6ff'
                  : cell.isToday
                  ? '#f8fafc'
                  : !cell.isCurrentMonth
                  ? '#f8f9fa'
                  : '#ffffff',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                <span
                  className={`small ${
                    cell.isToday
                      ? 'badge bg-dark text-white rounded-1 fw-bold px-1'
                      : cell.isCurrentMonth
                      ? 'fw-bold text-dark'
                      : 'text-secondary opacity-75'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {cell.dayNumber}
                </span>

                <span
                  className="text-secondary small fw-bold"
                  style={{ fontSize: '12px', opacity: 0.5 }}
                  title="Bấm để tạo buổi học"
                >
                  +
                </span>
              </div>

              {/* Danh sách các buổi học trong ngày với màu sắc hiện đại */}
              <div className="d-flex flex-column gap-1">
                {daySchedules.map((s) => {
                  const theme = getClassTheme(s.classId);

                  return (
                    <div
                      key={s.scheduleId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, s)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick(s);
                      }}
                      className="p-1 rounded-1 text-start"
                      style={{
                        backgroundColor: theme.bg,
                        borderLeft: `3px solid ${theme.border}`,
                        borderTop: `1px solid ${theme.border}25`,
                        borderRight: `1px solid ${theme.border}25`,
                        borderBottom: `1px solid ${theme.border}25`,
                        color: theme.text,
                        cursor: 'grab',
                        lineHeight: '1.25',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                      title={`Bấm để sửa/xóa. Kéo thả để dời ngày.\nLớp: ${s.className}\nKhung giờ: ${formatTimeShort(s.startTime)} - ${formatTimeShort(s.endTime)}\nGiáo viên: ${s.homeroomTeacherName || 'Chưa gán'}\nPhòng: ${s.room || 'Chưa xếp'}`}
                    >
                      <div className="d-flex justify-content-between align-items-center gap-1">
                        <span className="fw-bold text-truncate" style={{ fontSize: '11px' }}>
                          {s.className}
                        </span>
                        <span
                          className="px-1 rounded-1 font-monospace fw-semibold"
                          style={{
                            fontSize: '9.5px',
                            backgroundColor: theme.timeBg,
                            color: theme.timeText,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatTimeShort(s.startTime)} - {formatTimeShort(s.endTime)}
                        </span>
                      </div>

                      {(s.room || s.homeroomTeacherName) && (
                        <div
                          className="text-truncate mt-1"
                          style={{ fontSize: '10px', opacity: 0.85 }}
                        >
                          {s.room ? `P.${s.room}` : ''}
                          {s.room && s.homeroomTeacherName ? ' | ' : ''}
                          {s.homeroomTeacherName ? s.homeroomTeacherName : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleMonthView;
