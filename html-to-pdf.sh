#!/bin/bash

# สคริปต์สำหรับแปลงไฟล์ HTML เป็น PDF สำหรับ macOS
# วิธีใช้: bash html-to-pdf.sh

HTML_FILE="คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html"
PDF_FILE="คู่มือการเริ่มต้นใช้งาน_Classroom_Finance.pdf"

echo "🔄 กำลังแปลงไฟล์ HTML เป็น PDF..."
echo ""

# ตรวจว่าไฟล์ HTML มีอยู่หรือไม่
if [ ! -f "$HTML_FILE" ]; then
    echo "❌ ไม่พบไฟล์ $HTML_FILE"
    exit 1
fi

# ใช้ macOS native printing to PDF
# วิธี 1: ใช้ wkhtmltopdf (ถ้าติดตั้งแล้ว)
if command -v wkhtmltopdf &> /dev/null; then
    echo "📄 ใช้ wkhtmltopdf ในการแปลง..."
    wkhtmltopdf "$HTML_FILE" "$PDF_FILE"
    echo "✅ สำเร็จ! ไฟล์บันทึกไว้ที่: $PDF_FILE"
    exit 0
fi

# วิธี 2: ใช้ Python (ถ้าติดตั้ง weasyprint)
if python3 -c "import weasyprint" 2>/dev/null; then
    echo "📄 ใช้ Python weasyprint ในการแปลง..."
    python3 << 'EOF'
from weasyprint import HTML
HTML('คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html').write_pdf('คู่มือการเริ่มต้นใช้งาน_Classroom_Finance.pdf')
print("✅ สำเร็จ!")
EOF
    exit 0
fi

# วิธี 3: ใช้ Node.js Puppeteer (ถ้าติดตั้ง)
if command -v node &> /dev/null; then
    echo "📄 ใช้ Node.js Puppeteer ในการแปลง..."
    node html-to-pdf.js
    exit 0
fi

# วิธี 4: แนะนำให้ผู้ใช้แปลงด้วยมือ
echo "⚠️  ไม่พบเครื่องมือในการแปลง"
echo ""
echo "📝 โปรดทำตามขั้นตอนนี้เพื่อสร้าง PDF:"
echo ""
echo "1. เปิดไฟล์ HTML นี้ในเบราว์เซอร์:"
echo "   • Chrome: ลาก & วาง HTML file ลงในหน้าต่าง Chrome"
echo "   • Firefox: Ctrl+O (Win) / Cmd+O (Mac) เลือกไฟล์"
echo ""
echo "2. กด Ctrl+P (Windows) หรือ Cmd+P (macOS)"
echo ""
echo "3. เลือก 'Save as PDF'"
echo ""
echo "4. ตั้งชื่อไฟล์เป็น: คู่มือการเริ่มต้นใช้งาน_Classroom_Finance"
echo ""
echo "5. คลิก Save"
echo ""

exit 1
