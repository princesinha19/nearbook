use std::fmt::Debug;

use super::orders::OrderRequest;

extern crate near_sdk;
use self::near_sdk::borsh::{BorshDeserialize, BorshSerialize};

/// Validation errors
const ERR_BAD_ORDER_ASSET: &str = "bad order asset";
const ERR_BAD_PRICE_ASSET: &str = "bad price asset";
const ERR_BAD_PRICE_VALUE: &str = "price must be non-negative";
const ERR_BAD_QUANTITY_VALUE: &str = "quantity must be non-negative";
const ERR_BAD_SEQ_ID: &str = "order ID out of range";
const ERR_BAD_ORDER_CREATOR: &str = "order_creator cam't be empty";

/* Validators */

#[derive(Default, BorshDeserialize, BorshSerialize, Clone)]
pub struct OrderRequestValidator<Asset> {
    orderbook_order_asset: Asset,
    orderbook_price_asset: Asset,
    min_sequence_id: u64,
    max_sequence_id: u64,
}

impl<Asset> OrderRequestValidator<Asset>
where
    Asset: Debug + Clone + Copy + Eq,
{
    pub fn new(
        orderbook_order_asset: Asset,
        orderbook_price_asset: Asset,
        min_sequence_id: u64,
        max_sequence_id: u64,
    ) -> Self {
        OrderRequestValidator {
            orderbook_order_asset,
            orderbook_price_asset,
            min_sequence_id,
            max_sequence_id,
        }
    }

    pub fn validate(&self, request: &OrderRequest<Asset>) -> Result<(), &str> {
        match &*request {
            OrderRequest::NewMarketOrder {
                order_asset,
                price_asset,
                side: _side,
                qty,
                order_creator,
                ts: _ts,
            } => self.validate_market(*order_asset, *price_asset, *qty, order_creator.clone()),

            OrderRequest::NewLimitOrder {
                order_asset,
                price_asset,
                side: _side,
                price,
                qty,
                order_creator,
                ts: _ts,
            } => self.validate_limit(*order_asset, *price_asset, *price, *qty, order_creator.clone()),

            OrderRequest::AmendOrder {
                id,
                price,
                side: _side,
                qty,
                ts: _ts,
            } => self.validate_amend(*id, *price, *qty),

            OrderRequest::CancelOrder { id, side: _side } => self.validate_cancel(*id),
        }
    }

    /* Internal validators */

    fn validate_market(
        &self,
        order_asset: Asset,
        price_asset: Asset,
        qty: u128,
        order_creator: String,
    ) -> Result<(), &str> {
        if self.orderbook_order_asset != order_asset {
            return Err(ERR_BAD_ORDER_ASSET);
        }

        if self.orderbook_price_asset != price_asset {
            return Err(ERR_BAD_PRICE_ASSET);
        }

        if qty <= 0 {
            return Err(ERR_BAD_QUANTITY_VALUE);
        }

        if order_creator == "" {
            return Err(ERR_BAD_ORDER_CREATOR);
        }

        Ok(())
    }

    fn validate_limit(
        &self,
        order_asset: Asset,
        price_asset: Asset,
        price: f64,
        qty: u128,
        order_creator: String,
    ) -> Result<(), &str> {
        if self.orderbook_order_asset != order_asset {
            return Err(ERR_BAD_ORDER_ASSET);
        }

        if self.orderbook_price_asset != price_asset {
            return Err(ERR_BAD_PRICE_ASSET);
        }

        if price <= 0.0 {
            return Err(ERR_BAD_PRICE_VALUE);
        }

        if qty <= 0 {
            return Err(ERR_BAD_QUANTITY_VALUE);
        }

        if order_creator == "" {
            return Err(ERR_BAD_ORDER_CREATOR);
        }

        Ok(())
    }

    fn validate_amend(&self, id: u64, price: f64, qty: u128) -> Result<(), &str> {
        if self.min_sequence_id > id || self.max_sequence_id < id {
            return Err(ERR_BAD_SEQ_ID);
        }

        if price <= 0.0 {
            return Err(ERR_BAD_PRICE_VALUE);
        }

        if qty <= 0{
            return Err(ERR_BAD_QUANTITY_VALUE);
        }

        Ok(())
    }

    fn validate_cancel(&self, id: u64) -> Result<(), &str> {
        if self.min_sequence_id > id || self.max_sequence_id < id {
            return Err(ERR_BAD_SEQ_ID);
        }

        Ok(())
    }
}
