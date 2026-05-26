// ═══════════════════════════════════════════════════════════════
// templates.js — built-in template definitions
// Place this file in the same folder as template-organizer.html
// ═══════════════════════════════════════════════════════════════

// ── Shared utilities ─────────────────────────────────────────
const today  = () => new Date().toISOString().slice(0, 10);
const nowUtc = () => new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

function sanitizeUrl(raw) {
  if (!raw) return raw;
  return raw
    .replace(/^https?:\/\//i, m => m.replace(/https/i,'hxxps').replace(/http/i,'hxxp'))
    .replace(/\./g, '[.]');
}

function sanitizeDomain(raw) {
  if (!raw) return raw;
  return raw.replace(/^https?:\/\//i, '').replace(/\./g, '[.]');
}

// ── HTML helpers (used by renderHtml methods) ─────────────────
// hesc: escape a plain string for safe insertion into HTML
function hesc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// fs: wrap a filled field value in a clickable span
// Returns plain hesc'd text if empty (no span = not clickable)
function fs(id, text) {
  if (!text && text !== 0) return '';
  return `<span class="out-field" data-field="${id}">${hesc(text)}</span>`;
}

// line: escape a whole line of static text for innerHTML output
// Field values inside lines must be pre-wrapped with fs() before calling hesc on surrounding text
// Helper: builds a line mixing static text (auto-escaped) and pre-built field spans
// Usage: hl`Dear ${fs('reg', v.reg)} Abuse Team,`
function hl(strings, ...values) {
  return strings.map((s, i) => hesc(s) + (values[i] !== undefined ? values[i] : '')).join('');
}

// ── Abuse type map ────────────────────────────────────────────
const ABUSE_MAP = {
  'Phishing':           'phishing',
  'Malware Distribution':'malware distribution',
  'Spam':               'spam',
  'Brand Impersonation':'brand impersonation',
  'Scam':               'scams',
  'Other':              'malicious activities',
};

// ── Default hosting providers ─────────────────────────────────
const DEFAULT_HOSTS = [
  'Amazon Web Services (AWS)','Cloudflare','Google Cloud','Microsoft Azure',
  'DigitalOcean','Linode / Akamai','Vultr','Hetzner','OVHcloud','Fastly',
  'Leaseweb','Cogent Communications','Lumen / CenturyLink','Rackspace',
  'GoDaddy Hosting','Bluehost','HostGator','DreamHost','SiteGround',
  'Namecheap Hosting','Ionos / 1&1','Hostinger','A2 Hosting','InMotion Hosting',
  'WP Engine','Kinsta','Liquid Web','Nexcess','Contabo','BuyVM',
  'Frantech Solutions','Sharktech','Psychz Networks','QuadraNet','Zare',
  'M247','Serverius','Datacamp Limited','Combahton','Blazingfast',
];

// ── Built-in templates ────────────────────────────────────────
// Each template has:
//   id, name, folder, fields[]
//   onLoad(fv)          — called when template loads, sets defaults
//   render(v)           — returns plain text (used for copy)
//   renderHtml(v)       — returns HTML with clickable spans (used for display)
//
// Fields: { id, label, type, placeholder?, hint?, sanitize?, profileKey?, listKey?, options[] }
// Types:  text | email | date | textarea | list | select | listpicker
// _divider: true        — renders a horizontal rule between field groups

const TEMPLATES = [

  // ── Registrar Abuse Report ──────────────────────────────────
  {
    id: 'abuse_registrar',
    name: 'Registrar Abuse Report',
    folder: 'Abuse Reports',

    onLoad(fv) {
      if (!fv.date_observed) fv.date_observed = today();
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'registrar',    label:'Registrar',                      type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy…' },
      { id:'client',       label:'Client',                         type:'listpicker', listKey:'clients',    placeholder:'Client name…' },
      { id:'abuse_type',   label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { _divider: true },
      { id:'offending_domain', label:'Offending domain',           type:'text',       placeholder:'malicious-domain.com',            sanitize:'domain' },
      { id:'offending_url',    label:'Offending URL',              type:'text',       placeholder:'https://malicious-domain.com/…',   sanitize:'url' },
      { id:'original_domain',  label:"Original domain (client's)", type:'text',       placeholder:'legitimate-brand.com' },
      { id:'date_observed',    label:'Date observed',              type:'date' },
      { _divider: true },
      { id:'access_instructions', label:'Access instructions',     type:'textarea',   placeholder:'How to reach/reproduce the abuse…', hint:'Describe how to access the malicious page.' },
      { id:'evidence_format',     label:'Evidence format',         type:'select',     options:['Screenshot + URL','HAR file','Email headers','Screenshot only','URL only'] },
      { id:'evidence_data',       label:'Evidence details',        type:'textarea',   placeholder:'Describe what the phishing site does, what it mimics…' },
      { id:'blocklists',          label:'Blocklist references',    type:'list',       placeholder:'e.g. VirusTotal link, URLScan link…' },
      { _divider: true },
      { id:'company_name', label:'Your company name', type:'text', placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',  label:'Case ID',           type:'text', placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',    label:'System timestamp',  type:'text', placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const lines = [];
      lines.push(`Dear ${v.registrar ? v.registrar + ' Abuse Team' : '[Registrar] Abuse Team'},`);
      lines.push(`\nWe have identified that the resource listed below is being used to facilitate ${abuse}. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.`);
      lines.push(`\nAs the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.`);
      lines.push(`\n${'─'.repeat(55)}\nABUSE REPORT & EVIDENCE\n${'─'.repeat(55)}`);
      lines.push(`Offending domain:  ${ds || '[offending domain]'}`);
      lines.push(`Offending URL:     ${us || '[offending URL]'}`);
      lines.push(`Original domain:   ${v.original_domain || '[original domain]'}`);
      lines.push(`Abuse type:        ${abuse}`);
      lines.push(`Date observed:     ${v.date_observed || '[date]'}`);
      lines.push(`Access:            ${v.access_instructions || '[access instructions]'}`);
      lines.push(`Evidence format:   ${v.evidence_format || '[evidence format]'}`);
      if (v.evidence_data) lines.push(`\nEvidence details:\n${v.evidence_data}`);
      if (v.blocklists?.length) { lines.push(`\nFlagged by the following blocklists:`); v.blocklists.forEach(b => lines.push(`  • ${b}`)); }
      lines.push(`\n${'─'.repeat(55)}`);
      lines.push(`Please confirm receipt of this report and inform us of the outcome of your investigation.\n`);
      lines.push(`Sincerely,\nAbuse Operations\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const lines = [];
      lines.push(hl`Dear ${v.registrar ? fs('registrar', v.registrar) + hesc(' Abuse Team') : '[Registrar] Abuse Team'},`);
      lines.push('\n' + hesc('We have identified that the resource listed below is being used to facilitate ') + fs('abuse_type', abuse) + hesc('. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.'));
      lines.push('\n' + hesc('As the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('ABUSE REPORT & EVIDENCE') + '\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Offending domain:  ') + (ds ? fs('offending_domain', ds) : hesc('[offending domain]')));
      lines.push(hesc('Offending URL:     ') + (us ? fs('offending_url', us) : hesc('[offending URL]')));
      lines.push(hesc('Original domain:   ') + (v.original_domain ? fs('original_domain', v.original_domain) : hesc('[original domain]')));
      lines.push(hesc('Abuse type:        ') + fs('abuse_type', abuse));
      lines.push(hesc('Date observed:     ') + (v.date_observed ? fs('date_observed', v.date_observed) : hesc('[date]')));
      lines.push(hesc('Access:            ') + (v.access_instructions ? fs('access_instructions', v.access_instructions) : hesc('[access instructions]')));
      lines.push(hesc('Evidence format:   ') + (v.evidence_format ? fs('evidence_format', v.evidence_format) : hesc('[evidence format]')));
      if (v.evidence_data) lines.push('\n' + hesc('Evidence details:\n') + fs('evidence_data', v.evidence_data));
      if (v.blocklists?.length) {
        lines.push('\n' + hesc('Flagged by the following blocklists:'));
        v.blocklists.forEach(b => lines.push(hesc('  • ') + fs('blocklists', b)));
      }
      lines.push('\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Please confirm receipt of this report and inform us of the outcome of your investigation.\n'));
      lines.push(hesc('Sincerely,\nAbuse Operations\n') + (v.company_name ? fs('company_name', v.company_name) : hesc('[Company Name]')));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + (v.our_case_id ? fs('our_case_id', v.our_case_id) : hesc('[Case ID]')));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Follow-Up Abuse Report ──────────────────────────────────
  {
    id: 'abuse_followup',
    name: 'Follow-Up Abuse Report',
    folder: 'Abuse Reports',

    onLoad(fv) {
      if (!fv.date_observed) fv.date_observed = today();
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'registrar',    label:'Registrar',                      type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy…' },
      { id:'client',       label:'Client',                         type:'listpicker', listKey:'clients',    placeholder:'Client name…' },
      { id:'abuse_type',   label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { id:'their_case_id',label:'Their ticket / case ID',         type:'text',       placeholder:"Ref from the registrar's reply" },
      { _divider: true },
      { id:'offending_domain', label:'Offending domain',           type:'text',       placeholder:'malicious-domain.com',            sanitize:'domain' },
      { id:'offending_url',    label:'Offending URL',              type:'text',       placeholder:'https://malicious-domain.com/…',   sanitize:'url' },
      { id:'original_domain',  label:"Original domain (client's)", type:'text',       placeholder:'legitimate-brand.com' },
      { id:'date_observed',    label:'Date observed',              type:'date' },
      { _divider: true },
      { id:'access_instructions', label:'Access instructions',     type:'textarea',   placeholder:'How to reach/reproduce the abuse…' },
      { id:'evidence_format',     label:'Evidence format',         type:'select',     options:['Screenshot + URL','HAR file','Email headers','Screenshot only','URL only'] },
      { id:'evidence_data',       label:'Evidence details',        type:'textarea',   placeholder:'Updated evidence or notes…' },
      { _divider: true },
      { id:'company_name', label:'Your company name', type:'text', placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',  label:'Our case ID',       type:'text', placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',    label:'System timestamp',  type:'text', placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const base  = (v.offending_domain || '[domain]').replace(/^https?:\/\//i, '');
      const lines = [];
      lines.push(`Subject: [FOLLOW UP] ${abuse} - ${base} - Ref: ${v.their_case_id || '[their case ID]'}`);
      lines.push(`\nTo the Abuse Department,`);
      lines.push(`\nThis is a follow-up regarding the abuse report referenced below.\nOur monitoring systems indicate that the abusive content or domain is still active and accessible. Please provide a status update regarding your investigation.`);
      lines.push(`\n${'─'.repeat(55)}\nABUSE REPORT & EVIDENCE\n${'─'.repeat(55)}`);
      lines.push(`Offending URL:     ${us || '[offending URL]'}`);
      lines.push(`Offending domain:  ${ds || '[offending domain]'}`);
      lines.push(`Original domain:   ${v.original_domain || '[original domain]'}`);
      lines.push(`Abuse type:        ${abuse}`);
      lines.push(`Date observed:     ${v.date_observed || '[date]'}`);
      lines.push(`Assigned ticket:   ${v.their_case_id || '[ticket ID]'}`);
      lines.push(`Access:            ${v.access_instructions || '[access instructions]'}`);
      lines.push(`Evidence format:   ${v.evidence_format || '[evidence format]'}`);
      if (v.evidence_data) lines.push(`\nEvidence details:\n${v.evidence_data}`);
      lines.push(`\n${'─'.repeat(55)}`);
      lines.push(`If you require additional evidence to proceed with mitigation, please let us know.\n`);
      lines.push(`Sincerely,\nAbuse Operations\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const base  = (v.offending_domain || '[domain]').replace(/^https?:\/\//i, '');
      const lines = [];
      lines.push(hesc('Subject: [FOLLOW UP] ') + fs('abuse_type', abuse) + hesc(' - ') + hesc(base) + hesc(' - Ref: ') + (v.their_case_id ? fs('their_case_id', v.their_case_id) : hesc('[their case ID]')));
      lines.push('\n' + hesc('To the Abuse Department,'));
      lines.push('\n' + hesc('This is a follow-up regarding the abuse report referenced below.\nOur monitoring systems indicate that the abusive content or domain is still active and accessible. Please provide a status update regarding your investigation.'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('ABUSE REPORT & EVIDENCE') + '\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Offending URL:     ') + (us ? fs('offending_url', us) : hesc('[offending URL]')));
      lines.push(hesc('Offending domain:  ') + (ds ? fs('offending_domain', ds) : hesc('[offending domain]')));
      lines.push(hesc('Original domain:   ') + (v.original_domain ? fs('original_domain', v.original_domain) : hesc('[original domain]')));
      lines.push(hesc('Abuse type:        ') + fs('abuse_type', abuse));
      lines.push(hesc('Date observed:     ') + (v.date_observed ? fs('date_observed', v.date_observed) : hesc('[date]')));
      lines.push(hesc('Assigned ticket:   ') + (v.their_case_id ? fs('their_case_id', v.their_case_id) : hesc('[ticket ID]')));
      lines.push(hesc('Access:            ') + (v.access_instructions ? fs('access_instructions', v.access_instructions) : hesc('[access instructions]')));
      lines.push(hesc('Evidence format:   ') + (v.evidence_format ? fs('evidence_format', v.evidence_format) : hesc('[evidence format]')));
      if (v.evidence_data) lines.push('\n' + hesc('Evidence details:\n') + fs('evidence_data', v.evidence_data));
      lines.push('\n' + hesc('─'.repeat(55)));
      lines.push(hesc('If you require additional evidence to proceed with mitigation, please let us know.\n'));
      lines.push(hesc('Sincerely,\nAbuse Operations\n') + (v.company_name ? fs('company_name', v.company_name) : hesc('[Company Name]')));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + (v.our_case_id ? fs('our_case_id', v.our_case_id) : hesc('[Case ID]')));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Formal Report ───────────────────────────────────────────
  {
    id: 'formal_report',
    name: 'Formal Report',
    folder: 'General',

    fields: [
      { id:'title',            label:'Report title',      type:'text',     placeholder:'Q3 Performance Review' },
      { id:'date',             label:'Date',              type:'date' },
      { id:'author',           label:'Prepared by',       type:'text',     placeholder:'Name / Department', profileKey:'name' },
      { id:'addressed',        label:'Addressed to',      type:'text',     placeholder:'Name / Department' },
      { id:'subject',          label:'Subject',           type:'text',     placeholder:'Summary in one line' },
      { _divider: true },
      { id:'summary',          label:'Executive summary', type:'textarea', placeholder:'Brief overview…' },
      { id:'body',             label:'Main content',      type:'textarea', placeholder:'Detailed analysis…' },
      { id:'conclusions',      label:'Conclusions',       type:'textarea', placeholder:'Key takeaways…' },
      { id:'recommendations',  label:'Recommendations',   type:'textarea', placeholder:'Next steps…' },
    ],

    render(v) {
      const lines = [];
      lines.push(`REPORT: ${v.title || '[Title]'}`);
      lines.push(`Date:   ${v.date || '[Date]'}`);
      lines.push(`From:   ${v.author || '[Author]'}`);
      lines.push(`To:     ${v.addressed || '[Recipient]'}`);
      lines.push(`Re:     ${v.subject || '[Subject]'}`);
      lines.push('─'.repeat(50));
      if (v.summary)        lines.push(`\nEXECUTIVE SUMMARY\n\n${v.summary}`);
      if (v.body)           lines.push(`\nDETAILS\n\n${v.body}`);
      if (v.conclusions)    lines.push(`\nCONCLUSIONS\n\n${v.conclusions}`);
      if (v.recommendations)lines.push(`\nRECOMMENDATIONS\n\n${v.recommendations}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const lines = [];
      lines.push(hesc('REPORT: ') + (v.title ? fs('title', v.title) : hesc('[Title]')));
      lines.push(hesc('Date:   ') + (v.date ? fs('date', v.date) : hesc('[Date]')));
      lines.push(hesc('From:   ') + (v.author ? fs('author', v.author) : hesc('[Author]')));
      lines.push(hesc('To:     ') + (v.addressed ? fs('addressed', v.addressed) : hesc('[Recipient]')));
      lines.push(hesc('Re:     ') + (v.subject ? fs('subject', v.subject) : hesc('[Subject]')));
      lines.push(hesc('─'.repeat(50)));
      if (v.summary)         lines.push('\n' + hesc('EXECUTIVE SUMMARY\n\n') + fs('summary', v.summary));
      if (v.body)            lines.push('\n' + hesc('DETAILS\n\n') + fs('body', v.body));
      if (v.conclusions)     lines.push('\n' + hesc('CONCLUSIONS\n\n') + fs('conclusions', v.conclusions));
      if (v.recommendations) lines.push('\n' + hesc('RECOMMENDATIONS\n\n') + fs('recommendations', v.recommendations));
      return lines.join('\n');
    },
  },

  // ── Email Report ────────────────────────────────────────────
  {
    id: 'email_report',
    name: 'Email Report',
    folder: 'General',

    fields: [
      { id:'to',      label:'To',      type:'email', placeholder:'recipient@example.com' },
      { id:'cc',      label:'CC',      type:'email', placeholder:'optional' },
      { id:'from',    label:'From',    type:'email', placeholder:'you@example.com', profileKey:'email' },
      { id:'subject', label:'Subject', type:'text',  placeholder:'Weekly update — Week 42' },
      { id:'date',    label:'Date',    type:'date' },
      { _divider: true },
      { id:'body', label:'Body', type:'textarea', placeholder:'Write your email here…' },
    ],

    render(v) {
      const lines = [];
      lines.push(`To:      ${v.to || '[Recipient]'}`);
      if (v.cc) lines.push(`CC:      ${v.cc}`);
      lines.push(`From:    ${v.from || '[Sender]'}`);
      lines.push(`Subject: ${v.subject || '[Subject]'}`);
      lines.push(`Date:    ${v.date || '[Date]'}`);
      lines.push('─'.repeat(50));
      lines.push(`\n${v.body || '[Body]'}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const lines = [];
      lines.push(hesc('To:      ') + (v.to ? fs('to', v.to) : hesc('[Recipient]')));
      if (v.cc) lines.push(hesc('CC:      ') + fs('cc', v.cc));
      lines.push(hesc('From:    ') + (v.from ? fs('from', v.from) : hesc('[Sender]')));
      lines.push(hesc('Subject: ') + (v.subject ? fs('subject', v.subject) : hesc('[Subject]')));
      lines.push(hesc('Date:    ') + (v.date ? fs('date', v.date) : hesc('[Date]')));
      lines.push(hesc('─'.repeat(50)));
      lines.push('\n' + (v.body ? fs('body', v.body) : hesc('[Body]')));
      return lines.join('\n');
    },
  },

  // ── Meeting Minutes ─────────────────────────────────────────
  {
    id: 'meeting_minutes',
    name: 'Meeting Minutes',
    folder: 'General',

    fields: [
      { id:'meeting',      label:'Meeting name',    type:'text',     placeholder:'Sprint Planning — Week 42' },
      { id:'date',         label:'Date',            type:'date' },
      { id:'location',     label:'Location / link', type:'text',     placeholder:'Room 3B / Zoom' },
      { id:'facilitator',  label:'Facilitator',     type:'text',     placeholder:'Name', profileKey:'name' },
      { id:'attendees',    label:'Attendees',       type:'list',     placeholder:'Name, role…' },
      { _divider: true },
      { id:'agenda',       label:'Agenda items',   type:'list',     placeholder:'Item…' },
      { id:'notes',        label:'Notes',           type:'textarea', placeholder:'Key points…' },
      { id:'decisions',    label:'Decisions made',  type:'list',     placeholder:'Decision…' },
      { id:'actions',      label:'Action items',    type:'list',     placeholder:'Who does what by when…' },
      { id:'next_meeting', label:'Next meeting',    type:'text',     placeholder:'Date / time' },
    ],

    render(v) {
      const lines = [];
      lines.push(`MEETING MINUTES\n${'─'.repeat(50)}`);
      lines.push(`Meeting:     ${v.meeting || '[Meeting name]'}`);
      lines.push(`Date:        ${v.date || '[Date]'}`);
      lines.push(`Location:    ${v.location || '[Location]'}`);
      lines.push(`Facilitator: ${v.facilitator || '[Facilitator]'}`);
      if (v.attendees?.length)  lines.push(`\nATTENDEES\n${v.attendees.map(a => `  • ${a}`).join('\n')}`);
      if (v.agenda?.length)     lines.push(`\nAGENDA\n${v.agenda.map((a,i) => `  ${i+1}. ${a}`).join('\n')}`);
      if (v.notes)              lines.push(`\nNOTES\n\n${v.notes}`);
      if (v.decisions?.length)  lines.push(`\nDECISIONS\n${v.decisions.map(d => `  • ${d}`).join('\n')}`);
      if (v.actions?.length)    lines.push(`\nACTION ITEMS\n${v.actions.map(a => `  ☐ ${a}`).join('\n')}`);
      if (v.next_meeting)       lines.push(`\nNEXT MEETING: ${v.next_meeting}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const lines = [];
      lines.push(hesc('MEETING MINUTES\n') + hesc('─'.repeat(50)));
      lines.push(hesc('Meeting:     ') + (v.meeting ? fs('meeting', v.meeting) : hesc('[Meeting name]')));
      lines.push(hesc('Date:        ') + (v.date ? fs('date', v.date) : hesc('[Date]')));
      lines.push(hesc('Location:    ') + (v.location ? fs('location', v.location) : hesc('[Location]')));
      lines.push(hesc('Facilitator: ') + (v.facilitator ? fs('facilitator', v.facilitator) : hesc('[Facilitator]')));
      if (v.attendees?.length)  lines.push('\n' + hesc('ATTENDEES\n') + v.attendees.map(a => hesc('  • ') + fs('attendees', a)).join('\n'));
      if (v.agenda?.length)     lines.push('\n' + hesc('AGENDA\n') + v.agenda.map((a,i) => hesc(`  ${i+1}. `) + fs('agenda', a)).join('\n'));
      if (v.notes)              lines.push('\n' + hesc('NOTES\n\n') + fs('notes', v.notes));
      if (v.decisions?.length)  lines.push('\n' + hesc('DECISIONS\n') + v.decisions.map(d => hesc('  • ') + fs('decisions', d)).join('\n'));
      if (v.actions?.length)    lines.push('\n' + hesc('ACTION ITEMS\n') + v.actions.map(a => hesc('  ☐ ') + fs('actions', a)).join('\n'));
      if (v.next_meeting)       lines.push('\n' + hesc('NEXT MEETING: ') + fs('next_meeting', v.next_meeting));
      return lines.join('\n');
    },
  },

];

const BUILTIN_FOLDERS = new Set(TEMPLATES.map(t => t.folder));