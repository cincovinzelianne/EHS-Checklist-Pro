/* pdfExport.js — builds a formal audit checklist PDF from a completed checklist record */

const PdfExport = (() => {

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function createPdfDocument(record, template) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    
    let y = margin;

    // Custom Header
    if (template.customHeader) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      const headerLines = doc.splitTextToSize(template.customHeader, contentWidth);
      doc.text(headerLines, margin, y);
      y += headerLines.length * 16 + 20;
    }

    // Header - Audit Checklist Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 24, 38);
    const title = template.name || "Audit Checklist";
    doc.text(title, margin, y);
    y += 35;

    // Header - Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    
    if (template.category) {
      doc.setFont("helvetica", "bold");
      doc.text("Category:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(template.category, margin + 80, y);
      y += 25;
    }
    if (template.description) {
      doc.setFont("helvetica", "bold");
      doc.text("Description:", margin, y);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(template.description, contentWidth - 90);
      doc.text(descLines, margin + 90, y);
      y += descLines.length * 16 + 10;
    }

    // Divider Line
    y += 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;

    // Response Metadata Section
    doc.setFontSize(12);
    doc.setTextColor(40, 44, 56);
    
    // Row 1 - Title
    doc.setFont("helvetica", "bold");
    doc.text("Checklist Title:", margin, y);
    doc.setFont("helvetica", "normal");
    const titleText = record.title || "Untitled Response";
    const titleLines = doc.splitTextToSize(titleText, 300);
    doc.text(titleLines, margin + 100, y);
    y += titleLines.length * 16 + 10;

    // Row 2 - Date Completed
    doc.setFont("helvetica", "bold");
    doc.text("Date Completed:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(record.createdAt), margin + 120, y);
    y += 25;

    // Row 3 - Completed By
    doc.setFont("helvetica", "bold");
    doc.text("Completed By:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(record.completedBy || "—", margin + 100, y);
    y += 25;

    // Row 4 - Due Date
    if (record.dueDate) {
      doc.setFont("helvetica", "bold");
      doc.text("Due Date:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(record.dueDate, margin + 80, y);
      y += 25;
    }

    // Notes
    if (record.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", margin, y);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(record.notes, contentWidth - 70);
      doc.text(noteLines, margin + 70, y);
      y += noteLines.length * 16 + 20;
    } else {
      y += 10;
    }

    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;

    // Checklist Items Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 24, 38);
    doc.text("Audit Checklist Items", margin, y);
    y += 30;

    // Table Headers
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    
    // Column positions
    const itemColWidth = contentWidth * 0.55;
    const yesColX = margin + itemColWidth + 50;
    const noColX = yesColX + 100;

    // Draw header border and text
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(1);
    doc.rect(margin - 5, y - 15, contentWidth + 10, 25);
    
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", margin + 5, y);
    doc.text("YES", yesColX + 5, y);
    doc.text("NO", noColX + 5, y);
    y += 30;

    // Draw checklist items
    record.answers.forEach((answer, idx) => {
      // Page break check
      if (y + 60 > pageHeight - margin - 40) {
        // Draw custom footer before adding new page
        if (template.customFooter) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const footerLines = doc.splitTextToSize(template.customFooter, contentWidth);
          const footerY = pageHeight - margin;
          doc.text(footerLines, margin, footerY - (footerLines.length - 1) * 12);
        }
        
        doc.addPage();
        y = margin;
        
        // Redraw custom header on new page
        if (template.customHeader) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.setTextColor(80, 80, 80);
          const headerLines = doc.splitTextToSize(template.customHeader, contentWidth);
          doc.text(headerLines, margin, y);
          y += headerLines.length * 16 + 20;
        }
        
        // Redraw title on new page
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(20, 24, 38);
        doc.text(template.name || "Audit Checklist", margin, y);
        y += 35;
        
        // Redraw divider
        y += 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 30;
        
        // Redraw checklist items header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(20, 24, 38);
        doc.text("Audit Checklist Items (Continued)", margin, y);
        y += 30;
        
        // Redraw table headers
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin - 5, y - 15, contentWidth + 10, 25);
        doc.setFont("helvetica", "bold");
        doc.text("ITEM", margin + 5, y);
        doc.text("YES", yesColX + 5, y);
        doc.text("NO", noColX + 5, y);
        y += 30;
      }

      const item = template.items.find(i => i.id === answer.itemId) || { text: "(Deleted item)" };
      
      // Item number and text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(40, 44, 56);
      
      const itemText = `${idx + 1}. ${item.text}`;
      const itemLines = doc.splitTextToSize(itemText, itemColWidth);
      
      // Calculate block height
      const blockHeight = Math.max(itemLines.length * 16, 40);
      
      // Draw item cell border
      doc.setDrawColor(230, 230, 230);
      doc.rect(margin - 5, y - 15, contentWidth + 10, blockHeight + 15);
      
      // Draw item text
      doc.text(itemLines, margin + 5, y);
      
      // Draw checkboxes and checkmarks
      if (answer.type === "yesno") {
        // YES checkbox
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(1);
        doc.rect(yesColX, y - 12, 24, 24);
        
        if (answer.value === "yes") {
          // Draw a big, clear checkmark using lines
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(3);
          doc.line(yesColX + 5, y + 2, yesColX + 10, y + 8);
          doc.line(yesColX + 10, y + 8, yesColX + 19, y - 4);
        }
        
        // NO checkbox
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(1);
        doc.rect(noColX, y - 12, 24, 24);
        
        if (answer.value === "no") {
          // Draw a big, clear X using lines
          doc.setDrawColor(239, 68, 68);
          doc.setLineWidth(3);
          doc.line(noColX + 6, y - 6, noColX + 18, y + 6);
          doc.line(noColX + 18, y - 6, noColX + 6, y + 6);
        }
      } else {
        // Text response
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(11);
        const textAnswer = answer.value || "—";
        const answerLines = doc.splitTextToSize(textAnswer, contentWidth - itemColWidth - 70);
        doc.text(answerLines, yesColX, y);
      }

      y += blockHeight + 15;
    });

    // Add custom footer to last page
    if (template.customFooter) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const footerLines = doc.splitTextToSize(template.customFooter, contentWidth);
      const footerY = pageHeight - margin;
      doc.text(footerLines, margin, footerY - (footerLines.length - 1) * 12);
    }

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