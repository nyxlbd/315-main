import React, { useState, useEffect, useMemo } from 'react';
import API from '../api';
import Messaging from '../components/Messaging';
import { getCurrentUser } from '../auth';
import './SellerMessages.css';

function SellerMessages() {
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null); // { clientId, clientName }
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;
    const fetchData = async (isInitial = false) => {
      try {
        const [ordersRes, messagesRes] = await Promise.all([
          API.get('/orders/seller/all'),
          API.get('/messages/inbox'),
        ]);
        if (isMounted) {
          // Only update state if data actually changed to avoid unnecessary re-renders
          const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
          const messagesData = Array.isArray(messagesRes.data) ? messagesRes.data : [];
          setOrders(prev => JSON.stringify(prev) !== JSON.stringify(ordersData) ? ordersData : prev);
          setMessages(prev => JSON.stringify(prev) !== JSON.stringify(messagesData) ? messagesData : prev);
        }
      } catch {
        if (isMounted) {
          setOrders([]);
          setMessages([]);
        }
      }
      if (isMounted && isInitial) setLoading(false);
    };
    setLoading(true);
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Memoize clients list to prevent flicker
  const clients = useMemo(() => {
    const list = [];
    const clientMap = {};
    // From orders
    for (const order of (Array.isArray(orders) ? orders : [])) {
      if (order.client && order.client._id && !clientMap[order.client._id]) {
        list.push({ clientId: order.client._id, clientName: order.client.name || 'Unknown Client' });
        clientMap[order.client._id] = true;
      }
    }
    // From messages
    for (const msg of (Array.isArray(messages) ? messages : [])) {
      if (msg.sender && msg.sender._id && msg.sender.role === 'client' && !clientMap[msg.sender._id]) {
        list.push({ clientId: msg.sender._id, clientName: msg.sender.name || 'Unknown Client' });
        clientMap[msg.sender._id] = true;
      }
      if (msg.receiver && msg.receiver._id && msg.receiver.role === 'client' && !clientMap[msg.receiver._id]) {
        list.push({ clientId: msg.receiver._id, clientName: msg.receiver.name || 'Unknown Client' });
        clientMap[msg.receiver._id] = true;
      }
    }
    return list;
  }, [orders, messages]);

  return (
    <div className="seller-messages-container container">
      <h2>Messages from Clients</h2>
      <div className="seller-messages-flex">
        <div className="seller-messages-sidebar">
          <h4>Your Clients</h4>
          {loading && clients.length === 0 ? <div>Loading...</div> : (
            <ul className="seller-messages-list">
              {clients.map(client => (
                <li key={client.clientId} style={{ marginBottom: 10 }}>
                  <button
                    className={
                      'seller-messages-client-btn' +
                      (selectedClient && selectedClient.clientId === client.clientId ? ' selected' : '')
                    }
                    onClick={() => setSelectedClient(client)}
                  >
                    {client.clientName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="seller-messages-main">
          {selectedClient ? (
            <Messaging receiverId={selectedClient.clientId} orderId={null} receiverName={selectedClient.clientName} />
          ) : (
            <div>Select a client to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerMessages;
