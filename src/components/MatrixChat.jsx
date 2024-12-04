import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, orderBy, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const MatrixChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [username, setUsername] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
    const [tempUsername, setTempUsername] = useState('');
    const messagesEndRef = useRef(null);
  
    useEffect(() => {
      const q = query(collection(db, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageList);
        scrollToBottom();
      });
  
      return () => unsubscribe();
    }, []);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
  
    const handleChatOpen = () => {
      setIsOpen(true);
      if (!username) {
        setShowUsernamePrompt(true);
      }
    };
  
    const handleUsernameSubmit = (e) => {
      e.preventDefault();
      if (tempUsername.trim()) {
        setUsername(tempUsername);
        setShowUsernamePrompt(false);
      }
    };
  
    const sendMessage = async (e) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
  
      try {
        await addDoc(collection(db, 'messages'), {
          text: newMessage,
          username,
          timestamp: serverTimestamp()
        });
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };
  
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleChatOpen}
          className="bg-black border border-green-500 text-green-500 px-4 py-2 mb-2 
                   hover:bg-green-500 hover:text-black transition-all duration-300 font-mono"
        >
          {isOpen ? 'Close Chat' : 'Open Chat'}
        </button>
  
        {isOpen && (
          <div className="w-80 h-96 bg-black border border-green-500 flex flex-col font-mono">
            {showUsernamePrompt ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <form onSubmit={handleUsernameSubmit} className="w-full space-y-4">
                  <div className="text-green-500 text-center mb-4">Enter Your Username</div>
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full bg-black border border-green-500 text-green-500 p-2 
                             focus:outline-none focus:border-green-400"
                    placeholder="Username..."
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-black py-2 hover:bg-green-400 
                             transition-colors duration-300"
                  >
                    Begin Chat
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-green-500 ${
                        msg.username === username ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span className="text-xs text-green-300">{msg.username}:</span>
                      <div className="bg-green-500/10 p-2 rounded inline-block">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
  
                <form onSubmit={sendMessage} className="p-2 border-t border-green-500">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-black border border-green-500 text-green-500 p-2 
                             focus:outline-none focus:border-green-400"
                    placeholder="Type a message..."
                  />
                </form>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

export default MatrixChat;