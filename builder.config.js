// ./builder.config.js
const builder = require('build-dev')

function run([type]) {
    switch (type) {

        case 'run:nodejs':
           const res = builder.runNodejs({
                entryFile: './src/server1', 
                watchDirs: ['src'],
                nodeArgs: ['development'] 
            });

            builder.runNodejs({
                entryFile: './src/server2', 
            });

            return res

        case 'run':
            run(['run:nodejs'])
            break;

        default:
            throw new Error(`"${type}" not implemented`);
    }
}

run(process.argv.slice(2));