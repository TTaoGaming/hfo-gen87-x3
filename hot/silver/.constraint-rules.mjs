/**
 * Architectural Constraint Rules
 *
 * These are MACHINE-ENFORCEABLE rules that AI cannot bypass.
 * Run with: npx dependency-cruiser --config .constraint-rules.mjs hot/silver
 *
 * If AI creates slop, this FAILS before human sees it.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
export default {
	forbidden: [
		// ═══════════════════════════════════════════════════════════════
		// RULE 1: Silver exemplars MUST depend on Bronze adapters
		// ═══════════════════════════════════════════════════════════════
		{
			name: 'silver-must-use-bronze-adapters',
			comment: 'Files in hot/silver/exemplars must import from hot/bronze/src/adapters',
			severity: 'error',
			from: {
				path: '^hot/silver/exemplars',
			},
			to: {
				// Must NOT import from anywhere except these allowed paths
				pathNot: [
					'^hot/bronze/src/adapters',
					'^hot/bronze/src/contracts',
					'^hot/bronze/src/ports',
					'^node_modules',
					// Allow relative imports within exemplars for composition
					'^\\.\\.',
				],
			},
		},

		// ═══════════════════════════════════════════════════════════════
		// RULE 2: No circular dependencies
		// ═══════════════════════════════════════════════════════════════
		{
			name: 'no-circular',
			severity: 'error',
			comment: 'Circular dependencies break the hexagonal architecture',
			from: {},
			to: {
				circular: true,
			},
		},

		// ═══════════════════════════════════════════════════════════════
		// RULE 3: Adapters must not depend on exemplars (direction matters)
		// ═══════════════════════════════════════════════════════════════
		{
			name: 'bronze-does-not-depend-on-silver',
			severity: 'error',
			comment: 'Bronze is foundation. Silver is composition. Direction is bronze→silver only.',
			from: {
				path: '^hot/bronze',
			},
			to: {
				path: '^hot/silver',
			},
		},

		// ═══════════════════════════════════════════════════════════════
		// RULE 4: No orphan exemplars (must be wired to infrastructure)
		// ═══════════════════════════════════════════════════════════════
		{
			name: 'no-orphan-exemplars',
			severity: 'warn',
			comment: 'Exemplar files that import nothing from bronze are likely slop',
			from: {
				path: '^hot/silver/exemplars',
				orphan: true,
			},
			to: {},
		},
	],

	options: {
		doNotFollow: {
			path: 'node_modules',
		},
		// Don't use tsconfig for now - analyze raw imports
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default'],
		},
		reporterOptions: {
			dot: {
				theme: {
					graph: { splines: 'ortho' },
					node: { shape: 'box' },
				},
			},
		},
	},
};
