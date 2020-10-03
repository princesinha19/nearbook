NearBook 📖
===========
It is an On-Chain orderbook implemented using Rust. By "On-chain", We mean that the matching engine is implemented as a smart contract on the near blockchain. It allows users to create Limit Orders. Currently, It supports one market nDAI <-> nBook. nDAI (Near DAI) works as a price asset, which can be obtained by locking DAI (ETH erc20 token) using Rainbow Bridge.

**Live Application:** <a href="https://princesinha19.github.io/nearbook/" target="_blank" rel="noreferrer">Try Out On Github Pages</a> / <a href="https://siasky.net/AAAJ_Q-Zq9Pf0tejHbQA5WolmmROhA44jg5qrCRQjia8Cg" target="_blank" rel="noreferrer">Try Out On Skynet</a>

**Demo Video On Skynet:** https://siasky.net/_AVvKX781oq27T_cXUYwYzcARZKFIPPdvXJBQVyWUFbfwA

Description
===========

### Smart Contract

The implemented orderbook is fully decentralized. It's written in Rust programming language. In the current implementation, the Price Asset is **nDAI,** and Order Asset is **nBook.**

nDAI is a Mintable NEAR token which can be obtained by locking DAI (ETH erc20 token) on the locker contract using Rainbow Bridge. nBook is also a NEAR token.

Currently, the order book supports Limit Orders. The matching engine matches the order based on Ask & Bid price. The order will get instantly filled if there will be a match. The order might be filled partially if there is not enough quantity for the order. 

**For example:** 

*If user A has created an order to buy 10 nBook. And in the pool, there is an instant match of 5 nBook then, the order will get partially filled and in the future, only the remaining 5 will get matched with new orders.*

The smart contract support features like creating limit orders, canceling orders, to get current spread, to get bid, and ask orders. The smart-contract also has Market orders but that is not being used in the current implementation.

### Frontend

The frontend is written in React.js. It has two main components:

1. **Orderbook Page** 📖

    This page is for creating Limit orders. It displays the user's current balance. Also, one can see all buys & sells orders with the current price. 

    From this page, You can go to rainbow bridge page for moving DAI on NEAR.

2. **Rainbow Bridge Page** 🌈

    From this page, you can transfer DAI token to NEAR by locking DAI on the Locker contract. You can also use Reward Vault for getting 100 DAI tokens per address if you don't have any DAI. 
    You can click on the NEAR logo on the top left for going back to the Orderbook page.

Both pages have a `sign out` button for signing out and remove application authorization for automatic signing of the NEAR transaction on the user's behalf. 

It also has **Token Vault** contract which is written in solidity, which allows the new users to get 100 DAI (Eth erc20) token per address. If your DAI balance is zero and you haven't claimed 100 tokens from that address then, you will see a button to get 100 DAI on the rainbow bridge page.

Steps For Use
=============

1. For trading using NearBook, one needs to do **Sign In.** It will redirect the user to authorize the nearbook application to do transactions on their behalf.
2. For getting an **nDAI** token, you need to click to the Rainbow Bridge Icon on the orderbook page. This will redirect you to use the Rainbow Bridge page. 
3. Then, You will see a Metamask popup, you need to do login in Metamsk and You have to select the network as **Rinkeby**.
4. If you are a new user and don't have any DAI token then, you can obtain some by clicking to the `Get 100 DAI` button. That will ask you to sign an ethereum transaction and, you will get 100 DAI on Rinkeby testnet (For testing).
5. Next, You can fill the DAI amount, which you want to move to NEAR. The system will show you 2  metamask transactions. One for approving token and second for locking. Once it will reach 10 confirmation, you will get redirected to the NEAR wallet where you need to sign the transaction to get nDAI. Currently, 1 DAI will give you 1nDAI. 
6. Now, you can click to the NEAR logo at the top left corner and, you will get redirected to the Nearbook page (Main Page). 
7. You can fill the quantity and price of the trade. Quantity accepts no decimal places as of now. 
8. After filling the quantity, you need to approve the token so that the nearbook smart contract can deduct the token when you submit the order. For approving, you need to sign the NEAR transaction. 
**Note:** You can approve more than required token to save gas for next orders.
9. Once you successfully approved the token then, you can fill quantity and price (based on the current price) and you will get the button to `Place Order`.
10. Once you click the button, the system will automatically place an order. You will get a pop-up that the order has been successfully submitted. 
If there will be an available match in the orderbook then, your order will get filled instantly. Otherwise, it will get filled once there will be a match. It might get partially filled.

Running Project Locally
=======================

1. Prerequisites: Make sure you've installed [Node.js] ≥ 12 and [Rust with correct target][Rust]
2. Install dependencies: `yarn install`
3. Run the local development server: `yarn start` (see `package.json` for a
   full list of `scripts` you can run with `yarn`)

Now you'll have a local development environment backed by the NEAR TestNet!


Exploring The Code
==================

1. The "backend" code lives in the `/contract` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy:contract`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. The frontend code lives in the `/src` folder. `/src/index.html` is a great
   place to start exploring. Note that it loads in `/src/index.js`, where you
   can learn how the frontend connects to the NEAR blockchain.
