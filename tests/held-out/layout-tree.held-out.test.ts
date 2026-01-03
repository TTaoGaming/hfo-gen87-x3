import { describe, expect, it } from 'vitest';
import { removeTileFromTree, splitTileInTree } from '../../cold/silver/primitives/layout-tree';

/**
 * HELD-OUT TESTS - AI SHOULD NOT SEE THESE IN PRODUCTION
 * Focus: Tree structural integrity and edge cases
 */
describe('LayoutTree Held-Out Defense', () => {
	it('HELD-OUT: handles removing non-existent tile ID gracefully', () => {
		const tree = 'tile-1';
		const result = removeTileFromTree(tree, 'non-existent');
		expect(result).toBe('tile-1');
	});

	it('HELD-OUT: handles splitting non-existent tile ID gracefully', () => {
		const tree = 'tile-1';
		const result = splitTileInTree(tree, 'non-existent', 'new-tile');
		expect(result).toBe('tile-1');
	});

	it('HELD-OUT: handles empty string as tree input', () => {
		expect(removeTileFromTree('', 'any')).toBe('');
		expect(splitTileInTree('', 'any', 'new')).toBe('');
	});

	it('HELD-OUT: handles deeply nested removal and collapse', () => {
		// (A | (B | C))
		const tree: LayoutNode = {
			direction: 'row',
			first: 'A',
			second: {
				direction: 'column',
				first: 'B',
				second: 'C',
			},
		};

		// Remove B -> (A | C)
		const result = removeTileFromTree(tree, 'B') as any;
		expect(result.first).toBe('A');
		expect(result.second).toBe('C');
	});
});
