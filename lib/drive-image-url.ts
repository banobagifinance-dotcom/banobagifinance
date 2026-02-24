/**
 * แปลงลิงค์ Google Drive แบบ view (แชร์) เป็น URL รูปที่ใช้ embed ได้
 * ใช้ thumbnail endpoint (รองรับตั้งแต่ 2024 แทน uc?export=view ที่มักได้ 403)
 * ตัวอย่าง: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 *       -> https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
 */
export function toDirectImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return trimmed;
}

/** ใช้เช็คว่าเป็นลิงค์ Drive หรือไม่ (สำหรับใช้ <img> แทน next/image เพื่อลดปัญหา 403) */
export function isDriveUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return /drive\.google\.com/i.test(url.trim());
}
