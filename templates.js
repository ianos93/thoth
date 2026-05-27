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

  // ── US Hosting Infringement Notice ──────────────────────────
  {
    id: 'us_host_infringement',
    name: 'US Host Infringement Notice',
    folder: 'Legal Notices',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.your_name && p.name) fv.your_name = p.name;
      if (!fv.your_email && p.email) fv.your_email = p.email;
    },

    fields: [
      { id:'infringement_type',label:'Infringement type',      type:'select',     options:['Copyright','Trademark','Copyright and Trademark'] },
      { id:'host',             label:'Host / provider',        type:'listpicker', listKey:'hosts',   placeholder:'e.g. Cloudflare\u2026' },
      { id:'client',           label:'Client',                 type:'listpicker', listKey:'clients', placeholder:'Client name\u2026' },
      { _divider: true },
      { id:'infringing_url',   label:'Infringing website URL', type:'text',       placeholder:'https://infringing-site.com', sanitize:'url' },
      { id:'client_url',       label:"Client's original website", type:'text',    placeholder:'https://client-brand.com' },
      { id:'infringement_desc',label:'What was infringed',     type:'textarea',   placeholder:'e.g. logo and name to provide a similar product...' },
      { _divider: true },
      { id:'your_name',        label:'Your name',              type:'text',       placeholder:'Jane Doe', profileKey:'name' },
      { id:'your_email',       label:'Your email address',     type:'email',      placeholder:'jane@phishfort.com', profileKey:'email' },
      { id:'signature',        label:'Signature',              type:'text',       placeholder:'J.M. Smith', hint:'Your initials and surname' }
    ],

    render(v) {
      const type   = v.infringement_type || '[Copyright / Trademark]';
      const client = v.client || '[client]';
      const host   = v.host || '[Host name]';
      const lines  = [];
      lines.push(`Subject: ${type} infringement in relation to ${v.infringing_url || '[infringing website]'}`);
      lines.push(`\nDear ${host}`);
      lines.push(`\nWe act on behalf of our client, ${client}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${v.infringing_url || '[infringing website]'}`);
      lines.push(`And the original material of our client is at: ${v.client_url || '[client website]'}`);
      lines.push(`\nThe infringer has copied and used ${client}'s ${v.infringement_desc || '[description of infringement]'}, creating confusion for ${client}'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ${client}'s permission.`);
      lines.push(`\nWe are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.`);
      lines.push(`\nYou may use the following contact information for any further correspondence:`);
      lines.push(`${v.your_name || '[Your name]'}`);
      lines.push(`160 Robinson Road, #14-04 Singapore Business Federation Centre Singapore (068914)`);
      lines.push(`${v.your_email || '[Your email address]'}`);
      lines.push(`\nRegards`);
      lines.push(`Signed:`);
      lines.push(`${v.signature || '[Your initials and surname]'}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const typeSpan   = fs('infringement_type', v.infringement_type, '[Copyright / Trademark]');
      const clientSpan = fs('client', v.client, '[client]');
      const hostSpan   = fs('host', v.host, '[Host name]');
      const lines      = [];
      lines.push(hesc('Subject: ') + typeSpan + hesc(' infringement in relation to ') + fs('infringing_url', v.infringing_url, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan);
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc(". It has come to our attention that a website your company hosts may be infringing on one of ") + clientSpan + hesc("'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', v.infringing_url, '[infringing website]'));
      lines.push(hesc('And the original material of our client is at: ') + fs('client_url', v.client_url, '[client website]'));
      lines.push('\n' + hesc('The infringer has copied and used ') + clientSpan + hesc("'s ") + fs('infringement_desc', v.infringement_desc, '[description of infringement]') + hesc(", creating confusion for ") + clientSpan + hesc("'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ") + clientSpan + hesc("'s permission."));
      lines.push('\n' + hesc('We are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.'));
      lines.push('\n' + hesc('You may use the following contact information for any further correspondence:'));
      lines.push(fs('your_name', v.your_name, '[Your name]'));
      lines.push(hesc('160 Robinson Road, #14-04 Singapore Business Federation Centre Singapore (068914)'));
      lines.push(fs('your_email', v.your_email, '[Your email address]'));
      lines.push('\n' + hesc('Regards'));
      lines.push(hesc('Signed:'));
      lines.push(fs('signature', v.signature, '[Your initials and surname]'));
      return lines.join('\n');
    },
  },

  // ── Non-US Hosting Infringement Notice ──────────────────────
  {
    id: 'non_us_host_infringement',
    name: 'Non-US Host Infringement Notice',
    folder: 'Legal Notices',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.your_email && p.email) fv.your_email = p.email;
    },

    fields: [
      { id:'infringement_type',label:'Infringement type',      type:'select',     options:['Copyright','Trademark','Copyright and Trademark'] },
      { id:'host',             label:'Host / provider',        type:'listpicker', listKey:'hosts',   placeholder:'e.g. Hetzner\u2026' },
      { id:'client',           label:'Client (short name)',    type:'listpicker', listKey:'clients', placeholder:'Client name\u2026' },
      { id:'client_details',   label:'Client full details',    type:'textarea',   placeholder:'Full name, co. registration number, location\u2026', hint:'Used in the opening paragraph.' },
      { _divider: true },
      { id:'infringing_url',   label:'Infringing website URL', type:'text',       placeholder:'https://infringing-site.com', sanitize:'url' },
      { id:'client_url',       label:"Client's original website", type:'text',    placeholder:'https://client-brand.com' },
      { id:'infringement_desc',label:'What was infringed',     type:'textarea',   placeholder:'e.g. logo and name to provide a similar product...' },
      { _divider: true },
      { id:'your_email',       label:'Your email address',     type:'email',      placeholder:'jane@phishfort.com', profileKey:'email' }
    ],

    render(v) {
      const type    = v.infringement_type || '[Copyright / Trademark]';
      const client  = v.client || '[client]';
      const details = v.client_details || '[client’s full name, co. registration number, location]';
      const host    = v.host || '[Host name]';
      const lines   = [];
      lines.push(`Subject: ${type} infringement in relation to ${v.infringing_url || '[infringing website]'}`);
      lines.push(`\nDear ${host}`);
      lines.push(`\nWe act on behalf of our client, ${details}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${v.infringing_url || '[infringer website]'}`);
      lines.push(`And the original material of our client is at: ${v.client_url || '[client website]'}`);
      lines.push(`\nThe infringer has copied and used ${client}'s ${v.infringement_desc || '[description of infringement]'}, creating confusion for ${client}'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ${client}'s permission.`);
      lines.push(`\nWe are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.`);
      lines.push(`\nYou may use the following email address for any further correspondence: ${v.your_email || '[your email address]'}`);
      lines.push(`\nRegards`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const typeSpan    = fs('infringement_type', v.infringement_type, '[Copyright / Trademark]');
      const clientSpan  = fs('client', v.client, '[client]');
      const detailsSpan = fs('client_details', v.client_details, '[client’s full name, co. registration number, location]');
      const hostSpan    = fs('host', v.host, '[Host name]');
      const lines       = [];
      lines.push(hesc('Subject: ') + typeSpan + hesc(' infringement in relation to ') + fs('infringing_url', v.infringing_url, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan);
      lines.push('\n' + hesc('We act on behalf of our client, ') + detailsSpan + hesc(". It has come to our attention that a website your company hosts may be infringing on one of ") + clientSpan + hesc("'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', v.infringing_url, '[infringer website]'));
      lines.push(hesc('And the original material of our client is at: ') + fs('client_url', v.client_url, '[client website]'));
      lines.push('\n' + hesc('The infringer has copied and used ') + clientSpan + hesc("'s ") + fs('infringement_desc', v.infringement_desc, '[description of infringement]') + hesc(", creating confusion for ") + clientSpan + hesc("'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ") + clientSpan + hesc("'s permission."));
      lines.push('\n' + hesc('We are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.'));
      lines.push('\n' + hesc('You may use the following email address for any further correspondence: ') + fs('your_email', v.your_email, '[your email address]'));
      lines.push('\n' + hesc('Regards'));
      return lines.join('\n');
    }
  }
  
];

const BUILTIN_FOLDERS = new Set(TEMPLATES.map(t => t.folder));
