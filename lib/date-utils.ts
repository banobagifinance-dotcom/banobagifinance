/**
 * แปลงค่าวันที่จาก Google Sheet ให้แสดงถูกต้อง
 * ใน Sheet ใส่เป็น พ.ศ. ได้ เช่น 2568-10-22
 * (ถ้าปี >= 2400 หรือ > 2100 จะถือว่าเป็น พ.ศ. และแสดงเป็น พ.ศ. ไม่แปลงซ้ำ)
 */
function formatSheetDate(dateStr: string | null | undefined): string {
  if (!dateStr || !String(dateStr).trim()) return "—";
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const y = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return s;
  // ถ้าปีเป็น พ.ศ. (มักจะ 24xx–25xx) แสดงเป็น พ.ศ. โดยไม่ไปให้ Date บวก 543 อีกรอบ
  if (y >= 2400 || y > 2100) {
    const tempDate = new Date(2000, month - 1, day);
    const monthName = tempDate.toLocaleDateString("th-TH", { month: "long" });
    return `${day} ${monthName} ${y}`;
  }
  return new Date(y, month - 1, day).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * คืนค่าวันที่ในรูปแบบ YYYY-MM-DD สำหรับ input type="date"
 * ถ้าค่าจาก Sheet เป็น พ.ศ. (ปี >= 2400) จะคืนเป็น พ.ศ. เหมือนเดิม
 */
function sheetDateToInputValue(dateStr: string | null | undefined): string {
  if (!dateStr || !String(dateStr).trim()) return "";
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s.slice(0, 10);
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** แยก YYYY-MM-DD เป็น { day, month, year } */
function parseSheetDateParts(dateStr: string | null | undefined): { day: number; month: number; year: number } | null {
  if (!dateStr || !String(dateStr).trim()) return null;
  const m = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

/** รวม day, month, year เป็น YYYY-MM-DD */
function toSheetDateString(day: number, month: number, year: number): string {
  const d = Math.max(1, Math.min(31, day));
  const m = Math.max(1, Math.min(12, month));
  const y = year;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** ชื่อเดือนไทย (1–12) */
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function getThaiMonthName(month: number): string {
  const m = Math.max(1, Math.min(12, month));
  return THAI_MONTHS[m - 1] ?? "";
}

export { formatSheetDate, sheetDateToInputValue, parseSheetDateParts, toSheetDateString, getThaiMonthName, THAI_MONTHS };
