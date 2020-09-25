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

module.exports = {
    local: {
        ...localConfig,
        ethNetwork: 'localhost:9545',
        ethErc20AbiText: erc20Abi,
        ethLockerAbiText: tokenLockerAbi,
        nearClientAccount: 'rainbow_bridge_eth_on_near_client',
        nearFunTokenAccount: 'nearfuntoken',
        nearWalletUrl: 'http://localhost:4000/',
        nearHelperUrl: 'http://localhost:3000/'
    },
    development: {
        ethClientAddress: '0xF721c979db97413AA9D0F91ad531FaBF769bb09C',
        ethEd25519Address: '0x9003342d15B21b4C42e1702447fE2f39FfAF55C2',
        ethErc20AbiText: erc20Abi,
        ethErc20Address: '0x53Bf04b6d0818b0Df53494Fda641b38c2275eF28',
        ethLockerAbiText: tokenLockerAbi,
        ethLockerAddress: '0x0429F4f8CE5CeD3AcF9a5393D48f189aA44957e8',
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
    },
}
