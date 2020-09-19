extern crate orderbook;

use orderbook::{orders, OrderSide, Orderbook};

extern crate near_sdk;
use near_sdk::env;

#[derive(PartialEq, Eq, Debug, Copy, Clone)]
pub enum BrokerAsset {
    USD,
    EUR,
    BTC,
    ETH,
}

fn parse_asset(asset: &str) -> Option<BrokerAsset> {
    match asset {
        "USD" => Some(BrokerAsset::USD),
        "EUR" => Some(BrokerAsset::EUR),
        "BTC" => Some(BrokerAsset::BTC),
        "ETH" => Some(BrokerAsset::ETH),
        _ => None,
    }
}

fn get_current_time() -> u64 {
    return env::block_timestamp();
}

fn main() {
    let mut orderbook = Orderbook::new(BrokerAsset::BTC, BrokerAsset::USD);
    let order_asset = parse_asset("BTC").unwrap();
    let price_asset = parse_asset("USD").unwrap();

    // create order requests
    let order_list = vec![
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            0.98,
            5.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            1.02,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::amend_order_request(1, OrderSide::Bid, 0.99, 4.0, get_current_time()),
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            1.01,
            0.4,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            1.03,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::new_market_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            1.05,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
        orders::limit_order_cancel_request(4, OrderSide::Ask),
        orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            1.06,
            0.6,
            "test.example.testnet".to_string(),
            get_current_time(),
        ),
    ];

    // processing
    for order in order_list {
        println!("Order => {:?}", &order);
        let res = orderbook.process_order(order);
        println!("Processing => {:?}", res);
        if let Some((bid, ask)) = orderbook.current_spread() {
            println!("Spread => bid: {}, ask: {}\n", bid, ask);
        } else {
            println!("Spread => not available\n");
        }
    }
}
