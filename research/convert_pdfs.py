"""Convert the archived reference PDFs to page-addressable Markdown text."""

from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "sources"
OUTPUT = ROOT / "sources-md"

DOCUMENTS = {
    "nasa-artemis-science-hls-progress-2022": "https://ntrs.nasa.gov/api/citations/20220012459/downloads/Brazilian%20Space%20Agency%20-%20Artemis%20Science%20slides%20-%20Weber.pdf",
    "nasa-hls-capabilities-2022": "https://ntrs.nasa.gov/api/citations/20220015885/downloads/22%2010%2025%20ASCEND%20HLS%20Panel%20.pdf",
    "nasa-artemis-iii-progress-2026": "https://www.nasa.gov/wp-content/uploads/2026/03/1-going-back-to-the-moon.pdf",
    "nasa-engineering-hls-specs-2024": "https://ntrs.nasa.gov/api/citations/20240011013/downloads/Artemis%20Status%202024%20240826.pdf",
    "nasa-ntrs-starship-hls-2024": "https://ntrs.nasa.gov/api/citations/20240012057/downloads/MST_2024_KY_v1.pdf",
    "nasa-ntrs-hls-update-2025": "https://ntrs.nasa.gov/api/citations/20240012719/downloads/HLS%20Update%20Kent%20Chojnacki%20IEEE%20Aero%202025%20v2.pdf",
    "nasa-oig-hls-2026": "https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf",
}


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    for name, url in DOCUMENTS.items():
        pdf = SOURCES / f"{name}.pdf"
        extracted = subprocess.check_output(["pdftotext", "-raw", str(pdf), "-"])
        pages = extracted.decode("utf-8", errors="replace").split("\f")
        if not pages[-1].strip():
            pages.pop()
        lines = [
            f"# {name.replace('-', ' ').title()}",
            "",
            f"Source PDF: [{url}]({url})",
            f"Local original: [`../sources/{pdf.name}`](../sources/{pdf.name})",
            "",
            "> Automatically extracted text. Page headings correspond to PDF page numbers, not printed page numbers. Figures, image captions embedded as graphics, columns, and tables may be incomplete; inspect the PDF or screenshots before relying on visual details.",
            "",
        ]
        for number, page in enumerate(pages, start=1):
            lines.extend((f"## PDF page {number}", "", page.strip(), ""))
        output = OUTPUT / f"{name}.md"
        output.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
        print(f"{output.relative_to(ROOT)}: {len(pages)} pages")


if __name__ == "__main__":
    main()
