/* app.js — main application controller */

const App = (() => {
  let currentEditingTemplateId = null;
  let currentBuilderItems = [];
  let currentFillTemplateId = null;
  let currentFillAnswers = {};
  let currentDetailRecordId = null;
  let pendingDelete = null;
  let importData = null;
  let pendingSendRecordId = null;

  // ---------- Authentication ----------
  const VALID_CREDENTIALS = {
    email: "systemadmin@ehs.com",
    password: "EHSandFAC@2026"
  };

  function checkAuth() {
    return localStorage.getItem("checklisthub_auth") === "true";
  }

  function showLoginPage() {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  }

  function showMainApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainApp").style.display = "flex";
  }

  function handleLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");

    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      localStorage.setItem("checklisthub_auth", "true");
      errorEl.hidden = true;
      showToast("Welcome back!");
      showMainApp();
    } else {
      errorEl.hidden = false;
    }
  }

  function handleLogout() {
    localStorage.removeItem("checklisthub_auth");
    showToast("Logged out successfully!");
    showLoginPage();
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
  }

  // ---------- Utilities ----------
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.classList.remove("show"); }, 3000);
  }

  function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add("active");
    
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    const viewToNav = {
      "view-dashboard": "dashboard",
      "view-templates": "templates", 
      "view-builder": "builder", 
      "view-records": "records"
    };
    const navKey = viewToNav[viewId];
    if (navKey) {
      const btn = document.querySelector(`.nav-btn[data-view="${navKey}"]`);
      if (btn) btn.classList.add("active");
    }

    if (viewId === "view-dashboard") renderDashboard();
    else if (viewId === "view-templates") { renderTemplates(); updateCategoryFilter(); }
    else if (viewId === "view-records") renderRecords();
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }

  function formatShortDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function downloadFile(content, filename, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Theme Toggle ----------
  function initTheme() {
    const saved = localStorage.getItem("checklisthub_theme");
    if (saved === "dark") document.body.classList.add("dark");
    updateThemeButton();
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("checklisthub_theme", isDark ? "dark" : "light");
    updateThemeButton();
  }

  function updateThemeButton() {
    const btn = document.getElementById("themeToggle");
    const isDark = document.body.classList.contains("dark");
    btn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const templates = Storage.getTemplates();
    const records = Storage.getRecords();
    
    let totalItems = 0;
    templates.forEach(t => totalItems += (t.items || []).length);
    
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentRecords = records.filter(r => r.createdAt >= weekAgo);

    document.getElementById("statTemplates").textContent = templates.length;
    document.getElementById("statRecords").textContent = records.length;
    document.getElementById("statItems").textContent = totalItems;
    document.getElementById("statRecent").textContent = recentRecords.length;

    const recentGrid = document.getElementById("recentRecordsGrid");
    const recent = records.slice(0, 6);
    
    if (recent.length === 0) {
      recentGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>No recent records yet!</p></div>';
    } else {
      recentGrid.innerHTML = recent.map(r => {
        const t = Storage.getTemplate(r.templateId);
        const templateName = t ? t.name : "(Deleted Template)";
        return `
          <div class="card">
            <h3>${escapeHtml(r.title)}</h3>
            <span class="tag">${escapeHtml(templateName)}</span>
            <p class="desc">${r.completedBy ? "By " + escapeHtml(r.completedBy) : "No author listed"}</p>
            <div class="meta">Completed ${formatShortDate(r.createdAt)}</div>
            <div class="card-actions">
              <button class="btn btn-small btn-primary" data-action="view" data-id="${r.id}">View</button>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // ---------- Templates List View ----------
  function renderTemplates(filter = "", category = "") {
    let templates = Storage.getTemplates();
    templates = templates.filter(t => {
      const matchFilter = !filter || 
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(filter.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(filter.toLowerCase());
      const matchCategory = !category || (t.category || "").toLowerCase() === category.toLowerCase();
      return matchFilter && matchCategory;
    });
    
    const grid = document.getElementById("templatesGrid");
    const empty = document.getElementById("templatesEmpty");

    if (templates.length === 0) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = templates.map(t => {
      const priorityClass = t.priority || "low";
      return `
        <div class="card">
          <h3>${escapeHtml(t.name)}</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${t.category ? `<span class="tag">${escapeHtml(t.category)}</span>` : ""}
            <span class="tag ${priorityClass}">${t.priority || "low"}</span>
          </div>
          <p class="desc">${escapeHtml(t.description || "No description")}</p>
          <div class="meta">${t.items.length} item${t.items.length !== 1 ? "s" : ""} · Updated ${formatShortDate(t.updatedAt)}</div>
          <div class="card-actions">
            <button class="btn btn-small btn-primary" data-action="fill" data-id="${t.id}">Fill Out</button>
            <button class="btn btn-small btn-secondary" data-action="edit" data-id="${t.id}">Edit</button>
            <button class="btn btn-small btn-secondary" data-action="duplicate" data-id="${t.id}">Duplicate</button>
            <button class="btn btn-small btn-secondary" data-action="export" data-id="${t.id}">Export</button>
            <button class="btn btn-small btn-danger" data-action="delete" data-id="${t.id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateCategoryFilter() {
    const templates = Storage.getTemplates();
    const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];
    const select = document.getElementById("categoryFilter");
    select.innerHTML = '<option value="">All Categories</option>' + 
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function bindTemplateGridEvents() {
    document.getElementById("templatesGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      
      if (action === "fill") openFillView(id);
      else if (action === "edit") openBuilderView(id);
      else if (action === "duplicate") {
        Storage.duplicateTemplate(id);
        renderTemplates();
        updateCategoryFilter();
        showToast("Template duplicated!");
      } else if (action === "export") {
        const t = Storage.getTemplate(id);
        const json = Storage.exportTemplates([id]);
        downloadFile(json, `template_${t.name.replace(/\W+/g, "_")}.json`);
        showToast("Template exported!");
      } else if (action === "delete") {
        pendingDelete = { type: "template", id };
        document.getElementById("deleteMessage").textContent = "Are you sure you want to delete this template? Completed records will not be affected.";
        document.getElementById("deleteModal").classList.add("show");
      }
    });

    document.getElementById("recentRecordsGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "view") openRecordDetail(btn.dataset.id);
    });
  }

  // ---------- Builder View ----------
  function openBuilderView(templateId = null) {
    currentEditingTemplateId = templateId;
    const title = document.getElementById("builderTitle");
    if (templateId) {
      const t = Storage.getTemplate(templateId);
      title.textContent = "Edit Checklist Template";
      document.getElementById("tplName").value = t.name;
      document.getElementById("tplDescription").value = t.description || "";
      document.getElementById("tplCategory").value = t.category || "";
      document.getElementById("tplPriority").value = t.priority || "low";
      document.getElementById("tplCustomHeader").value = t.customHeader || "";
      document.getElementById("tplCustomFooter").value = t.customFooter || "";
      currentBuilderItems = JSON.parse(JSON.stringify(t.items));
    } else {
      title.textContent = "New Checklist Template";
      document.getElementById("tplName").value = "";
      document.getElementById("tplDescription").value = "";
      document.getElementById("tplCategory").value = "";
      document.getElementById("tplPriority").value = "low";
      document.getElementById("tplCustomHeader").value = "";
      document.getElementById("tplCustomFooter").value = "";
      currentBuilderItems = [];
    }
    renderBuilderItems();
    showView("view-builder");
  }

  function renderBuilderItems() {
    const list = document.getElementById("itemsList");
    const empty = document.getElementById("itemsEmpty");
    if (currentBuilderItems.length === 0) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.innerHTML = currentBuilderItems.map((item, idx) => `
      <div class="item-row" data-idx="${idx}">
        <div class="item-num">${idx + 1}</div>
        <div class="item-fields">
          <input type="text" class="item-text-input" placeholder="Checklist item text..." value="${escapeHtml(item.text)}">
          <select class="item-type-select">
            <option value="yesno" ${item.type === "yesno" ? "selected" : ""}>Yes / No</option>
            <option value="text" ${item.type === "text" ? "selected" : ""}>Text Response</option>
          </select>
        </div>
        <div class="item-controls">
          <button class="btn-icon" data-action="up" title="Move up">↑</button>
          <button class="btn-icon" data-action="down" title="Move down">↓</button>
          <button class="btn-icon" data-action="remove" title="Remove">✕</button>
        </div>
      </div>
    `).join("");
  }

  function bindBuilderEvents() {
    document.getElementById("btnAddItem").addEventListener("click", () => {
      currentBuilderItems.push({ id: Storage.uid("item"), text: "", type: "yesno" });
      renderBuilderItems();
    });

    document.getElementById("itemsList").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const row = btn.closest(".item-row");
      const idx = parseInt(row.dataset.idx, 10);
      if (btn.dataset.action === "remove") {
        currentBuilderItems.splice(idx, 1);
      } else if (btn.dataset.action === "up" && idx > 0) {
        [currentBuilderItems[idx - 1], currentBuilderItems[idx]] = [currentBuilderItems[idx], currentBuilderItems[idx - 1]];
      } else if (btn.dataset.action === "down" && idx < currentBuilderItems.length - 1) {
        [currentBuilderItems[idx + 1], currentBuilderItems[idx]] = [currentBuilderItems[idx], currentBuilderItems[idx + 1]];
      }
      syncBuilderItemsFromDom();
      renderBuilderItems();
    });

    document.getElementById("itemsList").addEventListener("input", () => {
      syncBuilderItemsFromDom();
    });
    document.getElementById("itemsList").addEventListener("change", () => {
      syncBuilderItemsFromDom();
    });

    document.getElementById("btnCancelBuilder").addEventListener("click", () => {
      showView("view-templates");
    });

    document.getElementById("btnSaveTemplate").addEventListener("click", () => {
      syncBuilderItemsFromDom();
      const name = document.getElementById("tplName").value.trim();
      if (!name) { showToast("Please enter a template name!"); return; }
      const cleanedItems = currentBuilderItems
        .map(i => ({ ...i, text: (i.text || "").trim() }))
        .filter(i => i.text.length > 0);
      if (cleanedItems.length === 0) { showToast("Add at least one checklist item!"); return; }

      const template = {
        id: currentEditingTemplateId,
        name,
        description: document.getElementById("tplDescription").value.trim(),
        category: document.getElementById("tplCategory").value.trim(),
        priority: document.getElementById("tplPriority").value,
        customHeader: document.getElementById("tplCustomHeader").value.trim(),
        customFooter: document.getElementById("tplCustomFooter").value.trim(),
        items: cleanedItems
      };
      Storage.saveTemplate(template);
      showToast("Template saved!");
      renderTemplates();
      updateCategoryFilter();
      showView("view-templates");
    });

    document.getElementById("btnNewTemplate").addEventListener("click", () => openBuilderView());
    document.getElementById("btnEmptyNewTemplate").addEventListener("click", () => openBuilderView());
  }

  function syncBuilderItemsFromDom() {
    const rows = document.querySelectorAll("#itemsList .item-row");
    rows.forEach(row => {
      const idx = parseInt(row.dataset.idx, 10);
      const text = row.querySelector(".item-text-input").value;
      const type = row.querySelector(".item-type-select").value;
      if (currentBuilderItems[idx]) {
        currentBuilderItems[idx].text = text;
        currentBuilderItems[idx].type = type;
      }
    });
  }

  // ---------- Fill View ----------
  function openFillView(templateId) {
    const t = Storage.getTemplate(templateId);
    if (!t) return;
    currentFillTemplateId = templateId;
    currentFillAnswers = {};
    t.items.forEach(item => {
      currentFillAnswers[item.id] = item.type === "yesno"
        ? { type: "yesno", itemId: item.id, value: null }
        : { type: "text", itemId: item.id, value: "" };
    });

    document.getElementById("fillTitle").textContent = t.name;
    document.getElementById("fillSubtitle").textContent = t.description || "";
    document.getElementById("fillResponseTitle").value = `${t.name} - ${formatShortDate(Date.now())}`;
    document.getElementById("fillCompletedBy").value = "";
    document.getElementById("fillNotes").value = "";
    document.getElementById("fillDueDate").value = "";

    renderFillItems(t);
    updateProgress();
    showView("view-fill");
  }

  function renderFillItems(template) {
    const list = document.getElementById("fillItemsList");
    list.innerHTML = template.items.map((item) => {
      if (item.type === "yesno") {
        return `
          <div class="fill-item" data-item-id="${item.id}">
            <div class="fill-item-text">${escapeHtml(item.text)}</div>
            <div class="fill-item-answer">
              <div class="toggle-group">
                <button type="button" class="toggle-btn yes" data-value="yes">Yes</button>
                <button type="button" class="toggle-btn no" data-value="no">No</button>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="fill-item" data-item-id="${item.id}">
            <div class="fill-item-text">${escapeHtml(item.text)}</div>
            <textarea rows="2" placeholder="Type your response..."></textarea>
          </div>
        `;
      }
    }).join("");
  }

  function updateProgress() {
    const total = Object.keys(currentFillAnswers).length;
    let completed = 0;
    Object.values(currentFillAnswers).forEach(a => {
      if (a.type === "yesno" && a.value) completed++;
      else if (a.type === "text" && a.value.trim()) completed++;
    });
    const percent = total ? Math.round((completed / total) * 100) : 0;
    document.getElementById("progressText").textContent = `${percent}% Complete (${completed}/${total})`;
    document.getElementById("progressFill").style.width = `${percent}%`;
  }

  function bindFillEvents() {
    document.getElementById("fillItemsList").addEventListener("click", (e) => {
      const btn = e.target.closest(".toggle-btn");
      if (!btn) return;
      const wrap = btn.closest(".fill-item");
      const itemId = wrap.dataset.itemId;
      wrap.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      currentFillAnswers[itemId].value = btn.dataset.value;
      updateProgress();
    });

    document.getElementById("fillItemsList").addEventListener("input", (e) => {
      const textarea = e.target.closest("textarea");
      if (!textarea) return;
      const wrap = textarea.closest(".fill-item");
      const itemId = wrap.dataset.itemId;
      currentFillAnswers[itemId].value = textarea.value;
      updateProgress();
    });

    document.getElementById("btnCancelFill").addEventListener("click", () => showView("view-templates"));

    document.getElementById("btnSubmitFill").addEventListener("click", () => {
      const title = document.getElementById("fillResponseTitle").value.trim();
      if (!title) { showToast("Please enter a response title!"); return; }

      const record = {
        templateId: currentFillTemplateId,
        title,
        completedBy: document.getElementById("fillCompletedBy").value.trim(),
        notes: document.getElementById("fillNotes").value.trim(),
        dueDate: document.getElementById("fillDueDate").value,
        answers: Object.values(currentFillAnswers)
      };
      Storage.saveRecord(record);
      showToast("Checklist response saved!");
      renderRecords();
      renderDashboard();
      showView("view-records");
    });
  }

  // ---------- Records List View ----------
  function renderRecords(filter = "", sortBy = "newest") {
    let records = Storage.getRecords();
    records = records.filter(r => 
      !filter || r.title.toLowerCase().includes(filter.toLowerCase()) ||
      (r.completedBy || "").toLowerCase().includes(filter.toLowerCase())
    );

    if (sortBy === "oldest") {
      records.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "title") {
      records.sort((a, b) => a.title.localeCompare(b.title));
    }

    const grid = document.getElementById("recordsGrid");
    const empty = document.getElementById("recordsEmpty");

    if (records.length === 0) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = records.map(r => {
      const t = Storage.getTemplate(r.templateId);
      const templateName = t ? t.name : "(Deleted Template)";
      return `
        <div class="card">
          <h3>${escapeHtml(r.title)}</h3>
          <span class="tag">${escapeHtml(templateName)}</span>
          <p class="desc">${r.completedBy ? "By " + escapeHtml(r.completedBy) : "No author listed"}</p>
          <div class="meta">
            Completed ${formatShortDate(r.createdAt)}
            ${r.dueDate ? ` · Due ${r.dueDate}` : ""}
          </div>
          <div class="card-actions">
            <button class="btn btn-small btn-primary" data-action="view" data-id="${r.id}">View</button>
            <button class="btn btn-small btn-secondary" data-action="send" data-id="${r.id}">Send PDF</button>
            <button class="btn btn-small btn-secondary" data-action="export" data-id="${r.id}">Export PDF</button>
            <button class="btn btn-small btn-danger" data-action="delete" data-id="${r.id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function bindRecordsGridEvents() {
    document.getElementById("recordsGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "view") openRecordDetail(id);
      else if (action === "export") exportRecordById(id);
      else if (action === "send") openSendPdfModal(id);
      else if (action === "delete") {
        pendingDelete = { type: "record", id };
        document.getElementById("deleteMessage").textContent = "Are you sure you want to delete this record?";
        document.getElementById("deleteModal").classList.add("show");
      }
    });
  }
  
  function openSendPdfModal(recordId) {
    pendingSendRecordId = recordId;
    document.getElementById("sendPdfModal").classList.add("show");
  }
  
  async function sendPdf(method) {
    const record = Storage.getRecord(pendingSendRecordId);
    const template = record ? Storage.getTemplate(record.templateId) : null;
    if (!record || !template) {
      showToast("Unable to send: record or template not found!");
      document.getElementById("sendPdfModal").classList.remove("show");
      return;
    }
    
    try {
      const pdfBlob = PdfExport.getPdfBlob(record, template);
      const safeName = (record.title || template.name || "checklist").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      const fileName = `${safeName}.pdf`;
      const subject = `Checklist: ${record.title || template.name}`;
      const body = `Please find the attached checklist.\n\n${record.completedBy ? `Completed by: ${record.completedBy}\n` : ''}Date: ${new Date(record.createdAt).toLocaleDateString()}`;
      
      // Create a download link first (fallback for all methods)
      const url = URL.createObjectURL(pdfBlob);
      
      switch (method) {
        case "outlook":
          // Try to open Outlook desktop app using mailto
          const outlookMailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = outlookMailto;
          showToast("Opening Outlook desktop app. Please attach the PDF manually.");
          // Trigger download
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break;

        case "mail":
          // Open default mail desktop app
          const mailMailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = mailMailto;
          showToast("Opening your mail app. Please attach the PDF manually.");
          // Trigger download
          const mailA = document.createElement("a");
          mailA.href = url;
          mailA.download = fileName;
          document.body.appendChild(mailA);
          mailA.click();
          document.body.removeChild(mailA);
          break;
          
        case "gmail":
          // Open Gmail compose in browser
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(gmailUrl, "_blank");
          showToast("Opening Gmail in browser. Please attach the PDF manually.");
          // Trigger download
          const gmailA = document.createElement("a");
          gmailA.href = url;
          gmailA.download = fileName;
          document.body.appendChild(gmailA);
          gmailA.click();
          document.body.removeChild(gmailA);
          break;
          
        case "teams":
          // Try to open Microsoft Teams desktop app
          try {
            window.location.href = "msteams:";
            showToast("Opening Microsoft Teams. Please share the PDF manually in your desired channel/chat.");
          } catch (e) {
            // If desktop app fails, try to open web
            window.open("https://teams.microsoft.com", "_blank");
            showToast("Opening Microsoft Teams in browser. Please share the PDF manually.");
          }
          // Trigger download
          const teamsA = document.createElement("a");
          teamsA.href = url;
          teamsA.download = fileName;
          document.body.appendChild(teamsA);
          teamsA.click();
          document.body.removeChild(teamsA);
          break;
      }
      
    } catch (error) {
      showToast("Error preparing PDF for sending.");
      console.error(error);
    }
    
    document.getElementById("sendPdfModal").classList.remove("show");
    pendingSendRecordId = null;
  }
  
  function bindSendPdfEvents() {
    // Bind Send PDF button in record detail view
    document.getElementById("btnSendPdf").addEventListener("click", () => {
      if (currentDetailRecordId) {
        openSendPdfModal(currentDetailRecordId);
      }
    });
    
    // Bind method buttons in modal
    document.querySelectorAll("#sendPdfModal .btn-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const method = btn.dataset.method;
        sendPdf(method);
      });
    });
    
    // Bind cancel button
    document.getElementById("btnCancelSend").addEventListener("click", () => {
      document.getElementById("sendPdfModal").classList.remove("show");
      pendingSendRecordId = null;
    });
    
    // Close modal when clicking outside
    document.getElementById("sendPdfModal").addEventListener("click", (e) => {
      if (e.target === document.getElementById("sendPdfModal")) {
        document.getElementById("sendPdfModal").classList.remove("show");
        pendingSendRecordId = null;
      }
    });
  }

  function exportRecordById(id) {
    const record = Storage.getRecord(id);
    const template = record ? Storage.getTemplate(record.templateId) : null;
    if (!record || !template) { showToast("Unable to export: template not found!"); return; }
    PdfExport.exportRecord(record, template);
    showToast("PDF exported!");
  }

  // ---------- Record Detail View ----------
  function openRecordDetail(id) {
    const record = Storage.getRecord(id);
    if (!record) return;
    const template = Storage.getTemplate(record.templateId);
    currentDetailRecordId = id;

    document.getElementById("detailTitle").textContent = record.title;
    document.getElementById("detailSubtitle").textContent = template ? template.name : "(Deleted Template)";

    let metaHtml = `
      <div><strong>Completed By</strong>${escapeHtml(record.completedBy || "—")}</div>
      <div><strong>Date Completed</strong>${new Date(record.createdAt).toLocaleString()}</div>
    `;
    if (record.dueDate) {
      metaHtml += `<div><strong>Due Date</strong>${escapeHtml(record.dueDate)}</div>`;
    }
    if (record.notes) {
      metaHtml += `<div><strong>Notes</strong>${escapeHtml(record.notes)}</div>`;
    }
    document.getElementById("detailMeta").innerHTML = metaHtml;

    const list = document.getElementById("detailItemsList");
    if (!template) {
      list.innerHTML = '<div class="empty-state-small"><p>The original template was deleted, so item text is unavailable.</p></div>';
      return;
    }

    list.innerHTML = record.answers.map(answer => {
      const item = template.items.find(i => i.id === answer.itemId) || { text: "(Deleted item)" };
      let displayHtml = "";
      if (answer.type === "yesno") {
        const cls = answer.value || "";
        const label = answer.value === "yes" ? "YES" : answer.value === "no" ? "NO" : "Not answered";
        displayHtml = `<span class="answer-display ${cls}">${label}</span>`;
      } else {
        displayHtml = `<span class="answer-display">${escapeHtml(answer.value || "—")}</span>`;
      }
      return `
        <div class="fill-item">
          <div class="fill-item-text">${escapeHtml(item.text)}</div>
          ${displayHtml}
        </div>
      `;
    }).join("");

    showView("view-record-detail");
  }

  function bindDetailEvents() {
    document.getElementById("btnBackRecords").addEventListener("click", () => showView("view-records"));
    document.getElementById("btnExportPdf").addEventListener("click", () => {
      if (currentDetailRecordId) exportRecordById(currentDetailRecordId);
    });
  }

  // ---------- Import/Export ----------
  function bindImportExportEvents() {
    document.getElementById("btnExportAll").addEventListener("click", () => {
      const json = Storage.exportAll();
      downloadFile(json, `checklisthub_backup_${new Date().toISOString().slice(0,10)}.json`);
      showToast("All data exported!");
    });

    document.getElementById("btnImport").addEventListener("click", () => {
      document.getElementById("importModal").classList.add("show");
    });

    document.getElementById("btnImportTemplates").addEventListener("click", () => {
      document.getElementById("importModal").classList.add("show");
    });

    document.getElementById("btnExportAllRecords").addEventListener("click", () => {
      const json = Storage.exportRecords();
      downloadFile(json, `checklisthub_records_${new Date().toISOString().slice(0,10)}.json`);
      showToast("All records exported!");
    });

    document.getElementById("btnCancelImport").addEventListener("click", () => {
      document.getElementById("importModal").classList.remove("show");
      document.getElementById("importFile").value = "";
    });

    document.getElementById("importFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        importData = event.target.result;
      };
      reader.readAsText(file);
    });

    document.getElementById("btnConfirmImport").addEventListener("click", () => {
      if (!importData) {
        showToast("Please select a file first!");
        return;
      }
      const success = Storage.importAll(importData);
      if (success) {
        showToast("Data imported successfully!");
        renderDashboard();
        renderTemplates();
        updateCategoryFilter();
        renderRecords();
      } else {
        showToast("Import failed: invalid file format!");
      }
      document.getElementById("importModal").classList.remove("show");
      document.getElementById("importFile").value = "";
      importData = null;
    });

    // Delete modal
    document.getElementById("btnCancelDelete").addEventListener("click", () => {
      document.getElementById("deleteModal").classList.remove("show");
      pendingDelete = null;
    });

    document.getElementById("btnConfirmDelete").addEventListener("click", () => {
      if (!pendingDelete) return;
      if (pendingDelete.type === "template") {
        Storage.deleteTemplate(pendingDelete.id);
        renderTemplates();
        updateCategoryFilter();
        showToast("Template deleted!");
      } else if (pendingDelete.type === "record") {
        Storage.deleteRecord(pendingDelete.id);
        renderRecords();
        renderDashboard();
        showToast("Record deleted!");
      }
      document.getElementById("deleteModal").classList.remove("show");
      pendingDelete = null;
    });

    // Close modals when clicking outside
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("show");
      });
    });
  }

  // ---------- Navigation & Search ----------
  function bindNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (view === "dashboard") { renderDashboard(); showView("view-dashboard"); }
        else if (view === "templates") { renderTemplates(); showView("view-templates"); }
        else if (view === "builder") openBuilderView();
        else if (view === "records") { renderRecords(); showView("view-records"); }
      });
    });

    document.getElementById("templateSearch").addEventListener("input", (e) => {
      renderTemplates(e.target.value, document.getElementById("categoryFilter").value);
    });

    document.getElementById("categoryFilter").addEventListener("change", (e) => {
      renderTemplates(document.getElementById("templateSearch").value, e.target.value);
    });

    document.getElementById("recordSearch").addEventListener("input", (e) => {
      renderRecords(e.target.value, document.getElementById("recordSort").value);
    });

    document.getElementById("recordSort").addEventListener("change", (e) => {
      renderRecords(document.getElementById("recordSearch").value, e.target.value);
    });

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  }

  function bindAuthEvents() {
    document.getElementById("btnLogin").addEventListener("click", handleLogin);
    document.getElementById("btnLogout").addEventListener("click", handleLogout);
    
    // Allow login on enter key
    document.getElementById("loginPassword").addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleLogin();
    });
    document.getElementById("loginEmail").addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    bindAuthEvents();
    bindNav();
    bindTemplateGridEvents();
    bindBuilderEvents();
    bindFillEvents();
    bindRecordsGridEvents();
    bindDetailEvents();
    bindSendPdfEvents();
    bindImportExportEvents();
    
    // Check authentication
    if (checkAuth()) {
      showMainApp();
      renderDashboard();
      seedExampleIfEmpty();
    } else {
      showLoginPage();
    }
  }

  function seedExampleIfEmpty() {
    if (Storage.getTemplates().length > 0) return;
    const example = {
      id: null,
      name: "Daily Equipment Inspection",
      description: "Routine checklist for inspecting equipment before daily use.",
      category: "Safety",
      priority: "high",
      items: [
        { id: Storage.uid("item"), text: "Equipment is free of visible damage", type: "yesno" },
        { id: Storage.uid("item"), text: "Safety guards are in place", type: "yesno" },
        { id: Storage.uid("item"), text: "Power cables are in good condition", type: "yesno" },
        { id: Storage.uid("item"), text: "Additional comments", type: "text" }
      ]
    };
    Storage.saveTemplate(example);
    renderDashboard();
    renderTemplates();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
