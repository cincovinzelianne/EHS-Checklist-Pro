/* pdfExport.js — builds a formal audit checklist PDF exactly matching user's image format */

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
    
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 40;
    const marginBottom = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    let y = marginTop;

    doc.setFont("helvetica");

    // Header - Main Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, y);
    y += 40;

    // Top checkboxes section
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const checkboxSize = 12;

    // Row 1
    let label1X = marginLeft;
    doc.text("New Product Process", label1X, y);
    let cb1X = label1X + doc.getTextWidth("New Product Process") + 10;
    doc.rect(cb1X, y - 9, checkboxSize, checkboxSize);
    if (record.newProductProcess) {
      doc.setLineWidth(2);
      doc.line(cb1X + 3, y - 2, cb1X + 5, y - 5);
      doc.line(cb1X + 5, y - 5, cb1X + 9, y - 11);
      doc.setLineWidth(0.5);
    }

    let label2X = marginLeft + (contentWidth / 2);
    doc.text("Product Process Change", label2X, y);
    let cb2X = label2X + doc.getTextWidth("Product Process Change") + 10;
    doc.rect(cb2X, y - 9, checkboxSize, checkboxSize);
    if (record.productProcessChange) {
      doc.setLineWidth(2);
      doc.line(cb2X + 3, y - 2, cb2X + 5, y - 5);
      doc.line(cb2X + 5, y - 5, cb2X + 9, y - 11);
      doc.setLineWidth(0.5);
    }
    y += 30;

    // Row 2
    let label3X = marginLeft;
    doc.text("New Equipment/Future", label3X, y);
    let cb3X = label3X + doc.getTextWidth("New Equipment/Future") + 10;
    doc.rect(cb3X, y - 9, checkboxSize, checkboxSize);
    if (record.newEquipmentFuture) {
      doc.setLineWidth(2);
      doc.line(cb3X + 3, y - 2, cb3X + 5, y - 5);
      doc.line(cb3X + 5, y - 5, cb3X + 9, y - 11);
      doc.setLineWidth(0.5);
    }

    let label4X = marginLeft + (contentWidth / 2);
    doc.text("Equipment Modification", label4X, y);
    let cb4X = label4X + doc.getTextWidth("Equipment Modification") + 10;
    doc.rect(cb4X, y - 9, checkboxSize, checkboxSize);
    if (record.equipmentModification) {
      doc.setLineWidth(2);
      doc.line(cb4X + 3, y - 2, cb4X + 5, y - 5);
      doc.line(cb4X + 5, y - 5, cb4X + 9, y - 11);
      doc.setLineWidth(0.5);
    }
    y += 35;

    // Fields table
    const fieldHeight = 25;
    const fieldLabelWidth = 140;
    const fieldValueWidth = 200;

    function drawField(label, value, startX, startY) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(label + ":", startX, startY);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      const fieldX = startX + fieldLabelWidth - 5;
      doc.rect(fieldX, startY - 15, fieldValueWidth, fieldHeight);
      doc.text(value || "", fieldX + 10, startY);
    }

    // Row 1
    drawField("Equipment/Line No.", record.equipmentLineNo || "", marginLeft, y);
    drawField("Equipment OEM Contact", record.equipmentOemContact || "", marginLeft + fieldLabelWidth + fieldValueWidth + 40, y);
    y += fieldHeight + 15;

    // Row 2
    drawField("Product/Process Name", record.productProcessName || "", marginLeft, y);
    drawField("Inspection Location", record.inspectionLocation || "", marginLeft + fieldLabelWidth + fieldValueWidth + 40, y);
    y += fieldHeight + 15;

    // Row3
    drawField("Inspection Date", record.inspectionDate || "", marginLeft, y);
    drawField("Inspection Conducted By", record.inspectionConductedBy || "", marginLeft + fieldLabelWidth + fieldValueWidth + 40, y);
    y += fieldHeight + 40;

    // Checklist items header
    const colNoX = marginLeft + 10;
    const colCheckX = marginLeft + 60;
    const colYesX = marginLeft + contentWidth - 140;
    const colNo2X = marginLeft + contentWidth - 80;
    const colRemarksX = colNo2X + 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(192, 192, 192);
    doc.rect(marginLeft - 2, y - 15, contentWidth + 4, 25, "F");
    doc.setTextColor(0, 0, 0);
    doc.text("No.", colNoX, y);
    doc.text("Check Items", colCheckX, y);
    doc.text("STATUS", (colYesX + colNo2X) / 2 - 20, y);
    doc.text("Yes", colYesX + 5, y);
    doc.text("No", colNo2X + 5, y);
    doc.text("Remarks", colRemarksX, y);
    y += 30;

    // Draw checklist items
    let currentSection = null;
    let itemNumber = 0;

    record.answers.forEach((answer, idx) => {
      const item = template.items.find(i => i.id === answer.itemId) || { text: "(Deleted item)" };

      // Check if item is a section header
      if (item.text.toUpperCase() === item.text && item.text.length > 5 && !item.text.includes(".")) {
        if (y + 30 > pageHeight - marginBottom - 80) {
          doc.addPage();
          y = marginTop + 20;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
          const titleWidth = doc.getTextWidth(titleText);
          doc.text(titleText, (pageWidth - titleWidth) / 2, y);
          y += 55;
          doc.setFontSize(11);
          doc.setFillColor(192, 192, 192);
          doc.rect(marginLeft - 2, y - 15, contentWidth + 4, 25, "F");
          doc.text("No.", colNoX, y);
          doc.text("Check Items", colCheckX, y);
          doc.text("STATUS", (colYesX + colNo2X) / 2 - 20, y);
          doc.text("Yes", colYesX + 5, y);
          doc.text("No", colNo2X + 5, y);
          doc.text("Remarks", colRemarksX, y);
          y += 30;
        }
        currentSection = item.text;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setFillColor(217, 217, 217);
        doc.rect(marginLeft - 2, y - 15, contentWidth + 4, 25, "F");
        doc.text(currentSection, colCheckX, y);
        y += 30;
        return;
      }

      itemNumber++;
      const itemText = item.text;
      const itemLines = doc.splitTextToSize(itemText, colYesX - colCheckX - 15);
      const blockHeight = Math.max(itemLines.length * 14, 25);

      if (y + blockHeight + 20 > pageHeight - marginBottom - 80) {
        doc.addPage();
        y = marginTop + 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const titleText = "EHS EQUIPMENT/LINE RELEASE CHECKLIST";
        const titleWidth = doc.getTextWidth(titleText);
        doc.text(titleText, (pageWidth - titleWidth) / 2, y);
        y += 55;
        doc.setFontSize(11);
        doc.setFillColor(192, 192, 192);
        doc.rect(marginLeft - 2, y - 15, contentWidth + 4, 25, "F");
        doc.text("No.", colNoX, y);
        doc.text("Check Items", colCheckX, y);
        doc.text("STATUS", (colYesX + colNo2X) / 2 - 20, y);
        doc.text("Yes", colYesX + 5, y);
        doc.text("No", colNo2X + 5, y);
        doc.text("Remarks", colRemarksX, y);
        y += 30;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(marginLeft - 2, y - 15, contentWidth + 4, blockHeight + 15);

      doc.text(String(itemNumber), colNoX, y);
      doc.text(itemLines, colCheckX, y);

      const boxSize = 14;
      doc.rect(colYesX, y - 11, boxSize, boxSize);
      if (answer.value === "yes") {
        doc.setLineWidth(2);
        doc.line(colYesX + 3, y - 5, colYesX + 5, y - 7);
        doc.line(colYesX + 5, y - 7, colYesX + 11, y - 13);
        doc.setLineWidth(0.5);
      }

      doc.rect(colNo2X, y - 11, boxSize, boxSize);
      if (answer.value === "no") {
        doc.setLineWidth(2);
        doc.line(colNo2X + 4, y - 9, colNo2X + 10, y - 3);
        doc.line(colNo2X + 10, y - 9, colNo2X + 4, y - 3);
        doc.setLineWidth(0.5);
      }

      if (answer.remarks) {
        const remarksLines = doc.splitTextToSize(answer.remarks, contentWidth - colRemarksX + marginLeft);
        doc.text(remarksLines, colRemarksX, y);
      }

      y += blockHeight + 15;
    });

    // Overall Remarks
    if (y + 80 > pageHeight - marginBottom - 40) {
      doc.addPage();
      y = marginTop + 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Overall Remarks", marginLeft, y);
    y += 25;
    doc.setFont("helvetica", "normal");
    if (record.overallRemarks) {
      const remarksLines = doc.splitTextToSize(record.overallRemarks, contentWidth);
      doc.text(remarksLines, marginLeft + 10, y);
    }
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(0.5);
    doc.rect(marginLeft-2, y -15, contentWidth+4, 80);

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
