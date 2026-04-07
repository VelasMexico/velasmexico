from fpdf import FPDF
from PIL import Image
import glob
import os

def add_bg_page(pdf, image_path, title, body_paragraphs):
    from PIL import Image
    tmp_out = image_path + "_dark.jpg"
    if not os.path.exists(tmp_out):
        img = Image.open(image_path).convert("RGBA")
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 175))
        img = Image.alpha_composite(img, overlay).convert("RGB")
        img.save(tmp_out)
    
    pdf.add_page()
    pdf.image(tmp_out, 0, 0, 210, 297)
    
    title_font_size = 22
    body_font_size = 11
    line_height = 6
    title_height = 10
    margin = 20
    content_width = 170
    
    pdf.set_left_margin(margin)
    pdf.set_right_margin(margin)
    
    start_y = 65
    
    # Draw Title
    pdf.set_text_color(224, 185, 75) # Gold
    pdf.set_font('helvetica', 'B', title_font_size)
    pdf.set_y(start_y)
    pdf.multi_cell(content_width, title_height, title, align='C')
    
    current_y = start_y + title_height + 15
    pdf.set_y(current_y)
    
    # Draw Body
    for p in body_paragraphs:
        if p == "":
            pdf.ln(line_height)
            continue
            
        pdf.set_font('helvetica', '', body_font_size)
        pdf.set_text_color(245, 245, 245)
        pdf.multi_cell(content_width, line_height, p, align='C')
        pdf.ln(4)

pdf = FPDF(orientation='P', unit='mm', format='A4')
pdf.set_auto_page_break(False)

brain_dir = '/Users/macbook/.gemini/antigravity/brain/8b42e289-28e2-462e-a2a1-7150b71f3748'
img1 = glob.glob(os.path.join(brain_dir, 'pdf_bg_cover_*.png'))[0]
img2 = glob.glob(os.path.join(brain_dir, 'pdf_bg_ritual_*.png'))[0]
img3 = glob.glob(os.path.join(brain_dir, 'pdf_bg_enjoy_*.png'))[0]
img4 = glob.glob(os.path.join(brain_dir, 'pdf_bg_aroma_*.png'))[0]

# Page 1: Como usar la vela
t1 = "1. Uso Correcto de tu Vela"
p1 = [
    "La experiencia perfecta comienza antes de encender la llama. Para aprovechar al maximo las propiedades artesanales y aromaticas de tu vela, sigue estos pasos esenciales.",
    "",
    "- Preparacion del Ambiente: Busca un lugar tranquilo, lejos de corrientes de aire que puedan hacer titilar la llama. Asegurate de colocarla sobre una superficie plana y resistente al calor.",
    "- Recorte de Pabilo: Antes de cada uso, recorta la mecha a unos 5 milimetros. Esto previene el humo negro y asegura que la llama sea brillante, constante y segura.",
    "- Memoria de la Cera (Timing): La primera vez que enciendas la vela, dejala arder hasta que toda la capa superior se derrita llegando hasta los bordes del recipiente (aprox. 1 o 2 horas). Esto previene que se forme un tunel y asegura que la vela se consuma uniformemente en el futuro.",
    "- Extincion Suave: Evita soplarla. Utiliza un apagavelas o sumerge suavemente la mecha en la cera liquida y vuelvela a enderezar, para no arruinar el aroma de la habitacion con humo gris."
]
add_bg_page(pdf, img1, t1, p1)

