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
import getConfig from '../config'
import Loading from '../Utils/Loading';
import history from '../Utils/History';
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import rainbowGif from '../../assets/rainbow-black.gif';

const { networkId } = getConfig(process.env.NODE_ENV || 'development')
const urlPrefix = `https://explorer.${networkId}.near.org/accounts`

export default function Orderbook() {
    // use React Hooks to store greeting in component state
    const [askOrders, setAskOrders] = useState([]);
    const [bidOrders, setBidOrders] = useState([]);
    const [spread, setSpread] = useState([]);
    const [ndaiBalance, setNdaiBalance] = useState("");
    const [ftBalance, setFtBalance] = useState("");
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
                    setErrorModal({
                        open: true,
                        msg: error.message,
                    });
                });
        }
    };

    const fetchOrdersAndBalance = async () => {
        try {
            const ftBalance = await window.ft.get_balance({
                owner_id: window.accountId
            });

            const ndaiBalance = await window.ndai.get_balance({
                owner_id: window.accountId
            });

            const spread = await window.contract.get_current_spread();
            const askOrders = await window.contract.get_ask_orders()
            const bidOrders = await window.contract.get_bid_orders();

            setSpread(spread);
            setAskOrders(askOrders);
            setBidOrders(bidOrders);
            setFtBalance(ftBalance);
            setNdaiBalance(ndaiBalance);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const redirectToRainbowBridge = () => {
        history.push('/rainbow-bridge');
    }

    useEffect(() => {
        if (window.walletConnection.isSignedIn()) {
            fetchOrdersAndBalance();
        }
    }, []);

    if (!window.walletConnection.isSignedIn()) {
        return (
            <Card className="mx-auto welcome-card">
                <Card.Header style={{ fontSize: "1.7rem", textAlign: "center" }}>
                    Welcome to NEAR Orderbook
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

            <div
                className="float-right"
                onClick={redirectToRainbowBridge}
                style={{ marginRight: "2%", cursor: "pointer" }}
            >
                <img style={{ width: '6em' }} src={rainbowGif} />
            </div>

            <CardDeck className="top-card">
                <Card style={{ marginLeft: "33%" }}>
                    <Card.Header>nDAI Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {ndaiBalance}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>nFT Balance</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {ftBalance}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>Ask Spread</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {spread[0]}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>Bid Spread</Card.Header>
                    <Card.Body style={{ fontSize: "25px" }}>
                        {spread[1]}
                    </Card.Body>
                </Card>
            </CardDeck>

            <Card className="mx-auto form-card">
                <Card.Header style={{
                    fontSize: "1.7rem",
                    textAlign: "center"
                }}>
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

            <Row className="justify-content-md-center"
                style={{
                    marginTop: "4%",
                    marginLeft: "0px",
                    marginRight: "0px"
                }}
            >
                <Col xs lg="4">
                    <p className="order-header">
                        <u>Ask Orders</u>
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

                                    <td>{element.quantity} nFT</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>

                <Col xs lg="4">
                    <p className="order-header">
                        <u>Bid Orders</u>
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

                                    <td>{element.quantity} nDAI</td>
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
