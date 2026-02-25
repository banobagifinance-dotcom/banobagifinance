/** ความหมายของรหัสนำหน้า (2 ตัวอักษร) ของ ID สินทรัพย์ */
export const ID_PREFIX_LABELS: Record<string, string> = {
  EQ: "อุปกรณ์สำนักงาน",
  FU: "เครื่องตกแต่งสำนักงาน",
  KM: "เครื่องมือเครื่องใช้",
  OT: "อื่นๆ",
};

export function getAssetIdPrefixLabel(prefix: string): string | undefined {
  return ID_PREFIX_LABELS[prefix.toUpperCase()];
}
