import { join } from 'node:path';
import * as esbuild from 'esbuild';

const entryPoint = join(process.cwd(), 'hot/silver/exemplars/browser/index.ts');
const outfile = join(process.cwd(), 'demos/dist/hfo.bundle.js');

async function build() {
	console.log('🚀 Building browser bundle...');

	try {
		await esbuild.build({
			entryPoints: [entryPoint],
			bundle: true,
			outfile: outfile,
			format: 'esm',
			platform: 'browser',
			target: 'esnext',
			external: ['zod', 'xstate', '1eurofilter', '@mediapipe/tasks-vision', 'nats'],
			logLevel: 'info',
			// esbuild handles .js extensions in TS imports by default
			// as long as the corresponding .ts files exist.
		});
		console.log('✅ Build complete: demos/dist/hfo.bundle.js');
	} catch (error) {
		console.error('❌ Build failed:', error);
		process.exit(1);
	}
}

build();
