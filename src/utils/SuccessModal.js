import React from "react";
import {
    Button,
    Modal,
} from "react-bootstrap";

export default function SuccessModal({
    open,
    toggle,
    children,
}) {
    return (
        <Modal
            show={open}
            onHide={toggle}
        >
            <Modal.Header closeButton>
                <Modal.Title>Notification</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ textAlign: "center" }}>{children}</Modal.Body>
            <Modal.Footer className="justify-content-around">
                <Button variant="success"
                    onClick={toggle}
                >
                    Ok
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
