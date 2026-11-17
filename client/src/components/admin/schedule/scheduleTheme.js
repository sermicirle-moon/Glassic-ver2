// Bảng màu hiện đại, tương phản sắc nét theo phong cách ứng dụng quản lý doanh nghiệp
export const CLASS_PALETTES = [
  {
    name: 'blue',
    border: '#2563eb',       // Blue 600
    bg: '#eff6ff',           // Blue 50
    text: '#1e3a8a',         // Blue 900
    timeBg: '#dbeafe',       // Blue 100
    timeText: '#1d4ed8',     // Blue 700
    subText: '#3b82f6'
  },
  {
    name: 'emerald',
    border: '#059669',       // Emerald 600
    bg: '#ecfdf5',           // Emerald 50
    text: '#064e3b',         // Emerald 900
    timeBg: '#d1fae5',       // Emerald 100
    timeText: '#047857',     // Emerald 700
    subText: '#10b981'
  },
  {
    name: 'violet',
    border: '#7c3aed',       // Violet 600
    bg: '#f5f3ff',           // Violet 50
    text: '#4c1d95',         // Violet 900
    timeBg: '#ede9fe',       // Violet 100
    timeText: '#6d28d9',     // Violet 700
    subText: '#8b5cf6'
  },
  {
    name: 'amber',
    border: '#d97706',       // Amber 600
    bg: '#fffbeb',           // Amber 50
    text: '#78350f',         // Amber 900
    timeBg: '#fef3c7',       // Amber 100
    timeText: '#b45309',     // Amber 700
    subText: '#d97706'
  },
  {
    name: 'rose',
    border: '#e11d48',       // Rose 600
    bg: '#fff1f2',           // Rose 50
    text: '#881337',         // Rose 900
    timeBg: '#ffe4e6',       // Rose 100
    timeText: '#be123c',     // Rose 700
    subText: '#f43f5e'
  },
  {
    name: 'teal',
    border: '#0d9488',       // Teal 600
    bg: '#f0fdfa',           // Teal 50
    text: '#134e4a',         // Teal 900
    timeBg: '#ccfbf1',       // Teal 100
    timeText: '#0f766e',     // Teal 700
    subText: '#14b8a6'
  },
  {
    name: 'indigo',
    border: '#4f46e5',       // Indigo 600
    bg: '#eef2ff',           // Indigo 50
    text: '#312e81',         // Indigo 900
    timeBg: '#e0e7ff',       // Indigo 100
    timeText: '#4338ca',     // Indigo 700
    subText: '#6366f1'
  },
  {
    name: 'cyan',
    border: '#0284c7',       // Sky 600
    bg: '#f0f9ff',           // Sky 50
    text: '#0c4a6e',         // Sky 900
    timeBg: '#e0f2fe',       // Sky 100
    timeText: '#0369a1',     // Sky 700
    subText: '#0ea5e9'
  }
];

export const getClassTheme = (classId = '') => {
  if (!classId) return CLASS_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < classId.length; i++) {
    hash = (hash << 5) - hash + classId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CLASS_PALETTES.length;
  return CLASS_PALETTES[index];
};

export const pad = (n) => String(n).padStart(2, '0');

export const formatTimeShort = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '';
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMinutes = Math.round(diffMs / 60000);
  if (totalMinutes <= 0) return '';
  if (totalMinutes < 60) return `${totalMinutes}p`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h${mins}p` : `${hours}h`;
};

export const isOddMinute = (isoString) => {
  if (!isoString) return false;
  const d = new Date(isoString);
  return d.getMinutes() !== 0;
};

/**
 * Thuật toán layout các khối sự kiện liên tục theo trục thời gian chuẩn Google Calendar:
 * - Mỗi ca học (ví dụ 8h30 - 10h15) là 1 khối duy nhất trải dài chính xác từ 8h30 đến 10h15.
 * - Khi có nhiều lớp học song song trong cùng 1 ca, tự động chia đều chiều rộng (side-by-side).
 */
export const layoutDayEvents = (events = [], startHour = 6, hourHeight = 60) => {
  if (!events || events.length === 0) return [];

  // 1. Chuyển đổi start/end sang số phút tính từ startHour
  const parsed = events.map((s) => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
    const endMinutes = (end.getHours() - startHour) * 60 + end.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 25);
    return {
      ...s,
      startMinutes,
      endMinutes,
      duration,
      top: (startMinutes / 60) * hourHeight,
      height: (duration / 60) * hourHeight
    };
  });

  // 2. Sắp xếp theo thời gian bắt đầu tăng dần, thời lượng giảm dần
  parsed.sort((a, b) => a.startMinutes - b.startMinutes || b.duration - a.duration);

  // 3. Gom cụm các buổi học giao nhau về thời gian
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const ev of parsed) {
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      clusterEnd = ev.endMinutes;
    } else if (ev.startMinutes < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = ev.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 4. Phân chia cột song song (Greedy column assignment)
  const result = [];
  for (const cluster of clusters) {
    const columns = [];
    for (const ev of cluster) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const lastEvInCol = columns[colIdx][columns[colIdx].length - 1];
        if (lastEvInCol.endMinutes <= ev.startMinutes) {
          columns[colIdx].push(ev);
          ev.col = colIdx;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([ev]);
        ev.col = columns.length - 1;
      }
    }

    const numCols = columns.length;
    for (const ev of cluster) {
      ev.leftPercent = (ev.col / numCols) * 100;
      ev.widthPercent = (1 / numCols) * 100;
      result.push(ev);
    }
  }

  return result;
};

