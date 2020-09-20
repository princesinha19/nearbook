use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::wee_alloc;
use near_sdk::{env, ext_contract, near_bindgen, PromiseResult};
use orderbook::{orders, Failed, OrderIndex, OrderSide, Orderbook, Success};

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

const SINGLE_CALL_GAS: u64 = 20_000_000_000_000; // 2 x 10^14
const TRANSFER_FROM_NEAR_COST: u128 = 36_500_000_000_000_000_000_000; // 365 x 10^20

#[allow(non_camel_case_types)]
#[derive(PartialEq, Eq, Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub enum Asset {
    nFT,
    nDAI,
}

impl Default for Asset {
    fn default() -> Self {
        Asset::nFT
    }
}

fn parse_side(side: &str) -> Option<OrderSide> {
    match side {
        "Ask" => Some(OrderSide::Ask),
        "Bid" => Some(OrderSide::Bid),
        _ => None,
    }
}

fn get_token_account(side: OrderSide) -> String {
    match side {
        OrderSide::Ask => "ft.hacker.testnet".to_string(),
        OrderSide::Bid => "dai.hacker.testnet".to_string(),
    }
}

fn get_current_time() -> u64 {
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
    fn post_transfer(&mut self, price: f64, quantity: u128, side: String);
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
            market_order_book: Orderbook::new(Asset::nFT, Asset::nDAI),
            order_asset: Asset::nFT,
            price_asset: Asset::nDAI,
        }
    }

    pub fn new_limit_order(&mut self, price: f64, quantity: u128, side: String) {
        ext_fungible_token::transfer_from(
            env::signer_account_id(),
            env::current_account_id(),
            U128(quantity),
            &get_token_account(parse_side(&side).unwrap()),
            TRANSFER_FROM_NEAR_COST,
            SINGLE_CALL_GAS,
        )
        .then(ext_this_contract::post_transfer(
            price,
            quantity,
            side,
            &env::current_account_id(),
            0,
            SINGLE_CALL_GAS,
        ));
    }

    pub fn cancel_limit_order(&mut self, id: u64, side: String) -> Vec<Result<Success, Failed>> {
        let order = orders::limit_order_cancel_request(id, parse_side(&side).unwrap());

        self.market_order_book.process_order(order)
    }

    pub fn get_ask_orders(&self) -> Vec<OrderIndex> {
        self.market_order_book.ask_queue.clone().idx_queue.unwrap()
    }

    pub fn get_bid_orders(&self) -> Vec<OrderIndex> {
        self.market_order_book.bid_queue.clone().idx_queue.unwrap()
    }

    pub fn get_current_spread(&self) -> Vec<f64> {
        if let Some((bid, ask)) = self.market_order_book.clone().current_spread() {
            vec![ask, bid]
        } else {
            vec![0.0, 0.0]
        }
    }

    pub fn post_transfer(&mut self, price: f64, quantity: u128, side: String) {
        self._only_owner_predecessor();
        assert_eq!(env::promise_results_count(), 1);
        match env::promise_result(0) {
            PromiseResult::Successful(_) => {
                env::log(b"Token Transfer Successful.");

                let order = orders::new_limit_order_request(
                    self.order_asset,
                    self.price_asset,
                    parse_side(&side).unwrap(),
                    price,
                    quantity,
                    env::signer_account_id(),
                    get_current_time(),
                );

                let res = self.market_order_book.process_order(order);

                self.process_orderbook_result(res)
            }
            PromiseResult::Failed => {
                env::panic(b"(post_transfer) The promise failed. See receipt failures.")
            }
            PromiseResult::NotReady => env::panic(b"The promise was not ready."),
        };
    }

    fn process_orderbook_result(
        &mut self,
        order: Vec<Result<Success, Failed>>,
    ) -> Vec<Result<Success, Failed>> {
        for temp_variable in &order {
            let success = temp_variable.as_ref().unwrap();

            match success {
                Success::Accepted {
                    id: _,
                    order_type: _,
                    order_creator: _,
                    ts: _,
                } => {}
                Success::Filled {
                    order_id: _,
                    side,
                    order_type: _,
                    price: _,
                    qty,
                    order_creator,
                    ts: _,
                } => {
                    let reverse_side = match side {
                        OrderSide::Ask => OrderSide::Bid,
                        OrderSide::Bid => OrderSide::Ask,
                    };

                    self.transfer(
                        get_token_account(reverse_side),
                        order_creator.to_string(),
                        *qty,
                    );
                }
                Success::PartiallyFilled {
                    order_id: _,
                    side,
                    order_type: _,
                    price: _,
                    qty,
                    order_creator,
                    ts: _,
                } => {
                    let reverse_side = match side {
                        OrderSide::Ask => OrderSide::Bid,
                        OrderSide::Bid => OrderSide::Ask,
                    };

                    self.transfer(
                        get_token_account(reverse_side),
                        order_creator.to_string(),
                        *qty,
                    );
                }
                Success::Amended {
                    id: _,
                    price: _,
                    qty: _,
                    ts: _,
                } => {}
                Success::Cancelled { id: _, ts: _ } => {}
            };
        }

        order
    }

    fn transfer(&mut self, token_account: String, order_creator: String, amount: u128) {
        self._only_owner_predecessor();

        ext_fungible_token::transfer(
            order_creator,
            U128(amount),
            &token_account,
            TRANSFER_FROM_NEAR_COST,
            SINGLE_CALL_GAS,
        );
    }

    fn _only_owner_predecessor(&mut self) {
        assert_eq!(
            env::predecessor_account_id(),
            env::current_account_id(),
            "Only contract owner can sign transactions for this method."
        );
    }
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
// TODO: Complete this test
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "prince_near".to_string(),
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
        let res = contract.new_limit_order(1.25, 2, "Ask".to_string());
        // let res1 = contract.get_ask_orders();
        println!("Ask Result: {:?}", res);

        // Bid Order
        let res2 = contract.new_limit_order(1.22, 1, "Bid".to_string());
        // let res3 = contract.get_bid_orders();
        println!("Bid Result: {:?}", res2);

        // Currrent Spread
        let spread = contract.get_current_spread();
        println!("Spread => Ask: {}, Bid: {}", spread[0], spread[1]);
        assert_eq!(spread[0], 1.25);
        assert_eq!(spread[1], 1.22);
    }
}
