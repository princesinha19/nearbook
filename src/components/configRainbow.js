const homedir = require('os').homedir()
const path = require('path')
let localConfig;

try {
    localConfig = require(path.join(homedir, '.rainbow', 'config.json'))
} catch (e) {
    localConfig = {}
}

const erc20Abi = require('./Rainbow/abis/erc20.json');
const tokenLockerAbi = require('./Rainbow/abis/tokenLocker.json');
const freeTokenVaultAbi = require('./Rainbow/abis/freeTokenVault.json');

module.exports = {
    local: {
        ...localConfig,
        ethNetwork: 'localhost:9545',
        ethErc20Abi: erc20Abi,
        ethLockerAbi: tokenLockerAbi,
        nearClientAccount: 'rainbow_bridge_eth_on_near_client',
        nearFunTokenAccount: 'nearfuntoken',
        nearWalletUrl: 'http://localhost:4000/',
        nearHelperUrl: 'http://localhost:3000/'
    },
    development: {
        ethClientAddress: '0xF721c979db97413AA9D0F91ad531FaBF769bb09C',
        ethEd25519Address: '0x9003342d15B21b4C42e1702447fE2f39FfAF55C2',
        ethErc20Abi: erc20Abi,
        ethErc20Address: '0x345D08d746B276f4288CAD4abD98f8AFD3aBD40E',
        ethLockerAbi: tokenLockerAbi,
        ethLockerAddress: '0x51847579c1b23EB2dEE0A9B6859BB7655A132035',
        ethNetwork: 'rinkeby',
        ethNodeUrl: 'https://rinkeby.infura.io/v3/TODO',
        ethProverAddress: '0xc5D62d66B8650E6242D9936c7e50E959BA0F9E37',
        nearClientAccount: 'ethonnearclient10',
        nearFunTokenAccount: 'ndai.hacker.testnet',
        nearHelperUrl: 'https://helper.testnet.near.org/',
        nearNetworkId: 'testnet',
        nearNodeUrl: 'https://rpc.testnet.near.org',
        nearProverAccount: 'ethonnearprover10',
        nearWalletUrl: 'https://wallet.testnet.near.org/',
        freeTokenVaultAbi,
        freeTokenVaultAddress: '0x8f98aD333bae0887c687f9f5B8b81D42d3A18e76',
    },
}
