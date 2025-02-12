import React, { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';

const ChatWindow = ({
  socket,
  selectedChat,
  messages,
  setMessages,
  isTyping,
  messageAreaRef,
  currentUser,
  chatService,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    if (!socket || !selectedChat) return;
    socket.emit('typing', selectedChat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop typing', selectedChat._id);
    }, 3000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !selectedChat) return;
    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('stop typing', selectedChat._id);

      const payload = {
        tenantId: currentUser.tenantId,
        content: newMessage,
        chat: selectedChat,
        sender: currentUser,
      };
      const messageToAdd = {
        content: newMessage,
        sender: currentUser.userData,
        chat: selectedChat._id,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, messageToAdd]);
      socket.emit('new message', payload);
      setNewMessage('');

      if (messageAreaRef.current) {
        messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="p-4 bg-white border-b shadow-sm">
            <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
  {selectedChat.isGroupChat ? (
    selectedChat.chatName?.[0]
  ) : (
    (() => {
      const otherUser = selectedChat.users.find(
        (user) => String(user._id) !== String(currentUser.userData._id)
      );
      return otherUser?.profilePicture ? (
        <img
          src={otherUser.profilePicture}
          alt={otherUser.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        otherUser?.name?.[0] || "?"
      );
    })()
  )}
</div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900">
                  {selectedChat.isGroupChat
                    ? selectedChat.chatName
                    : selectedChat.users.find(
                        (user) => user._id !== currentUser.userData._id
                      )?.name}
                </div>
                {isTyping && (
                  <div className="text-sm text-blue-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={messageAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isSender = msg.sender._id === currentUser.userData._id;
                const showAvatar = index === 0 || 
                  messages[index - 1].sender._id !== msg.sender._id;

                return (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      isSender ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isSender && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-sm font-medium text-gray-600">
                        {msg.sender.name?.[0]}
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] group relative ${
                        !showAvatar && !isSender ? 'ml-10' : ''
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl ${
                          isSender
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isSender ? 'text-gray-500 text-right' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2 items-center">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  handleTyping();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-grow bg-gray-50 rounded-full px-4 py-2 focus:ring-blue-500"
              />
              <Button 
                onClick={sendMessage} 
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600 h-10 w-10 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
          <p className="text-lg">Select a chat or start a new conversation</p>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;