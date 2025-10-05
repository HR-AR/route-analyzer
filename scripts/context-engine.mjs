#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

class ContextEngine {
  // PRP Generation with validation-first framing
  async generatePRP(feature = process.argv[3] || 'new-feature') {
    const today = new Date().toISOString().slice(0,10);
    const prd = fs.existsSync('docs/prd/PRD.md') ? fs.readFileSync('docs/prd/PRD.md', 'utf8') : '';

    const prp = `# Feature: ${feature}
Generated: ${today}

## Goal & Why
${(prd.match(/##\s*Objective([\s\S]*?)(\n##|$)/) || [,'[From PRD]'])[1].trim()}

## Context
### Pattern References
${this.findExamples()}

### Relevant Files
${this.scanRelevantFiles(feature)}

## Implementation Blueprint
[AI will generate steps based on patterns]

## Validation Loop
Task is ONLY complete when ALL pass:
\`\`\`bash
npm run validate
\`\`\`

## Self-Correction Protocol
If validation fails:
1) Read error output
2) Analyze failure: \`{error_message}\`
3) Apply minimal fix
4) Re-run: npm run validate
5) Repeat until success

## Success Criteria
- ✅ All validation gates pass
- ✅ Follows examples/ patterns
- ✅ Test coverage meets threshold
`;

    const filename = `docs/prps/PRP-${this.slug(feature)}-${today}.md`;
    fs.mkdirSync('docs/prps', { recursive: true });
    fs.writeFileSync(filename, prp);
    console.log(`✅ PRP created: ${filename}`);

    // also prep a Scout prompt for you
    this.scout(filename);
  }

  // Build a Scout prompt from PRP + CLAUDE stack
  scout(prpPath) {
    const prp = prpPath && fs.existsSync(prpPath) ? fs.readFileSync(prpPath, 'utf8') : '';
    const stack = fs.existsSync('CLAUDE.md') ? fs.readFileSync('CLAUDE.md', 'utf8') : '';

    const prompt = `You are a Context Engineering Scout.

Feature (excerpt from PRP):
---
${prp.slice(0, 800)}
---

Stack (from CLAUDE.md):
---
${stack.slice(0, 800)}
---

Tasks:
1) Find 3–5 PUBLIC examples (prefer MIT/Apache licenses).
2) For each, provide:
   - PATTERN (name)
   - USE WHEN (scenarios)
   - KEY CONCEPTS (bullets)
   - Minimal, sanitized stub code (safe placeholders, compilable) for examples/[category]/.
   - VALIDATION: how to test it (unit/integration)
   - Self-correction hints (common failure → quick fix)
3) Include a single \`Source: <URL>\` line. Do NOT paste large proprietary code.

Deliver Markdown sections I can paste directly into files.
`;

    const outPath = `docs/prompts/SCOUT-${Date.now()}.md`;
    fs.mkdirSync('docs/prompts', { recursive: true });
    fs.writeFileSync(outPath, prompt);
    console.log(`✅ Scout prompt: ${outPath}`);
    console.log('→ Open this file, copy everything, paste into Gemini/Claude/ChatGPT.');
  }

  // Attempt implementation by repeatedly running validation and writing a fix prompt
  async implement() {
    const latestPRP = this.getLatestPRP();
    if (!latestPRP) { console.log('No PRP found. Run: npm run prp "feature-name"'); process.exit(1); }
    console.log(`🤖 Implementing with guidance from: ${latestPRP}`);

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}`);
      try {
        execSync('npm run validate', { stdio: 'inherit' });
        console.log('✅ Validation passed!');
        break;
      } catch (error) {
        console.log('❌ Validation failed — preparing a fix prompt for your AI assistant...');
        const errorLog = String(error?.stdout || error?.stderr || error);
        const fixPrompt = `Fix this validation error (attempt ${attempts} of ${maxAttempts}):

\`\`\`
${errorLog.slice(0, 5000)}
\`\`\`

Constraints:
- Apply the smallest change possible that aligns with examples/ patterns.
- Explain the root cause in one sentence.
- Provide a patch (diff or replacement snippet).`;

