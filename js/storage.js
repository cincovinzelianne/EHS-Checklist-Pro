/* storage.js - handles persistence of templates and completed records via localStorage */

const Storage = (() => {
  const TEMPLATES_KEY = "checklist_templates_v1";
  const RECORDS_KEY = "checklist_records_v1";

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Storage read error", e);
      return [];
    }
  }

  function _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage write error", e);
      return false;
    }
  }

  // ---- Templates ----
  function getTemplates() {
    return _read(TEMPLATES_KEY).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function getTemplate(id) {
    return _read(TEMPLATES_KEY).find(t => t.id === id) || null;
  }

  function saveTemplate(template) {
    const templates = _read(TEMPLATES_KEY);
    const now = Date.now();
    if (template.id) {
      const idx = templates.findIndex(t => t.id === template.id);
      template.updatedAt = now;
      if (idx >= 0) {
        templates[idx] = template;
      } else {
        templates.push(template);
      }
    } else {
      template.id = uid("tpl");
      template.createdAt = now;
      template.updatedAt = now;
      template.priority = template.priority || "low";
      templates.push(template);
    }
    _write(TEMPLATES_KEY, templates);
    return template;
  }

  function deleteTemplate(id) {
    const templates = _read(TEMPLATES_KEY).filter(t => t.id !== id);
    _write(TEMPLATES_KEY, templates);
  }

  function duplicateTemplate(id) {
    const t = getTemplate(id);
    if (!t) return null;
    const copy = JSON.parse(JSON.stringify(t));
    copy.id = null;
    copy.name = `${t.name} (Copy)`;
    return saveTemplate(copy);
  }

  function exportTemplates(ids = null) {
    const templates = ids ? getTemplates().filter(t => ids.includes(t.id)) : getTemplates();
    return JSON.stringify({ type: "checklisthub_templates", version: 1, data: templates }, null, 2);
  }

  function importTemplates(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.type !== "checklisthub_templates") return false;
      const templates = data.data || [];
      const existing = getTemplates();
      templates.forEach(t => {
        t.id = uid("tpl");
        t.createdAt = Date.now();
        t.updatedAt = Date.now();
        existing.push(t);
      });
      _write(TEMPLATES_KEY, existing);
      return true;
    } catch (e) {
      console.error("Import error", e);
      return false;
    }
  }

  // ---- Records ----
  function getRecords() {
    return _read(RECORDS_KEY).sort((a, b) => b.createdAt - a.createdAt);
  }

  function getRecord(id) {
    return _read(RECORDS_KEY).find(r => r.id === id) || null;
  }

  function saveRecord(record) {
    const records = _read(RECORDS_KEY);
    record.id = uid("rec");
    record.createdAt = Date.now();
    records.push(record);
    _write(RECORDS_KEY, records);
    return record;
  }

  function deleteRecord(id) {
    const records = _read(RECORDS_KEY).filter(r => r.id !== id);
    _write(RECORDS_KEY, records);
  }

  function exportRecords(ids = null) {
    const records = ids ? getRecords().filter(r => ids.includes(r.id)) : getRecords();
    return JSON.stringify({ type: "checklisthub_records", version: 1, data: records }, null, 2);
  }

  function importRecords(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.type !== "checklisthub_records") return false;
      const records = data.data || [];
      const existing = getRecords();
      records.forEach(r => {
        r.id = uid("rec");
        r.createdAt = Date.now();
        existing.push(r);
      });
      _write(RECORDS_KEY, existing);
      return true;
    } catch (e) {
      console.error("Import error", e);
      return false;
    }
  }

  // ---- Combined Export ----
  function exportAll() {
    return JSON.stringify({
      type: "checklisthub_backup",
      version: 1,
      exportDate: new Date().toISOString(),
      templates: getTemplates(),
      records: getRecords()
    }, null, 2);
  }

  function importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.type === "checklisthub_backup") {
        if (data.templates) {
          const templates = data.templates.map(t => {
            const nt = JSON.parse(JSON.stringify(t));
            nt.id = uid("tpl");
            nt.createdAt = Date.now();
            nt.updatedAt = Date.now();
            return nt;
          });
          _write(TEMPLATES_KEY, [...getTemplates(), ...templates]);
        }
        if (data.records) {
          const records = data.records.map(r => {
            const nr = JSON.parse(JSON.stringify(r));
            nr.id = uid("rec");
            nr.createdAt = Date.now();
            return nr;
          });
          _write(RECORDS_KEY, [...getRecords(), ...records]);
        }
        return true;
      } else if (data.type === "checklisthub_templates") {
        return importTemplates(jsonString);
      } else if (data.type === "checklisthub_records") {
        return importRecords(jsonString);
      }
      return false;
    } catch (e) {
      console.error("Import error", e);
      return false;
    }
  }

  return {
    uid,
    getTemplates, getTemplate, saveTemplate, deleteTemplate, duplicateTemplate,
    exportTemplates, importTemplates,
    getRecords, getRecord, saveRecord, deleteRecord,
    exportRecords, importRecords,
    exportAll, importAll
  };
})();
