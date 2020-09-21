const shell = require('shelljs')

shell.fatal = true // same as "set -e"

shell.cd('contract')
// Note: see flags in ./cargo/config
shell.exec('cargo build --target wasm32-unknown-unknown --release')
shell.mkdir('-p', '../out')
shell.cp('./target/wasm32-unknown-unknown/release/nearbook.wasm', '../out/main.wasm')
