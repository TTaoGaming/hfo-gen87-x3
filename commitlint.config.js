export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// Allow HIVE phase prefixes
		'type-enum': [
			2,
			'always',
			[
				// HIVE/8 Phases (primary)
				'H', // Hunt - Research phase
				'I', // Interlock - TDD RED (write failing tests)
				'V', // Validate - TDD GREEN (make tests pass)
				'E', // Evolve - TDD REFACTOR
				// Conventional (secondary)
				'feat', // New feature
				'fix', // Bug fix
				'docs', // Documentation
				'style', // Formatting
				'refactor', // Code refactor
				'test', // Tests
				'chore', // Maintenance
				'ci', // CI/CD
				'perf', // Performance
				'revert', // Revert commit
			],
		],
		// Enforce scope for HIVE commits
		'scope-enum': [
			1, // Warning (not error)
			'always',
			[
				// 8 Ports
				'port0',
				'port1',
				'port2',
				'port3',
				'port4',
				'port5',
				'port6',
				'port7',
				// Commanders
				'observer',
				'bridger',
				'shaper',
				'injector',
				'disruptor',
				'immunizer',
				'assimilator',
				'navigator',
				// General
				'core',
				'shared',
				'tools',
				'docs',
				'ci',
				'config',
			],
		],
		// Subject must be meaningful
		'subject-min-length': [2, 'always', 10],
		'subject-max-length': [2, 'always', 72],
		// No period at end
		'subject-full-stop': [2, 'never', '.'],
		// Lowercase
		'subject-case': [2, 'always', 'lower-case'],
	},
	helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
	prompt: {
		messages: {
			type: 'Select commit type (HIVE phase or conventional):',
			scope: 'Select scope (port or component):',
			subject: 'Write a short description:',
		},
	},
};
