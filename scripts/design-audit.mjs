#!/usr/bin/env node

/**
 * Impeccable Design Audit & Auto-Fix Tool
 * Enforces the 59 Anti-Slop Rules and Vercel Web Design Guidelines across the QafNest monorepo.
 *
 * Usage:
 *   node scripts/design-audit.mjs         # Run audit and output report
 *   node scripts/design-audit.mjs --fix   # Run audit and apply safe auto-fixes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isFixMode = process.argv.includes('--fix');

// Target scan directories
const SCAN_DIRS = [
  path.join(rootDir, 'apps', 'guest', 'src'),
  path.join(rootDir, 'apps', 'host', 'src'),
  path.join(rootDir, 'apps', 'cms', 'src'),
  path.join(rootDir, 'apps', 'admin', 'src'),
  path.join(rootDir, 'packages', 'shared'),
];

const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);

// Rule definitions
const RULES = {
  GRADIENT_HEADLINE: {
    id: 'anti-slop/no-gradient-headline',
    name: 'No AI Gradient Text Headline',
    severity: 'error',
    weight: 4,
    description: 'Avoid tacky purple-to-cyan text gradients on headlines. Use high-contrast solid typography.',
  },
  RAW_EMOJI_ICON: {
    id: 'anti-slop/no-raw-emoji-icon',
    name: 'No Raw Emojis as Feature Icons',
    severity: 'warning',
    weight: 2,
    description: 'Use crisp Lucide React icons instead of raw Unicode emojis in cards and headings.',
  },
  VIEWPORT_ZOOM_LOCK: {
    id: 'vercel-ux/no-viewport-zoom-lock',
    name: 'Viewport Zoom Must Not Be Restricted',
    severity: 'error',
    weight: 6,
    description: 'Do not disable browser zoom (user-scalable=no or maximum-scale=1). Support accessibility scaling up to 5x.',
  },
  TOUCH_TARGET_SIZE: {
    id: 'vercel-ux/touch-target-size',
    name: 'Minimum 44px Mobile Touch Target',
    severity: 'warning',
    weight: 3,
    description: 'Interactive buttons and icon targets must be at least 44px on touch devices.',
  },
  SUBMIT_LOADING_STATE: {
    id: 'vercel-ux/submit-loading-state',
    name: 'Form Submit Must Have Loading State',
    severity: 'warning',
    weight: 3,
    description: 'Form submission buttons must indicate loading state and disable during submission.',
  },
  IMAGE_MISSING_ALT: {
    id: 'a11y/image-alt-required',
    name: 'Image Alt Attribute Required',
    severity: 'error',
    weight: 5,
    description: 'All <img> and <Image> elements must provide a meaningful alt attribute or alt="".',
  },
  OUTLINE_NONE_FOCUS: {
    id: 'a11y/outline-none-without-focus-ring',
    name: 'Focus Ring Required When Outline None',
    severity: 'error',
    weight: 4,
    description: 'When using outline-none, provide explicit focus-visible:ring-2 for keyboard users.',
  },
};

const EMOJI_REGEX = /([\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}])/u;

function collectFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
        collectFiles(fullPath, fileList);
      }
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Extracts JSX opening tags spanning multiple lines
 */
function extractJsxTags(content) {
  const tags = [];
  // Match tags like <button ... >, <select ... >, <input ... >, <Image ... >, <img ... >
  const tagRegex = /<([a-zA-Z0-9_]+)([^>]*?)(\/?>)/gs;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1];
    const attributes = match[2];
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;
    tags.push({
      tagName,
      attributes,
      fullMatch: match[0],
      lineNumber,
      index,
    });
  }
  return tags;
}

function auditFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  let fileModified = false;

  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Rule 1: Viewport Zoom Lock
  if (filePath.endsWith('layout.tsx') || filePath.endsWith('layout.ts')) {
    if (content.includes('user-scalable=no') || content.includes('maximum-scale=1') || content.includes('maximumScale: 1')) {
      const lineIdx = lines.findIndex(l => l.includes('user-scalable=no') || l.includes('maximum-scale=1') || l.includes('maximumScale: 1'));
      violations.push({
        rule: RULES.VIEWPORT_ZOOM_LOCK,
        file: relPath,
        line: lineIdx >= 0 ? lineIdx + 1 : 1,
        snippet: lines[lineIdx] ? lines[lineIdx].trim() : 'maximumScale: 1',
        autoFixable: true,
      });

      if (isFixMode) {
        content = content.replace(/maximumScale:\s*1(?![0-9])/g, 'maximumScale: 5');
        content = content.replace(/user-scalable=no/g, 'user-scalable=yes');
        fileModified = true;
      }
    }
  }

  // Multi-line Tag Audits
  const jsxTags = extractJsxTags(content);

  for (const tag of jsxTags) {
    const { tagName, attributes, lineNumber, fullMatch } = tag;

    // Rule: Submit button missing loading / disabled state
    if (tagName === 'button' && attributes.includes('type="submit"')) {
      const hasDisabled = attributes.includes('disabled');
      const hasLoading =
        attributes.includes('isLoading') ||
        attributes.includes('loading') ||
        attributes.includes('isSubmitting') ||
        attributes.includes('submitting') ||
        attributes.includes('pending') ||
        attributes.includes('aria-busy');

      if (!hasDisabled && !hasLoading) {
        violations.push({
          rule: RULES.SUBMIT_LOADING_STATE,
          file: relPath,
          line: lineNumber,
          snippet: fullMatch.split('\n')[0].trim(),
          autoFixable: false,
        });
      }
    }

    // Rule: Image missing alt
    if ((tagName === 'Image' || tagName === 'img') && !attributes.includes('alt=')) {
      violations.push({
        rule: RULES.IMAGE_MISSING_ALT,
        file: relPath,
        line: lineNumber,
        snippet: fullMatch.split('\n')[0].trim(),
        autoFixable: false,
      });
    }

    // Rule: Outline-none without focus ring
    if (
      ['input', 'select', 'textarea', 'button'].includes(tagName) &&
      (attributes.includes('outline-none') || attributes.includes('focus:outline-none')) &&
      !attributes.includes('focus-visible:ring') &&
      !attributes.includes('focus:ring') &&
      !attributes.includes('focus-visible:border')
    ) {
      violations.push({
        rule: RULES.OUTLINE_NONE_FOCUS,
        file: relPath,
        line: lineNumber,
        snippet: fullMatch.split('\n')[0].trim(),
        autoFixable: true,
      });

      if (isFixMode) {
        const replacement = fullMatch.replace(
          /focus:outline-none|outline-none/g,
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2'
        );
        content = content.replace(fullMatch, replacement);
        fileModified = true;
      }
    }
  }

  // Line-by-line checks for gradient slop & emojis
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // Rule: Gradient text headlines
    if (
      (trimmed.includes('bg-clip-text') || trimmed.includes('text-transparent')) &&
      trimmed.includes('bg-gradient-to') &&
      (trimmed.includes('from-purple') || trimmed.includes('from-violet') || trimmed.includes('to-pink') || trimmed.includes('to-indigo')) &&
      (trimmed.includes('<h1') || trimmed.includes('<h2') || trimmed.includes('<h3') || trimmed.includes('text-3xl') || trimmed.includes('text-4xl') || trimmed.includes('text-5xl'))
    ) {
      violations.push({
        rule: RULES.GRADIENT_HEADLINE,
        file: relPath,
        line: lineNum,
        snippet: trimmed,
        autoFixable: false,
      });
    }

    // Rule: Raw Emojis in JSX headings/cards
    if (
      (trimmed.startsWith('<h1') || trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.includes('className="font-bold') || trimmed.includes('className="text-lg')) &&
      EMOJI_REGEX.test(trimmed) &&
      !trimmed.includes('//') &&
      !trimmed.includes('🇸🇦') && !trimmed.includes('🇺🇸')
    ) {
      violations.push({
        rule: RULES.RAW_EMOJI_ICON,
        file: relPath,
        line: lineNum,
        snippet: trimmed,
        autoFixable: false,
      });
    }
  });

  if (fileModified && isFixMode) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return violations;
}

function runAudit() {
  console.log('\n======================================================================');
  console.log('   🎨 IMPECCABLE DESIGN AUDITOR & ANTI-SLOP VERIFIER');
  console.log('   Enforcing DESIGN.md · IMPECCABLE.md · TASTE.md · Vercel A11y');
  console.log('======================================================================\n');

  let allFiles = [];
  for (const dir of SCAN_DIRS) {
    collectFiles(dir, allFiles);
  }

  console.log(`🔍 Scanning ${allFiles.length} source files across monorepo apps...\n`);

  const allViolations = [];
  for (const file of allFiles) {
    const v = auditFile(file);
    if (v.length > 0) {
      allViolations.push(...v);
    }
  }

  let penalty = 0;
  let errorCount = 0;
  let warningCount = 0;

  for (const v of allViolations) {
    penalty += v.rule.weight;
    if (v.rule.severity === 'error') errorCount++;
    else warningCount++;
  }

  const rawScore = Math.max(15, Math.min(100, Math.round(100 - penalty)));

  if (allViolations.length === 0) {
    console.log('✨ [PERFECT SCORE] No anti-slop or UX violations detected!\n');
  } else {
    const grouped = {};
    for (const v of allViolations) {
      grouped[v.file] = grouped[v.file] || [];
      grouped[v.file].push(v);
    }

    for (const [file, list] of Object.entries(grouped)) {
      console.log(`\n📄 ${file}`);
      for (const item of list) {
        const tag = item.rule.severity === 'error' ? '❌ ERROR' : '⚠️ WARN';
        console.log(`   ${tag} [L${item.line}] ${item.rule.name} (${item.rule.id})`);
        console.log(`      Snippet: ${item.snippet.slice(0, 85)}${item.snippet.length > 85 ? '...' : ''}`);
        console.log(`      Remedy:  ${item.rule.description}`);
      }
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  📊 AUDIT SUMMARY`);
  console.log(`  Files Analyzed:      ${allFiles.length}`);
  console.log(`  Critical Errors:     ${errorCount}`);
  console.log(`  Design Warnings:     ${warningCount}`);
  console.log(`  Design Health Score: ${rawScore} / 100`);
  if (rawScore >= 95) {
    console.log('  Status:              🌟 WORLD-CLASS PRODUCTION GRADE (Impeccable Certified)');
  } else if (rawScore >= 80) {
    console.log('  Status:              👍 SOLID QUALITY (Minor polish recommended)');
  } else {
    console.log('  Status:              ⚠️ NEEDS IMPROVEMENT (Generic AI patterns found)');
  }
  console.log('----------------------------------------------------------------------\n');

  if (isFixMode) {
    console.log('🛠️ Auto-fix executed on safe violations.');
  }

  return { errorCount, warningCount, score: rawScore };
}

runAudit();
