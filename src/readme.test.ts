/**
 * Tests of README.md itself: keeps the samples it repeats in more than one form in step with one another
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Gets the content of the one code block of README.md opened by the given fence line
 * @param readme README.md's content
 * @param fence The code block's opening fence line, marker included (e.g. "```json showcase=jsonschema")
 * @returns The code block's content
 */
function _getCodeBlock(readme: string, fence: string): string {
  const blocks = readme.split(`\n${fence}\n`);
  expect(blocks.length, `README.md has exactly one code block opened by "${fence}"`).toBe(2);
  return blocks[1].split('\n```\n')[0];
}

describe('README', () => {
  // Tests README.md's content, read from the repository root (where Vitest runs). The shared schema of # Usage is a TypeScript `as const` resource
  // (`schema.ts`, which the `ts` showcases import), repeated as JSON for the `jsonschema` showcase drawing it, as that adapter only reads JSON. The
  // TypeScript one's object literal is evaluated and compared with the parsed JSON one.
  const readme = readFileSync('README.md', 'utf8').replace(/\r\n/g, '\n');

  describe('Usage schema', () => {
    it('Repeats the schema of schema.ts exactly in its JSON diagram', () => {
      const source = _getCodeBlock(readme, '```ts showcase file=schema.ts');
      const literal = source.match(/^export const schema = ([\s\S]*) as const;$/m)?.[1];
      expect(literal, 'schema.ts declares `export const schema = { ... } as const;`').toBeDefined();
      // The literal is only data (no identifiers, calls or spreads), so evaluating it is what TypeScript would see
      const schema: unknown = new Function(`return (${literal});`)();

      const json: unknown = JSON.parse(_getCodeBlock(readme, '```json showcase=jsonschema'));
      expect(json).toEqual(schema);
    });
  });
});
