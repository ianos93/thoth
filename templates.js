// ═══════════════════════════════════════════════════════════════
// templates.js — built-in template definitions
// Place in the same folder as index.html
// ═══════════════════════════════════════════════════════════════

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
function hesc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
// Always wraps — shows placeholder span if value is empty
function fs(id, value, placeholder) {
  const display = value || placeholder || '';
  if (!display) return '';
  return `<span class="out-field" data-field="${id}">${hesc(display)}</span>`;
}

const ABUSE_MAP = {
  'Phishing':            'phishing',
  'Malware Distribution':'malware distribution',
  'Spam':                'spam',
  'Brand Impersonation': 'brand impersonation',
  'Scam':                'scams',
  'Other':               'malicious activities',
};

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
      { id:'registrar',    label:'Registrar',                      type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy\u2026' },
      { id:'client',       label:'Client',                         type:'listpicker', listKey:'clients',    placeholder:'Client name\u2026' },
      { id:'abuse_type',   label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { _divider: true },
      { id:'offending_domain', label:'Offending domain',           type:'text',       placeholder:'malicious-domain.com',           sanitize:'domain' },
      { id:'offending_url',    label:'Offending URL',              type:'text',       placeholder:'https://malicious-domain.com/\u2026', sanitize:'url' },
      { id:'original_domain',  label:"Original domain (client's)", type:'text',      placeholder:'legitimate-brand.com' },
      { id:'date_observed',    label:'Date observed',              type:'date' },
      { _divider: true },
      { id:'access_instructions', label:'Access instructions',     type:'textarea',   placeholder:'How to reach/reproduce the abuse\u2026', hint:'Describe how to access the malicious page.' },
      { id:'evidence_format',     label:'Evidence format',         type:'select',     options:['Screenshot + URL','HAR file','Email headers','Screenshot only','URL only'] },
      { id:'evidence_data',       label:'Evidence details',        type:'textarea',   placeholder:'Describe what the phishing site does, what it mimics\u2026' },
      { id:'blocklists',          label:'Blocklist references',    type:'list',       placeholder:'e.g. VirusTotal link, URLScan link\u2026' },
      { _divider: true },
      { id:'company_name', label:'Your company name', type:'text', placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',  label:'Case ID',           type:'text', placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',    label:'System timestamp',  type:'text', placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain) || '[offending domain]';
      const us    = sanitizeUrl(v.offending_url) || '[offending URL]';
      const lines = [];
      lines.push(`Dear ${v.registrar ? v.registrar + ' Abuse Team' : '[Registrar] Abuse Team'},`);
      lines.push(`\nWe have identified that the resource listed below is being used to facilitate ${abuse}. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.`);
      lines.push(`\nAs the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.`);
      lines.push(`\n${'─'.repeat(55)}\nABUSE REPORT & EVIDENCE\n${'─'.repeat(55)}`);
      lines.push(`Offending domain:  ${ds}`);
      lines.push(`Offending URL:     ${us}`);
      lines.push(`Original domain:   ${v.original_domain || '[original domain]'}`);
      lines.push(`Abuse type:        ${abuse}`);
      lines.push(`Date observed:     ${v.date_observed || '[date]'}`);
      lines.push(`Access:            ${v.access_instructions || '[access instructions]'}`);
      lines.push(`Evidence format:   ${v.evidence_format || '[evidence format]'}`);
      if (v.evidence_data) lines.push(`\nEvidence details:\n${v.evidence_data}`);
      if (v.blocklists?.length) { lines.push(`\nFlagged by the following blocklists:`); v.blocklists.forEach(b => lines.push(`  \u2022 ${b}`)); }
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
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type;
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const lines = [];
      lines.push(hesc('Dear ') + fs('registrar', v.registrar ? v.registrar + ' Abuse Team' : null, '[Registrar] Abuse Team') + hesc(','));
      lines.push('\n' + hesc('We have identified that the resource listed below is being used to facilitate ') + fs('abuse_type', abuse, '[abuse type]') + hesc('. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.'));
      lines.push('\n' + hesc('As the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('ABUSE REPORT & EVIDENCE') + '\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Offending domain:  ') + fs('offending_domain', ds, '[offending domain]'));
      lines.push(hesc('Offending URL:     ') + fs('offending_url', us, '[offending URL]'));
      lines.push(hesc('Original domain:   ') + fs('original_domain', v.original_domain, '[original domain]'));
      lines.push(hesc('Abuse type:        ') + fs('abuse_type', abuse, '[abuse type]'));
      lines.push(hesc('Date observed:     ') + fs('date_observed', v.date_observed, '[date]'));
      lines.push(hesc('Access:            ') + fs('access_instructions', v.access_instructions, '[access instructions]'));
      lines.push(hesc('Evidence format:   ') + fs('evidence_format', v.evidence_format, '[evidence format]'));
      if (v.evidence_data) lines.push('\n' + hesc('Evidence details:\n') + fs('evidence_data', v.evidence_data));
      if (v.blocklists?.length) { lines.push('\n' + hesc('Flagged by the following blocklists:')); v.blocklists.forEach(b => lines.push(hesc('  \u2022 ') + fs('blocklists', b))); }
      lines.push('\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Please confirm receipt of this report and inform us of the outcome of your investigation.\n'));
      lines.push(hesc('Sincerely,\nAbuse Operations\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
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
      { id:'registrar',    label:'Registrar',                      type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy\u2026' },
      { id:'client',       label:'Client',                         type:'listpicker', listKey:'clients',    placeholder:'Client name\u2026' },
      { id:'abuse_type',   label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { id:'their_case_id',label:'Their ticket / case ID',         type:'text',       placeholder:"Ref from the registrar's reply" },
      { _divider: true },
      { id:'offending_domain', label:'Offending domain',           type:'text',       placeholder:'malicious-domain.com',           sanitize:'domain' },
      { id:'offending_url',    label:'Offending URL',              type:'text',       placeholder:'https://malicious-domain.com/\u2026', sanitize:'url' },
      { id:'original_domain',  label:"Original domain (client's)", type:'text',      placeholder:'legitimate-brand.com' },
      { id:'date_observed',    label:'Date observed',              type:'date' },
      { _divider: true },
      { id:'access_instructions', label:'Access instructions',     type:'textarea',   placeholder:'How to reach/reproduce the abuse\u2026' },
      { id:'evidence_format',     label:'Evidence format',         type:'select',     options:['Screenshot + URL','HAR file','Email headers','Screenshot only','URL only'] },
      { id:'evidence_data',       label:'Evidence details',        type:'textarea',   placeholder:'Updated evidence or notes\u2026' },
      { _divider: true },
      { id:'company_name', label:'Your company name', type:'text', placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',  label:'Our case ID',       type:'text', placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',    label:'System timestamp',  type:'text', placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts    = v.timestamp || nowUtc();
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const ds    = sanitizeDomain(v.offending_domain) || '[offending domain]';
      const us    = sanitizeUrl(v.offending_url) || '[offending URL]';
      const base  = (v.offending_domain || '[domain]').replace(/^https?:\/\//i, '');
      const lines = [];
      lines.push(`Subject: [FOLLOW UP] ${abuse} - ${base} - Ref: ${v.their_case_id || '[their case ID]'}`);
      lines.push(`\nTo the Abuse Department,`);
      lines.push(`\nThis is a follow-up regarding the abuse report referenced below.\nOur monitoring systems indicate that the abusive content or domain is still active and accessible. Please provide a status update regarding your investigation.`);
      lines.push(`\n${'─'.repeat(55)}\nABUSE REPORT & EVIDENCE\n${'─'.repeat(55)}`);
      lines.push(`Offending URL:     ${us}`);
      lines.push(`Offending domain:  ${ds}`);
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
      const abuse = ABUSE_MAP[v.abuse_type] || v.abuse_type;
      const ds    = sanitizeDomain(v.offending_domain);
      const us    = sanitizeUrl(v.offending_url);
      const base  = (v.offending_domain || '').replace(/^https?:\/\//i, '');
      const lines = [];
      lines.push(hesc('Subject: [FOLLOW UP] ') + fs('abuse_type', abuse, '[abuse type]') + hesc(' - ') + fs('offending_domain', base, '[domain]') + hesc(' - Ref: ') + fs('their_case_id', v.their_case_id, '[their case ID]'));
      lines.push('\n' + hesc('To the Abuse Department,'));
      lines.push('\n' + hesc('This is a follow-up regarding the abuse report referenced below.\nOur monitoring systems indicate that the abusive content or domain is still active and accessible. Please provide a status update regarding your investigation.'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('ABUSE REPORT & EVIDENCE') + '\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Offending URL:     ') + fs('offending_url', us, '[offending URL]'));
      lines.push(hesc('Offending domain:  ') + fs('offending_domain', ds, '[offending domain]'));
      lines.push(hesc('Original domain:   ') + fs('original_domain', v.original_domain, '[original domain]'));
      lines.push(hesc('Abuse type:        ') + fs('abuse_type', abuse, '[abuse type]'));
      lines.push(hesc('Date observed:     ') + fs('date_observed', v.date_observed, '[date]'));
      lines.push(hesc('Assigned ticket:   ') + fs('their_case_id', v.their_case_id, '[ticket ID]'));
      lines.push(hesc('Access:            ') + fs('access_instructions', v.access_instructions, '[access instructions]'));
      lines.push(hesc('Evidence format:   ') + fs('evidence_format', v.evidence_format, '[evidence format]'));
      if (v.evidence_data) lines.push('\n' + hesc('Evidence details:\n') + fs('evidence_data', v.evidence_data));
      lines.push('\n' + hesc('─'.repeat(55)));
      lines.push(hesc('If you require additional evidence to proceed with mitigation, please let us know.\n'));
      lines.push(hesc('Sincerely,\nAbuse Operations\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Hosting Provider Abuse Report ──────────────────────────
  {
    id: 'abuse_host',
    name: 'Hosting Provider Abuse Report',
    folder: 'Abuse Reports',

    onLoad(fv) {
      if (!fv.date_observed) fv.date_observed = today();
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'host',         label:'Hosting provider',               type:'listpicker', listKey:'hosts',    placeholder:'e.g. Cloudflare\u2026' },
      { id:'client',       label:'Client',                         type:'listpicker', listKey:'clients',  placeholder:'Client name\u2026' },
      { id:'abuse_type',   label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { _divider: true },
      { id:'offending_url',    label:'Offending URL',              type:'text',       placeholder:'https://malicious-domain.com/\u2026', sanitize:'url' },
      { id:'original_domain',  label:"Original domain (client's)", type:'text',      placeholder:'legitimate-brand.com' },
      { id:'date_observed',    label:'Date observed',              type:'date' },
      { _divider: true },
      { id:'access_instructions', label:'Access instructions',     type:'textarea',   placeholder:'How to reach/reproduce the abuse\u2026', hint:'Describe how to access the malicious page.' },
      { id:'evidence_format',     label:'Evidence format',         type:'select',     options:['Screenshot + URL','HAR file','Email headers','Screenshot only','URL only'] },
      { id:'evidence_data',       label:'Evidence details',        type:'textarea',   placeholder:'Describe what the phishing site does, what it mimics\u2026' },
      { id:'blocklists',          label:'Blocklist references',    type:'list',       placeholder:'e.g. VirusTotal link, URLScan link\u2026' },
      { _divider: true },
      { id:'company_name', label:'Your company name', type:'text', placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',  label:'Case ID',           type:'text', placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',    label:'System timestamp',  type:'text', placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts         = v.timestamp || nowUtc();
      const abuse      = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const us         = sanitizeUrl(v.offending_url) || '[offending URL]';
      const phishRaw   = v.offending_url ? v.offending_url.replace(/^https?:\/\//i,'').split('/')[0] : '[phishing website]';
      const phishSan   = sanitizeDomain(phishRaw) || phishRaw;
      const lines = [];
      lines.push(`Subject: [URGENT] Phishing website Takedown Request for ${phishSan}`);
      lines.push(`\nDear ${v.host ? v.host + ' Abuse Team' : '[Host Provider] Abuse Team'},`);
      lines.push(`\nWe have identified that the resource listed below is being used to facilitate ${abuse}. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.`);
      lines.push(`\nAs the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.`);
      lines.push(`\n${'─'.repeat(55)}\nABUSE REPORT & EVIDENCE\n${'─'.repeat(55)}`);
      lines.push(`Offending URL:     ${us}`);
      lines.push(`Original domain:   ${v.original_domain || '[original domain]'}`);
      lines.push(`Abuse type:        ${abuse}`);
      lines.push(`Date observed:     ${v.date_observed || '[date]'}`);
      lines.push(`Access:            ${v.access_instructions || '[access instructions]'}`);
      lines.push(`Evidence format:   ${v.evidence_format || '[evidence format]'}`);
      if (v.evidence_data) lines.push(`\nEvidence details:\n${v.evidence_data}`);
      if (v.blocklists?.length) {
        lines.push(`\nPlease note that the phishing URL is already flagged as malicious by the following reputed blocklists:`);
        v.blocklists.forEach(b => lines.push(`  \u2022 ${b}`));
      } else {
        lines.push(`\nPlease note that the phishing URL is already flagged as malicious by the following reputed blocklists: [insert link/screenshots of blocklisting] [VT, URLScan, Spamhaus, GSB]`);
      }
      lines.push(`\nPlease confirm receipt of this report and inform us of the outcome of your investigation.\n`);
      lines.push(`Sincerely,\nAbuse Operations\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts         = v.timestamp || nowUtc();
      const abuse      = ABUSE_MAP[v.abuse_type] || v.abuse_type;
      const us         = sanitizeUrl(v.offending_url);
      const phishRaw   = v.offending_url ? v.offending_url.replace(/^https?:\/\//i,'').split('/')[0] : null;
      const phishSan   = phishRaw ? sanitizeDomain(phishRaw) : null;
      const lines = [];
      lines.push(hesc('Subject: [URGENT] Phishing website Takedown Request for ') + fs('offending_url', phishSan, '[phishing website]'));
      lines.push('\n' + hesc('Dear ') + fs('host', v.host ? v.host + ' Abuse Team' : null, '[Host Provider] Abuse Team') + hesc(','));
      lines.push('\n' + hesc('We have identified that the resource listed below is being used to facilitate ') + fs('abuse_type', abuse, '[abuse type]') + hesc('. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.'));
      lines.push('\n' + hesc('As the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('ABUSE REPORT & EVIDENCE') + '\n' + hesc('─'.repeat(55)));
      lines.push(hesc('Offending URL:     ') + fs('offending_url', us, '[offending URL]'));
      lines.push(hesc('Original domain:   ') + fs('original_domain', v.original_domain, '[original domain]'));
      lines.push(hesc('Abuse type:        ') + fs('abuse_type', abuse, '[abuse type]'));
      lines.push(hesc('Date observed:     ') + fs('date_observed', v.date_observed, '[date]'));
      lines.push(hesc('Access:            ') + fs('access_instructions', v.access_instructions, '[access instructions]'));
      lines.push(hesc('Evidence format:   ') + fs('evidence_format', v.evidence_format, '[evidence format]'));
      if (v.evidence_data) lines.push('\n' + hesc('Evidence details:\n') + fs('evidence_data', v.evidence_data));
      if (v.blocklists?.length) {
        lines.push('\n' + hesc('Please note that the phishing URL is already flagged as malicious by the following reputed blocklists:'));
        v.blocklists.forEach(b => lines.push(hesc('  \u2022 ') + fs('blocklists', b)));
      } else {
        lines.push('\n' + hesc('Please note that the phishing URL is already flagged as malicious by the following reputed blocklists: [insert link/screenshots of blocklisting] [VT, URLScan, Spamhaus, GSB]'));
      }
      lines.push('\n' + hesc('Please confirm receipt of this report and inform us of the outcome of your investigation.\n'));
      lines.push(hesc('Sincerely,\nAbuse Operations\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Trademark Infringement Notice ──────────────────────────
  {
    id: 'trademark_infringement',
    name: 'Trademark Infringement Notice',
    folder: 'Legal Notices',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'host',             label:'Host / provider',            type:'listpicker', listKey:'hosts',   placeholder:'e.g. Cloudflare\u2026' },
      { id:'client',           label:'Client',                     type:'listpicker', listKey:'clients', placeholder:'Client name\u2026' },
      { _divider: true },
      { id:'infringing_url',   label:'Infringing website URL',     type:'text',       placeholder:'https://infringing-site.com' },
      { id:'client_url',       label:"Client's original website",  type:'text',       placeholder:'https://client-brand.com' },
      { _divider: true },
      { id:'jurisdiction',     label:'Trademark jurisdiction',     type:'text',       placeholder:'e.g. United States, European Union\u2026' },
      { id:'trademark_number', label:'Trademark registration no.', type:'text',       placeholder:'e.g. US123456789' },
      { id:'infringement_desc',label:'What was infringed',         type:'textarea',   placeholder:'e.g. logo and name to provide a similar product / content from our client website', hint:'Describe specifically what the infringer copied or misused.' },
      { _divider: true },
      { id:'company_name',     label:'Your company name',          type:'text',       placeholder:'Acme Legal Inc.', profileKey:'company' },
      { id:'our_case_id',      label:'Case ID',                    type:'text',       placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',        label:'System timestamp',           type:'text',       placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts     = v.timestamp || nowUtc();
      const client = v.client || '[client]';
      const host   = v.host || '[Host name]';
      const lines  = [];
      lines.push(`Subject: Trademark infringement in relation to ${v.infringing_url || '[infringing website]'}`);
      lines.push(`\nDear ${host},`);
      lines.push(`\nWe act on behalf of our client, ${client}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${v.infringing_url || '[infringing website URL]'}`);
      lines.push(`And the original material of our client is at: ${v.client_url || "[client's website URL]"}`);
      lines.push(`\n${client} owns a ${v.jurisdiction || '[country jurisdiction]'} registered trademark under registration number: ${v.trademark_number || '[trademark number]'}. See attached proof of registration.`);
      lines.push(`\nThe infringer has copied and used ${client}'s ${v.infringement_desc || '[description of infringement]'}, creating confusion for ${client}'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ${client}'s permission.`);
      lines.push(`\nWe are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the trademark in question.`);
      lines.push(`\nRegards,\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts         = v.timestamp || nowUtc();
      const clientSpan = fs('client', v.client, '[client]');
      const hostSpan   = fs('host', v.host, '[Host name]');
      const lines      = [];
      lines.push(hesc('Subject: Trademark infringement in relation to ') + fs('infringing_url', v.infringing_url, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan + hesc(','));
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc('. It has come to our attention that a website your company hosts may be infringing on one of ') + clientSpan + hesc("'s trademarks. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', v.infringing_url, '[infringing website URL]'));
      lines.push(hesc("And the original material of our client is at: ") + fs('client_url', v.client_url, "[client's website URL]"));
      lines.push('\n' + clientSpan + hesc(' owns a ') + fs('jurisdiction', v.jurisdiction, '[country jurisdiction]') + hesc(' registered trademark under registration number: ') + fs('trademark_number', v.trademark_number, '[trademark number]') + hesc('. See attached proof of registration.'));
      lines.push('\n' + hesc('The infringer has copied and used ') + clientSpan + hesc("'s ") + fs('infringement_desc', v.infringement_desc, '[description of infringement]') + hesc(', creating confusion for ') + clientSpan + hesc("'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ") + clientSpan + hesc("'s permission."));
      lines.push('\n' + hesc('We are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the trademark in question.'));
      lines.push('\n' + hesc('Regards,\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
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
      { id:'title',           label:'Report title',      type:'text',     placeholder:'Q3 Performance Review' },
      { id:'date',            label:'Date',              type:'date' },
      { id:'author',          label:'Prepared by',       type:'text',     placeholder:'Name / Department', profileKey:'name' },
      { id:'addressed',       label:'Addressed to',      type:'text',     placeholder:'Name / Department' },
      { id:'subject',         label:'Subject',           type:'text',     placeholder:'Summary in one line' },
      { _divider: true },
      { id:'summary',         label:'Executive summary', type:'textarea', placeholder:'Brief overview\u2026' },
      { id:'body',            label:'Main content',      type:'textarea', placeholder:'Detailed analysis\u2026' },
      { id:'conclusions',     label:'Conclusions',       type:'textarea', placeholder:'Key takeaways\u2026' },
      { id:'recommendations', label:'Recommendations',   type:'textarea', placeholder:'Next steps\u2026' },
    ],

    render(v) {
      const lines = [];
      lines.push(`REPORT: ${v.title || '[Title]'}`);
      lines.push(`Date:   ${v.date || '[Date]'}`);
      lines.push(`From:   ${v.author || '[Author]'}`);
      lines.push(`To:     ${v.addressed || '[Recipient]'}`);
      lines.push(`Re:     ${v.subject || '[Subject]'}`);
      lines.push('─'.repeat(50));
      if (v.summary)         lines.push(`\nEXECUTIVE SUMMARY\n\n${v.summary}`);
      if (v.body)            lines.push(`\nDETAILS\n\n${v.body}`);
      if (v.conclusions)     lines.push(`\nCONCLUSIONS\n\n${v.conclusions}`);
      if (v.recommendations) lines.push(`\nRECOMMENDATIONS\n\n${v.recommendations}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const lines = [];
      lines.push(hesc('REPORT: ') + fs('title', v.title, '[Title]'));
      lines.push(hesc('Date:   ') + fs('date', v.date, '[Date]'));
      lines.push(hesc('From:   ') + fs('author', v.author, '[Author]'));
      lines.push(hesc('To:     ') + fs('addressed', v.addressed, '[Recipient]'));
      lines.push(hesc('Re:     ') + fs('subject', v.subject, '[Subject]'));
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
      { id:'subject', label:'Subject', type:'text',  placeholder:'Weekly update \u2014 Week 42' },
      { id:'date',    label:'Date',    type:'date' },
      { _divider: true },
      { id:'body', label:'Body', type:'textarea', placeholder:'Write your email here\u2026' },
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
      lines.push(hesc('To:      ') + fs('to', v.to, '[Recipient]'));
      if (v.cc) lines.push(hesc('CC:      ') + fs('cc', v.cc));
      lines.push(hesc('From:    ') + fs('from', v.from, '[Sender]'));
      lines.push(hesc('Subject: ') + fs('subject', v.subject, '[Subject]'));
      lines.push(hesc('Date:    ') + fs('date', v.date, '[Date]'));
      lines.push(hesc('─'.repeat(50)));
      lines.push('\n' + fs('body', v.body, '[Body]'));
      return lines.join('\n');
    },
  },

  // ── Meeting Minutes ─────────────────────────────────────────
  {
    id: 'meeting_minutes',
    name: 'Meeting Minutes',
    folder: 'General',

    fields: [
      { id:'meeting',      label:'Meeting name',    type:'text',     placeholder:'Sprint Planning \u2014 Week 42' },
      { id:'date',         label:'Date',            type:'date' },
      { id:'location',     label:'Location / link', type:'text',     placeholder:'Room 3B / Zoom' },
      { id:'facilitator',  label:'Facilitator',     type:'text',     placeholder:'Name', profileKey:'name' },
      { id:'attendees',    label:'Attendees',       type:'list',     placeholder:'Name, role\u2026' },
      { _divider: true },
      { id:'agenda',       label:'Agenda items',   type:'list',     placeholder:'Item\u2026' },
      { id:'notes',        label:'Notes',           type:'textarea', placeholder:'Key points\u2026' },
      { id:'decisions',    label:'Decisions made',  type:'list',     placeholder:'Decision\u2026' },
      { id:'actions',      label:'Action items',    type:'list',     placeholder:'Who does what by when\u2026' },
      { id:'next_meeting', label:'Next meeting',    type:'text',     placeholder:'Date / time' },
    ],

    render(v) {
      const lines = [];
      lines.push(`MEETING MINUTES\n${'─'.repeat(50)}`);
      lines.push(`Meeting:     ${v.meeting || '[Meeting name]'}`);
      lines.push(`Date:        ${v.date || '[Date]'}`);
      lines.push(`Location:    ${v.location || '[Location]'}`);
      lines.push(`Facilitator: ${v.facilitator || '[Facilitator]'}`);
      if (v.attendees?.length)  lines.push(`\nATTENDEES\n${v.attendees.map(a => `  \u2022 ${a}`).join('\n')}`);
      if (v.agenda?.length)     lines.push(`\nAGENDA\n${v.agenda.map((a,i) => `  ${i+1}. ${a}`).join('\n')}`);
      if (v.notes)              lines.push(`\nNOTES\n\n${v.notes}`);
      if (v.decisions?.length)  lines.push(`\nDECISIONS\n${v.decisions.map(d => `  \u2022 ${d}`).join('\n')}`);
      if (v.actions?.length)    lines.push(`\nACTION ITEMS\n${v.actions.map(a => `  \u2610 ${a}`).join('\n')}`);
      if (v.next_meeting)       lines.push(`\nNEXT MEETING: ${v.next_meeting}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const lines = [];
      lines.push(hesc('MEETING MINUTES\n') + hesc('─'.repeat(50)));
      lines.push(hesc('Meeting:     ') + fs('meeting', v.meeting, '[Meeting name]'));
      lines.push(hesc('Date:        ') + fs('date', v.date, '[Date]'));
      lines.push(hesc('Location:    ') + fs('location', v.location, '[Location]'));
      lines.push(hesc('Facilitator: ') + fs('facilitator', v.facilitator, '[Facilitator]'));
      if (v.attendees?.length)  lines.push('\n' + hesc('ATTENDEES\n') + v.attendees.map(a => hesc('  \u2022 ') + fs('attendees', a)).join('\n'));
      if (v.agenda?.length)     lines.push('\n' + hesc('AGENDA\n') + v.agenda.map((a,i) => hesc(`  ${i+1}. `) + fs('agenda', a)).join('\n'));
      if (v.notes)              lines.push('\n' + hesc('NOTES\n\n') + fs('notes', v.notes));
      if (v.decisions?.length)  lines.push('\n' + hesc('DECISIONS\n') + v.decisions.map(d => hesc('  \u2022 ') + fs('decisions', d)).join('\n'));
      if (v.actions?.length)    lines.push('\n' + hesc('ACTION ITEMS\n') + v.actions.map(a => hesc('  \u2610 ') + fs('actions', a)).join('\n'));
      if (v.next_meeting)       lines.push('\n' + hesc('NEXT MEETING: ') + fs('next_meeting', v.next_meeting));
      return lines.join('\n');
    },
  },

];

const BUILTIN_FOLDERS = new Set(TEMPLATES.map(t => t.folder));
