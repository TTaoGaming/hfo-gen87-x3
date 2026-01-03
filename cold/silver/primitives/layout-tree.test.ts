import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { LayoutNode } from './layout-tree.js';
import {
    addTileToTree,
    countTilesInTree,
    findTileInTree,
    getAllTileIds,
    removeTileFromTree,
    splitTileInTree,
} from './layout-tree.js';

describe('Layout Tree Primitives', () => {
	describe('Basic Operations', () => {
		it('should add a tile to an empty tree', () => {
			const result = addTileToTree('', 'tile1');
			expect(result).toBe('tile1');
		});

		it('should wrap existing tree when adding a tile', () => {
			const result = addTileToTree('tile1', 'tile2', 'column');
			expect(result).toEqual({
				direction: 'column',
				first: 'tile1',
				second: 'tile2',
				splitPercentage: 50,
			});
		});

		it('should use default row direction when adding a tile', () => {
			const result = addTileToTree('tile1', 'tile2');
			expect(result).toEqual({
				direction: 'row',
				first: 'tile1',
				second: 'tile2',
				splitPercentage: 50,
			});
		});

		it('should find a tile in the tree', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: {
					direction: 'column',
					first: 'tile2',
					second: 'tile3',
				},
			};
			expect(findTileInTree(tree, 'tile2')).toBe(true);
			expect(findTileInTree(tree, 'tile4')).toBe(false);
		});

		it('should count tiles correctly', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: {
					direction: 'column',
					first: 'tile2',
					second: 'tile3',
				},
			};
			expect(countTilesInTree(tree)).toBe(3);
			expect(countTilesInTree('')).toBe(0);
		});

		it('should get all tile IDs', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: {
					direction: 'column',
					first: 'tile2',
					second: 'tile3',
				},
			};
			expect(getAllTileIds(tree)).toEqual(['tile1', 'tile2', 'tile3']);
		});

		it('should return empty array for empty string in getAllTileIds', () => {
			expect(getAllTileIds('')).toEqual([]);
		});
	});

	describe('removeTileFromTree', () => {
		it('should remove a leaf node and return empty string', () => {
			expect(removeTileFromTree('tile1', 'tile1')).toBe('');
		});

		it('should not remove if ID does not match', () => {
			expect(removeTileFromTree('tile1', 'tile2')).toBe('tile1');
		});

		it('should collapse branch when first child is removed', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: 'tile2',
			};
			expect(removeTileFromTree(tree, 'tile1')).toBe('tile2');
		});

		it('should collapse branch when second child is removed', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: 'tile2',
			};
			expect(removeTileFromTree(tree, 'tile2')).toBe('tile1');
		});

		it('should handle nested removal and collapse', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: {
					direction: 'column',
					first: 'tile2',
					second: 'tile3',
				},
			};
			// Remove tile2, branch {tile2, tile3} collapses to tile3
			// Result should be {tile1, tile3}
			expect(removeTileFromTree(tree, 'tile2')).toEqual({
				direction: 'row',
				first: 'tile1',
				second: 'tile3',
			});
		});

		it('should return empty string if all tiles removed', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: 'tile2',
			};
			const step1 = removeTileFromTree(tree, 'tile1'); // 'tile2'
			const step2 = removeTileFromTree(step1, 'tile2'); // ''
			expect(step2).toBe('');
		});

		it('should handle empty string input for removeTileFromTree', () => {
			expect(removeTileFromTree('', 'tile1')).toBe('');
		});
	});

	describe('splitTileInTree', () => {
		it('should split a leaf node', () => {
			const result = splitTileInTree('tile1', 'tile1', 'tile2', 'column', 30);
			expect(result).toEqual({
				direction: 'column',
				first: 'tile1',
				second: 'tile2',
				splitPercentage: 30,
			});
		});

		it('should split a nested leaf node', () => {
			const tree: LayoutNode = {
				direction: 'row',
				first: 'tile1',
				second: 'tile2',
			};
			const result = splitTileInTree(tree, 'tile2', 'tile3', 'column');
			expect(result).toEqual({
				direction: 'row',
				first: 'tile1',
				second: {
					direction: 'column',
					first: 'tile2',
					second: 'tile3',
					splitPercentage: 50,
				},
			});
		});
	});

	describe('Property-Based Invariants', () => {
		// Arbitrary for LayoutNode
		const tileIdArb = fc.string({ minLength: 1, maxLength: 10 });
		const layoutNodeArb: fc.Arbitrary<LayoutNode> = fc.letrec((tie) => ({
			node: fc.oneof(
				tileIdArb,
				fc.record({
					direction: fc.constantFrom('row', 'column' as const),
					first: tie('node') as fc.Arbitrary<LayoutNode>,
					second: tie('node') as fc.Arbitrary<LayoutNode>,
					splitPercentage: fc.integer({ min: 0, max: 100 }),
				}),
			),
		})).node;

		it('should maintain tile count invariant: count(remove(tree, id)) == count(tree) - 1 (if id exists)', () => {
			fc.assert(
				fc.property(layoutNodeArb, (tree) => {
					const ids = getAllTileIds(tree);
					if (ids.length === 0) return true;

					const targetId = fc.sample(fc.constantFrom(...ids), 1)[0];
					const initialCount = countTilesInTree(tree);
					const newTree = removeTileFromTree(tree, targetId);
					const newCount = countTilesInTree(newTree);

					return newCount === initialCount - 1;
				}),
			);
		});

		it('should maintain tile count invariant: count(split(tree, id, newId)) == count(tree) + 1 (if id exists)', () => {
			fc.assert(
				fc.property(layoutNodeArb, tileIdArb, (tree, newId) => {
					const ids = getAllTileIds(tree);
					if (ids.length === 0) return true;
					if (ids.includes(newId)) return true; // Skip if newId already exists

					const targetId = fc.sample(fc.constantFrom(...ids), 1)[0];
					const initialCount = countTilesInTree(tree);
					const newTree = splitTileInTree(tree, targetId, newId, 'row');
					const newCount = countTilesInTree(newTree);

					return newCount === initialCount + 1;
				}),
			);
		});

		it('should ensure removed tile is no longer in tree', () => {
			fc.assert(
				fc.property(layoutNodeArb, (tree) => {
					const ids = getAllTileIds(tree);
					if (ids.length === 0) return true;

					const targetId = fc.sample(fc.constantFrom(...ids), 1)[0];
					const newTree = removeTileFromTree(tree, targetId);
					return !findTileInTree(newTree, targetId);
				}),
			);
		});

		it('should ensure split tile and new tile are both in tree', () => {
			fc.assert(
				fc.property(layoutNodeArb, tileIdArb, (tree, newId) => {
					const ids = getAllTileIds(tree);
					if (ids.length === 0) return true;
					if (ids.includes(newId)) return true;

					const targetId = fc.sample(fc.constantFrom(...ids), 1)[0];
					const newTree = splitTileInTree(tree, targetId, newId, 'row');
					return findTileInTree(newTree, targetId) && findTileInTree(newTree, newId);
				}),
			);
		});
	});
});
