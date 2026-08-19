"""
Facade module for backwards compatibility.
"""
from .pdf.evaluation_pdf import generate_pdf_buffer
from .pdf.final_inspection_pdf import generate_final_inspection_pdf

__all__ = [
    "generate_pdf_buffer",
    "generate_final_inspection_pdf",
]
