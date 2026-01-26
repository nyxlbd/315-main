import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Messaging from '../components/Messaging';
import { getCurrentUser } from '../auth';
import './ClientMessages.css';


function ClientMessages() {
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null); // { sellerId, sellerName }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, messagesRes] = await Promise.all([
          API.get('/orders/my'),
          API.get('/messages/inbox'),
        ]);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      } catch {
        setOrders([]);
        setMessages([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Group sellers from orders and messages
  const sellers = [];
  const sellerMap = {};
  // From orders
  for (const order of (Array.isArray(orders) ? orders : [])) {
    if (order.seller && order.seller._id && !sellerMap[order.seller._id]) {
      sellers.push({ sellerId: order.seller._id, sellerName: order.seller.name || 'Unknown Seller' });
      sellerMap[order.seller._id] = true;
    }
  }
  // From messages
  for (const msg of (Array.isArray(messages) ? messages : [])) {
    if (msg.sender && msg.sender._id && msg.sender.role === 'seller' && !sellerMap[msg.sender._id]) {
      sellers.push({ sellerId: msg.sender._id, sellerName: msg.sender.name || 'Unknown Seller' });
      sellerMap[msg.sender._id] = true;
    }
    if (msg.receiver && msg.receiver._id && msg.receiver.role === 'seller' && !sellerMap[msg.receiver._id]) {
      sellers.push({ sellerId: msg.receiver._id, sellerName: msg.receiver.name || 'Unknown Seller' });
      sellerMap[msg.receiver._id] = true;
    }
  }

  return (
    <div className="client-messages-container container">
      <h2>Messages with Sellers</h2>
      <div className="client-messages-flex">
        <div className="client-messages-sidebar">
          <h4>Your Sellers</h4>
          {loading ? <div>Loading...</div> : (
            <ul className="client-messages-list">
              {sellers.map(seller => (
                <li key={seller.sellerId} style={{ marginBottom: 10 }}>
                  <button
                    className={
                      'client-messages-seller-btn' +
                      (selectedSeller && selectedSeller.sellerId === seller.sellerId ? ' selected' : '')
                    }
                    onClick={() => setSelectedSeller(seller)}
                  >
                    {seller.sellerName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="client-messages-main">
          {selectedSeller ? (
            <Messaging receiverId={selectedSeller.sellerId} orderId={null} receiverName={selectedSeller.sellerName} />
          ) : (
            <div>Select a seller to message.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientMessages;
