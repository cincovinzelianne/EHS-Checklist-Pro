/* pdfExport.js — builds a formal audit checklist PDF exactly matching Template.pdf format */

const PdfExport = (() => {

  function createPdfDocument(record, template) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ 
      unit: "pt", 
      format: "a4",
      compress: false,
      precision: 16
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 30;
    const marginRight = 30;
    const marginTop = 25;
    const marginBottom = 25;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    let y = marginTop;

    // Set default font
    doc.setFont("helvetica");

    // Header - Main Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, y);
    y += 30;

    // Top checkboxes section
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const checkboxSize = 10;
    const checkboxGap = 5;

    // Row 1
    let label1X = marginLeft;
    doc.text("New Product Process", label1X, y);
    let cb1X = label1X + doc.getTextWidth("New Product Process") + 8;
    doc.rect(cb1X, y - 8, checkboxSize, checkboxSize);
    if (record.newProductProcess) {
      doc.setLineWidth(1.5);
      doc.line(cb1X + 2, y - 3, cb1X + 4, y - 5);
      doc.line(cb1X + 4, y - 5, cb1X + 8, y - 10);
      doc.setLineWidth(0.5);
    }

    let label2X = marginLeft + (contentWidth / 2);
    doc.text("Product Process Change", label2X, y);
    let cb2X = label2X + doc.getTextWidth("Product Process Change") + 8;
    doc.rect(cb2X, y - 8, checkboxSize, checkboxSize);
    if (record.productProcessChange) {
      doc.setLineWidth(1.5);
      doc.line(cb2X + 2, y - 3, cb2X + 4, y - 5);
      doc.line(cb2X + 4, y - 5, cb2X + 8, y - 10);
      doc.setLineWidth(0.5);
    }
    y += 25;

    // Row 2
    let label3X = marginLeft;
    doc.text("New Equipment/Future", label3X, y);
    let cb3X = label3X + doc.getTextWidth("New Equipment/Future") + 8;
    doc.rect(cb3X, y - 8, checkboxSize, checkboxSize);
    if (record.newEquipmentFuture) {
      doc.setLineWidth(1.5);
      doc.line(cb3X + 2, y - 3, cb3X + 4, y - 5);
      doc.line(cb3X + 4, y - 5, cb3X + 8, y - 10);
      doc.setLineWidth(0.5);
    }

    let label4X = marginLeft + (contentWidth / 2);
    doc.text("Equipment Modification", label4X, y);
    let cb4X = label4X + doc.getTextWidth("Equipment Modification") + 8;
    doc.rect(cb4X, y - 8, checkboxSize, checkboxSize);
    if (record.equipmentModification) {
      doc.setLineWidth(1.5);
      doc.line(cb4X + 2, y - 3, cb4X + 4, y - 5);
      doc.line(cb4X + 4, y - 5, cb4X + 8, y - 10);
      doc.setLineWidth(0.5);
    }
    y += 35;

    // Fields table
    const fieldHeight = 22;
    const fieldLabelWidth = 130;
    const fieldValueWidth = (contentWidth - fieldLabelWidth * 2) / 2;

    function drawField(label, value, startX, startY) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(label + ":", startX, startY);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      const fieldX = startX + fieldLabelWidth - 5;
      doc.rect(fieldX, startY - 13, fieldValueWidth, fieldHeight);
      doc.text(value || "", fieldX + 8, startY);
    }

    // Row 1
    drawField("Equipment/Line No.", record.equipmentLineNo || "", marginLeft, y);
    drawField("Equipment OEM Contact", record.equipmentOemContact || "", marginLeft + contentWidth / 2, y);
    y += fieldHeight + 12;

    // Row 2
    drawField("Product/Process Name", record.productProcessName || "", marginLeft, y);
    drawField("Inspection Location", record.inspectionLocation || "", marginLeft + contentWidth / 2, y);
    y += fieldHeight + 12;

    // Row3
    drawField("Inspection Date", record.inspectionDate || "", marginLeft, y);
    drawField("Inspection Conducted By", record.inspectionConductedBy || "", marginLeft + contentWidth / 2, y);
    y += fieldHeight + 30;

    // Checklist items header
    const colNoX = marginLeft;
    const colCheckX = marginLeft + 35;
    const colYesX = marginLeft + contentWidth - 110;
    const colNo2X = marginLeft + contentWidth - 55;
    const colRemarksX = colNo2X + 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(217, 217, 217);
    doc.rect(marginLeft - 2, y - 13, contentWidth + 4, 23, "F");
    doc.setTextColor(0, 0, 0);
    doc.text("No.", colNoX + 4, y);
    doc.text("Check Items", colCheckX, y);
    doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
    doc.text("Yes", colYesX + 6, y);
    doc.text("No", colNo2X + 6, y);
    doc.text("Remarks", colRemarksX, y);
    y += 28;

    // Draw checklist items
    let currentSection = null;
    let itemNumber = 0;

    record.answers.forEach((answer, idx) => {
      const item = template.items.find(i => i.id === answer.itemId) || { text: "(Deleted item)" };

      // Check if item is a section header (all caps or starts with header pattern)
      if (item.text.toUpperCase() === item.text && item.text.length > 5 && !item.text.includes(".")) {
        // Section header
        if (y + 30 > pageHeight - marginBottom - 80) {
          // New page
          doc.addPage();
          y = marginTop + 20;
          // Redraw header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
          const titleWidth = doc.getTextWidth(titleText);
          doc.text(titleText, (pageWidth - titleWidth) / 2, y);
          y += 55;
          // Redraw table header
          doc.setFontSize(10);
          doc.setFillColor(217, 217, 217);
          doc.rect(marginLeft - 2, y - 13, contentWidth + 4, 23, "F");
          doc.text("No.", colNoX + 4, y);
          doc.text("Check Items", colCheckX, y);
          doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
          doc.text("Yes", colYesX + 6, y);
          doc.text("No", colNo2X + 6, y);
          doc.text("Remarks", colRemarksX, y);
          y += 28;
        }

        currentSection = item.text;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setFillColor(230, 230, 230);
        doc.rect(marginLeft - 2, y - 13, contentWidth + 4, 23, "F");
        doc.text(currentSection, colCheckX, y);
        y += 28;
        return;
      }

      itemNumber++;
      const itemText = item.text;
      const itemLines = doc.splitTextToSize(itemText, colYesX - colCheckX - 12);
      const blockHeight = Math.max(itemLines.length * 13, 22);

      // Page break check
      if (y + blockHeight + 20 > pageHeight - marginBottom - 80) {
        // New page
        doc.addPage();
        y = marginTop + 20;
        // Redraw header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
        const titleWidth = doc.getTextWidth(titleText);
        doc.text(titleText, (pageWidth - titleWidth) / 2, y);
        y += 55;
        // Redraw table header
        doc.setFontSize(10);
        doc.setFillColor(217, 217, 217);
        doc.rect(marginLeft - 2, y - 13, contentWidth + 4, 23, "F");
        doc.text("No.", colNoX + 4, y);
        doc.text("Check Items", colCheckX, y);
        doc.text("STATUS", (colYesX + colNo2X) / 2, y, { align: "center" });
        doc.text("Yes", colYesX + 6, y);
        doc.text("No", colNo2X + 6, y);
        doc.text("Remarks", colRemarksX, y);
        y += 28;
      }

      // Draw row border
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(marginLeft - 2, y - 13, contentWidth + 4, blockHeight + 13);

      // No column
      doc.text(String(itemNumber), colNoX + 4, y);

      // Check Items column
      doc.text(itemLines, colCheckX, y);

      // Yes/No checkboxes
      const boxSize = 12;
      doc.rect(colYesX, y - 10, boxSize, boxSize);
      if (answer.value === "yes") {
        doc.setLineWidth(1.5);
        doc.line(colYesX + 2, y - 5, colYesX + 4, y - 7);
        doc.line(colYesX + 4, y - 7, colYesX + 10, y - 11);
        doc.setLineWidth(0.5);
      }

      doc.rect(colNo2X, y - 10, boxSize, boxSize);
      if (answer.value === "no") {
        doc.setLineWidth(1.5);
        doc.line(colNo2X + 3, y - 8, colNo2X + 9, y - 3);
        doc.line(colNo2X + 9, y - 8, colNo2X + 3, y - 3);
        doc.setLineWidth(0.5);
      }

      // Remarks
      if (answer.remarks) {
        const remarksLines = doc.splitTextToSize(answer.remarks, contentWidth - colRemarksX + marginLeft);
        doc.text(remarksLines, colRemarksX, y);
      }

      y += blockHeight + 13;
    });

    // Overall Remarks
    if (y + 70 > pageHeight - marginBottom - 40) {
      doc.addPage();
      y = marginTop + 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Overall Remarks", marginLeft, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    if (record.overallRemarks) {
      const remarksLines = doc.splitTextToSize(record.overallRemarks, contentWidth);
      doc.text(remarksLines, marginLeft, y);
    }
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(0.5);
    doc.rect(marginLeft-2, y -13, contentWidth+4, 65);

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
