import sys
import os
import datetime  # Importamos datetime para obtener la fecha actual
from PyPDF2 import PdfWriter, PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import reportlab.rl_config
import io

# Parámetros ingresados desde Node.js
student = sys.argv[1]

course = "Curso BPM Valencia"  # Puedes cambiar este texto fijo si es necesario
# Obtener la fecha actual en formato "dd/mm/yyyy"
current_date = datetime.datetime.now().strftime("%d/%m/%Y")  # La fecha se genera automáticamente
output_path = sys.argv[2]  # Ruta donde se guardará el certificado
cedula = sys.argv[3]

# Crear la carpeta 'certificates' si no existe
output_dir = os.path.dirname(output_path)
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Configuración del certificado
reportlab.rl_config.warnOnMissingFontGlyphs = 0
pdfmetrics.registerFont(TTFont('VeraBd', 'VeraBd.ttf'))  # Font para 'Student'
pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))      # Font para 'Course'
pdfmetrics.registerFont(TTFont('VeraBI', 'VeraBI.ttf'))  # Font para 'Date'

packet = io.BytesIO()
width, height = letter
c = canvas.Canvas(packet, pagesize=(width*2, height*2))

# Configurar el texto del certificado
c.setFillColorRGB(139/255, 119/255, 40/255)
c.setFont('VeraBd', 50)
c.drawCentredString(422, 310, student)

c.setFont('Vera', 25)
c.drawCentredString(422, 215, cedula)

c.setFont('Vera', 25)
c.drawCentredString(422, 135, course)

c.setFillColorRGB(1/255, 1/255, 1/255)
c.setFont('VeraBI', 16)
c.drawCentredString(578, 77, current_date)  # Aquí usamos la fecha actual

c.save()

# Combinar el texto con la plantilla del certificado
existing_pdf = PdfReader(open('input/certificate_template.pdf', 'rb'))
page = existing_pdf.pages[0]

packet.seek(0)
new_pdf = PdfReader(packet)
page.merge_page(new_pdf.pages[0])

# Guardar el archivo PDF generado
outputStream = open(output_path, "wb")
output = PdfWriter()
output.add_page(page)
output.write(outputStream)
outputStream.close()
