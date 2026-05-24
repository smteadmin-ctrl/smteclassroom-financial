# 📖 คู่มือการเริ่มต้นใช้งาน Classroom Finance

## 🎯 ขั้นตอนสร้าง PDF

### วิธีที่ 1: ใช้เบราว์เซอร์ (ง่ายที่สุด! ✨)

**เวลา:** 2 นาที | **ความยากง่าย:** ง่ายมาก

#### ขั้นตอน:
1. **เปิดไฟล์ HTML**
   - หา `คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html`
   - Double-click เพื่อเปิดในเบราว์เซอร์
   - หรือ ลากไฟล์ลงในหน้าต่าง Chrome/Firefox

2. **เปิด Print Dialog**
   - **macOS:** กด `Cmd + P`
   - **Windows:** กด `Ctrl + P`
   - **Linux:** กด `Ctrl + P`

3. **ตั้งค่า Print**
   - Destination: เปลี่ยนจาก "Printer" เป็น "Save as PDF"
   - Page orientation: Portrait
   - Paper size: A4
   - Margins: Default

4. **บันทึกไฟล์**
   - Filename: `คู่มือการเริ่มต้นใช้งาน_Classroom_Finance`
   - Location: Desktop หรือโฟลเดอร์ที่ต้องการ
   - Format: PDF
   - คลิก "Save"

✅ **เสร็จแล้ว!** ไฟล์ PDF จะถูกสร้างในที่ที่คุณเลือก

---

### วิธีที่ 2: ใช้ Command Line (สำหรับ macOS)

**เวลา:** 30 วินาที | **ความยากง่าย:** ปานกลาง

```bash
# ไป Directory ที่มีโครงการ
cd /path/to/classroom-finance

# รัน Shell script
bash html-to-pdf.sh
```

ระบบจะพยายามแปลงโดยอัตโนมัติ

---

### วิธีที่ 3: ติดตั้ง Tools และแปลง (สำหรับ Advanced Users)

#### Option A: ใช้ Node.js Puppeteer
```bash
npm install puppeteer
node html-to-pdf.js
```

#### Option B: ใช้ Python weasyprint (ใน venv)
```bash
python3 -m venv pdf_env
source pdf_env/bin/activate
pip install weasyprint
python3 convert_to_pdf.py
```

#### Option C: ใช้ Homebrew (macOS)
```bash
# ติดตั้ง wkhtmltopdf
brew install --cask wkhtmltopdf

# แปลงโดยใช้เบราว์เซอร์ (วิธีที่ 1) หลังจากติดตั้ง
```

---

## 📋 เนื้อหาของคู่มือ

คู่มือนี้ประกอบด้วย 11 บท รวมทั้งหมด **30+ หน้า** ครอบคลุม:

### 📚 บทต่างๆ

1. **บทนำและความรู้พื้นฐาน**
   - ระบบ Classroom Finance คืออะไร
   - ส่วนประกอบและประโยชน์
   - ความรู้ที่ต้องการ

2. **การติดตั้งและเตรียมระบบ**
   - ความต้องการทางด้านเทคนิค
   - ตรวจสอบ Node.js และ npm
   - โคลนโครงการจาก GitHub
   - ติดตั้ง Dependencies

3. **การตั้งค่า Supabase (ฐานข้อมูล)**
   - สร้างบัญชี Supabase
   - ดึง API Credentials
   - รัน Database Migrations

4. **การตั้งค่า LINE Bot**
   - สร้าง LINE Channel
   - ตั้งค่า Webhook URL
   - ดึง LINE Credentials

5. **การใช้งานระบบจริง (First Run)**
   - รัน Development Server
   - ทำความรู้จักกับ Interface
   - เพิ่มข้อมูลเริ่มต้น

6. **การใช้งานแต่ละหน้า**
   - Dashboard (หน้าหลัก)
   - Transactions (บันทึกรายการ)
   - Schedule (กำหนดการ)
   - Students (นักเรียน)

7. **หน้าตั้งค่า (Settings)**
   - Secrets (ข้อมูลลับ)
   - Receiver (บัญชีรับเงิน)
   - Rich Menu (เมนูปุ่ม LINE)
   - LINE Messages

