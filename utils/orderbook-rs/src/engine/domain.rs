use std::fmt::Debug;

extern crate near_sdk;
use self::near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use self::near_sdk::serde::Serialize;

#[derive( Debug, Copy, Clone, BorshDeserialize, BorshSerialize, Serialize)]
pub enum OrderSide {
    Bid,
    Ask,
}

impl Default for OrderSide {
    fn default() -> Self { OrderSide:: Bid}
}

#[derive(Default, Debug, Clone, BorshDeserialize, BorshSerialize)]
pub struct Asset;

#[derive(Default, Debug, Clone, BorshDeserialize, BorshSerialize)]
pub struct Order<Asset>
{
    pub order_id: u64,
    pub order_asset: Asset,
    pub price_asset: Asset,
    pub side: OrderSide,
    pub price: f64,
    pub qty: f64,
}

#[derive(Eq, PartialEq, Debug, Copy, Clone, Serialize)]
pub enum OrderType {
    Market,
    Limit,
}
