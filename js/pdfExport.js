/* pdfExport.js — exports the created template as a printable PDF */

const PdfExport = (() => {
  function formatText(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function fitTextToWidth(doc, text, maxWidth) {
    const cleanText = formatText(text);
    if (!cleanText) return "";
    if (doc.getTextWidth(cleanText) <= maxWidth) return cleanText;

    const ellipsis = "...";
    let low = 0;
    let high = cleanText.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = cleanText.slice(0, mid).trimEnd() + ellipsis;
      if (doc.getTextWidth(candidate) <= maxWidth) low = mid;
      else high = mid - 1;
    }
    return cleanText.slice(0, low).trimEnd() + ellipsis;
  }

  function drawCheckmark(doc, x, y, size) {
    doc.setLineWidth(1.2);
    doc.line(x + 3, y + size * 0.55, x + size * 0.42, y + size - 3);
    doc.line(x + size * 0.42, y + size - 3, x + size - 3, y + 3);
    doc.setLineWidth(0.5);
  }

  function drawCheckbox(doc, x, y, size, checked) {
    doc.rect(x, y, size, size);
    if (checked) drawCheckmark(doc, x, y, size);
  }

  function drawHeaderCell(doc, x, y, width, height, label, value) {
    doc.rect(x, y, width, height);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label, x + 4, y + 8);
    const cleanValue = formatText(value);
    if (cleanValue) {
      doc.setFontSize(8.5);
      doc.text(fitTextToWidth(doc, cleanValue, width - 8), x + 4, y + 18);
    }
  }

  function renderTemplateDocument(record, template) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4", compress: false, precision: 16 });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 46;
    const top = 44;
    const width = pageWidth - left * 2;
    const colNoW = 28;
    const colItemW = 242;
    const colYesW = 28;
    const colNoW2 = 28;
    const colRemarkW = width - colNoW - colItemW - colYesW - colNoW2;
    const colNoX = left;
    const colItemX = colNoX + colNoW;
    const colYesX = colItemX + colItemW;
    const colNo2X = colYesX + colYesW;
    const colRemarkX = colNo2X + colNoW2;
    let y = top;

    const answersByItemId = new Map((Array.isArray(record.answers) ? record.answers : []).map(answer => [answer.itemId, answer]));
    const items = Array.isArray(template.items) ? template.items : [];

    function drawPageHeader() {
      doc.setDrawColor(0, 0, 0);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      doc.setLineWidth(0.75);
      doc.rect(left, y, width, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(formatText(template.name || "EHS EQUIPMENT/LINE RELEASE CHECKLIST"), pageWidth / 2, y + 18, { align: "center" });
      y += 28;

      const halfWidth = width / 2;
      const checkboxRowHeight = 22;
      const checkboxSize = 10;
      const checkboxRows = [
        [
          ["New Product Process", record.newProductProcess],
          ["Product Process Change", record.productProcessChange]
        ],
        [
          ["New Equipment/Fixture", record.newEquipmentFuture],
          ["Equipment/Fixture Modification", record.equipmentModification]
        ]
      ];

      checkboxRows.forEach((row) => {
        doc.rect(left, y, width, checkboxRowHeight);
        doc.line(left + halfWidth, y, left + halfWidth, y + checkboxRowHeight);
        row.forEach((cell, cellIndex) => {
          const cellX = left + (halfWidth * cellIndex);
          const label = cell[0];
          const checked = Boolean(cell[1]);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(label, cellX + 4, y + 14);
          drawCheckbox(doc, cellX + halfWidth - 22, y + 6, checkboxSize, checked);
        });
        y += checkboxRowHeight;
      });

      const fieldRowHeight = 26;
      const fieldRows = [
        [["Equipment/Line No.", record.equipmentLineNo], ["Equipment OEM Contact:", record.equipmentOemContact]],
        [["Product/Process Name:", record.productProcessName], ["Equipment/Line Location:", record.inspectionLocation]],
        [["Inspection Date:", record.inspectionDate], ["Inspection Conducted by:", record.inspectionConductedBy]]
      ];

      fieldRows.forEach((row) => {
        doc.rect(left, y, width, fieldRowHeight);
        doc.line(left + halfWidth, y, left + halfWidth, y + fieldRowHeight);

        row.forEach((cell, cellIndex) => {
          const cellX = left + (halfWidth * cellIndex);
          const label = cell[0];
          const value = formatText(cell[1]);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.text(label, cellX + 4, y + 9);
          const boxX = cellX + 96;
          doc.rect(boxX, y + 3, halfWidth - 100, 20);
          if (value) {
            doc.setFontSize(8.2);
            doc.text(fitTextToWidth(doc, value, halfWidth - 108), boxX + 4, y + 17);
          }
        });
        y += fieldRowHeight;
      });

        const headerHeight = 36;
        const statusTopHeight = 18;
        doc.setFillColor(192, 192, 192);
        doc.rect(left, y, width, headerHeight, "F");
        doc.rect(left, y, width, headerHeight);
        doc.line(colItemX, y, colItemX, y + headerHeight);
        doc.line(colRemarkX, y, colRemarkX, y + headerHeight);
        doc.line(colYesX, y, colYesX, y + headerHeight);
        doc.line(colNo2X, y + statusTopHeight, colNo2X, y + headerHeight);
        doc.line(colYesX, y + statusTopHeight, colNo2X + colNoW2, y + statusTopHeight);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("No.", colNoX + colNoW / 2, y + 23, { align: "center" });
        doc.text("Check Items", colItemX + colItemW / 2, y + 23, { align: "center" });
        doc.text("STATUS", colYesX + (colYesW + colNoW2) / 2, y + 8, { align: "center" });
        doc.text("Yes", colYesX + colYesW / 2, y + 30, { align: "center" });
        doc.text("No", colNo2X + colNoW2 / 2, y + 30, { align: "center" });
        doc.text("Remarks", colRemarkX + colRemarkW / 2, y + 23, { align: "center" });
        y += headerHeight;
    }

    drawPageHeader();

    let itemNumber = 0;
    items.forEach((item) => {
      if (item.type === "section") {
        const sectionText = formatText(item.text) || " ";
        const sectionHeight = 16;

        if (y + sectionHeight + 46 > pageHeight - 20) {
          doc.addPage();
          y = top;
          drawPageHeader();
        }

        doc.setFillColor(217, 217, 217);
        doc.rect(left, y, width, sectionHeight, "F");
        doc.rect(left, y, width, sectionHeight);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(fitTextToWidth(doc, sectionText, width - 8), colItemX + 4, y + 11);
        y += sectionHeight;
        return;
      }

      const answer = answersByItemId.get(item.id) || {};
      const itemText = formatText(item.text) || " ";
      const itemLines = doc.splitTextToSize(itemText, colItemW - 8);
      const rowHeight = Math.max(18, itemLines.length * 8 + 6);

      if (y + rowHeight + 46 > pageHeight - 20) {
        doc.addPage();
        y = top;
        drawPageHeader();
      }

      doc.rect(left, y, width, rowHeight);
      doc.line(colItemX, y, colItemX, y + rowHeight);
      doc.line(colYesX, y, colYesX, y + rowHeight);
      doc.line(colNo2X, y, colNo2X, y + rowHeight);
      doc.line(colRemarkX, y, colRemarkX, y + rowHeight);

      itemNumber += 1;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(String(itemNumber), colNoX + colNoW / 2, y + 10, { align: "center" });
      doc.text(fitTextToWidth(doc, itemText, colItemW - 8), colItemX + 4, y + 9);

      const boxSize = 9;
      const yesBoxX = colYesX + (colYesW - boxSize) / 2;
      const noBoxX = colNo2X + (colNoW2 - boxSize) / 2;
      drawCheckbox(doc, yesBoxX, y + 4, boxSize, answer.value === "yes");
      drawCheckbox(doc, noBoxX, y + 4, boxSize, answer.value === "no");

      if (formatText(answer.remarks)) {
        doc.setFontSize(6.6);
        doc.text(fitTextToWidth(doc, answer.remarks, colRemarkW - 8), colRemarkX + 4, y + 9);
      }

      y += rowHeight;
    });

    const remarksHeight = 34;
    const noteHeight = 26;
    if (y + remarksHeight + noteHeight > pageHeight - 20) {
      doc.addPage();
      y = top;
    }

    doc.rect(left, y, width, remarksHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Overall Remarks:", left + 4, y + 11);
    const overallText = formatText(record.overallRemarks || template.customFooter || "");
    if (overallText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.text(fitTextToWidth(doc, overallText, width - 10), left + 4, y + 21);
    }
    y += remarksHeight;

    doc.rect(left, y, width, noteHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Note:", left + 4, y + 11);
    const noteText = formatText(record.note || "");
    if (noteText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.text(fitTextToWidth(doc, noteText, width - 10), left + 4, y + 21);
    }

    return doc;
  }

  function createPdfDocument(record, template) {
    if (!template || !Array.isArray(template.items)) {
      throw new Error("Template not found or invalid.");
    }
    return renderTemplateDocument(record, template);
  }

  function exportRecord(record, template) {
    const doc = createPdfDocument(record, template);
    const safeName = (record.title || template.name || "checklist").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    doc.save(`${safeName}.pdf`);
  }

  function getPdfBlob(record, template) {
    const doc = createPdfDocument(record, template);
    return doc.output("blob");
  }

  return { exportRecord, getPdfBlob };
})();
