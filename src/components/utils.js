import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from '../components/config'

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
    })
}

export function logout() {
    window.walletConnection.signOut()
    // reload page
    window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
    // Allow the current app to make calls to the specified contract on the
    // user's behalf.
    // This works by creating a new access key for the user's account and storing
    // the private key in localStorage.
    window.walletConnection.requestSignIn(nearConfig.contractName)
}
