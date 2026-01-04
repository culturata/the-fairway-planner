"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ChatWindowProps {
  channelId: string;
  currentUserId: string;
}

export default function ChatWindow({
  channelId,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    fetchMessages();

    const interval = setInterval(async () => {
      if (messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        const response = await fetch(
          `/api/channels/${channelId}/messages?since=${lastMessageId}`
        );
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages]);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [channelId, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId;
            const senderName =
              message.sender.name || message.sender.email || "Unknown";

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                    isOwnMessage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  } rounded-lg px-4 py-2`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-1">
                      {senderName}
                    </div>
                  )}
                  <div className="break-words">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
