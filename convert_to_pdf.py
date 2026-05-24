#!/usr/bin/env python3
"""
Simple HTML to PDF converter for macOS using native capabilities
Run: python3 convert_to_pdf.py
"""

import os
import subprocess
import sys

def convert_with_print_to_pdf():
    """Use macOS print utility to convert HTML to PDF"""
    html_file = "คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html"
    pdf_file = "คู่มือการเริ่มต้นใช้งาน_Classroom_Finance.pdf"
    
    if not os.path.exists(html_file):
        print("❌ ไม่พบไฟล์ HTML")
        return False
    
    try:
        # ใช้ cupsfilter ที่มี macOS มาจึงหาเป็นไปไม่ได้ เลยลอง enscript
        # หรือใช้ AppleScript
        print("🔄 กำลังแปลงไฟล์ HTML เป็น PDF...")
        
        # วิธี 1: ลองใช้ enscript
        result = subprocess.run(
            ['enscript', '-B', '-p', pdf_file, html_file],
            capture_output=True,
            timeout=30
        )
        
        if result.returncode == 0 and os.path.exists(pdf_file):
            print(f"✅ สำเร็จ! ไฟล์บันทึกไว้ที่: {pdf_file}")
            return True
            
    except Exception as e:
        print(f"⚠️  Method 1 ล้มเหลว: {e}")
    
    # วิธี 2: ใช้ Python built-in capabilities
    try:
        print("📚 พยายามใช้ method อื่น...")
        print("")
        print("🌐 แนะนำ: เปิดไฟล์ HTML ในเบราว์เซอร์แล้ว Print to PDF")
        print("   ขั้นตอน:")
        print("   1. double-click: คู่มือการเริ่มต้นใช้งาน_ฉบับสมบูรณ์.html")
        print("   2. Cmd+P (print dialog)")
        print("   3. เลือก 'Save as PDF'")
        print("   4. Save เป็น 'คู่มือการเริ่มต้นใช้งาน_Classroom_Finance.pdf'")
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    convert_with_print_to_pdf()
