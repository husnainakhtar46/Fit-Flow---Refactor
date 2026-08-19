import io
import textwrap
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader, simpleSplit
from PIL import Image as PILImage


def generate_pdf_buffer(inspection):
    """
    Generate PDF report for Sample Evaluation (development stage inspections).
    """
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y_pos = height - 50

    # Header
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, y_pos, "SAMPLE EVALUATION REPORT")
    y_pos -= 20

    # Decision Status
    p.setFont("Helvetica-Bold", 14)
    decision = inspection.decision or "PENDING"
    if decision == "Rejected":
        p.setFillColorRGB(1, 0, 0)
    elif decision == "Accepted":
        p.setFillColorRGB(0, 0.5, 0)
    elif decision == "Represent":
        p.setFillColorRGB(1, 0.5, 0)
    else:
        p.setFillColorRGB(0, 0, 0)

    p.drawRightString(550, height - 50, f"STATUS: {decision.upper()}")
    p.setFillColorRGB(0, 0, 0)

    # Info Block
    p.setFont("Helvetica", 12)
    y_pos -= 10

    def draw_pair(x, y, label, value):
        p.setFont("Helvetica-Bold", 12)
        p.drawString(x, y, f"{label}:")
        p.setFont("Helvetica", 12)
        p.drawString(x + 70, y, str(value))

    # Left Column
    draw_pair(50, y_pos, "Style", inspection.style)
    draw_pair(50, y_pos - 20, "Color", inspection.color)
    draw_pair(50, y_pos - 40, "PO #", inspection.po_number)

    # Factory Name Lookup
    factory_name = 'N/A'
    if inspection.factory:
        try:
            from qc.models import Factory
            factory_obj = Factory.objects.filter(id=inspection.factory).first()
            if factory_obj:
                factory_name = factory_obj.name
        except Exception:
            factory_name = str(inspection.factory)

    # Right Column
    draw_pair(300, y_pos, "Date", inspection.created_at.strftime('%Y-%m-%d'))
    draw_pair(300, y_pos - 20, "Stage", inspection.stage)
    draw_pair(300, y_pos - 40, "Customer", inspection.customer.name if inspection.customer else 'N/A')
    draw_pair(300, y_pos - 60, "Factory", factory_name)

    y_pos -= 80

    # Measurements Setup
    all_measurements = list(inspection.measurements.all())
    max_sample_index = 3
    for m in all_measurements:
        s_indices = [s.index for s in m.samples.all()]
        if s_indices:
            max_sample_index = max(max_sample_index, max(s_indices))

    page_width_printable = 500
    col_width_std = 30
    col_width_tol = 30
    col_width_sample = 35

    total_sample_width = max_sample_index * col_width_sample
    pom_width = page_width_printable - col_width_std - col_width_tol - total_sample_width

    x_pom = 50
    x_tol = x_pom + pom_width
    x_std = x_tol + col_width_tol
    x_samples_start = x_std + col_width_std

    y_pos -= 10
    p.setFont("Helvetica-Bold", 8)
    p.drawString(x_pom, y_pos, "POM")
    p.drawString(x_tol, y_pos, "Tol")
    p.drawString(x_std, y_pos, "Std")

    for i in range(max_sample_index):
        p.drawString(x_samples_start + (i * col_width_sample), y_pos, f"S{i+1}")

    y_pos -= 2
    p.line(50, y_pos, 550, y_pos)
    y_pos -= 12

    p.setFont("Helvetica", 8)

    for m in all_measurements:
        samples_dict = {s.index: s.value for s in m.samples.all()}
        pom_text = m.pom_name
        wrapped_lines = simpleSplit(pom_text, "Helvetica", 8, pom_width - 5)
        row_height = max(12, len(wrapped_lines) * 10)

        if y_pos - row_height < 50:
            p.showPage()
            y_pos = height - 50
            p.setFont("Helvetica-Bold", 8)
            p.drawString(x_pom, y_pos, "POM")
            p.drawString(x_tol, y_pos, "Tol")
            p.drawString(x_std, y_pos, "Std")
            for i in range(max_sample_index):
                p.drawString(x_samples_start + (i * col_width_sample), y_pos, f"S{i+1}")
            y_pos -= 14
            p.setFont("Helvetica", 8)

        text_y = y_pos
        for line in wrapped_lines:
            p.drawString(x_pom, text_y, line)
            text_y -= 10

        p.drawString(x_tol, y_pos, str(m.tol))
        p.drawString(x_std, y_pos, str(m.std) if m.std is not None else '-')

        for i in range(max_sample_index):
            idx = i + 1
            val_str = samples_dict.get(idx)
            x = x_samples_start + (i * col_width_sample)

            val = float(val_str) if val_str is not None and val_str != '' else None
            is_error = False
            if val is not None and m.std is not None and m.tol is not None:
                if abs(val - m.std) > m.tol:
                    is_error = True

            if is_error:
                p.setFillColorRGB(1, 0, 0)
            else:
                p.setFillColorRGB(0, 0, 0)

            p.drawString(x, y_pos, str(val) if val is not None else '-')
            p.setFillColorRGB(0, 0, 0)

        y_pos -= (row_height + 4)

    p.setFillColorRGB(0, 0, 0)
    y_pos -= 30

    def draw_text_block(title, content):
        nonlocal y_pos
        if not content:
            return

        if y_pos < 60:
            p.showPage()
            y_pos = height - 50

        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y_pos, title)
        y_pos -= 12

        p.setFont("Helvetica", 9)
        text_obj = p.beginText(50, y_pos)
        lines = textwrap.wrap(content, width=95)
        for line in lines:
            if y_pos < 50:
                p.drawText(text_obj)
                p.showPage()
                y_pos = height - 50
                text_obj = p.beginText(50, y_pos)
                text_obj.setFont("Helvetica", 9)

            text_obj.textLine(line)
            y_pos -= 12

        p.drawText(text_obj)
        y_pos -= 10

    # Fabric Check Status
    if y_pos < 80:
        p.showPage()
        y_pos = height - 50

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "Fabric Check:")
    y_pos -= 15
    p.setFont("Helvetica", 10)
    handfeel = getattr(inspection, 'fabric_handfeel', 'OK') or 'OK'
    pilling = getattr(inspection, 'fabric_pilling', 'None') or 'None'

    p.drawString(50, y_pos, "Handfeel: ")
    if handfeel == 'Not OK':
        p.setFillColorRGB(1, 0, 0)
    else:
        p.setFillColorRGB(0, 0.5, 0)
    p.drawString(110, y_pos, handfeel)
    p.setFillColorRGB(0, 0, 0)

    p.drawString(200, y_pos, "Pilling: ")
    if pilling == 'High':
        p.setFillColorRGB(1, 0, 0)
    elif pilling == 'Low':
        p.setFillColorRGB(1, 0.5, 0)
    else:
        p.setFillColorRGB(0, 0.5, 0)
    p.drawString(250, y_pos, pilling)
    p.setFillColorRGB(0, 0, 0)
    y_pos -= 25

    # Accessories Checklist Table
    accessories_data = getattr(inspection, 'accessories_data', []) or []
    if accessories_data:
        if y_pos < 100:
            p.showPage()
            y_pos = height - 50

        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_pos, "Accessories Checklist:")
        y_pos -= 20

        p.setFont("Helvetica-Bold", 9)
        p.setFillColorRGB(0.9, 0.9, 0.9)
        p.rect(50, y_pos - 15, 500, 15, fill=1)
        p.setFillColorRGB(0, 0, 0)
        p.drawString(55, y_pos - 12, "Item")
        p.drawString(250, y_pos - 12, "Remarks")
        y_pos -= 15

        p.setFont("Helvetica", 9)
        for acc in accessories_data:
            if y_pos < 50:
                p.showPage()
                y_pos = height - 50

            p.rect(50, y_pos - 15, 500, 15)
            p.drawString(55, y_pos - 12, str(acc.get('name', ''))[:30])

            comment = str(acc.get('comment', ''))
            if comment == 'Not Ok':
                p.setFillColorRGB(1, 0, 0)
                p.setFont("Helvetica-Bold", 9)
            elif comment == 'Available':
                p.setFillColorRGB(1, 0.5, 0)
                p.setFont("Helvetica-Bold", 9)
            elif comment in ['Ok', 'Improved']:
                p.setFillColorRGB(0, 0.5, 0)
                p.setFont("Helvetica", 9)
            else:
                p.setFillColorRGB(0, 0, 0)
                p.setFont("Helvetica", 9)

            p.drawString(250, y_pos - 12, comment[:65])
            p.setFillColorRGB(0, 0, 0)
            p.setFont("Helvetica", 9)
            y_pos -= 15

        y_pos -= 10

    # Customer Comments Addressed
    if y_pos < 50:
        p.showPage()
        y_pos = height - 50

    addressed = getattr(inspection, 'customer_comments_addressed', False)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y_pos, "Customer Comments Addressed: ")
    if addressed:
        p.setFillColorRGB(0, 0.5, 0)
        p.drawString(220, y_pos, "✓ YES")
    else:
        p.setFillColorRGB(1, 0.5, 0)
        p.drawString(220, y_pos, "○ NO")
    p.setFillColorRGB(0, 0, 0)
    y_pos -= 25

    # Evaluation Comments
    if y_pos < 100:
        p.showPage()
        y_pos = height - 50

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "Evaluation Comments (Customer → QA):")
    y_pos -= 20

    comparison_pairs = [
        ("Fit", inspection.customer_fit_comments, inspection.qa_fit_comments),
        ("Workmanship", inspection.customer_workmanship_comments, inspection.qa_workmanship_comments),
        ("Wash", inspection.customer_wash_comments, inspection.qa_wash_comments),
        ("Fabric", inspection.customer_fabric_comments, inspection.qa_fabric_comments),
        ("Accessories", inspection.customer_accessories_comments, inspection.qa_accessories_comments),
    ]

    for category, cust_comment, qa_comment in comparison_pairs:
        if cust_comment or qa_comment:
            if y_pos < 80:
                p.showPage()
                y_pos = height - 50

            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y_pos, f"{category}:")
            y_pos -= 12

            if cust_comment:
                p.setFont("Helvetica-Oblique", 9)
                p.setFillColorRGB(0.6, 0.4, 0)
                p.drawString(60, y_pos, "Customer:")
                y_pos -= 12
                comment_lines = cust_comment.replace('\r\n', '\n').replace('\r', '\n').split('\n')
                for comment_line in comment_lines:
                    wrapped_lines = textwrap.wrap(comment_line, width=85) if comment_line.strip() else ['']
                    for line in wrapped_lines:
                        if y_pos < 50:
                            p.showPage()
                            y_pos = height - 50
                            p.setFont("Helvetica-Oblique", 9)
                            p.setFillColorRGB(0.6, 0.4, 0)
                        p.drawString(70, y_pos, line)
                        y_pos -= 12
                p.setFillColorRGB(0, 0, 0)

            if qa_comment:
                p.setFont("Helvetica", 9)
                p.setFillColorRGB(0, 0, 0.6)
                p.drawString(60, y_pos, "QA: " + qa_comment[:80])
                y_pos -= 12
                p.setFillColorRGB(0, 0, 0)

            y_pos -= 5

    draw_text_block("Customer Feedback Summary:", inspection.customer_remarks)
    draw_text_block("Final Remarks:", inspection.remarks)

    # Images Page
    images = inspection.images.all()
    if images.exists():
        p.showPage()
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "INSPECTION IMAGES")

        img_width = 250
        img_height = 200
        row_gap = 50
        start_y = height - 100
        current_y = start_y

        for i, img_obj in enumerate(images):
            col = i % 2
            if i > 0 and col == 0:
                current_y -= (img_height + row_gap)

            if current_y - img_height < 50:
                p.showPage()
                p.setFont("Helvetica-Bold", 16)
                p.drawString(50, height - 50, "INSPECTION IMAGES (Cont.)")
                current_y = start_y

            x = 50 if col == 0 else 320
            y = current_y - img_height

            try:
                with PILImage.open(img_obj.image) as pil_img:
                    if pil_img.mode in ("RGBA", "P"):
                        pil_img = pil_img.convert("RGB")
                    pil_img.thumbnail((800, 800))
                    img_buffer = io.BytesIO()
                    pil_img.save(img_buffer, format='JPEG', quality=85, optimize=True)
                    img_buffer.seek(0)
                    reportlab_img = ImageReader(img_buffer)
                    p.drawImage(reportlab_img, x, y, width=img_width, height=img_height, preserveAspectRatio=True)

                p.setFont("Helvetica-Bold", 10)
                p.setFillColorRGB(0, 0, 0)
                caption = img_obj.caption or "Image"
                p.drawCentredString(x + (img_width / 2), y - 15, caption)
            except Exception:
                p.drawString(x, y, "Error loading image")

    p.save()
    buffer.seek(0)
    return buffer
