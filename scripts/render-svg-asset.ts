import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HANGUL_FONT_STACK =
  "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', Arial, Helvetica, sans-serif";
const LATIN_FONT_STACK = "'Pretendard', 'Inter', Arial, Helvetica, sans-serif";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildLogoTitleBlock(
  line1: string,
  line2: string | undefined,
  accentChar: string | undefined,
  textColor: string,
  accentColor: string
): string {
  const accent = accentChar ?? '';
  const hasLine2 = Boolean(line2 && line2.trim());

  const renderLine = (text: string, withAccent: boolean, y: number): string => {
    const baseFill = escapeXml(textColor);
    const accentFill = escapeXml(accentColor);
    const baseText = escapeXml(text);
    const accentTspan = withAccent && accent
      ? `<tspan fill="${accentFill}">${escapeXml(accent)}</tspan>`
      : '';
    return `<text x="300" y="${y}" text-anchor="middle" font-family="${HANGUL_FONT_STACK}" font-weight="900" font-size="180" fill="${baseFill}" letter-spacing="-4">${baseText}${accentTspan}</text>`;
  };

  if (hasLine2) {
    return [renderLine(line1, false, 220), renderLine(line2!, true, 400)].join('\n  ');
  }
  return renderLine(line1, true, 340);
}

function buildLogoTaglineBlock(tagline: string | undefined, textColor: string): string {
  if (!tagline || !tagline.trim()) return '';
  return `<text x="300" y="540" text-anchor="middle" font-family="${LATIN_FONT_STACK}" font-weight="800" font-size="44" fill="${escapeXml(textColor)}" letter-spacing="6">${escapeXml(tagline)}</text>`;
}

function buildThumbAccentBlock(accentChar: string | undefined, accentColor: string): string {
  if (!accentChar || !accentChar.trim()) return '';
  return `<text x="640" y="630" text-anchor="middle" font-family="${HANGUL_FONT_STACK}" font-weight="900" font-size="540" fill="${escapeXml(accentColor)}" letter-spacing="-12">${escapeXml(accentChar)}</text>`;
}

function buildThumbPills(
  pillsCsv: string | undefined,
  textColor: string,
  bgColor: string
): string {
  if (!pillsCsv) return '';
  const pills = pillsCsv
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (pills.length === 0) return '';

  const fill = escapeXml(textColor);
  const labelFill = escapeXml(bgColor);
  const out: string[] = [`<g transform="translate(0, 460)">`];
  let cursor = 0;
  for (const label of pills) {
    const charLen = [...label].length;
    const width = Math.max(160, charLen * 32 + 80);
    const centerX = cursor + width / 2;
    out.push(
      `  <rect x="${cursor}" y="0" width="${width}" height="80" rx="40" fill="${fill}"/>`
    );
    out.push(
      `  <text x="${centerX}" y="53" text-anchor="middle" font-family="${HANGUL_FONT_STACK}" font-weight="700" font-size="32" fill="${labelFill}">${escapeXml(label)}</text>`
    );
    cursor += width + 24;
  }
  out.push('</g>');
  return out.join('\n    ');
}

function buildThumbTextBlock(
  titleKo: string | undefined,
  subtitle: string | undefined,
  pills: string | undefined,
  sub: string | undefined,
  textColor: string,
  bgColor: string
): string {
  const fill = escapeXml(textColor);
  const parts: string[] = [`<g transform="translate(1080, 0)">`];
  if (titleKo) {
    parts.push(
      `  <text x="0" y="300" font-family="${HANGUL_FONT_STACK}" font-weight="900" font-size="180" fill="${fill}" letter-spacing="-4">${escapeXml(titleKo)}</text>`
    );
  }
  if (subtitle) {
    parts.push(
      `  <text x="0" y="410" font-family="${HANGUL_FONT_STACK}" font-weight="600" font-size="56" fill="${fill}">${escapeXml(subtitle)}</text>`
    );
  }
  const pillsBlock = buildThumbPills(pills, textColor, bgColor);
  if (pillsBlock) parts.push(`  ${pillsBlock}`);
  if (sub) {
    parts.push(
      `  <text x="0" y="700" font-family="${LATIN_FONT_STACK}" font-weight="700" font-size="36" fill="${fill}" letter-spacing="6">${escapeXml(sub)}</text>`
    );
  }
  parts.push('</g>');
  return parts.join('\n  ');
}

