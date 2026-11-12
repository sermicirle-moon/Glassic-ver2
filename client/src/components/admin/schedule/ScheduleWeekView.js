import React, { useState } from 'react';
import {
  getClassTheme,
  formatTimeShort,
  formatDuration,
  layoutDayEvents,
  pad
} from './scheduleTheme';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_HEIGHT = 64; // Mỗi 1 giờ cao 64px (khoảng ~1.06px / phút)
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const toDateKey = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

const ScheduleWeekView = ({
  currentDate,
  schedules = [],
  onScheduleClick,
  onEmptySlotClick,
  onScheduleMove
}) => {
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null); // 'YYYY-MM-DD-HH'

  const monday = getMonday(currentDate);

  // Tạo 7 ngày trong tuần
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      date: d,
      dateKey: toDateKey(d),
      dayLabel: WEEKDAYS[i],
      dateNumberStr: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
      isToday: toDateKey(d) === toDateKey(new Date())
    };
  });

  const handleDragStart = (e, s) => {
    e.stopPropagation();
    setDraggedSchedule(s);
    e.dataTransfer.setData('text/plain', String(s.scheduleId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, cellKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCell !== cellKey) {
      setDragOverCell(cellKey);
    }
  };

  const handleDrop = (e, targetDate, targetHour) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedSchedule) return;

    onScheduleMove(draggedSchedule, targetDate, targetHour);
    setDraggedSchedule(null);
  };

  return (
    <div
      className="border rounded-1 bg-white overflow-auto shadow-sm"
      style={{ maxHeight: '760px', borderColor: '#e2e8f0' }}
    >
      {/* Header thứ và ngày trong tuần (Sticky ở trên) */}
      <div
        className="d-grid sticky-top bg-white border-bottom shadow-sm"
        style={{
          gridTemplateColumns: '64px repeat(7, 1fr)',
          borderColor: '#e2e8f0',
          zIndex: 10
        }}
      >
        <div
          className="p-2 text-center text-secondary small fw-semibold border-end bg-light font-monospace d-flex align-items-center justify-content-center"
          style={{ fontSize: '11px', borderColor: '#e2e8f0' }}
        >
          Giờ
        </div>
        {weekDays.map((day) => (
          <div
            key={day.dateKey}
            className={`p-2 text-center small border-end ${
              day.isToday ? 'bg-light text-dark fw-bold' : 'text-dark'
            }`}
            style={{
              borderColor: '#e2e8f0',
              backgroundColor: day.isToday ? '#f8fafc' : '#ffffff'
            }}
          >
            <div className="fw-semibold text-secondary" style={{ fontSize: '11.5px' }}>
              {day.dayLabel}
            </div>
            <div className="mt-1">
              <span
                className={`font-monospace px-2 py-0.5 rounded-1 ${
                  day.isToday
                    ? 'badge bg-dark text-white fw-bold'
                    : 'text-dark fw-semibold'
                }`}
                style={{ fontSize: '12px' }}
              >
                {day.dateNumberStr}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Thân Calendar theo dòng thời gian liên tục */}
      <div
        className="d-grid position-relative"
        style={{
          gridTemplateColumns: '64px repeat(7, 1fr)',
          height: `${HOURS.length * HOUR_HEIGHT}px`
        }}
      >
        {/* Cột mốc giờ bên trái */}
        <div
          className="border-end bg-light d-flex flex-column"
          style={{ borderColor: '#e2e8f0' }}
        >
          {HOURS.map((hour) => (
            <div
              key={`label-${hour}`}
              className="text-secondary small font-monospace d-flex align-items-start justify-content-center pt-1 border-bottom"
              style={{
                height: `${HOUR_HEIGHT}px`,
                fontSize: '11px',
                borderColor: '#e2e8f0'
              }}
            >
              {pad(hour)}:00
            </div>
          ))}
        </div>

        {/* 7 cột ứng với 7 ngày trong tuần */}
        {weekDays.map((day) => {
          // Lọc tất cả lịch học của ngày này
          const dayRawEvents = schedules.filter(
            (s) => toDateKey(new Date(s.startTime)) === day.dateKey
          );

          // Áp dụng thuật toán layout: Biến mỗi ca học thành 1 khối duy nhất trải dài đúng vị trí thời gian
          const laidOutEvents = layoutDayEvents(dayRawEvents, START_HOUR, HOUR_HEIGHT);

          return (
            <div
              key={`col-${day.dateKey}`}
              className="border-end position-relative"
              style={{
                borderColor: '#e2e8f0',
                backgroundColor: day.isToday ? '#fbfcfd' : '#ffffff'
              }}
            >
              {/* Lưới các ô theo giờ để nhận sự kiện Click tạo mới và Hover / Drop */}
              {HOURS.map((hour) => {
                const cellKey = `${day.dateKey}-${hour}`;
                const isOver = dragOverCell === cellKey;

                return (
                  <div
                    key={`slot-${cellKey}`}
                    onDragOver={(e) => handleDragOver(e, cellKey)}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => handleDrop(e, day.date, hour)}
                    onClick={() =>
                      onEmptySlotClick({
                        date: day.dateKey,
                        startTime: `${pad(hour)}:00`,
                        endTime: `${pad(Math.min(hour + 2, 23))}:00`
                      })
                    }
                    className="border-bottom position-relative"
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      borderColor: '#f1f5f9',
                      backgroundColor: isOver ? '#eff6ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                    title={`Bấm để thêm lịch học vào lúc ${pad(hour)}:00`}
                  >
                    {/* Vạch kẻ nửa giờ mờ (30 phút) giúp định vị giờ lẻ trực quan */}
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

              {/* Render CÁC KHỐI BUỔI HỌC LIÊN TỤC TRẢI DÀI CHÍNH XÁC THEO THỜI GIAN */}
              {laidOutEvents.map((s) => {
                const theme = getClassTheme(s.classId);
                const durationStr = formatDuration(s.startTime, s.endTime);
                const isShort = s.height < 52;

                return (
                  <div
                    key={s.scheduleId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleClick(s);
                    }}
                    className="rounded-1 text-start p-1.5 shadow-sm"
                    style={{
                      position: 'absolute',
                      top: `${Math.max(s.top, 0)}px`,
                      height: `${s.height}px`,
                      left: `calc(${s.leftPercent}% + 2px)`,
                      width: `calc(${s.widthPercent}% - 4px)`,
                      backgroundColor: theme.bg,
                      borderLeft: `3.5px solid ${theme.border}`,
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
                    {/* Hàng tiêu đề với tên lớp và khung giờ chính xác */}
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

                    {/* Chi tiết phòng học & giáo viên nếu chiều cao khối đủ rộng */}
                    {!isShort && (
                      <div
                        className="d-flex justify-content-between align-items-center mt-1"
                        style={{ fontSize: '10px', opacity: 0.9 }}
                      >
                        <span className="text-truncate">
                          {s.room ? `P.${s.room}` : ''}
                          {s.room && s.homeroomTeacherName ? ' | ' : ''}
                          {s.homeroomTeacherName ? s.homeroomTeacherName : ''}
                        </span>
                        {durationStr && (
                          <span
                            className="font-monospace opacity-75 ms-1"
                            style={{ fontSize: '9px', whiteSpace: 'nowrap' }}
                          >
                            {durationStr}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Chủ đề bài học nếu ca học đủ dài */}
                    {s.height >= 85 && s.lessonTopic && (
                      <div
                        className="text-truncate mt-1 fst-italic"
                        style={{ fontSize: '9.5px', opacity: 0.8 }}
                      >
                        Chủ đề: {s.lessonTopic}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleWeekView;
