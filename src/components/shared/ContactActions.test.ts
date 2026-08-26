import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Call and WhatsApp are real links, so nothing may wrap them in another one.
 *
 * An anchor inside an anchor is invalid HTML. The browser's parser repairs it by lifting
 * the inner one out of the outer, which leaves the server's markup and React's tree
 * disagreeing about the shape of the page — and the route stops hydrating. That is exactly
 * what the loan detail screen did: the borrower row was a Link to the borrower, and the
 * contact icons sat inside it.
 *
 * Nothing else catches this. It type-checks, it renders, and it only speaks up as a console
 * warning in the browser. stopPropagation does not help either — that governs the click,
 * and the damage is done by the parser, before any click.
 *
 * ContactActions was recently added to every screen that shows a name, so another one being
 * dropped inside a Link is a live risk rather than a hypothetical.
 */

const ROOT = join(__dirname, '..', '..');
const ANCHORS = new Set(['a', 'Link']);

/**
 * Uses the TypeScript parser rather than a regex, having watched a regex fail at this.
 *
 * Attributes carry arrow functions, so `>` does not mean the end of a tag; and stripping
 * `{...}` to get rid of them deletes the component body along with it, since that is a
 * brace too. The first version of this guard did exactly that, reported every file clean,
 * and passed while the real bug was sitting in front of it. A parser knows the difference.
 */
function nestedAt(file: string, source: string): number[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: number[] = [];
  let openAnchors = 0;

  const lineOf = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const walk = (node: ts.Node) => {
    let opened = false;

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = ts.isJsxElement(node)
        ? node.openingElement.tagName.getText(sf)
        : node.tagName.getText(sf);

      if (tag === 'ContactActions' && openAnchors > 0) hits.push(lineOf(node));

      // Only a container can nest anything; a self-closing anchor has no children.
      if (ANCHORS.has(tag) && ts.isJsxElement(node)) { openAnchors++; opened = true; }
    }

    ts.forEachChild(node, walk);
    if (opened) openAnchors--;
  };

  walk(sf);
  return hits;
}

/** Every source file that renders the component. */
function callSites(): string[] {
  return execSync(`grep -rl '<ContactActions' --include='*.tsx' ${JSON.stringify(ROOT)}`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('the contact icons are never wrapped in another link', () => {
  const files = callSites();

  it('finds the call sites, so this is guarding something', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [f.slice(ROOT.length + 1), f] as const))('%s', (_label, file) => {
    const lines = nestedAt(file, readFileSync(file, 'utf8'));
    expect(
      lines,
      `<ContactActions> sits inside a <Link>/<a> at line ${lines.join(', ')}. An anchor `
      + 'inside an anchor is invalid HTML — the parser lifts the inner one out and the route '
      + 'stops hydrating. Make them siblings: let the Link take the name, icons beside it.',
    ).toEqual([]);
  });
});

describe('the scanner itself', () => {
  // A guard that cannot fail is worse than none, and this one already shipped broken once.
  const scan = (src: string) => nestedAt('probe.tsx', src);

  it('catches the bug this was written for', () => {
    const src = `const A = () => (
      <Link to="/x" params={{ id: 1 }} onClick={() => go()}>
        <p>name</p>
        <ContactActions mobile="1" name="n" />
      </Link>
    );`;
    expect(scan(src)).toEqual([4]);
  });

  it('is quiet when they are siblings', () => {
    const src = `const A = () => (
      <div>
        <Link to="/x">name</Link>
        <ContactActions mobile="1" name="n" />
      </div>
    );`;
    expect(scan(src)).toEqual([]);
  });

  it('does not count a self-closing Link as still open', () => {
    const src = `const A = () => (
      <div>
        <Link to="/x" />
        <ContactActions mobile="1" name="n" />
      </div>
    );`;
    expect(scan(src)).toEqual([]);
  });

  it('sees through a component body, which a brace-stripper could not', () => {
    // The exact shape that defeated the first attempt: JSX nested inside a function.
    const src = `function Page() {
      const x = { a: 1 };
      return (
        <a href="/x">
          <ContactActions mobile="1" name="n" />
        </a>
      );
    }`;
    expect(scan(src)).toEqual([5]);
  });
});
