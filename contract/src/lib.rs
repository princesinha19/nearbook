use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::wee_alloc;
use near_sdk::{env, ext_contract, near_bindgen, PromiseResult};
use orderbook::{orders, Failed, OrderIndex, OrderSide, Orderbook, Success};

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// const TOKEN_ACCOUNT: &str = "ft.hacker.testnet";
// const SINGLE_CALL_GAS: u64 = 20_000_000_000_000; // 2 x 10^14
// const TRANSFER_FROM_NEAR_COST: u128 = 36_500_000_000_000_000_000_000; // 365 x 10^20

#[derive(PartialEq, Eq, Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub enum Asset {
    USD,
    EUR,
    BTC,
    ETH,
}

impl Default for Asset {
    fn default() -> Self {
        Asset::BTC
    }
}

fn parse_asset(asset: &str) -> Option<Asset> {
    match asset {
        "USD" => Some(Asset::USD),
        "EUR" => Some(Asset::EUR),
        "BTC" => Some(Asset::BTC),
        "ETH" => Some(Asset::ETH),
        _ => None,
    }
}

fn parse_side(side: &str) -> Option<OrderSide> {
    match side {
        "Ask" => Some(OrderSide::Ask),
        "Bid" => Some(OrderSide::Bid),
        _ => None,
    }
}

fn get_time() -> u64 {
    return env::block_timestamp();
}

/// External Fungible token contract
#[ext_contract(ext_fungible_token)]
pub trait ExtFunToken {
    fn transfer(&mut self, new_owner_id: AccountId, amount: U128);
    fn transfer_from(&mut self, owner_id: AccountId, new_owner_id: AccountId, amount: U128);
}

#[ext_contract(ext_this_contract)]
pub trait ExtSimulation {
    fn post_transfer(&mut self);
}

#[near_bindgen]
#[derive(Default, BorshDeserialize, BorshSerialize)]
pub struct Market {
    market_order_book: Orderbook<Asset>,
    order_asset: Asset,
    price_asset: Asset,
}

#[near_bindgen]
impl Market {
    #[init]
    pub fn new() -> Self {
        Self {
            market_order_book: Orderbook::new(Asset::BTC, Asset::USD),
            order_asset: parse_asset("BTC").unwrap(),
            price_asset: parse_asset("USD").unwrap(),
        }
    }

    pub fn new_limit_order(
        &mut self,
        price: f64,
        quantity: f64,
        side: String,
    ) -> Vec<Result<Success, Failed>> {
        // let recipient_account = env::signer_account_id();

        // ext_fungible_token::transfer_from(
        //     env::signer_account_id(),
        //     recipient_account, //TODO: Get current contract id
        //     U128(1),
        //     &TOKEN_ACCOUNT,
        //     TRANSFER_FROM_NEAR_COST,
        //     SINGLE_CALL_GAS,
        // )
        // .then(ext_this_contract::post_transfer(
        //     &env::current_account_id(),
        //     0,
        //     SINGLE_CALL_GAS,
        // ));

        let order = orders::new_limit_order_request(
            self.order_asset,
            self.price_asset,
            parse_side(&side).unwrap(),
            price,
            quantity,
            get_time(),
        );

        return self.market_order_book.process_order(order);
    }

    pub fn cancel_limit_order(&mut self, id: u64, side: String) -> Vec<Result<Success, Failed>> {
        let order = orders::limit_order_cancel_request(id, parse_side(&side).unwrap());

        return self.market_order_book.process_order(order);
    }

    pub fn get_ask_orders(&mut self) -> Vec<OrderIndex> {
        return self.market_order_book.get_ask_queue();
    }

    pub fn get_bid_orders(&mut self) -> Vec<OrderIndex> {
        return self.market_order_book.get_bid_queue();
    }

    pub fn get_current_spread(&mut self) -> Vec<f64> {
        if let Some((bid, ask)) = self.market_order_book.current_spread() {
            return vec![ask, bid];
        } else {
            return vec![0.0, 0.0];
        }
    }

    // pub fn post_transfer(&mut self) {
    //     self._only_owner_predecessor();
    //     assert_eq!(env::promise_results_count(), 1);
    //     match env::promise_result(0) {
    //         // We don't care about the result this time, hence the underscore
    //         // This is how we'll get the number soon, though.
    //         PromiseResult::Successful(_) => {}
    //         PromiseResult::Failed => {
    //             env::panic(b"(post_transfer) The promise failed. See receipt failures.")
    //         }
    //         PromiseResult::NotReady => env::panic(b"The promise was not ready."),
    //     };
    //     env::log(b"You've received a fungible token.")
    // }

    // fn _only_owner_predecessor(&mut self) {
    //     assert_eq!(
    //         env::predecessor_account_id(),
    //         env::current_account_id(),
    //         "Only contract owner can sign transactions for this method."
    //     );
    // }
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 *
 * To run from contract directory:
 * cargo test -- --nocapture
 *
 * From project root, to run in combination with frontend tests:
 * yarn test
 *
 */
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn get_ask_order() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = Market::new();

        // Currrent Spread
        let spread = contract.get_current_spread();
        println!("Spread => Ask: {}, Bid: {}", spread[0], spread[1]);
        assert_eq!(spread[0], 0.0);
        assert_eq!(spread[1], 0.0);

        // Ask Order
        let res = contract.new_limit_order(1.25, 1.0, "Ask".to_string());
        // let res1 = contract.get_ask_orders();
        println!("Ask Result: {:?}", res);

        // Bid Order
        let res2 = contract.new_limit_order(1.22, 0.56, "Bid".to_string());
        // let res3 = contract.get_bid_orders();
        println!("Bid Result: {:?}", res2);

        // for temp_variable in res2 {
        //     let x = temp_variable.unwrap();

        //     match x {
        //         Success::Accepted { id, order_type, ts } => {
        //             println!(
        //                 "Accepted => Id {} , Order type: {:?}, Timestamp: {}",
        //                 id, order_type, ts
        //             );
        //         }
        //         Success::Filled {
        //             order_id,
        //             side,
        //             order_type,
        //             price,
        //             qty,
        //             ts,
        //         } => {
        //             println!(
        //                 "Filled => Id: {} , Side: {:?}, Order Type: {:?}, Price: {}, Quantity: {}, Timestamp: {}",
        //                 order_id, side, order_type, price, qty, ts,
        //             );
        //         }
        //         Success::PartiallyFilled {
        //             order_id,
        //             side,
        //             order_type,
        //             price,
        //             qty,
        //             ts,
        //         } => {
        //             println!(
        //                 "PartiallyFilled => Id: {} , Side: {:?}, Order Type: {:?}, Price: {}, Quantity: {}, Timestamp: {}",
        //                 order_id, side, order_type, price, qty, ts,
        //             );
        //         }
        //         Success::Amended { id, price, qty, ts } => {
        //             println!(
        //                 "Amended => Id: {}, Price: {}, Quantity: {}, Timestamp: {}",
        //                 id, price, qty, ts,
        //             );
        //         }
        //         Success::Cancelled { id, ts } => {
        //             println!("Cancelled => id {}, Timestamp: {}", id, ts,);
        //         }
        //     };
        // }

        // Currrent Spread
        let spread = contract.get_current_spread();
        println!("Spread => Ask: {}, Bid: {}", spread[0], spread[1]);
        assert_eq!(spread[0], 1.25);
        assert_eq!(spread[1], 1.22);
    }
}