export interface RenderOptions {
  template: 'logo' | 'thumbnail';
  bg: string;
  text?: string;
  accent: string;
  titleLine1?: string;
  titleLine2?: string;
  accentChar?: string;
  tagline?: string;
  titleKo?: string;
  subtitle?: string;
  pills?: string;
  sub?: string;
  outputPath: string;
  saveSvg?: boolean;
}

export async function renderSvgAsset(opts: RenderOptions): Promise<void> {
  const textColor = opts.text ?? '#1A1A1A';
  const templatePath = resolve(
    __dirname,
    'templates',
    opts.template === 'logo' ? 'logo-template.svg' : 'thumbnail-template.svg'
  );
  let svg = readFileSync(templatePath, 'utf-8');

  const replacements: Record<string, string> = {
    '{{BG}}': escapeXml(opts.bg),
  };

  if (opts.template === 'logo') {
    if (!opts.titleLine1) {
      throw new Error('logo template requires --title-line1');
    }
    replacements['{{TITLE_BLOCK}}'] = buildLogoTitleBlock(
      opts.titleLine1,
      opts.titleLine2,
      opts.accentChar,
      textColor,
      opts.accent
    );
    replacements['{{TAGLINE_BLOCK}}'] = buildLogoTaglineBlock(opts.tagline, textColor);
  } else {
    replacements['{{ACCENT_BLOCK}}'] = buildThumbAccentBlock(opts.accentChar, opts.accent);
    replacements['{{TEXT_BLOCK}}'] = buildThumbTextBlock(
      opts.titleKo,
      opts.subtitle,
      opts.pills,
      opts.sub,
      textColor,
      opts.bg
    );
  }

  for (const [key, value] of Object.entries(replacements)) {
    svg = svg.split(key).join(value);
  }

  const [w, h] = opts.template === 'logo' ? [600, 600] : [1932, 828];

  mkdirSync(dirname(opts.outputPath), { recursive: true });

  await sharp(Buffer.from(svg))
    .resize(w, h, { fit: 'contain', background: opts.bg })
    .flatten({ background: opts.bg })
    .png()
    .toFile(opts.outputPath);

  console.log(`Rendered ${opts.template} → ${opts.outputPath} (${w}x${h}, bg=${opts.bg}, accent=${opts.accent})`);

  if (opts.saveSvg) {
    const debugSvgPath = opts.outputPath.replace(/\.png$/, '.svg');
    writeFileSync(debugSvgPath, svg, 'utf-8');
    console.log(`  Source SVG saved alongside: ${debugSvgPath}`);
  }
}

const isMain =
  process.argv[1] === new URL(import.meta.url).pathname ||
  process.argv[1]?.endsWith('render-svg-asset.ts') ||
  process.argv[1]?.endsWith('render-svg-asset.js');

if (isMain) {
  const args = process.argv.slice(2);
  function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  }

  const template = getArg('template') as 'logo' | 'thumbnail' | undefined;
  const bg = getArg('bg');
  const accent = getArg('accent');
  const output = getArg('output');

  if (!template || !['logo', 'thumbnail'].includes(template) || !bg || !accent || !output) {
    console.error(
      `Usage:
  tsx scripts/render-svg-asset.ts --template logo --bg "#FFCD3C" --accent "#EA3C53" --output PATH \\
    --title-line1 "데일리" [--title-line2 "단어"] [--accent-char "5"] [--tagline "DAILY WORD"] [--text "#1A1A1A"] [--save-svg]

  tsx scripts/render-svg-asset.ts --template thumbnail --bg "#FFCD3C" --accent "#EA3C53" --output PATH \\
    --accent-char "5" --title-ko "데일리단어" [--subtitle "30초 영어 단어 퀴즈"] \\
    [--pills "토익,비즈니스,일상회화"] [--sub "DAILY WORD · 30 SEC QUIZ"] [--text "#1A1A1A"] [--save-svg]`
    );
    process.exit(1);
  }

  renderSvgAsset({
    template,
    bg,
    accent,
    text: getArg('text'),
    titleLine1: getArg('title-line1'),
    titleLine2: getArg('title-line2'),
    accentChar: getArg('accent-char'),
    tagline: getArg('tagline'),
    titleKo: getArg('title-ko'),
    subtitle: getArg('subtitle'),
    pills: getArg('pills'),
    sub: getArg('sub'),
    outputPath: output,
    saveSvg: args.includes('--save-svg'),
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
