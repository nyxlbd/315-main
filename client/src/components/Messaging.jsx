import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { getCurrentUser, getUserRole } from '../auth';
import './Messaging.css';

function Messaging({ receiverId, orderId, receiverName }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  let user = getCurrentUser();
  const role = getUserRole();
  // Fallback: try to get user._id from token if missing
  if (!user || !user._id) {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        user = { ...user, _id: payload.id || payload._id };
      }
    } catch {}
  }
  const messagesEndRef = useRef(null);


  // Only show loading on initial mount
  const initialLoad = useRef(true);
  const fetchMessages = async () => {
    if (initialLoad.current) setLoading(true);
    try {
      let url = orderId ? `/messages/conversation/${receiverId}/${orderId}` : `/messages/conversation/${receiverId}`;
      const res = await API.get(url);
      setMessages(res.data);
    } catch {
      if (initialLoad.current) setMessages([]); // Only clear on first load
    }
    if (initialLoad.current) {
      setLoading(false);
      initialLoad.current = false;
    }
  };

  useEffect(() => {
    initialLoad.current = true;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [receiverId, orderId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      const payload = { receiver: receiverId, content };
      if (orderId) payload.order = orderId;
      await API.post('/messages', payload);
      setContent('');
      fetchMessages();
    } catch {
      setError('Failed to send message.');
    }
    setSending(false);
  };

  return (
    <div className="messaging-container">
      <div className="messaging-header">Conversation with {receiverName}</div>
      <div className="messaging-messages">
        {loading ? (
          <div>Loading...</div>
        ) : messages.length === 0 ? (
          <div>No messages yet.</div>
        ) : (
          messages.map(msg => {
            // Handle both populated and unpopulated sender fields
            let senderId = msg.sender;
            if (msg.sender && typeof msg.sender === 'object') {
              senderId = msg.sender._id || msg.sender;
            }
            const isMine = String(senderId) === String(user._id);
            return (
              <div
                key={msg._id}
                className={`messaging-message-row${isMine ? ' mine' : ''}`}
              >
                <span className={`messaging-message${isMine ? ' mine' : ' other'}`}>
                  {msg.content}
                  <div className="messaging-timestamp" style={{ textAlign: isMine ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="messaging-form">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="messaging-input"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !content.trim()} className="messaging-send-btn">
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
      {error && <div className="messaging-error">{error}</div>}
    </div>
  );
}

export default Messaging;