8. **QR Code และวิธีชำระเงิน**
   - ประเภทการชำระเงิน
   - ตั้งค่า QR ธนาคาร
   - ตั้งค่า QR TrueMoney
   - วิธี Generate QR

9. **การตรวจสลิป (Slip Checking)**
   - ขั้นตอนการตรวจสลิป
   - ประเภทของผลการตรวจ
   - ตั้งค่า Slip Checker
   - วิธีตรวจและอนุมัติ

10. **คำถามที่พบบ่อย (FAQ)**
    - คำถามทั่วไป
    - คำถามทางเทคนิค
    - คำถามเกี่ยวกับการชำระเงิน
    - คำถามเกี่ยวกับ LINE

11. **การแก้ไขปัญหา (Troubleshooting)**
    - ข้อผิดพลาดทั่วไป
    - Deploy ปัญหา
    - Supabase ปัญหา
    - คำแนะนำสำหรับใช้งานที่มีประสิทธิภาพ

---

## 📊 สิ่งที่รวมอยู่ในไฟล์

```
คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html    ← ไฟล์ HTML (ดูได้ในเบราว์เซอร์)
html-to-pdf.sh                         ← Script แปลง HTML เป็น PDF
html-to-pdf.js                         ← Node.js version (ถ้ามี Puppeteer)
convert_to_pdf.py                      ← Python version
คู่มือการเริ่มต้นใช้งาน_Classroom_Finance.pdf ← ไฟล์ PDF (สร้างแล้ว)
```

---

## 💡 คำแนะนำ

### ✅ ควรอ่านคู่มือนี้ถ้า:
- เป็นเหรัญญิกใหม่ที่รับช่วงต่อ
- ต้องติดตั้งระบบครั้งแรก
- ต้องการเข้าใจวิธีใช้งานทั้งหมด
- พบปัญหาและต้องการแก้ไข

### 📱 สำหรับนักเรียน:
คู่มือนี้เป็นของเหรัญญิก นักเรียนควรดู:
- หน้า LINE Bot ของเหรัญญิก
- หรือถามเหรัญญิกตรง ๆ

### 🔒 ข้อมูลลับ:
อย่าแชร์:
- Supabase Service Role Key
- LINE Channel Secret
- LINE Channel Access Token
- API Keys ต่างๆ

---

## 🚀 Quick Start

1. **ขั้นตอนที่ 1:** อ่านคู่มือนี้
2. **ขั้นตอนที่ 2:** เตรียม Supabase Account
3. **ขั้นตอนที่ 3:** เตรียม LINE Business Account
4. **ขั้นตอนที่ 4:** ติดตั้งโปรแกรมตามข้อมูล
5. **ขั้นตอนที่ 5:** ทดสอบระบบ
6. **ขั้นตอนที่ 6:** Deploy บน Vercel
7. **ขั้นตอนที่ 7:** ใช้งานจริง!

---

## 📞 ติดต่อและการสนับสนุน

หากพบปัญหา:
1. ตรวจ **คำถามที่พบบ่อย (FAQ)** ในคู่มือ
2. ตรวจ **การแก้ไขปัญหา** ในคู่มือ
3. ถามผู้พัฒนาหรือรุ่นพี่ที่พัฒนา

---

## 📅 ข้อมูลเอกสาร

- **เวอร์ชัน:** 1.0
- **วันที่อัปเดต:** 24 พฤษภาคม 2566
- **ภาษา:** ไทย
- **ผู้เขียน:** Classroom Finance Team
- **ใบอนุญาต:** Open Source

---

## 🎉 ขอให้สำเร็จ!

ขอให้ระบบ Classroom Finance ช่วยให้การจัดการการเงินห้องเรียนง่ายขึ้น
และมีประสิทธิภาพมากยิ่งขึ้น

**Happy Finance Managing! 💰**

---

**หมายเหตุ:** ถ้าต้องการอัปเดตหรือเพิ่มเติมข้อมูล สามารถแจ้งให้ผู้พัฒนาทราบ
