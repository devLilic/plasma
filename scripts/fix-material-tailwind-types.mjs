import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const declarationsRoot = join(
    process.cwd(),
    'node_modules',
    '@material-tailwind',
    'react',
);

async function patchDeclarations(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            await patchDeclarations(path);
            continue;
        }

        if (extname(entry.name) !== '.ts' || !entry.name.endsWith('.d.ts')) {
            continue;
        }

        const source = await readFile(path, 'utf8');
        const patched = source.replace(
            /React\.ForwardRefExoticComponent<Pick<(.+)> & React\.RefAttributes</g,
            'React.ForwardRefExoticComponent<Partial<Pick<$1>> & React.RefAttributes<',
        );

        if (patched !== source) {
            await writeFile(path, patched);
        }
    }
}

await patchDeclarations(declarationsRoot);
