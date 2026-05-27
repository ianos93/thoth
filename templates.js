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
      const lines = [];
      lines.push(`Subject: [FOLLOW UP] ${abuse} - ${ds} - Ref: ${v.their_case_id || '[their case ID]'}`);
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
      const lines = [];
      lines.push(hesc('Subject: [FOLLOW UP] ') + fs('abuse_type', abuse, '[abuse type]') + hesc(' - ') + fs('offending_domain', ds, '[domain]') + hesc(' - Ref: ') + fs('their_case_id', v.their_case_id, '[their case ID]'));
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
      { id:'infringing_url',   label:'Infringing website URL',     type:'text',       placeholder:'https://infringing-site.com', sanitize:'url' },
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
      const us     = sanitizeUrl(v.infringing_url) || '[infringing website URL]';
      const lines  = [];
      lines.push(`Subject: Trademark infringement in relation to ${us}`);
      lines.push(`\nDear ${host},`);
      lines.push(`\nWe act on behalf of our client, ${client}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${us}`);
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
      const us         = sanitizeUrl(v.infringing_url);
      const lines      = [];
      lines.push(hesc('Subject: Trademark infringement in relation to ') + fs('infringing_url', us, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan + hesc(','));
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc('. It has come to our attention that a website your company hosts may be infringing on one of ') + clientSpan + hesc("'s trademarks. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', us, '[infringing website URL]'));
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
      const us     = sanitizeUrl(v.infringing_url) || '[infringing website]';
      const lines  = [];
      lines.push(`Subject: ${type} infringement in relation to ${us}`);
      lines.push(`\nDear ${host}`);
      lines.push(`\nWe act on behalf of our client, ${client}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${us}`);
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
      const us         = sanitizeUrl(v.infringing_url);
      const lines      = [];
      lines.push(hesc('Subject: ') + typeSpan + hesc(' infringement in relation to ') + fs('infringing_url', us, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan);
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc(". It has come to our attention that a website your company hosts may be infringing on one of ") + clientSpan + hesc("'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', us, '[infringing website]'));
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
      const us      = sanitizeUrl(v.infringing_url) || '[infringer website]';
      const lines   = [];
      lines.push(`Subject: ${type} infringement in relation to ${us}`);
      lines.push(`\nDear ${host}`);
      lines.push(`\nWe act on behalf of our client, ${details}. It has come to our attention that a website your company hosts may be infringing on one of ${client}'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${us}`);
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
      const us          = sanitizeUrl(v.infringing_url);
      const lines       = [];
      lines.push(hesc('Subject: ') + typeSpan + hesc(' infringement in relation to ') + fs('infringing_url', us, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan);
      lines.push('\n' + hesc('We act on behalf of our client, ') + detailsSpan + hesc(". It has come to our attention that a website your company hosts may be infringing on one of ") + clientSpan + hesc("'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', us, '[infringer website]'));
      lines.push(hesc('And the original material of our client is at: ') + fs('client_url', v.client_url, '[client website]'));
      lines.push('\n' + hesc('The infringer has copied and used ') + clientSpan + hesc("'s ") + fs('infringement_desc', v.infringement_desc, '[description of infringement]') + hesc(", creating confusion for ") + clientSpan + hesc("'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ") + clientSpan + hesc("'s permission."));
      lines.push('\n' + hesc('We are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.'));
      lines.push('\n' + hesc('You may use the following email address for any further correspondence: ') + fs('your_email', v.your_email, '[your email address]'));
      lines.push('\n' + hesc('Regards'));
      return lines.join('\n');
    },
  },

  // ── Registrar Infringement Notice ─────────────────────────────
  {
    id: 'registrar_infringement',
    name: 'Registrar Infringement Notice',
    folder: 'Legal Notices',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.your_name && p.name) fv.your_name = p.name;
      if (!fv.your_email && p.email) fv.your_email = p.email;
    },

    fields: [
      { id:'infringement_type',label:'Infringement type',      type:'select',     options:['Copyright','Trademark','Copyright and Trademark'] },
      { id:'registrar',        label:'Registrar',              type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy\u2026' },
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
      const reg    = v.registrar || '[Registrar name]';
      const us     = sanitizeUrl(v.infringing_url) || '[infringing website]';
      const lines  = [];
      lines.push(`Subject: ${type} infringement in relation to ${us}`);
      lines.push(`\nDear ${reg}`);
      lines.push(`\nWe act on behalf of our client, ${client}. It has come to our attention that a website for which your company is the registrar may be infringing on one of ${client}'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed.`);
      lines.push(`\nThe infringing material is found at: ${us}`);
      lines.push(`And the original material of our client is at: ${v.client_url || '[client website]'}`);
      lines.push(`\nThe infringer has copied and used ${client}'s ${v.infringement_desc || '[description of infringement]'}, creating confusion for ${client}'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ${client}'s permission.`);
      lines.push(`\nWe are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.`);
      lines.push(`\nYou may use the following contact information for any further correspondence:`);
      lines.push(`${v.your_name || '[Your name]'}`);
      lines.push(`PhishFort, 160 Robinson Road, #14-04 Singapore Business Federation Centre Singapore (068914)`);
      lines.push(`${v.your_email || '[Your email address]'}`);
      lines.push(`\nRegards`);
      lines.push(`Signed: ${v.signature || '[Your initials and surname]'}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const typeSpan   = fs('infringement_type', v.infringement_type, '[Copyright / Trademark]');
      const clientSpan = fs('client', v.client, '[client]');
      const regSpan    = fs('registrar', v.registrar, '[Registrar name]');
      const us         = sanitizeUrl(v.infringing_url);
      const lines      = [];
      lines.push(hesc('Subject: ') + typeSpan + hesc(' infringement in relation to ') + fs('infringing_url', us, '[infringing website]'));
      lines.push('\n' + hesc('Dear ') + regSpan);
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc(". It has come to our attention that a website for which your company is the registrar may be infringing on one of ") + clientSpan + hesc("'s trademarks and/or copyrights. We request your cooperation to have the infringing content removed."));
      lines.push('\n' + hesc('The infringing material is found at: ') + fs('infringing_url', us, '[infringer website]'));
      lines.push(hesc('And the original material of our client is at: ') + fs('client_url', v.client_url, '[client website]'));
      lines.push('\n' + hesc('The infringer has copied and used ') + clientSpan + hesc("'s ") + fs('infringement_desc', v.infringement_desc, '[description of infringement]') + hesc(", creating confusion for ") + clientSpan + hesc("'s customers and therefore harm to the business of our client. Our client is not related to nor does it have any affiliation to the infringer and the infringing content was published on your servers without ") + clientSpan + hesc("'s permission."));
      lines.push('\n' + hesc('We are sending this notice under a good faith belief that use of the materials, described above as allegedly infringing, is not authorized by the copyright/trademark owner, its agent, or the law. We certify, under the penalty of perjury, that the information in this notice is correct. We have the authority to act on behalf of the person who owns the copyright/trademark in question.'));
      lines.push('\n' + hesc('You may use the following contact information for any further correspondence:'));
      lines.push(fs('your_name', v.your_name, '[Your name]'));
      lines.push(hesc('PhishFort, 160 Robinson Road, #14-04 Singapore Business Federation Centre Singapore (068914)'));
      lines.push(fs('your_email', v.your_email, '[Your email address]'));
      lines.push('\n' + hesc('Regards'));
      lines.push(hesc('Signed: ') + fs('signature', v.signature, '[Your initials and surname]'));
      return lines.join('\n');
    },
  },

  // ── Phishing App Takedown Request ───────────────────────────
  {
    id: 'app_takedown',
    name: 'Phishing App Takedown Request',
    folder: 'Abuse Reports',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'host',             label:'Host / App Store',           type:'listpicker', listKey:'hosts',   placeholder:'e.g. Google Play, Apple\u2026' },
      { id:'client',           label:'Client',                     type:'listpicker', listKey:'clients', placeholder:'Client name\u2026' },
      { id:'client_url',       label:"Client's original website",  type:'text',       placeholder:'https://client-brand.com' },
      { _divider: true },
      { id:'offending_url',    label:'Phishing App URL',           type:'text',       placeholder:'https://malicious-store.com/app...', sanitize:'url' },
      { id:'ip_address',       label:'IP address',                 type:'text',       placeholder:'e.g. 192.168.1.1' },
      { _divider: true },
      { id:'company_name',     label:'Your company name',          type:'text',       placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',      label:'Case ID',                    type:'text',       placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',        label:'System timestamp',           type:'text',       placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts     = v.timestamp || nowUtc();
      const client = v.client || '[client]';
      const host   = v.host || '[website owner]';
      const us     = sanitizeUrl(v.offending_url) || '[phishing URL]';
      const lines  = [];
      lines.push(`Subject: [URGENT] Phishing App Takedown Request for ${us}`);
      lines.push(`\nDear ${host} Abuse Team,`);
      lines.push(`\nWe act on behalf of our client, ${client} found at ${v.client_url || '[client URL]'}. It has come to our attention that an unauthorised link to our client’s App is being hosted on your website, and is being used to conduct a phishing attack against ${client}.`);
      lines.push(`\nThe link to the App is found at: ${us}`);
      lines.push(`IP address of phishing domain: ${v.ip_address || '[IP address]'}`);
      lines.push(`\nOur client has not authorized the use of this App, and is not related to nor does it have any affiliation to the publishers of this App. Given the severity of harm caused to our client, we request your urgent assistance to have the malicious App removed.`);
      lines.push(`\nPlease let us know if you require any further information to have the content removed swiftly.`);
      lines.push(`\nKind regards,\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts         = v.timestamp || nowUtc();
      const clientSpan = fs('client', v.client, '[client]');
      const hostSpan   = fs('host', v.host, '[website owner]');
      const us         = sanitizeUrl(v.offending_url);
      const lines      = [];
      lines.push(hesc('Subject: [URGENT] Phishing App Takedown Request for ') + fs('offending_url', us, '[phishing URL]'));
      lines.push('\n' + hesc('Dear ') + hostSpan + hesc(' Abuse Team,'));
      lines.push('\n' + hesc('We act on behalf of our client, ') + clientSpan + hesc(' found at ') + fs('client_url', v.client_url, '[client URL]') + hesc('. It has come to our attention that an unauthorised link to our client’s App is being hosted on your website, and is being used to conduct a phishing attack against ') + clientSpan + hesc('.'));
      lines.push('\n' + hesc('The link to the App is found at: ') + fs('offending_url', us, '[phishing URL]'));
      lines.push(hesc('IP address of phishing domain: ') + fs('ip_address', v.ip_address, '[IP address]'));
      lines.push('\n' + hesc('Our client has not authorized the use of this App, and is not related to nor does it have any affiliation to the publishers of this App. Given the severity of harm caused to our client, we request your urgent assistance to have the malicious App removed.'));
      lines.push('\n' + hesc('Please let us know if you require any further information to have the content removed swiftly.'));
      lines.push('\n' + hesc('Kind regards,\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Email Phishing Domain Takedown ──────────────────────────
  {
    id: 'email_phishing_takedown',
    name: 'Email Phishing Domain Takedown',
    folder: 'Abuse Reports',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'host',             label:'Hosting provider',               type:'listpicker', listKey:'hosts',    placeholder:'e.g. Cloudflare\u2026' },
      { id:'client',           label:'Client',                         type:'listpicker', listKey:'clients',  placeholder:'Client name\u2026' },
      { id:'abuse_type',       label:'Abuse type',                     type:'select',     options:['Phishing','Malware Distribution','Spam','Brand Impersonation','Scam','Other'] },
      { _divider: true },
      { id:'offending_url',    label:'Phishing website URL',           type:'text',       placeholder:'https://malicious-domain.com/\u2026', sanitize:'url' },
      { id:'ip_address',       label:'IP address of domain',           type:'text',       placeholder:'e.g. 192.168.1.1' },
      { id:'phishing_email',   label:'Phisher’s email address',        type:'email',      placeholder:'attacker@malicious-domain.com' },
      { id:'original_domain',  label:'Legitimate domain impersonated', type:'text',       placeholder:'legitimate-brand.com' },
      { _divider: true },
      { id:'email_description',label:'Email behavior description',     type:'textarea',   placeholder:'e.g. inducing clients to download malware...', hint:'What is the email asking users to do?' },
      { _divider: true },
      { id:'company_name',     label:'Your company name',              type:'text',       placeholder:'Acme Security Inc.', profileKey:'company' },
      { id:'our_case_id',      label:'Case ID',                        type:'text',       placeholder:'CASE-2024-XXXXX' },
      { id:'timestamp',        label:'System timestamp',               type:'text',       placeholder:'Auto-filled if left blank', hint:'Leave blank to auto-fill current UTC time.' },
    ],

    render(v) {
      const ts      = v.timestamp || nowUtc();
      const abuse   = ABUSE_MAP[v.abuse_type] || v.abuse_type || '[abuse type]';
      const host    = v.host || '[Host Provider]';
      const us      = sanitizeUrl(v.offending_url) || '[phishing website]';
      const client  = v.client || '[client]';
      const defDesc = `[inducing clients to download malware / encouraging users to share their passwords and private information / falsely representing themselves to be ${client}]`;
      const lines   = [];
      lines.push(`Subject: [URGENT] Phishing Domain Takedown Request for ${us}`);
      lines.push(`\nDear ${host} Abuse Team`);
      lines.push(`\nWe have identified that the resource listed below is being used to facilitate ${abuse}. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.`);
      lines.push(`\nAs the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.`);
      lines.push(`\nThe phishing domain is found at: ${us}`);
      lines.push(`IP address of phishing domain: ${v.ip_address || '[IP address]'}`);
      lines.push(`Phisher’s email address: ${v.phishing_email || '[phishing email address]'}`);
      lines.push(`Legitimate domain being impersonated: ${v.original_domain || '[original domain]'}`);
      lines.push(`\nIn support of this claim, please find the relevant phishing email headers attached.`);
      lines.push(`\nThe emails are ${v.email_description || defDesc}. Our client is not related to nor does it have any affiliation to the phishers.`);
      lines.push(`\nGiven the severity of harm caused, we request your urgent assistance to have the malicious site shut down.`);
      lines.push(`\nPlease confirm receipt of this report and inform us of the outcome of your investigation.`);
      lines.push(`\nSincerely,\nAbuse Operations\n${v.company_name || '[Company Name]'}`);
      lines.push(`\n${'─'.repeat(55)}\nINTERNAL REFERENCE`);
      if (v.client) lines.push(`Client:    ${v.client}`);
      lines.push(`Case ID:   ${v.our_case_id || '[Case ID]'}`);
      lines.push(`Timestamp: ${ts}`);
      return lines.join('\n');
    },

    renderHtml(v) {
      const ts         = v.timestamp || nowUtc();
      const abuse      = ABUSE_MAP[v.abuse_type] || v.abuse_type;
      const hostSpan   = fs('host', v.host, '[Host Provider]');
      const us         = sanitizeUrl(v.offending_url);
      const client     = v.client || '[client]';
      const defDesc    = `[inducing clients to download malware / encouraging users to share their passwords and private information / falsely representing themselves to be ${client}]`;
      const lines      = [];
      lines.push(hesc('Subject: [URGENT] Phishing Domain Takedown Request for ') + fs('offending_url', us, '[phishing website]'));
      lines.push('\n' + hesc('Dear ') + hostSpan + hesc(' Abuse Team'));
      lines.push('\n' + hesc('We have identified that the resource listed below is being used to facilitate ') + fs('abuse_type', abuse, '[abuse type]') + hesc('. This activity poses a security risk to internet users and appears to violate standard Acceptable Use Policies.'));
      lines.push('\n' + hesc('As the sponsoring provider, we request that you investigate this resource and take appropriate mitigation action in accordance with your abuse policies and relevant industry agreements.'));
      lines.push('\n' + hesc('The phishing domain is found at: ') + fs('offending_url', us, '[phishing URL]'));
      lines.push(hesc('IP address of phishing domain: ') + fs('ip_address', v.ip_address, '[IP address]'));
      lines.push(hesc('Phisher’s email address: ') + fs('phishing_email', v.phishing_email, '[phishing email address]'));
      lines.push(hesc('Legitimate domain being impersonated: ') + fs('original_domain', v.original_domain, '[original domain]'));
      lines.push('\n' + hesc('In support of this claim, please find the relevant phishing email headers attached.'));
      lines.push('\n' + hesc('The emails are ') + fs('email_description', v.email_description, defDesc) + hesc('. Our client is not related to nor does it have any affiliation to the phishers.'));
      lines.push('\n' + hesc('Given the severity of harm caused, we request your urgent assistance to have the malicious site shut down.'));
      lines.push('\n' + hesc('Please confirm receipt of this report and inform us of the outcome of your investigation.'));
      lines.push('\n' + hesc('Sincerely,\nAbuse Operations\n') + fs('company_name', v.company_name, '[Company Name]'));
      lines.push('\n' + hesc('─'.repeat(55)) + '\n' + hesc('INTERNAL REFERENCE'));
      if (v.client) lines.push(hesc('Client:    ') + fs('client', v.client));
      lines.push(hesc('Case ID:   ') + fs('our_case_id', v.our_case_id, '[Case ID]'));
      lines.push(hesc('Timestamp: ') + fs('timestamp', ts));
      return lines.join('\n');
    },
  },

  // ── Registrar Refusal Pushback ─────────────────────────────
  {
    id: 'registrar_pushback',
    name: 'Registrar Refusal Pushback',
    folder: 'Follow-Ups',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.company_name && p.company) fv.company_name = p.company;
    },

    fields: [
      { id:'registrar',        label:'Registrar',              type:'listpicker', listKey:'registrars', placeholder:'e.g. GoDaddy\u2026' },
      { id:'their_case_id',    label:'Their ticket / case ID', type:'text',       placeholder:"Ref from the registrar's reply" },
      { id:'offending_domain', label:'Offending domain',       type:'text',       placeholder:'malicious-domain.com', sanitize:'domain' },
      { _divider: true },
      { id:'company_name',     label:'Your company name',      type:'text',       placeholder:'Acme Security Inc.', profileKey:'company' }
    ],

    render(v) {
      const regSpan = v.registrar ? v.registrar + ' ' : '';
      const ds      = sanitizeDomain(v.offending_domain) || '[offending domain]';
      const lines   = [];
      
      lines.push(`Subject: RE: Abuse Report - ${ds} - Ref: ${v.their_case_id || '[their case ID]'}`);
      lines.push(`\nHi ${regSpan}Abuse team,`);
      lines.push(`\nWe work with hundreds of registrars all over the world. While we are also working with the hosting provider to shut this website down, it still remains an obligation of the registrar to suspend the domain if it is clearly being used for illegal activity as is the case in question.`);
      lines.push(`\nPlease see the final recommendation on the ICANN website here:\nhttps://www.icann.org/resources/pages/phishing-2013-05-03-en`);
      lines.push(`\nwhich suggests contacting the registrar who has the ability to suspend the domain directly. This is outlined in more detail as a part of the ARRs which you as a registrar are bound to as a part of ICANN compliance:\nhttps://www.icann.org/resources/pages/approved-with-specs-2013-09-17-en`);
      lines.push(`\nPlease kindly assist us by suspending this domain.`);
      lines.push(`\nThank you.`);
      lines.push(`\n${v.company_name || '[Company Name]'}`);
      
      return lines.join('\n');
    },

    renderHtml(v) {
      const regSpan = v.registrar ? fs('registrar', v.registrar) + ' ' : '';
      const ds      = sanitizeDomain(v.offending_domain);
      const lines   = [];
      
      lines.push(hesc('Subject: RE: Abuse Report - ') + fs('offending_domain', ds, '[offending domain]') + hesc(' - Ref: ') + fs('their_case_id', v.their_case_id, '[their case ID]'));
      lines.push('\n' + hesc('Hi ') + regSpan + hesc('Abuse team,'));
      lines.push('\n' + hesc('We work with hundreds of registrars all over the world. While we are also working with the hosting provider to shut this website down, it still remains an obligation of the registrar to suspend the domain if it is clearly being used for illegal activity as is the case in question.'));
      lines.push('\n' + hesc('Please see the final recommendation on the ICANN website here:\nhttps://www.icann.org/resources/pages/phishing-2013-05-03-en'));
      lines.push('\n' + hesc('which suggests contacting the registrar who has the ability to suspend the domain directly. This is outlined in more detail as a part of the ARRs which you as a registrar are bound to as a part of ICANN compliance:\nhttps://www.icann.org/resources/pages/approved-with-specs-2013-09-17-en'));
      lines.push('\n' + hesc('Please kindly assist us by suspending this domain.'));
      lines.push('\n' + hesc('Thank you.'));
      lines.push('\n' + fs('company_name', v.company_name, '[Company Name]'));
      
      return lines.join('\n');
    },
  },

  // ── Client Clarification Request ─────────────────────────────
  {
    id: 'client_clarification',
    name: 'Client Clarification Request',
    folder: 'Client Communications',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.your_name && p.name) fv.your_name = p.name;
    },

    fields: [
      { id:'client_contact',   label:'Client contact name',    type:'text',       placeholder:'e.g. John' },
      { id:'offending_domain', label:'Incident domain',        type:'text',       placeholder:'malicious-domain.com', sanitize:'domain' },
      { id:'observation',      label:'What you observed',      type:'textarea',   placeholder:'e.g. the hosting service has been suspended...', hint:'Explain what looks different on your end.' },
      { _divider: true },
      { id:'your_name',        label:'Your name',              type:'text',       placeholder:'Jane Doe', profileKey:'name' }
    ],

    render(v) {
      const contact = v.client_contact || '[name of client]';
      const ds      = sanitizeDomain(v.offending_domain) || '[incident domain]';
      const obs     = v.observation || '[the hosting service has been suspended / insert whatever stuff you saw upon investigation]';
      const lines   = [];
      
      lines.push(`Subject: Clarification required regarding incident: ${ds}`);
      lines.push(`\nHello ${contact}!`);
      lines.push(`\nI'm working on your incident ${ds} and it seems like ${obs}. This is what I have on my side:`);
      lines.push(`\n[insert screenshot]`);
      lines.push(`\nPlease confirm if you can still see it on your end.`);
      lines.push(`\nKind regards,\n${v.your_name || '[Your Name]'}`);
      
      return lines.join('\n');
    },

    renderHtml(v) {
      const contact = fs('client_contact', v.client_contact, '[name of client]');
      const ds      = sanitizeDomain(v.offending_domain);
      const obs     = fs('observation', v.observation, '[the hosting service has been suspended / insert whatever stuff you saw upon investigation]');
      const lines   = [];
      
      lines.push(hesc('Subject: Clarification required regarding incident: ') + fs('offending_domain', ds, '[incident domain]'));
      lines.push('\n' + hesc('Hello ') + contact + hesc('!'));
      lines.push('\n' + hesc("I'm working on your incident ") + fs('offending_domain', ds, '[incident domain]') + hesc(' and it seems like ') + obs + hesc('. This is what I have on my side:'));
      lines.push('\n' + hesc('[insert screenshot]'));
      lines.push('\n' + hesc('Please confirm if you can still see it on your end.'));
      lines.push('\n' + hesc('Kind regards,\n') + fs('your_name', v.your_name, '[Your Name]'));
      
      return lines.join('\n');
    },
  },

  // ── Request Email Headers ───────────────────────────────────
  {
    id: 'client_email_headers',
    name: 'Request Email Headers',
    folder: 'Client Communications',

    onLoad(fv) {
      const p = getProfile();
      if (!fv.your_name && p.name) fv.your_name = p.name;
      if (!fv.department && p.dept) fv.department = p.dept;
    },

    fields: [
      { id:'client_contact',   label:'Client contact name',    type:'text',       placeholder:'e.g. John' },
      { id:'offending_domain', label:'Incident domain',        type:'text',       placeholder:'malicious-domain.com', sanitize:'domain', hint:'Used for the subject line.' },
      { _divider: true },
      { id:'your_name',        label:'Your name',              type:'text',       placeholder:'Deon', profileKey:'name' },
      { id:'department',       label:'Your department',        type:'text',       placeholder:'Phishfort Operations Team', profileKey:'dept' }
    ],

    render(v) {
      const contact = v.client_contact || '[Client Correspondent]';
      const name    = v.your_name || '[Your Name]';
      const dept    = v.department || '[Your Department]';
      const ds      = sanitizeDomain(v.offending_domain) || '[incident domain]';
      const lines   = [];
      
      lines.push(`Subject: Action Required: Email headers needed for incident ${ds}`);
      lines.push(`\nHi ${contact},`);
      lines.push(`\nMy name is ${name}. I'm with the ${dept}, I'm the analyst handling your case. We got the email extracts and the phishing domain used in the attack. Thank you for the evidence. However, to build a stronger case we will need the email headers for that email exchange you provided.`);
      lines.push(`\nThe headers provide the exact evidence we need to trace the path that the email took from sender to their target(s), along with the IP addresses and/or domains included in the attack.`);
      lines.push(`\nIf you need help with how to get the headers please let me know and I will be happy to guide you through that.`);
      lines.push(`\nPlease feel free to reach out if you need any clarity.`);
      lines.push(`\nKind regards,\n${name}`);
      
      return lines.join('\n');
    },

    renderHtml(v) {
      const contact = fs('client_contact', v.client_contact, '[Client Correspondent]');
      const name    = fs('your_name', v.your_name, '[Your Name]');
      const dept    = fs('department', v.department, '[Your Department]');
      const ds      = sanitizeDomain(v.offending_domain);
      const lines   = [];
      
      lines.push(hesc('Subject: Action Required: Email headers needed for incident ') + fs('offending_domain', ds, '[incident domain]'));
      lines.push('\n' + hesc('Hi ') + contact + hesc(','));
      lines.push('\n' + hesc('My name is ') + name + hesc(". I'm with the ") + dept + hesc(", I'm the analyst handling your case. We got the email extracts and the phishing domain used in the attack. Thank you for the evidence. However, to build a stronger case we will need the email headers for that email exchange you provided."));
      lines.push('\n' + hesc('The headers provide the exact evidence we need to trace the path that the email took from sender to their target(s), along with the IP addresses and/or domains included in the attack.'));
      lines.push('\n' + hesc('If you need help with how to get the headers please let me know and I will be happy to guide you through that.'));
      lines.push('\n' + hesc('Please feel free to reach out if you need any clarity.'));
      lines.push('\n' + hesc('Kind regards,\n') + name);
      
      return lines.join('\n');
    },
  },

];

const BUILTIN_FOLDERS = new Set(TEMPLATES.map(t => t.folder));
