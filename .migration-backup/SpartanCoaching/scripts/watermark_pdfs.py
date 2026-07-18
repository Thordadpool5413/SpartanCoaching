"""
Adds a "personal use only" watermark to every page of every PDF
in client/public/resources/.

Watermark consists of:
  1. Diagonal "FOR PERSONAL USE ONLY" in light gray across the page center
  2. Small footer: "© Spartan Coaching — For personal use only.
     Not for resale or redistribution."

Run from project root: python3 scripts/watermark_pdfs.py
"""

import io
import os
import glob

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from reportlab.pdfgen import canvas

PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "client", "public", "resources")
FOOTER_TEXT = "© Spartan Coaching — For personal use only. Not for resale or redistribution."
DIAGONAL_TEXT = "FOR PERSONAL USE ONLY"


def build_watermark_bytes(page_width: float, page_height: float) -> bytes:
    """Return an in-memory PDF page containing the watermark overlay."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(page_width, page_height))

    # --- diagonal background text ---
    c.saveState()
    gray = Color(0.75, 0.75, 0.75, alpha=0.25)
    c.setFillColor(gray)
    c.setFont("Helvetica-Bold", 52)
    c.translate(page_width / 2, page_height / 2)
    c.rotate(42)
    c.drawCentredString(0, 0, DIAGONAL_TEXT)
    c.restoreState()

    # --- footer bar ---
    footer_height = 18
    c.saveState()
    c.setFillColor(Color(0.95, 0.95, 0.95, alpha=1))
    c.rect(0, 0, page_width, footer_height, fill=1, stroke=0)
    c.setFillColor(Color(0.3, 0.3, 0.3, alpha=1))
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(page_width / 2, 5, FOOTER_TEXT)
    c.restoreState()

    c.save()
    buf.seek(0)
    return buf.read()


def watermark_pdf(pdf_path: str) -> None:
    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        # Detect actual page dimensions (may differ per page)
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        wm_bytes = build_watermark_bytes(page_width, page_height)
        wm_page = PdfReader(io.BytesIO(wm_bytes)).pages[0]

        # Merge watermark under the existing content
        # (merge_page overlays wm on top; we want it behind, so overlay existing on top of wm)
        wm_page.merge_page(page)
        writer.add_page(wm_page)

    # Overwrite original in place
    with open(pdf_path, "wb") as f:
        writer.write(f)


def main():
    pattern = os.path.join(PDF_DIR, "*.pdf")
    pdf_files = sorted(glob.glob(pattern))

    if not pdf_files:
        print(f"No PDF files found in {PDF_DIR}")
        return

    print(f"Found {len(pdf_files)} PDF files. Applying watermark...\n")

    success = 0
    for pdf_path in pdf_files:
        name = os.path.basename(pdf_path)
        try:
            reader = PdfReader(pdf_path)
            original_pages = len(reader.pages)
            watermark_pdf(pdf_path)
            # Verify page count unchanged
            reader2 = PdfReader(pdf_path)
            new_pages = len(reader2.pages)
            if new_pages != original_pages:
                print(f"  WARNING {name}: page count changed {original_pages} -> {new_pages}")
            else:
                print(f"  OK  {name} ({new_pages} pages)")
                success += 1
        except Exception as e:
            print(f"  FAIL {name}: {e}")

    print(f"\nDone. {success}/{len(pdf_files)} files watermarked successfully.")


if __name__ == "__main__":
    main()
