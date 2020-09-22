import React, { useState, useEffect } from "react";
import { login, logout } from '../utils';
import {
    Row,
    Button,
    Card,
    Col,
    Form,
    Table,
    CardDeck
} from "react-bootstrap";
import SuccessModal from "../Utils/SuccessModal";

import getConfig from '../config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')
const urlPrefix = `https://explorer.${networkId}.near.org/accounts`

export default function Orderbook() {
    // use React Hooks to store greeting in component state
    const [askOrders, setAskOrders] = useState([]);
    const [bidOrders, setBidOrders] = useState([]);
    const [ndaiBalance, setNdaiBalance] = useState("");
    const [ftBalance, setFtBalance] = useState("");
    const [processing, setProcessing] = useState(false);
    const [successModal, setSuccessModal] = useState({ open: false });

    const [state, setState] = useState({
        price: "1.10",
        quantity: "1",
    });

    const [side, setSide] = useState({
        Ask: true,
        Bid: false,
    });

    const submitOrder = async () => {
        if (window.walletConnection.isSignedIn()) {

            let orderSide = "";
            if (side.Ask) {
                orderSide = "Ask";
            } else if (side.Bid) {
                orderSide = "Bid";
            }

            setProcessing(true);

            await window.contract.new_limit_order
                ({
                    price: parseFloat(state.price),
                    quantity: parseInt(state.quantity),
                    side: orderSide,
                }, 300000000000000)
                .then(() => {
                    setProcessing(false);
                    setSuccessModal({ open: true });
                    fetchOrdersAndBalance();
                })
                .catch((error) => {
                    setProcessing(false);
                    console.log(error);
                });
        }
    };

    const fetchOrdersAndBalance = () => {
        window.contract.get_ask_orders()
            .then((askOrders) => {
                setAskOrders(askOrders);
            })
            .catch((error) => {
                console.log(error);
            })

        window.contract.get_bid_orders()
            .then((bidOrders) => {
                setBidOrders(bidOrders);
            })
            .catch((error) => {
                console.log(error);
            })

        window.ndai.get_balance({ owner_id: window.accountId })
            .then((balance) => {
                setNdaiBalance(balance);
            });

        window.ft.get_balance({ owner_id: window.accountId })
            .then((balance) => {
                setFtBalance(balance);
            });
    }

    useEffect(() => {
        // in this case, we only care to query the contract when signed in
        if (window.walletConnection.isSignedIn()) {
            fetchOrdersAndBalance();
        }
    }, []);

    // if not signed in, return early with sign-in prompt
    if (!window.walletConnection.isSignedIn()) {
        return (
            <Card className="mx-auto welcome-card ">
                <Card.Header style={{ fontSize: "1.7rem", textAlign: "center" }}>
                    Welcome to NEAR Orderbook!
                </Card.Header>

                <Card.Body style={{ textAlign: "center" }}>
                    <p>
                        To make use of the NEAR blockchain, you need to sign in. The button
                        below will sign you in using NEAR Wallet.
                    </p>
                    <p>
                        By default, when your app runs in "development" mode, it connects
                        to a test network ("testnet") wallet. This works just like the main
                        network ("mainnet") wallet, but the NEAR Tokens on testnet aren't
                        convertible to other currencies – they're just for testing!
                    </p>
                    <p>
                        Go ahead and click the button below to try it out:
                    </p>
                    <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
                        <button onClick={login}>Sign in</button>
                    </p>
                </Card.Body>
            </Card>
        )
    }

    return (
        <div>
            <Button variant="warning" style={{ marginRight: "2%" }} className="float-right" onClick={logout}>
                Sign out
            </Button>

            <CardDeck className="mx-auto top-card ">
                <Card style={{ marginLeft: "27%" }}>
                    <Card.Header>nDAI Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>{ndaiBalance}</Card.Body>
                </Card>
                <Card>
                    <Card.Header>nFT Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>{ftBalance}</Card.Body>
                </Card>
            </CardDeck>

            <Card className="mx-auto form-card ">
                <Card.Header style={{ fontSize: "1.7rem", textAlign: "center" }}>
                    NEAR ORDER BOOK
                </Card.Header>

                <Card.Body style={{ textAlign: "left" }}>
                    <p
                        style={{ textAlign: "center", fontWeight: "bold" }}
                    >
                        <u>Place your order</u>
                    </p>

                    <Row>
                        <Col>
                            <div key={`inline-radio`} className="mb-3">
                                <span><strong>Side: </strong></span>
                                <Form.Check
                                    inline
                                    label="Ask"
                                    type="radio"
                                    id={`inline-radio-1`}
                                    checked={side.Ask}
                                    onChange={() => {
                                        setSide({
                                            ...side,
                                            Ask: true,
                                            Bid: false,
                                        });
                                    }}
                                />

                                <Form.Check
                                    inline
                                    label="Bid"
                                    type="radio"
                                    id={`inline-radio-2`}
                                    checked={side.Bid}
                                    onChange={() => {
                                        setSide({
                                            ...side,
                                            Ask: false,
                                            Bid: true,
                                        });
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Form.Control
                                className="mb-4"
                                type="number"
                                step="0"
                                placeholder="Quantity"
                                onChange={(e) => setState({
                                    ...state,
                                    quantity: e.target.value
                                })}
                                value={state.quantity}
                                required
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Form.Control
                                className="mb-4"
                                type="number"
                                step=".01"
                                placeholder="Price"
                                onChange={(e) => setState({
                                    ...state,
                                    price: e.target.value
                                })}
                                value={state.price}
                                required
                            />
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Footer className="text-center">
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
                </Card.Footer>
            </Card>

            <Row className="justify-content-md-center" style={{ marginTop: "4%" }}>
                <Col xs lg="4">
                    <p style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                    }}>
                        <u>Ask Orders</u>
                    </p>

                    <Table striped bordered hover style={{ textAlign: "center" }}>
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

                                    <td>{element.quantity} nFT</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>

                <Col xs lg="4">
                    <p style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                    }}>
                        <u>Bid Orders</u>
                    </p>

                    <Table striped bordered hover style={{ textAlign: "center" }}>
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

                                    <td>{element.quantity} nDAI</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>

            <SuccessModal
                open={successModal.open}
                toggle={() => setSuccessModal({ ...successModal, open: false })}
            >
                {
                    <aside>
                        Succesfully Created Order ✔
                        <footer>
                            <div>Just now</div>
                            <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
                                Contract: {window.contract.contractId}
                            </a>
                        </footer>
                    </aside>
                }
            </SuccessModal>
        </div>
    )
}
