mod engine;
extern crate near_sdk;

pub use engine::domain::{OrderSide};
pub use engine::order_queues::{OrderQueue, OrderIndex};
pub use engine::orderbook::{Failed, OrderProcessingResult, Orderbook, Success};
pub use engine::orders;

#[cfg(test)]
mod tests {
    use super::*;

    const FLOAT_THRESHOLD: f64 = 1e-6;

    fn match_float(expected: f64, get: f64) -> bool {
        if (expected - get).abs() < FLOAT_THRESHOLD {
            true
        } else {
            false
        }
    }

    #[derive(PartialEq, Eq, Debug, Copy, Clone)]
    enum Asset {
        USD,
        EUR,
        BTC,
        ETH,
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

    // fn get_current_time() -> u64 {
    //     use std::time;
    //     let since_the_epoch = time::SystemTime::now()
    //         .duration_since(time::SystemTime::UNIX_EPOCH)
    //         .expect("Time went backwards");

    //     return since_the_epoch.as_secs();
    // }
    fn get_current_time() -> u64 {
        use self::near_sdk::env;
        return env::block_timestamp();
    }

    #[test]
    fn market_order_on_empty_orderbook() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_market_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            2.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        // process market order
        let res = orderbook.process_order(order1);

        if !match res[0] {
            Ok(Success::Accepted { id: 1, .. }) => true,
            _ => false,
        } || !match res[1] {
            Err(Failed::NoMatch(1)) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }
    }

    #[test]
    fn market_order_partial_match() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order2 = orders::new_market_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        orderbook.process_order(order1);
        let res = orderbook.process_order(order2);

        if !match res[0] {
            Ok(Success::Accepted { id: 2, .. }) => true,
            _ => false,
        } || !match res[1] {
            Ok(Success::Filled {
                order_id: 2,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } || !match res[2] {
            Ok(Success::PartiallyFilled {
                order_id: 1,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }
    }

    #[test]
    fn market_order_two_orders_match() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order2 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            12.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order3 = orders::new_market_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            1.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        orderbook.process_order(order1);
        orderbook.process_order(order2);
        let res = orderbook.process_order(order3);

        if !match res[0] {
            Ok(Success::Accepted { id: 3, .. }) => true,
            _ => false,
        } || !match res[1] {
            Ok(Success::PartiallyFilled {
                order_id: 3,
                price,
                qty,
                ..
            }) if match_float(price, 12.0) && match_float(qty, 1.0) => true,
            _ => false,
        } || !match res[2] {
            Ok(Success::Filled {
                order_id: 2,
                price,
                qty,
                ..
            }) if match_float(price, 12.0) && match_float(qty, 1.0) => true,
            _ => false,
        } || !match res[3] {
            Ok(Success::Filled {
                order_id: 3,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } || !match res[4] {
            Ok(Success::PartiallyFilled {
                order_id: 1,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }
    }

    #[test]
    fn limit_order_on_empty_orderbook() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            2.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        // process order
        let res = orderbook.process_order(order1);

        if !match res[0] {
            Ok(Success::Accepted { id: 1, .. }) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }
    }

    #[test]
    fn limit_order_partial_match() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order2 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            9.0,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        orderbook.process_order(order1);
        let res = orderbook.process_order(order2);

        if !match res[0] {
            Ok(Success::Accepted { id: 2, .. }) => true,
            _ => false,
        } || !match res[1] {
            Ok(Success::Filled {
                order_id: 2,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } || !match res[2] {
            Ok(Success::PartiallyFilled {
                order_id: 1,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }
    }

    #[test]
    fn limit_order_exact_match() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order2 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            9.0,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        orderbook.process_order(order1);
        let res = orderbook.process_order(order2);

        if !match res[0] {
            Ok(Success::Accepted { id: 2, .. }) => true,
            _ => false,
        } || !match res[1] {
            Ok(Success::Filled {
                order_id: 2,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } || !match res[2] {
            Ok(Success::PartiallyFilled {
                order_id: 1,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res)
        }

        let order3 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            8.0,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let res2 = orderbook.process_order(order3);

        if !match res2[0] {
            Ok(Success::Accepted { id: 3, .. }) => true,
            _ => false,
        } || !match res2[1] {
            Ok(Success::Filled {
                order_id: 3,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } || !match res2[2] {
            Ok(Success::Filled {
                order_id: 1,
                price,
                qty,
                ..
            }) if match_float(price, 10.0) && match_float(qty, 0.5) => true,
            _ => false,
        } {
            panic!("unexpected event sequence: {:?}", res2)
        }

        assert_eq!(orderbook.current_spread(), None);
    }

    #[test]
    fn current_spread() {
        let mut orderbook = Orderbook::new(Asset::BTC, Asset::USD);
        let order_asset = parse_asset("BTC").unwrap();
        let price_asset = parse_asset("USD").unwrap();

        let order1 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            10.0,
            1.0,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        // not enough orders to calculate
        assert_eq!(orderbook.current_spread(), None);

        let order2 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            12.0,
            0.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        let order3 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Ask,
            12.5,
            2.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );

        orderbook.process_order(order1);
        orderbook.process_order(order2);
        orderbook.process_order(order3);

        assert_eq!(orderbook.current_spread(), Some((10.0, 12.0)));

        // wider spread
        let order4 = orders::new_limit_order_request(
            order_asset,
            price_asset,
            OrderSide::Bid,
            14.0,
            1.5,
            "test.example.testnet".to_string(),
            get_current_time(),
        );
        let res = orderbook.process_order(order4);
        println!("{:?}", res);

        assert_eq!(orderbook.current_spread(), Some((10.0, 12.5)));
    }
}
