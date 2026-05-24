#!/usr/bin/env bash

# 🏫 Classroom Finance - Junior Handover Setup Script 💸
# สคริปต์ช่วยติดตั้งระบบอัตโนมัติสำหรับรุ่นน้องที่รับช่วงต่อดูแลโครงการ
# วิธีใช้งาน: เปิด Terminal แล้วพิมพ์ bash setup.sh หรือ ./setup.sh

# กำหนดสีในเทอร์มินัลเพื่อความสวยงาม
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo -e "${CYAN}${BOLD}    🏫  ระบบการเงินห้องเรียน (Classroom Finance) - เตรียมระบบสำหรับรุ่นน้อง 💸${NC}"
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo -e " ยินดีต้อนรับเหรัญญิกรุ่นใหม่! สคริปต์นี้จะช่วยตั้งค่าและทดสอบสภาพแวดล้อมเพื่อเริ่มต้นระบบ"
echo ""

# ----------------------------------------------------
# 1. ตรวจสอบ Node.js
# ----------------------------------------------------
echo -e "${BOLD}[1/4] ตรวจสอบโปรแกรมพื้นฐานในเครื่อง...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ไม่พบ Node.js ในเครื่องคอมพิวเตอร์นี้${NC}"
    echo -e "กรุณาดาวน์โหลดและติดตั้ง Node.js (เวอร์ชัน 18 ขึ้นไป แนะนำ LTS) ที่: https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "  - Node.js: ${GREEN}ผ่าน (${NODE_VERSION})${NC}"
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ ไม่พบ npm (Node Package Manager) ในเครื่องนี้${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "  - npm:     ${GREEN}ผ่าน (v${NPM_VERSION})${NC}"
fi
echo ""

# ----------------------------------------------------
# 2. ติดตั้ง Dependencies
# ----------------------------------------------------
echo -e "${BOLD}[2/4] กำลังติดตั้ง Dependencies (อาจใช้เวลาประมาณ 1-2 นาที)...${NC}"
echo -e "  รันคำสั่ง: ${BLUE}npm install${NC}"
echo ""

if npm install; then
    echo ""
    echo -e "${GREEN}✅ ติดตั้ง Dependencies ทั้งหมดเรียบร้อยแล้ว!${NC}"
else
    echo ""
    echo -e "${RED}❌ ติดตั้ง Dependencies ไม่สำเร็จ${NC}"
    echo -e "กรุณาลองเช็คอินเทอร์เน็ตแล้วรัน ${BLUE}npm install${NC} ด้วยตนเองอีกครั้ง"
    exit 1
fi
echo ""

# ----------------------------------------------------
# 3. เตรียมไฟล์ Environment (.env.local)
# ----------------------------------------------------
echo -e "${BOLD}[3/4] ตั้งค่า Environment Variables...${NC}"

if [ -f ".env.local" ]; then
    echo -e "  - ไฟล์ ${GREEN}.env.local${NC} มีอยู่แล้วในเครื่องของคุณ"
else
    echo -e "  - ไม่พบไฟล์ .env.local ทำการคัดลอกตัวอย่างจาก ${BLUE}.env.example${NC} ให้ทันที"
    cp .env.example .env.local
    echo -e "  - ${GREEN}สร้างไฟล์ .env.local สำเร็จแล้ว!${NC}"
fi

echo ""
echo -e "⚠️  ${YELLOW}${BOLD}ขั้นตอนสำคัญมาก:${NC}"
echo -e "เปิดไฟล์ ${BLUE}.env.local${NC} ในโปรแกรมเขียนโค้ด (เช่น VS Code) แล้วใส่ข้อมูลเชื่อมต่อฐานข้อมูลของคุณ:"
echo -e "  1. ${BOLD}SUPABASE_URL${NC} (URL ของโปรเจกต์ Supabase)"
echo -e "  2. ${BOLD}SUPABASE_SERVICE_ROLE_KEY${NC} (Service Role Key สำหรับสิทธิ์หลังบ้าน)"
echo -e "*(สามารถเอาคีย์สองค่านี้ได้จากเว็บ Supabase > Settings > API)*"
echo ""

# ----------------------------------------------------
# 4. ลบไฟล์แคชและสรุปคำแนะนำ
# ----------------------------------------------------
echo -e "${BOLD}[4/4] สรุปคำแนะนำสำหรับการเริ่มต้นระบบ...${NC}"
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo -e " 🎉 ${GREEN}${BOLD}การติดตั้งขั้นต้นเสร็จสมบูรณ์!${NC}"
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo ""
echo -e "${YELLOW}${BOLD}📌 เช็คลิสต์สิ่งที่ต้องทำถัดไป:${NC}"
echo -e "  ${BOLD}1. รันฐานข้อมูลบน Supabase SQL Editor:${NC}"
echo -e "     เปิดเว็บ Supabase ไปที่ SQL Editor แล้วนำโค้ดในไฟล์ทั้งหมดนี้ไปรันตามลำดับเลข:"
echo -e "     📁 ${BLUE}supabase/migrations/001_initial_schema.sql${NC} ถึง ${BLUE}012_add_app_settings.sql${NC}"
echo ""
echo -e "  ${BOLD}2. สั่งรันเว็บเพื่อพัฒนาต่อ (Local Development):${NC}"
echo -e "     เมื่อใส่ Env ครบแล้ว รันคำสั่งนี้ในเทอร์มินัล:"
echo -e "     👉 ${GREEN}npm run dev${NC}"
echo -e "     จากนั้นเปิดเว็บไปที่: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "  ${BOLD}3. การตั้งค่า Secrets & ข้อความ LINE จากหน้าเว็บ:${NC}"
echo -e "     เข้าไปที่หน้า ${BOLD}http://localhost:3000/settings${NC} เพื่อกรอก LINE Token, EasySlip API, PromptPay ID"
echo -e "     และปรับข้อความบอทตอบกลับได้ทั้งหมดจากหน้าจอเว็บ โดยไม่ต้องแก้โค้ดเลย!"
echo ""
echo -e "  ${BOLD}4. อ่านคู่มือแบบละเอียด:${NC}"
echo -e "     เปิดอ่านเพิ่มเติมได้ที่ไฟล์ 📁 ${BLUE}docs/คู่มือตั้งค่าระบบและข้อความ_LINE.md${NC}"
echo ""
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo -e "ขอให้สนุกกับการพัฒนาต่อ! ขอส่งต่อพลังทางการเงินห้องเรียนให้กับรุ่นของน้องๆ นะครับ 🚀✨"
echo -e "${CYAN}${BOLD}=========================================================================${NC}"
echo ""
