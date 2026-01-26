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
      const payload = { receiverId, message: content };
      if (orderId) payload.orderId = orderId;
      await API.post('/messages/send', payload);
      setContent('');
      await fetchMessages();
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
            let senderId = msg.sender;
            if (msg.sender && typeof msg.sender === 'object') {
              senderId = msg.sender._id || msg.sender;
            }
            const isMine = String(senderId) === String(user._id);
            return (
              <div
                key={msg._id}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    background: isMine ? '#538e5e' : '#f1f1f1',
                    color: isMine ? '#fff' : '#222',
                    borderRadius: 12,
                    padding: '8px 16px',
                    maxWidth: '70%',
                    wordBreak: 'break-word',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    marginLeft: isMine ? '40%' : 0,
                    marginRight: !isMine ? '40%' : 0,
                    boxShadow: isMine
                      ? '1px 1px 6px #b3d1f7'
                      : '1px 1px 6px #b7e6c7',
                  }}
                >
                  {msg.message}
                  <div
                    style={{
                      fontSize: '0.75em',
                      color: '#888',
                      marginTop: 4,
                      textAlign: isMine ? 'right' : 'left',
                    }}
                  >
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
