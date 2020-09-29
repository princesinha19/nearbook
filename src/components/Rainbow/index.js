import React, { useState, useEffect } from "react";
import { checkStatuses, initiate, get, humanStatusFor, retry, clear, track } from './transfers'
import { Card, CardDeck, Form, Button } from "react-bootstrap";
import accountLogo from '../../assets/account.svg';
import ethLogo from '../../assets/eth-diamond-purple.png';
import nearLogo from '../../assets/near-icon-black.svg';
import rainbowGif from '../../assets/rainbow-black.gif';
import bellBlackLogo from '../../assets/bell-black.svg';
import { logout, initWeb3 } from '../utils';
import Loading from '../Utils/Loading';
import { Link } from 'react-router-dom';
import AlertModal from "../Utils/AlertModal";
import * as localStorage from './localStorage'
import './rainbow.css';

export default function Rainbow() {
    const STORAGE_KEY = 'WEB3_CONNECT_CACHED_PROVIDER';
    const [erc20Balance, setErc20Balance] = useState("");
    const [nep21Balance, setNep21Balance] = useState("");
    const [quantity, setQuantity] = useState("");
    const [inProgressTxs, setInProgressTxs] = useState([]);
    const [completeTxs, setCompleteTxs] = useState([]);
    const [showTxs, setShowTxs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [alreadyClaimed, setAlreadyClaimed] = useState(false);
    const ethUrlPrefix = `https://rinkeby.etherscan.io/address`;
    const nearUrlPrefix = `https://explorer.testnet.near.org/accounts`

    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });

    const formatLargeNum = n => n >= 1e5 || (n < 1e-3 && n !== 0)
        ? n.toExponential(2)
        : new Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(n)

    const getBalanceAndTransfers = async () => {
        try {
            const erc20Balance = Number(
                await window.erc20.methods.balanceOf(window.ethUserAddress).call()
            );

            const nep21Balance = Number(
                await window.nep21.get_balance({ owner_id: window.nearUserAddress })
            );

            const { inProgress, complete } = get()
            setInProgressTxs(inProgress);
            setCompleteTxs(complete);

            setErc20Balance(formatLargeNum(erc20Balance));
            setNep21Balance(formatLargeNum(nep21Balance));

            if (erc20Balance === 0) {
                setAlreadyClaimed(
                    await window.freeTokenVault.methods.alreadyClaimed(
                        window.ethUserAddress
                    ).call()
                );
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    };

    const handleSwap = () => {
        try {
            if (quantity > 0) {
                initiate(quantity, getBalanceAndTransfers);
            }
        } catch (error) {
            setLoading(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const handleGetFreeTokens = () => {
        window.freeTokenVault.methods
            .claimTestTokens()
            .send()
            .on('transactionHash', () => {
                setProcessing(true);
            })
            .on('receipt', (_) => {
                setProcessing(false);
                getBalanceAndTransfers();
            })
            .catch((error) => {
                setProcessing(false);
                setErrorModal({
                    open: true,
                    msg: error.message,
                });
            });
    }

    useEffect(() => {
        if (localStorage.get(STORAGE_KEY) === "connected") {
            initWeb3(getBalanceAndTransfers);
        }

        window.setTimeout(() => {
            checkStatuses(getBalanceAndTransfers);
        }, 4000);
    }, []);

    if (
        (localStorage.get(STORAGE_KEY) === "injected" ||
            !localStorage.get(STORAGE_KEY)
        ) &&
        (!window.ethInitialized || !window.nearInitialized)
    ) {
        return (
            <Card className="mx-auto welcome-card">
                <Card.Header style={{ fontSize: "1.7rem", textAlign: "center" }}>
                    Welcome to Rainbow Bridge!
                </Card.Header>

                <Card.Body style={{ textAlign: "center", marginTop: "20px" }}>
                    <p>
                        To make use of the Rainbow bridge, you need to connect Metamsk.
                    </p>
                    <p>
                        Make sure the selected network is <strong>Rinkeby</strong>
                        for using Rainbow bridge. Note: For using Orderbook you
                        don't need the Metamsk to be initialized.
                    </p>
                    <p>
                        Go ahead and click the button below to Initialize Matamsk
                        and Connect account:
                    </p>
                    <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
                        <Button
                            variant="info"
                            onClick={() => initWeb3(getBalanceAndTransfers)}
                        >
                            Connect Metamask
                        </Button>
                    </p>
                </Card.Body>
            </Card>
        )
    }

    if (loading) return <Loading />;

    return (
        <div>
            <CardDeck></CardDeck>

            <Link
                className="float-left"
                to={`/`}
                style={{
                    marginLeft: "2%",
                    marginTop: "2%",
                    cursor: "pointer",
                }}
            >
                <img style={{ height: "2em" }} src={nearLogo} />
            </Link>

            <Button
                variant="warning"
                style={{ marginRight: "2%", marginTop: "2%" }}
                className="float-right"
                onClick={logout}

            >
                Sign out
            </Button>

            <nav className="float-right" style={{ display: 'flex', alignItems: 'stretch', marginRight: "3%", marginTop: "2.1%" }}>
                <div className="dropdown" aria-live="polite">
                    <button style={{ outline: "none" }} onClick={() => setShowTxs(!showTxs)}>
                        {inProgressTxs.length === 0 && completeTxs.length === 0 ?
                            <div>
                                <picture>
                                    <img style={{ width: '2em', verticalAlign: 'middle' }} alt="no transfers" src={bellBlackLogo} />
                                </picture>
                            </div>
                            : (inProgressTxs.length > 0 ?
                                <div>
                                    <picture>
                                        <img style={{ width: '6em', verticalAlign: 'middle' }} alt="view transfers" src={rainbowGif} />
                                    </picture>
                                </div>
                                : (completeTxs.length > 0 ?
                                    <div>
                                        <picture>
                                            <img style={{ width: '2em', verticalAlign: 'middle' }} alt="no transfers" src={bellBlackLogo} />
                                        </picture>
                                        <div className="notification-indicator">
                                            <span>{completeTxs.length}</span>
                                            <span className="visually-hidden">notifications</span>
                                        </div>
                                    </div>
                                    : null
                                )
                            )
                        }
                    </button>
                </div>

                {showTxs ?
                    <div>
                        {inProgressTxs.length === 0 && completeTxs.length === 0 ?
                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '3em', justifyContent: 'space-around', textAlign: 'center', width: '10em' }}>
                                    No transfers
                                    </div>
                            </div>
                            : null
                        }

                        <div>
                            {completeTxs.map((transfer, k) => (
                                <div key={k} className="transfer">
                                    <header>
                                        <span>{transfer.outcome === 'success' ? '🌈' : '😞'}</span>
                                        <span>{transfer.amount}</span>
                                        <span>{window.ethErc20Name}</span>
                                        <span className="arrow ${transfer.outcome} ${transfer.status !== 'complete' && 'animate '}">→</span>
                                        <span>{'n' + window.ethErc20Name}</span>
                                    </header>
                                    <div>
                                        <p>{humanStatusFor(transfer)}</p>
                                    </div>
                                    <footer>
                                        {transfer.outcome === 'success' ?
                                            <button onClick={() => {
                                                clear(transfer.id);
                                                getBalanceAndTransfers();
                                            }}>
                                                <span className="visually-hidden">clear</span>
                                                <span aria-hidden="true">⨉</span>
                                            </button>
                                            :
                                            <button onClick={() => retry(transfer.id, getBalanceAndTransfers)}>
                                                <span className="visually-hidden">retry</span>
                                                <span aria-hidden="true" title="retry">↻</span>
                                            </button>
                                        }
                                    </footer>
                                </div>
                            ))}

                            {inProgressTxs.map((transfer, key) => (
                                <div key={key} className="transfer">
                                    <header>
                                        <span className="loader">in progress:</span>
                                        <span>{transfer.amount}</span>
                                        <span>{window.ethErc20Name}</span>
                                        <span className="arrow animate">→</span>
                                        <span>{'n' + window.ethErc20Name}</span>
                                    </header>
                                    <div>
                                        <p>{humanStatusFor(transfer)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    : null
                }
            </nav>

            <CardDeck style={{ marginLeft: "10%", marginRight: "10%", marginTop: "17%" }}>
                <Card>
                    <Card.Header>
                        <img style={{ height: "1.5em" }} src={ethLogo} /> Ethereum
                    </Card.Header>

                    <Card.Body style={{ paddingTop: "10%", paddingBottom: "10%" }}>
                        <div style={{ fontSize: "20px" }}>
                            <a className="link" target="_blank" rel="noreferrer" href={`${ethUrlPrefix}/${window.ethErc20Address}`}>
                                {window.ethErc20Name} Balance
                            </a>
                        </div>
                        <strong className="jumbo">{erc20Balance ? erc20Balance : 0}</strong>
                    </Card.Body>

                    <Card.Footer>
                        <img style={{ height: "1.3em" }} alt="account" src={accountLogo} />
                        <span> </span>
                        <a className="link clip" target="_blank" rel="noreferrer" href={`${ethUrlPrefix}/${window.ethUserAddress}`}>
                            {window.ethUserAddress}
                        </a>
                    </Card.Footer>
                </Card>

                {erc20Balance > 0 ?
                    <>
                        <Card style={{ background: "transparent", border: "none" }}>
                            <Card.Body style={{ marginTop: "25%", marginLeft: "7%", display: 'flex' }}>
                                <Form.Control
                                    className="mb-4"
                                    type="number"
                                    step="0"
                                    placeholder="Quantity"
                                    onChange={(e) => setQuantity(e.target.value)}
                                    value={quantity}
                                    style={{ width: "70%", height: "40px" }}
                                />
                                <Button variant="secondary" style={{ height: "40px" }} onClick={handleSwap}>
                                    <span>Send</span>
                                </Button>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Header>
                                <img style={{ height: "1.5em" }} src={nearLogo} /> NEAR
                            </Card.Header>

                            <Card.Body style={{ paddingTop: "10%", paddingBottom: "10%" }}>
                                <div style={{ fontSize: "20px" }}>
                                    <a className="link" target="_blank" rel="noreferrer" href={`${nearUrlPrefix}/ndai.hacker.testnet`}>
                                        {'n' + window.ethErc20Name} Balance
                                    </a>
                                </div>
                                <strong className="jumbo">{nep21Balance}</strong>
                            </Card.Body>

                            <Card.Footer>
                                <img style={{ height: "1.3em" }} alt="account" src={accountLogo} />
                                <span> </span>
                                <a className="link clip" target="_blank" rel="noreferrer" href={`${nearUrlPrefix}/${window.nearUserAddress}`}>
                                    {window.nearUserAddress}
                                </a>
                            </Card.Footer>
                        </Card>
                    </>
                    :
                    <Card>
                        <Card.Header>
                            <img style={{ height: "1em" }} src={nearLogo} /> NEAR
                        </Card.Header>

                        <Card.Body style={{ marginTop: "7%" }}>
                            <p>
                                Uh oh! You have no <span>{window.ethErc20Name} </span>
                                tokens. If you want to send some to yourself on NEAR, you'll need to
                                get some on Ethereum first 😄
                            </p>

                            {!alreadyClaimed ?
                                <div>
                                    <p>
                                        You can get 100 Free ETH <strong>{window.ethErc20Name} </strong>
                                        (one time) by clicking below button:
                                        <br />
                                    </p>

                                    <Button
                                        style={{ marginTop: '10px' }}
                                        variant="success"
                                        onClick={handleGetFreeTokens}
                                    >
                                        {processing ?
                                            <div className="d-flex align-items-center">
                                                Processing
                                                <span className="loading ml-2"></span>
                                            </div>
                                            :
                                            <div>
                                                GET 100 {window.ethErc20Name}
                                            </div>
                                        }
                                    </Button>
                                </div>
                                :
                                <div style={{ marginTop: "30px" }}>
                                    <p style={{ color: "gray" }}>
                                        You have already claimed your 100 {window.ethErc20Name}.
                                    </p>
                                    <p style={{ marginTop: "30px", fontWeight: "bold" }}>
                                        Maybe you need to use a different account?
                                    </p>
                                </div>
                            }
                        </Card.Body>
                    </Card>
                }
            </CardDeck>

            <AlertModal
                open={errorModal.open}
                toggle={() => setErrorModal({ ...errorModal, open: false })}
            >
                {errorModal.msg}
            </AlertModal>
        </div >
    );
}
