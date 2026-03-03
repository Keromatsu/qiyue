// utils/dateUtil.js
// 格式化时间为 YYYY-MM-DD（仅日期）
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化时间为 YYYY-MM-DD HH:mm（日期+时分，适配活动时间）
function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 计算时间差（提前几小时/几天）
function subtractTime(date, amount, unit) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  if (unit === 'hour') {
    d.setHours(d.getHours() - amount);
  } else if (unit === 'day') {
    d.setDate(d.getDate() - amount);
  }
  return d;
}

// 判断时间1是否早于时间2（完整时间对比，精确到毫秒）
function isBefore(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return d1 < d2;
}

module.exports = {
  formatDate,
  formatDateTime,
  subtractTime,
  isBefore
};