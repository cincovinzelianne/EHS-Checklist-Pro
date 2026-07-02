/* pdfExport.js — builds a formal audit checklist PDF from a completed checklist record */

const PdfExport = (() => {

  function createPdfDocument(record, template) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    
    let y = margin;

    // Header - Main Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("EHS EQUIPMENT/LINE RELEASE CHECKLIST", pageWidth / 2, y, { align: "center" });
    y += 30;

    // Top checkboxes
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const checkboxSize = 12;

    // Row 1
    let x1 = margin;
    doc.text("New Product Process", x1, y);
    x1 += 130;
    doc.rect(x1, y - 10, checkboxSize, checkboxSize);
    if (record.newProductProcess) {
      doc.setLineWidth(2);
      doc.line(x1 + 2, y - 2, x1 + 5, y - 5);
      doc.line(x1 + 5, y - 5, x1 + 10, y - 10);
      doc.setLineWidth(1);
    }

    let x2 = margin + 250;
    doc.text("Product Process Change", x2, y);
    x2 += 130;
    doc.rect(x2, y - 10, checkboxSize, checkboxSize);
    if (record.productProcessChange) {
      doc.setLineWidth(2);
      doc.line(x2 + 2, y - 2, x2 + 5, y - 5);
      doc.line(x2 + 5, y - 5, x2 + 10, y - 10);
      doc.setLineWidth(1);
    }
    y += 25;

    // Row 2
    let x3 = margin;
    doc.text("New Equipment/Future", x3, y);
    x3 += 130;
    doc.rect(x3, y - 10, checkboxSize, checkboxSize);
    if (record.newEquipmentFuture) {
      doc.setLineWidth(2);
      doc.line(x3 + 2, y - 2, x3 + 5, y - 5);
      doc.line(x3 + 5, y - 5, x3 + 10, y - 10);
      doc.setLineWidth(1);
    }

    let x4 = margin + 250;
    doc.text("Equipment Modification", x4, y);
    x4 += 130;
    doc.rect(x4, y - 10, checkboxSize, checkboxSize);
    if (record.equipmentModification) {
      doc.setLineWidth(2);
      doc.line(x4 + 2, y - 2, x4 + 5, y - 5);
      doc.line(x4 + 5, y - 5, x4 + 10, y - 10);
      doc.setLineWidth(1);
    }
    y += 30;

    // Fields table
    const fieldHeight = 25;
    const fieldLabelWidth = 120;
    const fieldValueWidth = (contentWidth - fieldLabelWidth * 2) / 2;

    function drawField(label, value, startX, startY) {
      doc.setFont("helvetica", "normal");
      doc.text(label + ":", startX, startY);
      doc.setDrawColor(0, 0, 0);
      doc.rect(startX + fieldLabelWidth - 10, startY - 15, fieldValueWidth, fieldHeight);
      doc.text(value || "", startX + fieldLabelWidth, startY);
    }

    // Row 1
    drawField("Equipment/Line No.", record.equipmentLineNo || "", margin, y);
    drawField("Equipment OEM Contact", record.equipmentOemContact || "", margin + contentWidth / 2, y);
    y += fieldHeight + 10;

    // Row 2
    drawField("Product/Process Name", record.productProcessName || "", margin, y);
    drawField("Inspection Location", record.inspectionLocation || "", margin + contentWidth / 2, y);
    y += fieldHeight + 10;

    // Row3
    drawField("Inspection Date", record.inspectionDate || "", margin, y);
    drawField("Inspection Conducted By", record.inspectionConductedBy || "", margin + contentWidth / 2, y);
    y += fieldHeight + 20;

    // Checklist items header
    const colNo = margin;
    const colCheckX = margin + 40;
    const colYesX = margin + contentWidth - 120;
    const colNo2X = margin + contentWidth - 60;
    const colRemarksX = colNo2X + 40;

    doc.setFont("helvetica", "bold");
    doc.setFillColor(200, 200, 200);
    doc.rect(margin - 2, y - 15, contentWidth + 4, 25, "F");
    doc.setTextColor(0, 0, 0);
    doc.text("No.", colNo + 5, y);
    doc.text("Check Items", colCheckX, y);
    doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
    doc.text("Yes", colYesX + 10, y);
    doc.text("No", colNo2X + 10, y);
    doc.text("Remarks", colRemarksX, y);
    y += 30;

    // Draw checklist items
    let currentSection = null;
    let itemNumber = 0;

    record.answers.forEach((answer, idx) => {
      const item = template.items.find(i => i.id === answer.itemId) || { text: "(Deleted item)" };

      // Check if item is a section header (all caps or starts with header pattern)
      if (item.text.toUpperCase() === item.text && item.text.length > 5 && !item.text.includes(".")) {
        // Section header
        if (y + 30 > pageHeight - margin - 80) {
          // New page
          doc.addPage();
          y = margin + 20;
          // Redraw header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.text("EHS EQUIPMENT/LINE RELEASE CHECKLIST", pageWidth / 2, y, { align: "center" });
          y += 50;
          // Redraw table header
          doc.setFontSize(11);
          doc.setFillColor(200, 200, 200);
          doc.rect(margin - 2, y - 15, contentWidth + 4, 25, "F");
          doc.text("No.", colNo + 5, y);
          doc.text("Check Items", colCheckX, y);
          doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
          doc.text("Yes", colYesX + 10, y);
          doc.text("No", colNo2X + 10, y);
          doc.text("Remarks", colRemarksX, y);
          y += 30;
        }

        currentSection = item.text;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setFillColor(230, 230, 230);
        doc.rect(margin - 2, y - 15, contentWidth + 4, 25, "F");
        doc.text(currentSection, colCheckX, y);
        y += 30;
        return;
      }

      itemNumber++;
      const itemText = item.text;
      const itemLines = doc.splitTextToSize(itemText, colYesX - colCheckX - 10);
      const blockHeight = Math.max(itemLines.length * 14, 25);

      // Page break check
      if (y + blockHeight + 20 > pageHeight - margin - 80) {
        // New page
        doc.addPage();
        y = margin + 20;
        // Redraw header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("EHS EQUIPMENT/LINE RELEASE CHECKLIST", pageWidth / 2, y, { align: "center" });
        y += 50;
        // Redraw table header
        doc.setFontSize(11);
        doc.setFillColor(200, 200, 200);
        doc.rect(margin - 2, y - 15, contentWidth + 4, 25, "F");
        doc.text("No.", colNo + 5, y);
        doc.text("Check Items", colCheckX, y);
        doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
        doc.text("Yes", colYesX + 10, y);
        doc.text("No", colNo2X + 10, y);
        doc.text("Remarks", colRemarksX, y);
        y += 30;
      }

      // Draw row border
      doc.setFont("helvetica", "normal");
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin - 2, y - 15, contentWidth + 4, blockHeight + 15);

      // No column
      doc.text(String(itemNumber), colNo + 5, y);

      // Check Items column
      doc.text(itemLines, colCheckX, y);

      // Yes/No checkboxes
      const boxSize = 14;
      doc.rect(colYesX, y - 11, boxSize, boxSize);
      if (answer.value === "yes") {
        doc.setLineWidth(2);
        doc.line(colYesX + 2, y - 4, colYesX + 5, y - 7);
        doc.line(colYesX + 5, y - 7, colYesX + 12, y - 12);
        doc.setLineWidth(0.5);
      }

      doc.rect(colNo2X, y - 11, boxSize, boxSize);
      if (answer.value === "no") {
        doc.setLineWidth(2);
        doc.line(colNo2X + 3, y - 9, colNo2X + 11, y - 2);
        doc.line(colNo2X + 11, y - 9, colNo2X + 3, y - 2);
        doc.setLineWidth(0.5);
      }

      // Remarks
      if (answer.remarks) {
        const remarksLines = doc.splitTextToSize(answer.remarks, contentWidth - colRemarksX + margin);
        doc.text(remarksLines, colRemarksX, y);
      }

      y += blockHeight + 15;
    });

    // Overall Remarks
    if (y + 60 > pageHeight - margin - 40) {
      doc.addPage();
      y = margin + 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Overall Remarks", margin, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    if (record.overallRemarks) {
      const remarksLines = doc.splitTextToSize(record.overallRemarks, contentWidth);
      doc.text(remarksLines, margin, y);
    }
    doc.setDrawColor(0,0,0);
    doc.rect(margin-2, y -15, contentWidth+4, 60);

    return doc;
  }

  function exportRecord(record, template) {
    const doc = createPdfDocument(record, template);
    const safeName = (record.title || template.name || "checklist").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    doc.save(`${safeName}.pdf`);
  }

  function getPdfBlob(record, template) {
    const doc = createPdfDocument(record, template);
    return doc.output('blob');
  }

  return { exportRecord, getPdfBlob };
})();