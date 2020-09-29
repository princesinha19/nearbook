import React, { useState, useEffect } from "react";
import { login, logout } from '../utils';
import {
    Row,
    Button,
    Card,
    Col,
    Form,
    Table,
    CardDeck,
    Nav,
} from "react-bootstrap";
import BN from 'bn.js';
import getConfig from '../config'
import Loading from '../Utils/Loading';
import { Link } from 'react-router-dom';
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import rainbowGif from '../../assets/rainbow-black.gif';

const { networkId } = getConfig('development');
const urlPrefix = `https://explorer.${networkId}.near.org/accounts`;

export default function Orderbook() {
    const [askOrders, setAskOrders] = useState([]);
    const [bidOrders, setBidOrders] = useState([]);
    const [spread, setSpread] = useState([]);
    const [ndaiBalance, setNdaiBalance] = useState("");
    const [nbookBalance, setNbookBalance] = useState("");
    const [ndaiAllowance, setNdaiAllowance] = useState("");
    const [nbookAllowance, setNbookAllowance] = useState("");
    const [action, setAction] = useState("Buy");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [successModal, setSuccessModal] = useState({
        open: false
    });
    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });

    const [state, setState] = useState({
        price: "",
        quantity: "",
    });

    const submitOrder = async () => {
        try {
            if (window.walletConnection.isSignedIn()) {

                setProcessing(true);

                // await approveNearToken(state.quantity);

                await window.contract.new_limit_order({
                    price: parseFloat(state.price),
                    quantity: parseInt(state.quantity),
                    side: action === "Buy" ? "Bid" : "Ask",
                }, new BN('300000000000000'));

                setProcessing(false);
                setSuccessModal({ open: true });
                fetchOrdersAndBalance();
            }
        } catch (error) {
            setProcessing(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    };

    const fetchOrdersAndBalance = async () => {
        try {
            const ndaiBalance = await window.ndai.get_balance({
                owner_id: window.accountId
            });

            const nbookBalance = await window.nbook.get_balance({
                owner_id: window.accountId
            });

            const ndaiAllowance = await window.ndai.get_allowance({
                owner_id: window.accountId,
                escrow_account_id: window.contract.contractId,
            });

            const nbookAllowance = await window.nbook.get_allowance({
                owner_id: window.accountId,
                escrow_account_id: window.contract.contractId,
            });

            const spread = await window.contract.get_current_spread();
            const askOrders = await window.contract.get_ask_orders()
            const bidOrders = await window.contract.get_bid_orders();

            setSpread(spread);
            setAskOrders(askOrders);
            setBidOrders(bidOrders);
            setNdaiBalance(ndaiBalance);
            setNbookBalance(nbookBalance);
            setNdaiAllowance(ndaiAllowance);
            setNbookAllowance(nbookAllowance);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    };

    const approveNearToken = async () => {
        try {
            let contract, amount;
            if (action === "Buy") {
                contract = window.ndai;
                amount = Number(state.quantity) - ndaiAllowance;
            } else if (action === "Sell") {
                contract = window.nbook;
                amount = Number(state.quantity) - nbookAllowance;
            }

            await contract.inc_allowance
                ({
                    amount: amount.toString(),
                    escrow_account_id: window.contract.contractId,
                },
                    new BN('300000000000000'),
                    new BN('100000000000000000000').mul(new BN('350')),
                );
        } catch (error) {
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    };

    useEffect(() => {
        if (window.walletConnection.isSignedIn()) {
            fetchOrdersAndBalance();
        }
    }, []);

    if (!window.walletConnection.isSignedIn()) {
        return (
            <Card className="mx-auto welcome-card">
                <Card.Header style={{ fontSize: "1.7rem", textAlign: "center" }}>
                    Welcome to NearBook 📖
                </Card.Header>

                <Card.Body style={{ textAlign: "center", marginTop: "4%" }}>
                    <p>
                        To make use of the NEAR blockchain, you need to sign in.
                        The button below will sign you in using NEAR Wallet.
                    </p>
                    <p>
                        By default, when your app runs in "development" mode,
                        it connects to a test network ("testnet") wallet.
                        This works just like the main network ("mainnet") wallet,
                        but the NEAR Tokens on testnet aren't convertible to
                        other currencies – they're just for testing!
                        </p>
                    <p>
                        Go ahead and click the button below to try it out:
                        </p>
                    <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
                        <Button variant="info" onClick={login}>Sign in</Button>
                    </p>
                </Card.Body>
            </Card>
        )
    }

    if (loading) return <Loading />;

    return (
        <div>
            <Button
                variant="warning"
                className="float-right"
                onClick={logout}
                style={{ marginRight: "2%", marginTop: "5px" }}
            >
                Sign out
            </Button>

            <Link
                className="float-right"
                style={{ marginRight: "2%", cursor: "pointer" }}
                to={`/rainbow-bridge`}
            >
                <img style={{ width: '6em' }} src={rainbowGif} />
            </Link>

            <CardDeck className="top-card">
                <Card style={{ marginLeft: "33%" }}>
                    <Card.Header>nDAI Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {ndaiBalance}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>nBook Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {nbookBalance}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>Current Buy Price</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {spread[0]}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>Current Sell Price</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {spread[1]}
                    </Card.Body>
                </Card>
            </CardDeck>

            <Card className="mx-auto form-card">
                <Card.Header style={{
                    fontWeight: "bold",
                    fontSize: "large"
                }}>
                    <u>Place your order</u>
                </Card.Header>

                <Card.Body>
                    <Nav
                        className="navbar"
                        fill variant="pills"
                        defaultActiveKey="Buy"
                        onSelect={(e) => setAction(e)}
                    >
                        <Nav.Item style={{ color: "green !important" }}>
                            <Nav.Link eventKey="Buy">Buy</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="Sell">Sell</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Row>
                        <Col style={{ marginTop: "7px", fontWeight: "bold" }}>
                            Quantity:
                        </Col>
                        <Col style={{ paddingLeft: "0px" }}>
                            <Form.Control
                                className="mb-4"
                                type="number"
                                step="0"
                                placeholder="No decimal places"
                                onChange={(e) => setState({
                                    ...state,
                                    quantity: e.target.value
                                })}
                                style={{ width: "80%" }}
                                value={state.quantity}
                                required
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col style={{ marginTop: "6px", fontWeight: "bold" }}>
                            Price:
                        </Col>
                        <Col style={{ paddingLeft: "0px" }}>
                            <Form.Control
                                className="mb-4"
                                type="number"
                                step=".01"
                                placeholder="Only 2 decimal places"
                                onChange={(e) => setState({
                                    ...state,
                                    price: e.target.value
                                })}
                                style={{ width: "80%" }}
                                value={state.price}
                                required
                            />
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Footer className="text-center">
                    {(action === "Buy" && ndaiAllowance >= Number(state.quantity)) ||
                        (action === "Sell" && nbookAllowance >= Number(state.quantity)) ?
                        <Button
                            onClick={submitOrder}
                            variant="outline-success"
                        >
                            {processing ?
                                <div className="d-flex align-items-center">
                                    Processing
                                <span className="loading ml-2"></span>
                                </div>
                                :
                                <div>Place Order</div>
                            }
                        </Button>
                        :
                        <Button
                            onClick={approveNearToken}
                            variant="outline-success"
                        >
                            {processing ?
                                <div className="d-flex align-items-center">
                                    Processing
                                <span className="loading ml-2"></span>
                                </div>
                                :
                                <div>
                                    <span>Approve </span>
                                    {action === "Buy" ?
                                        <span>
                                            {Number(state.quantity) - ndaiAllowance} nDAI
                                        </span>
                                        :
                                        <span>
                                            {Number(state.quantity) - nbookAllowance} nBook
                                        </span>
                                    }
                                </div>
                            }
                        </Button>
                    }

                </Card.Footer>
            </Card>

            <Row className="justify-content-md-center"
                style={{
                    marginTop: "4%",
                    marginLeft: "0px",
                    marginRight: "0px"
                }}
            >
                <Col xs lg="4">
                    <p className="order-header">
                        <u>Buy Orders</u>
                    </p>

                    <Table striped bordered hover style={{
                        textAlign: "center"
                    }}>
                        <thead>
                            <tr>
                                <th>Price</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bidOrders.map((element, k) => (
                                <tr key={k}>
                                    <td>{Number(element.price)}</td>

                                    <td>{element.quantity} nBook</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>

                <Col xs lg="4">
                    <p className="order-header">
                        <u>Sell Orders</u>
                    </p>

                    <Table striped bordered hover style={{
                        textAlign: "center"
                    }}>
                        <thead>
                            <tr>
                                <th>Price</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {askOrders.map((element, k) => (
                                <tr key={k}>
                                    <td>{Number(element.price)}</td>

                                    <td>{element.quantity} nBook</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>

            </Row>

            <SuccessModal
                open={successModal.open}
                toggle={() => setSuccessModal({
                    ...successModal, open: false
                })}
            >
                {
                    <aside>
                        Succesfully Created Order ✔
                        <footer>
                            <div>Just now</div>
                            <a
                                target="_blank"
                                rel="noreferrer"
                                href={`${urlPrefix}/${window.contract.contractId}`}
                            >
                                Contract: {window.contract.contractId}
                            </a>
                        </footer>
                    </aside>
                }
            </SuccessModal>

            <AlertModal
                open={errorModal.open}
                toggle={() => setErrorModal({ ...errorModal, open: false })}
            >
                {errorModal.msg}
            </AlertModal>
        </div>
    )
}
