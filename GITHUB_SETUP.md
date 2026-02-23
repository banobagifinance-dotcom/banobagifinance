# วิธีเอาโปรเจกต์ขึ้น GitHub

## 1. ติดตั้ง Git (ถ้ายังไม่มี)

- ดาวน์โหลด: https://git-scm.com/download/win  
- ติดตั้งแล้ว **เปิด terminal/CMD ใหม่** แล้วลองพิมพ์ `git --version`

## 2. รันคำสั่งในโฟลเดอร์โปรเจกต์

เปิด PowerShell หรือ Command Prompt แล้วไปที่โฟลเดอร์โปรเจกต์:

```bash
cd c:\Users\UsEr\Documents\web\ThehaggiAssets
```

จากนั้นรันทีละคำสั่ง:

```bash
git init
git remote add origin https://github.com/banobagifinance-dotcom/banobagifinance.git
git add .
git status
```

ตรวจสอบว่า **ไม่มี** ไฟล์ `.env.local` ในรายการ (ไฟล์นี้ไม่ควรถูก commit)  
ถ้ามี ให้รัน: `git reset HEAD .env.local`

จากนั้น:

```bash
git commit -m "Initial commit: Thehaggi Assets - ระบบจัดการสินทรัพย์พร้อม QR Code"
git branch -M main
git push -u origin main
```

## 3. ถ้าให้ใส่ username/password

- **Username:** ชื่อ user บน GitHub ของคุณ  
- **Password:** ใช้ **Personal Access Token** แทนรหัสผ่าน (ไม่ใช้รหัสผ่านเข้าเว็บ)  
  - สร้างที่: GitHub → Settings → Developer settings → Personal access tokens → Generate new token  
  - เลือก scope `repo` แล้ว copy token ไปใส่เมื่อ git ถาม password

---

เมื่อ push สำเร็จ โปรเจกต์จะอยู่ที่:  
https://github.com/banobagifinance-dotcom/banobagifinance
