import React, { useState, useEffect, useRef } from 'react';
import { sellerAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { MessageSquare, Send, User, Search } from 'lucide-react';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);


  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation && selectedConversation.customer) {
      fetchMessages(selectedConversation.customer._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getConversations();
      const sellerId = localStorage.getItem('userId');
      // Add .customer property to each conversation
      const mapped = (response.data.conversations || []).map(conv => {
        let customer = null;
        if (conv.lastMessage) {
          // The customer is the user who is not the seller
          if (conv.lastMessage.sender && conv.lastMessage.sender._id !== sellerId && conv.lastMessage.sender.role === 'customer') {
            customer = conv.lastMessage.sender;
          } else if (conv.lastMessage.receiver && conv.lastMessage.receiver._id !== sellerId && conv.lastMessage.receiver.role === 'customer') {
            customer = conv.lastMessage.receiver;
          }
        }
        return { ...conv, customer };
      });
      setConversations(mapped);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await sellerAPI.getMessages(userId);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    try {
      // Use the .customer property for the correct receiverId
      const customerId = selectedConversation.customer?._id;
      if (!customerId) {
        alert('No customer found for this conversation.');
        return;
      }
      const payload = { receiverId: customerId, message: messageText };
      console.log('DEBUG seller sendMessage payload:', payload);
      await sellerAPI.sendMessage(payload);
      setMessageText('');
      fetchMessages(customerId);
      fetchConversations(); // Update last message
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.customer?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && conversations.length === 0) return <LoadingSpinner size="large" />;

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1 className="messages-title">Messages</h1>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchConversations} />}

      {conversations.length === 0 ? (
        <div className="messages-empty">
          <MessageSquare className="empty-icon" />
          <h3 className="empty-title">No Messages Yet</h3>
          <p className="empty-description">
            Customer messages will appear here
          </p>
        </div>
      ) : (
        <div className="messages-layout">
          {/* Conversations Panel */}
          <div className="conversations-panel">
            <div className="conversations-header">
              <div className="conversations-search-wrapper">
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="conversations-search"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="conversations-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`conversation-item ${
                    selectedConversation?._id === conversation._id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-info">
                    <div className="conversation-avatar">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="conversation-details">
                      <h4 className="conversation-name">
                        {conversation.customer?.username || 'Customer'}
                      </h4>
                      <p className="conversation-last-message">
                        {conversation.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                    <div className="conversation-meta">
                      <p className="conversation-time">
                        {conversation.lastMessage
                          ? formatDate(conversation.lastMessage.createdAt)
                          : ''}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="conversation-unread">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-user-avatar">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="chat-user-info">
                    <h3>{selectedConversation.customer?.username || 'Customer'}</h3>
                    <p>{selectedConversation.customer?.email || ''}</p>
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message-group ${
                        message.sender.role === 'seller' ? 'sent' : 'received'
                      }`}
                    >
                      <div
                        className={`message-bubble ${
                          message.sender.role === 'seller' ? 'sent' : 'received'
                        }`}
                      >
                        <p className="message-text">{message.message}</p>
                        <p className="message-time">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                  <form onSubmit={handleSendMessage}>
                    <div className="chat-input-wrapper">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="chat-textarea"
                        rows="1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="btn-send"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="chat-empty">
                <MessageSquare className="chat-empty-icon" />
                <p className="chat-empty-text">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;