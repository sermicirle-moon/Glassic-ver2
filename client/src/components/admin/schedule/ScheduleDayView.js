import React, { useState } from 'react';
import {
  getClassTheme,
  formatTimeShort,
  formatDuration,
  layoutDayEvents,
  pad
} from './scheduleTheme';

const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_HEIGHT = 68; // Chiều cao mỗi giờ trong ngày
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const toDateKey = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const ScheduleDayView = ({
  currentDate,
  schedules = [],
  onScheduleClick,
  onEmptySlotClick,
  onScheduleMove
}) => {
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [dragOverHour, setDragOverHour] = useState(null);

  const dateKey = toDateKey(currentDate);

  // Lọc tất cả các buổi học trong ngày hiện tại
  const dayRawEvents = schedules.filter((s) => {
    return toDateKey(new Date(s.startTime)) === dateKey;
  });

  // Áp dụng thuật toán layout khối liên tục chuẩn xác theo mốc giờ bắt đầu và kết thúc
  const laidOutEvents = layoutDayEvents(dayRawEvents, START_HOUR, HOUR_HEIGHT);

  const handleDragStart = (e, s) => {
    e.stopPropagation();
    setDraggedSchedule(s);
    e.dataTransfer.setData('text/plain', String(s.scheduleId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, hour) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHour !== hour) {
      setDragOverHour(hour);
    }
  };

  const handleDrop = (e, targetHour) => {
    e.preventDefault();
    setDragOverHour(null);
    if (!draggedSchedule) return;

    onScheduleMove(draggedSchedule, currentDate, targetHour);
    setDraggedSchedule(null);
  };

  return (
    <div
      className="border rounded-1 bg-white overflow-auto shadow-sm"
      style={{ maxHeight: '760px', borderColor: '#e2e8f0' }}
    >
      {/* Header ngày */}
      <div
        className="p-3 border-bottom d-flex justify-content-between align-items-center"
        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
      >
        <div>
          <span className="fw-bold text-dark me-2" style={{ fontSize: '14px' }}>
            Lịch học trong ngày:
          </span>
          <span className="text-secondary small font-monospace">
            {currentDate.toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="small text-secondary">
          Tổng số ca học:{' '}
          <span className="badge bg-dark text-white rounded-1 ms-1">
            {dayRawEvents.length}
          </span>
        </div>
      </div>

      {/* Dòng thời gian liên tục */}
      <div
        className="d-flex position-relative"
        style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
      >
        {/* Cột hiển thị mốc giờ bên trái */}
        <div
          className="border-end bg-light d-flex flex-column"
          style={{ width: '84px', borderColor: '#e2e8f0' }}
        >
          {HOURS.map((hour) => (
            <div
              key={`day-label-${hour}`}
              className="text-secondary small font-monospace d-flex align-items-start justify-content-center pt-1 border-bottom"
              style={{
                height: `${HOUR_HEIGHT}px`,
                fontSize: '12px',
                borderColor: '#e2e8f0'
              }}
            >
              {pad(hour)}:00
            </div>
          ))}
        </div>

        {/* Khu vực hiển thị lưới và các khối ca học liên tục */}
        <div className="flex-grow-1 position-relative bg-white">
          {/* Lưới các ô giờ làm nền cho sự kiện click và drop */}
          {HOURS.map((hour) => {
            const isOver = dragOverHour === hour;

            return (
              <div
                key={`day-slot-${hour}`}
                className="border-bottom position-relative"
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  borderColor: '#f1f5f9',
                  backgroundColor: isOver ? '#eff6ff' : 'transparent',
                  cursor: 'pointer'
                }}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={() => setDragOverHour(null)}
                onDrop={(e) => handleDrop(e, hour)}
                onClick={() =>
                  onEmptySlotClick({
                    date: dateKey,
                    startTime: `${pad(hour)}:00`,
                    endTime: `${pad(Math.min(hour + 2, 23))}:00`
                  })
                }
                title={`Bấm để thêm ca học lúc ${pad(hour)}:00`}
              >
                {/* Vạch kẻ nửa giờ mờ (30 phút) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    borderTop: '1px dashed #f1f5f9',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            );
          })}

          {/* Render CÁC KHỐI CA HỌC LIÊN TỤC TRẢI DÀI CHÍNH XÁC (ví dụ 8h30 - 10h15 là 1 khối duy nhất) */}
          {laidOutEvents.map((s) => {
            const theme = getClassTheme(s.classId);
            const durationStr = formatDuration(s.startTime, s.endTime);
            const isShort = s.height < 56;

            return (
              <div
                key={s.scheduleId}
                draggable
                onDragStart={(e) => handleDragStart(e, s)}
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleClick(s);
                }}
                className="rounded-1 text-start p-2.5 shadow-sm"
                style={{
                  position: 'absolute',
                  top: `${Math.max(s.top, 0)}px`,
                  height: `${s.height}px`,
                  left: `calc(${s.leftPercent}% + 4px)`,
                  width: `calc(${s.widthPercent}% - 8px)`,
                  backgroundColor: theme.bg,
                  borderLeft: `4px solid ${theme.border}`,
                  borderTop: `1px solid ${theme.border}35`,
                  borderRight: `1px solid ${theme.border}35`,
                  borderBottom: `1px solid ${theme.border}35`,
                  color: theme.text,
                  zIndex: 3,
                  cursor: 'grab',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                }}
                title={`Lớp: ${s.className}\nKhung giờ: ${formatTimeShort(s.startTime)} - ${formatTimeShort(s.endTime)} (${durationStr})\nGiáo viên: ${s.homeroomTeacherName || 'Chưa gán'}\nPhòng: ${s.room || 'Chưa xếp'}\nKéo thả để dời giờ. Bấm để sửa hoặc xóa.`}
              >
                {/* Tiêu đề lớp và huy hiệu thời gian chính xác */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold" style={{ fontSize: '13px' }}>
                    {s.className}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-1 font-monospace fw-semibold"
                    style={{
                      fontSize: '11px',
                      backgroundColor: theme.timeBg,
                      color: theme.timeText,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatTimeShort(s.startTime)} - {formatTimeShort(s.endTime)}
                  </span>
                </div>

                {/* Thông tin chi tiết giáo viên, phòng học và thời lượng */}
                {!isShort && (
                  <div className="small" style={{ fontSize: '11.5px', opacity: 0.9 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        GV: <strong>{s.homeroomTeacherName || 'Chưa phân công'}</strong>
                        {s.room && (
                          <span className="ms-2">
                            | Phòng: <strong>{s.room}</strong>
                          </span>
                        )}
                      </span>
                      {durationStr && (
                        <span className="font-monospace text-secondary opacity-75">
                          {durationStr}
                        </span>
                      )}
                    </div>

                    {/* Chủ đề bài học nếu ca học đủ dài */}
                    {s.height >= 90 && s.lessonTopic && (
                      <div className="text-truncate mt-1 fst-italic" style={{ opacity: '0.85' }}>
                        Chủ đề: {s.lessonTopic}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDayView;
