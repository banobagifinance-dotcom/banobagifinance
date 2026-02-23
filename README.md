# Thehaggi Assets

ระบบจัดการสินทรัพย์ พร้อม QR Code สำหรับติดบนสินทรัพย์และสแกนดูรายละเอียด

## คุณสมบัติ

- **หน้าแรก**: แสดงภาพและ ID (รูปแบบ XX-25-034 เช่น EQ, AQ, CQ) ของสินทรัพย์ทั้งหมด
- **เพิ่มสินทรัพย์**: ภาพ, ID, Name, Date, Price — หลังเพิ่มจะได้ QR Code นำไปพิมพ์ติดสินทรัพย์
- **หน้ารายละเอียด** (เข้าจากลิงก์หรือสแกน QR): แสดงข้อมูลครบ และปุ่มลบสินทรัพย์
- รันในเครื่องได้ เพิ่ม/ลบสินทรัพย์ได้จริง (เก็บใน Supabase)
- พร้อม deploy ขึ้น Vercel ผ่าน GitHub

## การติดตั้ง

### 1. Clone และติดตั้ง dependencies

```bash
cd ThehaggiAssets
npm install
```

### 2. ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) (ฟรี)
2. ใน SQL Editor รันคำสั่งในไฟล์ `supabase/schema.sql`
3. ไปที่ **Storage** → สร้าง bucket ชื่อ `assets` → ตั้งเป็น **Public**
4. ใน bucket `assets` → **Policies** → New policy → เลือก "For full customization" แล้วเพิ่ม policy:
   - Allowed operation: All
   - Target roles: (ว่างหรือ public)
   - ในช่อง **Policy definition** (SQL expression ที่คืนค่า boolean): ใส่ `true`  
     ถ้ามีแยก USING / WITH CHECK ให้ใส่ `true` ทั้งสองช่อง
5. ไปที่ **Settings** → **API** → copy ค่า **Project URL** และ **Publishable key** (ไม่ใช้ Secret key)

### 3. ตั้งค่า Environment

สร้างไฟล์ `.env.local` ในโฟลเดอร์โปรเจกต์:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

### 4. รันในเครื่อง

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## การ Deploy ขึ้น Vercel ผ่าน GitHub

1. สร้าง repo บน GitHub แล้ว push โปรเจกต์นี้ขึ้นไป (ไม่ push ไฟล์ `.env` หรือ `.env.local`)
2. ไปที่ [vercel.com](https://vercel.com) → Import โปรเจกต์จาก GitHub
3. ใน Vercel → โปรเจกต์ → **Settings** → **Environment Variables** เพิ่ม:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — เว็บจะใช้ Supabase ชุดเดียวกัน ข้อมูลจึงเหมือนกันทั้งรันในเครื่องและบน Vercel

## รูปแบบ ID

รหัสสินทรัพย์ต้องเป็นรูปแบบ **XX-XX-XXX** เช่น `EQ-25-034`, `AQ-01-001`, `CQ-99-999` (ตัวอักษร 2 ตัว + ขีด + ตัวเลข 2 หลัก + ขีด + ตัวเลข 3 หลัก)

## โครงสร้างหลัก

- `app/page.tsx` — หน้าแรก (ภาพ + ID)
- `app/add/page.tsx` — เพิ่มสินทรัพย์ + แสดง QR หลังเพิ่ม
- `app/asset/[id]/page.tsx` — รายละเอียดสินทรัพย์ (สำหรับสแกน QR) + ลบได้
- `app/api/assets/` — API รายการและสร้าง
- `app/api/assets/[id]/` — API ดึงรายการเดียวและลบ
- `lib/supabase.ts` — client และ type
- `supabase/schema.sql` — สร้าง table และคำอธิบาย storage
