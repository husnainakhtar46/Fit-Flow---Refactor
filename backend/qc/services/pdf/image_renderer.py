import io
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage


def render_pdf_images(p, images, height, title="INSPECTION IMAGES"):
    """
    Render attached inspection images on separate PDF pages in a 2-column grid.
    """
    if not images.exists():
        return

    p.showPage()
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, title)

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
            p.drawString(50, height - 50, f"{title} (Cont.)")
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
