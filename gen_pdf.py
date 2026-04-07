import json
from fpdf import FPDF
import io

def clean_text(text):
    # FPDF standard fonts only support latin-1, so we normalize.
    # To be extremely safe, we map common problematic characters to ascii or drop them
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ñ': 'n', 'Ñ': 'N', '¿': '?', '¡': '!', '–': '-', '—': '-', '”': '"', '“': '"'
    }
    
    for old, new in replacements.items():
         text = text.replace(old, new)
         
    return text.encode('latin-1', 'replace').decode('latin-1')

class PDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Base de Conocimiento - Velas Mexico', 0, 1, 'C')
        self.ln(5)

pdf = PDF()
pdf.add_page()
pdf.set_font('helvetica', size=11)

try:
    with open("/Users/macbook/.gemini/antigravity/brain/8b42e289-28e2-462e-a2a1-7150b71f3748/KnowledgeBase.md", "r", encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        clean_line = line.replace('\n', '').replace('*', '').replace('#', '').strip()
        if clean_line:
            clean_line = clean_text(clean_line)
            pdf.multi_cell(0, 6, clean_line)
            pdf.ln(2)

    pdf.output('/Users/macbook/Desktop/Velas Mexico/Pag Web/KnowledgeBase.pdf')
    print("PDF generado correctamente")
except Exception as e:
    print(f"Error: {str(e)}")
