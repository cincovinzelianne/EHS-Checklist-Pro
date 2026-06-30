# Checklist Template Management & Export System

A browser-based checklist management platform for creating reusable checklist templates, filling them out, keeping organized records, and exporting completed checklists as clean, printable PDFs.

## Features

- **Create & customize checklist templates** — name, description, category, and an ordered list of items
- **Item types** — Yes/No/N-A toggle items or free-text response items
- **Edit, reorder, duplicate, and delete templates**
- **Fill out templates** to create checklist responses (with response title, completed-by, and notes)
- **View completed records** in an organized, searchable list
- **Export any completed checklist to PDF** with a single click, producing a clean, printable report containing checklist details, items, and answers
- Works entirely in the browser — no backend or installation required

## Getting Started

1. Unzip the project.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
3. That's it — no build step, no server, no dependencies to install.

> Note: Data (templates and completed records) is stored in your browser's `localStorage`, scoped to the file/origin you open it from. If you want shared/multi-user persistence, you'll need to wire the `Storage` module in `js/storage.js` up to a backend API or database instead of `localStorage`.

## Project Structure

```
checklist-system/
├── index.html          # Main app shell — all views
├── css/
│   └── style.css       # All styling
├── js/
│   ├── storage.js       # Persistence layer (localStorage CRUD for templates & records)
│   ├── pdfExport.js      # Builds the printable PDF using jsPDF
│   └── app.js            # App controller — views, rendering, event binding
└── README.md
```

## How It Works

1. **Templates** — Go to "New Template", give it a name/description/category, and add checklist items (each item can be a Yes/No/N-A item or a text item). Save it.
2. **Fill Out** — From the Templates list, click "Fill Out" on any template. Answer each item, optionally add a response title, your name, and notes. Save the response.
3. **Records** — Every saved response appears under "Completed Records". You can view full details or delete a record.
4. **Export PDF** — From the record detail view (or directly from the Records list), click "Export as PDF" to download a formatted PDF containing the checklist name, metadata, and every item with its answer.

## Tech Stack

- Plain HTML/CSS/JavaScript (no framework, no build tooling)
- [jsPDF](https://github.com/parallax/jsPDF) (loaded via CDN) for PDF generation
- Browser `localStorage` for data persistence

## Extending This Project

- Swap `js/storage.js` for API calls to add a real backend (e.g., Node/Express + database) for multi-user support.
- Add user authentication if multiple people need separate accounts.
- Add more item types (e.g., multiple choice, ratings, photo upload).
- Add CSV/Excel export alongside PDF export.