# Page 2: Ritual Magico
t2 = "2. Ritual de 15 Minutos"
p2 = [
    "Vivimos en un mundo acelerado. Este pequeno ritual magico esta disenado para reconectarte con tu interior y liberar toda la tension acomulada a lo largo del dia.",
    "",
    "- 0-3 Minutos (Enraizamiento): Apaga todas las luces artificiales, sientate en una postura comoda y enciende tu vela. Siente el peso de tu cuerpo sobre la silla o el piso y observa como la luz dorada disipa la oscuridad.",
    "- 3-8 Minutos (Intencion): Fija tu mirada suavemente en el centro de la llama. Observa su movimiento hipnotico. Con cada inhalacion, imagina que atraes luz, paz y claridad; con cada exhalacion, visualiza como el estres y las preocupaciones se derriten como la cera.",
    "- 8-12 Minutos (Meditacion Olfativa): Cierra los ojos y enfocate unicamente en el suave aroma que envuelve el aire. Deja que el perfume despierte sensaciones, recuerdos o unicamente silencio mental.",
    "- 12-15 Minutos (Cierre): Agradece por este momento de pausa. Define una intencion positiva para el resto de tu dia o para tu descanso. Siente como esa calidez permanece contigo aun cuando apagues la llama."
]
add_bg_page(pdf, img2, t2, p2)

# Page 3: Ideas de disfrute
t3 = "3. Ideas para Disfrutar tu Vela"
p3 = [
    "No necesitas un motivo especial para encender tu vela. Convierte los placeres cotidianos en momentos extraordinarios y transforma tu rutina en un estilo de vida de autocuidado.",
    "",
    "- Cafe y Mananas Lentas: Enciende tu vela a primera hora del dia mientras el aroma de un cafe humeante inunda la cocina. Observar el fuego antes de ver pantallas establece un tono sereno y poderoso para tu jornada.",
    "- Copa de Vino y Noche de Descanso: Al caer la oscuridad, sirve una copa de tu vino rojo favorito. El contraste de la bebida con el ambiente tenue y el aroma amaderado de la vela crean una experiencia sensorial inigualable.",
    "- Terapia de Journaling (Escritura): Sientate frente a tu libreta con la iluminacion exclusiva de la vela. La falta de luz desinhibe la mente y facilita vaciar tus pensamientos en papel. Escribe gratitud, sueños o ansiedades.",
    "- Lectura Inmersiva: Acompana un buen libro de fantasia o romance con una vela encendida a tu lado; el ambiente calido potencia la inmersión en la historia.",
    "- Bano Renovador: Apaga la luz del bano. Deja que unicamente el destello de la llama guie tu vista mientras tomas un relajante bano de espumas."
]
add_bg_page(pdf, img3, t3, p3)

# Page 4: Aromas
t4 = "4. Tu Vela Según tu Animo"
p4 = [
    "La aromaterapia no es solo perfume; son moleculas que, al entrar a nuestro cerebro, detonan respuestas directas en el sistema nervioso. Encuentra la familia ideal para ti:",
    "",
    "- Florales y Relajantes (Lavanda, Rosas, Jazmin, Manzanilla): Perfectos para el atardecer. Disminuyen el ritmo cardiaco, conectan con la energia femenina, el amor propio y preparan profundamente al cuerpo para combatir el insomnio.",
    "- Citricos y Frescos (Limon, Naranja, Bergamota): Son portadores de vibracion alta. Estimulan la produccion de serotonina, ahuyentan la fatiga mental y promueven la energia, alegria y limpieza energetica.",
    "- Calidos y Especiados (Vainilla, Canela): Evocan recuerdos de hogar, confort maternal y postres caseros. Son ideales para sentir un 'abrazo al alma', calmar el corazon en tiempos dificiles e invitar la nostalgia dulce.",
    "- Maderas y Tierra (Sandalo, Pino, Cedro): Anclan la energia al presente. Favorecen la meditacion profunda, aclaran la negacion y otorgan una sensacion de lujo, elegancia y misterio.",
]
add_bg_page(pdf, img4, t4, p4)

assets_dir = '/Users/macbook/Desktop/Velas Mexico/Pag Web/assets'
if not os.path.exists(assets_dir):
    os.makedirs(assets_dir)
out_path = os.path.join(assets_dir, 'Guia_Premium_Velas.pdf')
pdf.output(out_path)
print(f"PDF created successfully at {out_path}")
