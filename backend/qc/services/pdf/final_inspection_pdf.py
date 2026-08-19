import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage


def generate_final_inspection_pdf(final_inspection):
    """
    Generate professional PDF report for Final Inspection (AQL-based shipment audits).
    """
    buffer = io.BytesIO()
    width, height = A4
    p = canvas.Canvas(buffer, pagesize=A4)
    y_pos = height - 50

    def check_page_break(y, required_space=50):
        if y < required_space:
            p.showPage()
            return height - 50
        return y

    # Page 1: Header
    p.setFont("Helvetica-Bold", 22)
    p.drawString(50, y_pos, "FINAL INSPECTION REPORT")

    result = final_inspection.result
    p.setFont("Helvetica-Bold", 18)
    if result == 'Pass':
        p.setFillColorRGB(0, 0.6, 0)
        badge_text = "PASS"
    elif result == 'Fail':
        p.setFillColorRGB(1, 0, 0)
        badge_text = "FAIL"
    else:
        p.setFillColorRGB(0.5, 0.5, 0.5)
        badge_text = "PENDING"

    p.drawRightString(550, y_pos, f"RESULT: {badge_text}")
    p.setFillColorRGB(0, 0, 0)
    y_pos -= 40

    # General Information
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "1. General Information")
    y_pos -= 20

    data = [
        ["Customer:", final_inspection.customer.name if final_inspection.customer else 'N/A', "Inspection Date:", final_inspection.inspection_date.strftime('%d-%b-%Y')],
        ["AQL Standard:", final_inspection.get_aql_standard_display() if hasattr(final_inspection, 'get_aql_standard_display') else final_inspection.aql_standard, "Order No:", final_inspection.order_no],
        ["Factory:", final_inspection.factory, "Style No:", final_inspection.style_no],
        ["Color:", final_inspection.color, "Inspection Attempt:", final_inspection.get_inspection_attempt_display() if hasattr(final_inspection, 'get_inspection_attempt_display') else final_inspection.inspection_attempt],
    ]

    row_height = 20
    col_widths = [80, 180, 90, 150]
    x_start = 50

    p.setFont("Helvetica", 10)
    for row in data:
        curr_x = x_start
        for i, cell in enumerate(row):
            p.rect(curr_x, y_pos - row_height + 5, col_widths[i], row_height, stroke=1, fill=0)
            p.drawString(curr_x + 5, y_pos - 10, str(cell))
            curr_x += col_widths[i]
        y_pos -= row_height

    y_pos -= 20

    # AQL Result Summary
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "2. AQL Result Summary")
    y_pos -= 20

    headers = ["Sample Size", "Critical (0)", f"Major ({final_inspection.aql_major})", f"Minor ({final_inspection.aql_minor})", "Result"]
    col_widths = [100, 100, 100, 100, 100]
    curr_x = 50

    p.setFillColorRGB(0.9, 0.9, 0.9)
    p.rect(50, y_pos - 20, 500, 20, fill=1)
    p.setFillColorRGB(0, 0, 0)

    for i, h in enumerate(headers):
        p.drawString(curr_x + 5, y_pos - 15, h)
        curr_x += col_widths[i]
    y_pos -= 20

    values = [
        str(final_inspection.sample_size),
        f"{final_inspection.critical_found} / {final_inspection.max_allowed_critical}",
        f"{final_inspection.major_found} / {final_inspection.max_allowed_major}",
        f"{final_inspection.minor_found} / {final_inspection.max_allowed_minor}",
        badge_text
    ]

    curr_x = 50
    for i, v in enumerate(values):
        p.rect(curr_x, y_pos - 20, col_widths[i], 20)
        if i == 4:
            if v == "PASS":
                p.setFillColorRGB(0, 0.6, 0)
            elif v == "FAIL":
                p.setFillColorRGB(1, 0, 0)
            p.setFont("Helvetica-Bold", 10)

        p.drawString(curr_x + 5, y_pos - 15, v)
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica", 10)
        curr_x += col_widths[i]

    y_pos -= 40

    # Shipment Quantities
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "3. Shipment Quantities")
    y_pos -= 20

    qty_data = [
        ["Total Order Qty:", str(final_inspection.total_order_qty)],
        ["Presented Qty:", str(final_inspection.presented_qty)],
        ["Total Cartons:", str(final_inspection.total_cartons)],
        ["Selected Cartons:", str(final_inspection.selected_cartons)],
        ["Net Weight (kg):", str(final_inspection.net_weight)],
        ["Gross Weight (kg):", str(final_inspection.gross_weight)],
    ]

    for row in qty_data:
        p.drawString(50, y_pos, row[0])
        p.drawString(200, y_pos, row[1])
        y_pos -= 15

    # Page 2: Measurements
    p.showPage()
    y_pos = height - 50
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y_pos, "4. Measurement Data")
    y_pos -= 30

    if final_inspection.measurements.exists():
        headers = ["POM", "Tol (+/-)", "Standard", "S1", "S2", "S3", "S4", "S5", "S6"]
        col_widths = [140, 50, 50, 40, 40, 40, 40, 40, 40]

        p.setFont("Helvetica-Bold", 9)
        p.setFillColorRGB(0.9, 0.9, 0.9)
        p.rect(50, y_pos - 20, sum(col_widths), 20, fill=1)
        p.setFillColorRGB(0, 0, 0)

        curr_x = 50
        for i, h in enumerate(headers):
            p.drawString(curr_x + 5, y_pos - 14, h)
            curr_x += col_widths[i]
        y_pos -= 20

        p.setFont("Helvetica", 9)
        for m in final_inspection.measurements.all():
            samples_dict = {s.index: s.value for s in m.samples.all()}

            def get_sample_val(idx):
                val = samples_dict.get(idx)
                return val if val is not None else "-"

            vals = [
                m.pom_name, str(m.tol), str(m.spec),
                get_sample_val(1), get_sample_val(2), get_sample_val(3),
                get_sample_val(4), get_sample_val(5), get_sample_val(6)
            ]
            curr_x = 50

            for i, v in enumerate(vals):
                p.rect(curr_x, y_pos - 20, col_widths[i], 20)
                is_fail = False
                if i > 2 and v and v != "-":
                    try:
                        val_float = float(v)
                        if abs(val_float - m.spec) > m.tol:
                            is_fail = True
                    except Exception:
                        pass

                if is_fail:
                    p.setFillColorRGB(1, 0, 0)
                    p.setFont("Helvetica-Bold", 9)
                else:
                    p.setFillColorRGB(0, 0, 0)
                    p.setFont("Helvetica", 9)

                p.drawString(curr_x + 5, y_pos - 14, str(v))
                curr_x += col_widths[i]

            y_pos -= 20
            y_pos = check_page_break(y_pos)
    else:
        p.drawString(50, y_pos, "No measurements recorded.")

    # Page 3: Defects
    p.showPage()
    y_pos = height - 50
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y_pos, "5. Defect Breakdown")
    y_pos -= 30

    if final_inspection.defects.exists():
        headers = ["Description", "Severity", "Count"]
        col_widths = [250, 100, 80]

        p.setFont("Helvetica-Bold", 10)
        p.setFillColorRGB(0.9, 0.9, 0.9)
        p.rect(50, y_pos - 20, 430, 20, fill=1)
        p.setFillColorRGB(0, 0, 0)

        curr_x = 50
        for i, h in enumerate(headers):
            p.drawString(curr_x + 5, y_pos - 15, h)
            curr_x += col_widths[i]
        y_pos -= 20

        p.setFont("Helvetica", 10)
        for defect in final_inspection.defects.all():
            vals = [defect.description, defect.severity, str(defect.count)]
            curr_x = 50

            for i, v in enumerate(vals):
                p.rect(curr_x, y_pos - 20, col_widths[i], 20)
                if i == 1:
                    if v == 'Critical':
                        p.setFillColorRGB(1, 0, 0)
                    elif v == 'Major':
                        p.setFillColorRGB(1, 0.5, 0)

                p.drawString(curr_x + 5, y_pos - 15, v)
                p.setFillColorRGB(0, 0, 0)
                curr_x += col_widths[i]

            y_pos -= 20
            y_pos = check_page_break(y_pos)
    else:
        p.drawString(50, y_pos, "No defects recorded.")

    # Page 4: Photo Appendix
    p.showPage()
    y_pos = height - 50
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y_pos, "6. Photo Appendix")
    y_pos -= 30

    categories = ['Packaging', 'Labeling', 'Defect', 'General', 'Measurement', 'On-Site Test']

    for category in categories:
        cat_images = final_inspection.images.filter(category=category)
        if not cat_images.exists():
            continue

        if y_pos < 250:
            p.showPage()
            y_pos = height - 50

        p.setFont("Helvetica-Bold", 14)
        p.setFillColorRGB(0, 0, 0.5)
        p.drawString(50, y_pos, category)
        p.line(50, y_pos - 5, 550, y_pos - 5)
        p.setFillColorRGB(0, 0, 0)
        y_pos -= 30

        row_y = y_pos
        for i, img_obj in enumerate(cat_images):
            if row_y < 220:
                p.showPage()
                y_pos = height - 50
                row_y = y_pos

            is_right = i % 2 != 0
            x = 310 if is_right else 50

            try:
                with PILImage.open(img_obj.image) as pil_img:
                    if pil_img.mode != "RGB":
                        pil_img = pil_img.convert("RGB")
                    pil_img.thumbnail((600, 600))
                    img_buffer = io.BytesIO()
                    pil_img.save(img_buffer, format='JPEG')
                    img_buffer.seek(0)

                    p.drawImage(ImageReader(img_buffer), x, row_y - 180, width=240, height=180, preserveAspectRatio=True)
                    p.rect(x, row_y - 180, 240, 180)

                    caption = img_obj.caption or "No Caption"
                    p.setFont("Helvetica", 9)
                    p.drawCentredString(x + 120, row_y - 195, caption[:50])
            except Exception:
                p.drawString(x, row_y - 100, "Image Missing")

            if is_right:
                row_y -= 230

        if len(cat_images) % 2 != 0:
            row_y -= 230

        y_pos = row_y

    p.save()
    buffer.seek(0)
    return buffer
