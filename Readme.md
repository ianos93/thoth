# Template Organizer

A browser-based report template tool. Runs on GitHub Pages — no server, no install.

## Setup

1. Create a new GitHub repository (can be private or public)
2. Upload these three files to the root of the repo:
   - `template-organizer.html`
   - `templates.js`
   - `README.md`
3. Go to **Settings → Pages → Source** and set it to `main` branch, `/ (root)`
4. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/`
5. Open `https://yourusername.github.io/your-repo-name/template-organizer.html`

## Adding built-in templates

Edit `templates.js` and add a new object to the `TEMPLATES` array. Each template needs:

```js
{
  id: 'unique_id',
  name: 'Display Name',
  folder: 'Folder Name',        // must match an existing folder or a new one

  onLoad(fv) {
    // optional: set defaults when template opens
    if (!fv.date) fv.date = today();
  },

  fields: [
    { id:'to', label:'To', type:'email', placeholder:'recipient@example.com' },
    { id:'subject', label:'Subject', type:'text' },
    { _divider: true },
    { id:'body', label:'Body', type:'textarea' },
  ],

  // Plain text output (used for copy-to-clipboard)
  render(v) {
    return `To: ${v.to}\nSubject: ${v.subject}\n\n${v.body}`;
  },

  // HTML output with clickable field spans (used for display)
  renderHtml(v) {
    return hesc('To: ') + fs('to', v.to)
      + '\n' + hesc('Subject: ') + fs('subject', v.subject)
      + '\n\n' + fs('body', v.body);
  },
}
```

### Field types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `email` | Email input |
| `date` | Date picker |
| `textarea` | Multi-line text |
| `select` | Dropdown — add `options: ['A','B','C']` |
| `list` | Add/remove rows |
| `listpicker` | Pick from saved lists — add `listKey: 'registrars'/'hosts'/'clients'` |

### Field options

| Option | Description |
|--------|-------------|
| `sanitize: 'url'` | Converts `https://` → `hxxps://` and `.` → `[.]` in output |
| `sanitize: 'domain'` | Converts `.` → `[.]` in output |
| `profileKey: 'company'` | Pre-fills from Profile panel (`company`/`name`/`email`/`role`/`dept`) |
| `hint: 'some text'` | Shows help text below the field |

### HTML helpers (available in `renderHtml`)

- `hesc(str)` — escapes a string for safe HTML insertion
- `fs(fieldId, value)` — wraps a value in a clickable span linked to its field
- `today()` — returns current date as `YYYY-MM-DD`
- `nowUtc()` — returns current UTC timestamp

## Saving data

All lists, drafts, and profile data are saved in your browser's `localStorage` for that origin.
Use **Export save file** in the sidebar to download a `.json` backup, and **Import save file** to restore it on another device or browser.