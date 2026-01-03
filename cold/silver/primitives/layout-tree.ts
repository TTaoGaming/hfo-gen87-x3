/**
 * Layout Tree Primitives - Port 7 NAVIGATE
 *
 * Gen87.X3 | Pure Binary Tree Layout Manipulation
 *
 * PURPOSE: Pure algorithmic primitives for manipulating binary space partitioning (BSP) trees.
 * These functions are used by UIShell adapters (like GoldenLayout) to manage tile arrangements.
 *
 * ARCHITECTURE:
 * - Pure functions (no side effects)
 * - No DOM or library dependencies
 * - Recursive tree algorithms
 * - TRL 9: Based on react-mosaic and golden-layout production patterns
 *
 * @port 7
 * @verb NAVIGATE
 * @binary 111
 * @element Heaven - Pure will, strategic direction
 */

/**
 * Layout tree node - recursive binary tree structure
 * Leaves are strings (Tile IDs), branches are split nodes.
 */
export type LayoutNode =
	| string
	| {
			direction: 'row' | 'column';
			first: LayoutNode;
			second: LayoutNode;
			splitPercentage?: number | undefined;
	  };

/**
 * Remove a tile from the arrangement tree.
 * If a branch node loses one child, it collapses and returns the remaining child.
 * If the root tile is removed, returns an empty string.
 */
export function removeTileFromTree(node: LayoutNode, tileId: string): LayoutNode {
	if (typeof node === 'string') {
		// Leaf node
		return node === tileId ? '' : node;
	}

	// Branch node - recurse
	const first = removeTileFromTree(node.first, tileId);
	const second = removeTileFromTree(node.second, tileId);

	// Collapse logic:
	// If both sides are empty, the whole branch is empty
	if (first === '' && second === '') return '';

	// If one side is empty, return the other side (collapsing the branch)
	if (first === '') return second;
	if (second === '') return first;

	// Both sides still have content, return updated branch
	return {
		...node,
		first,
		second,
	};
}

/**
 * Split a tile in the arrangement tree.
 * Replaces the target tile with a branch node containing the original tile and the new tile.
 */
export function splitTileInTree(
	node: LayoutNode,
	sourceTileId: string,
	newTileId: string,
	direction: 'row' | 'column',
	splitPercentage = 50,
): LayoutNode {
	if (typeof node === 'string') {
		if (node === sourceTileId) {
			// Found the tile to split
			return {
				direction,
				first: sourceTileId,
				second: newTileId,
				splitPercentage,
			};
		}
		return node;
	}

	// Branch node - recurse
	return {
		...node,
		first: splitTileInTree(node.first, sourceTileId, newTileId, direction, splitPercentage),
		second: splitTileInTree(node.second, sourceTileId, newTileId, direction, splitPercentage),
	};
}

/**
 * Add a tile to the tree by wrapping the existing arrangement.
 * If tree is empty, the new tile becomes the root.
 * Otherwise, creates a new root branch with the existing tree and the new tile.
 */
export function addTileToTree(
	arrangement: LayoutNode,
	newTileId: string,
	direction: 'row' | 'column' = 'row',
): LayoutNode {
	if (arrangement === '') {
		return newTileId;
	}

	return {
		direction,
		first: arrangement,
		second: newTileId,
		splitPercentage: 50,
	};
}

/**
 * Find if a tile exists in the tree.
 */
export function findTileInTree(node: LayoutNode, tileId: string): boolean {
	if (typeof node === 'string') {
		return node === tileId;
	}
	return findTileInTree(node.first, tileId) || findTileInTree(node.second, tileId);
}

/**
 * Get all tile IDs present in the tree.
 */
export function getAllTileIds(node: LayoutNode): string[] {
	if (typeof node === 'string') {
		return node === '' ? [] : [node];
	}
	return [...getAllTileIds(node.first), ...getAllTileIds(node.second)];
}

/**
 * Count total number of tiles in the tree.
 */
export function countTilesInTree(node: LayoutNode): number {
	if (typeof node === 'string') {
		return node === '' ? 0 : 1;
	}
	return countTilesInTree(node.first) + countTilesInTree(node.second);
}
