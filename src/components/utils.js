import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from '../components/config';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider'
import Web3 from 'web3';
import config from './configRainbow';;
import EthOnNearClient from './Rainbow/borsh/ethOnNearClient';
import * as localStorage from './Rainbow/localStorage'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')

// Initialize contract & set global variables
export async function initContract() {

    // Initialize connection to the NEAR testnet
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))

    // Initializing Wallet based Account. It can work with NEAR testnet wallet that
    // is hosted at https://wallet.testnet.near.org
    window.walletConnection = new WalletConnection(near)

    // Getting the Account ID. If still unauthorized, it's just empty string
    window.accountId = window.walletConnection.getAccountId()

    // Initializing our contract APIs by contract name and configuration
    window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        // View methods are read only. They don't modify the state, but usually return some value.
        viewMethods: [
            'get_ask_orders',
            'get_bid_orders',
            'get_current_spread',
        ],

        // Change methods can modify the state. But you don't receive the returned value when called.
        changeMethods: [
            'new_limit_order',
            'cancel_limit_order',
        ],
    });

    // Initializing our contract APIs by contract name and configuration
    window.ndai = await new Contract(window.walletConnection.account(), "ndai.hacker.testnet", {
        viewMethods: [
            'get_balance',
        ],

        changeMethods: [],
    });

    // Initializing our contract APIs by contract name and configuration
    window.ft = await new Contract(window.walletConnection.account(), "ft.hacker.testnet", {
        viewMethods: [
            'get_balance',
        ],

        changeMethods: [],
    });

    // const span = document.createElement('span')
    // span.innerHTML = `Connected to Ethereum as <code>${window.ethUserAddress}</code>`

    // Near Connection
    window.nearConnection = new WalletConnection(near);
    window.nearUserAddress = window.nearConnection.getAccountId()

    // const span = document.createElement('span')
    // span.innerHTML = `Connected to NEAR as <code>${window.nearUserAddress}</code>`
    // button.replaceWith(span)

    window.nep21 = await new Contract(
        window.nearConnection.account(),
        config.development.nearFunTokenAccount,
        {
            // View methods are read only
            viewMethods: ['get_balance'],
            // Change methods modify state but don't receive updated data
            changeMethods: ['mint_with_json']
        }
    )

    window.ethOnNearClient = await new EthOnNearClient(
        window.nearConnection.account(),
        config.development.nearClientAccount
    )

    window.nearInitialized = true;
}

export async function initWeb3(callback) {

    // SWAP IN YOUR OWN INFURA_ID FROM https://infura.io/dashboard/ethereum
    // const INFURA_ID = '9c91979e95cb4ef8a61eb029b4217a1a'

    // /*
    //   Web3 modal helps us "connect" external wallets:
    // */
    // window.web3Modal = new Web3Modal({
    //     network: config.development.ethNetwork, // optional
    //     cacheProvider: true, // optional
    //     providerOptions: {
    //         walletconnect: {
    //             package: WalletConnectProvider, // required
    //             options: {
    //                 infuraId: INFURA_ID
    //             }
    //         }
    //     }
    // });

    // Web3 Connection
    // const provider = await window.web3Modal.connect();

    window.web3 = new Web3(window.ethereum)
    await window.ethereum.enable();

    window.ethUserAddress = (await window.web3.eth.getAccounts())[0]

    window.erc20 = new window.web3.eth.Contract(
        config.development.ethErc20Abi,
        config.development.ethErc20Address,
        { from: window.ethUserAddress }
    )

    window.ethErc20Address = config.development.ethErc20Address;

    try {
        window.ethErc20Name = await window.erc20.methods.symbol().call()
    } catch (e) {
        window.ethErc20Name = config.development.ethErc20Address.slice(0, 5) + '…'
    }

    window.tokenLocker = new window.web3.eth.Contract(
        config.development.ethLockerAbi,
        config.development.ethLockerAddress,
        { from: window.ethUserAddress }
    )

    window.freeTokenVault = new window.web3.eth.Contract(
        config.development.freeTokenVaultAbi,
        config.development.freeTokenVaultAddress,
        { from: window.ethUserAddress }
    )

    window.ethInitialized = true;

    const STORAGE_KEY = 'WEB3_CONNECT_CACHED_PROVIDER';
    if (localStorage.get(STORAGE_KEY) !== "connected") {
        localStorage.set(STORAGE_KEY, "connected")
    }

    callback();
}

export function logout() {
    window.walletConnection.signOut();

    const STORAGE_KEY = 'WEB3_CONNECT_CACHED_PROVIDER';
    localStorage.set(STORAGE_KEY, "injected");

    window.location.replace(window.location.origin);
}

export function login() {
    // Allow the current app to make calls to the specified contract on the
    // user's behalf.
    // This works by creating a new access key for the user's account and storing
    // the private key in localStorage.
    window.walletConnection.requestSignIn(nearConfig.contractName)
}