        fs.mkdirSync('tmp', { recursive: true });
        fs.writeFileSync('tmp/fix-prompt.md', fixPrompt);
        console.log('→ Open tmp/fix-prompt.md, paste into your AI assistant, apply suggested patch, and re-run `npm run implement`.');
        if (attempts === maxAttempts) {
          console.log('⚠️ Max attempts reached. Please review manually.');
        }
      }
    }
  }

  // Sync discovered examples back into CLAUDE.md (Dynamic Context)
  syncContext() {
    console.log('🔄 Syncing context from examples/ → CLAUDE.md...');
    const patterns = {};
    const areas = ['components', 'api', 'tests', 'database', 'utils'];
    for (const dir of areas) {
      const p = `examples/${dir}`;
      if (!fs.existsSync(p)) continue;
      for (const f of fs.readdirSync(p)) {
        const file = path.join(p, f);
        if (!fs.statSync(file).isFile()) continue;
        const content = fs.readFileSync(file, 'utf8');
        const pattern = (content.match(/PATTERN:\s*(.+)/) || [,''])[1].trim();
        const validation = (content.match(/VALIDATION:\s*(.+)/) || [,'npm test'])[1].trim();
        if (pattern) patterns[pattern] = { path: file, validation };
      }
    }

    const block = `\n## Discovered Patterns\n${
      Object.entries(patterns).map(([name, info]) => `- ${name}: ${info.path} (validate: ${info.validation})`).join('\n') || '- (none yet)'
    }\n`;

    let md = fs.readFileSync('CLAUDE.md', 'utf8');
    if (/##\s*Discovered Patterns/.test(md)) {
      md = md.replace(/##\s*Discovered Patterns[\s\S]*?(?=\n##|$)/, block + '\n');
    } else {
      md += block;
    }
    fs.writeFileSync('CLAUDE.md', md);
    console.log('✅ Context synced.');
  }

  // Helpers
  findExamples() {
    if (!fs.existsSync('examples')) return '- No examples yet';
    const areas = ['components','api','tests','database','utils'];
    const out = [];
    for (const dir of areas) {
      const p = `examples/${dir}`;
      if (!fs.existsSync(p)) continue;
      for (const f of fs.readdirSync(p)) out.push(`- examples/${dir}/${f}`);
    }
    return out.join('\n') || '- No examples yet';
  }
  scanRelevantFiles(feature) {
    const files = new Set(['- tests/']);
    const f = feature.toLowerCase();
    if (f.includes('api')) files.add('- src/api/');
    if (f.includes('auth')) files.add('- src/auth/');
    if (f.includes('component') || f.includes('ui') || f.includes('page')) files.add('- src/components/');
    return [...files].join('\n');
  }
  getLatestPRP() {
    if (!fs.existsSync('docs/prps')) return null;
    const prps = fs.readdirSync('docs/prps').filter(f => f.startsWith('PRP-')).sort();
    return prps.length ? `docs/prps/${prps[prps.length-1]}` : null;
  }
  slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
}

const engine = new ContextEngine();
const cmd = process.argv[2];
const run = {
  prp: () => engine.generatePRP(),
  scout: () => engine.scout(),
  implement: () => engine.implement(),
  sync: () => engine.syncContext(),
};
if (!cmd || !run[cmd]) {
  console.log(`Context Engine

Commands:
  prp [name]   - Generate PRP with validation-first framing
  scout        - Build a Scout prompt from PRP + stack (paste into Gemini)
  implement    - Run validation; on failure, prepare fix prompt
  sync         - Update CLAUDE.md with patterns discovered in examples/
`);
  process.exit(0);
}
await run[cmd]();
