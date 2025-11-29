"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { getUserThreads, getThreadMessages, sendMessage } from "@/lib/services/messages";
import type { MessageThread, Message } from "@/types/message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPaperclip, faPaperPlane, faPhone, faVideo, faEllipsisVertical, faLocationDot } from "@fortawesome/free-solid-svg-icons";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadIdFromUrl = searchParams.get("threadId");
  
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showThreads, setShowThreads] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const active = useMemo(() => threads.find((t) => t.id === activeId), [threads, activeId]);

  // Auth state listener
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch threads when user is authenticated
  useEffect(() => {
    if (!user) return;

    const fetchThreads = async () => {
      try {
        setLoading(true);
        const userThreads = await getUserThreads(user.uid);
        setThreads(userThreads);
        
        // Set active thread from URL or first available thread
        if (threadIdFromUrl && userThreads.some(t => t.id === threadIdFromUrl)) {
          setActiveId(threadIdFromUrl);
          setShowThreads(false); // Auto-open chat on mobile
        } else if (userThreads.length > 0 && !activeId) {
          setActiveId(userThreads[0].id);
        }
      } catch (error) {
        console.error("❌ Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [user, activeId, threadIdFromUrl]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (!activeId) return;

    const fetchMessages = async () => {
      try {
        const threadMessages = await getThreadMessages(activeId);
        setMessages(threadMessages);
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [activeId]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !user || !activeId || sending) return;

    try {
      setSending(true);
      await sendMessage({
        threadId: activeId,
        senderId: user.uid,
        senderName: user.displayName || "User",
        senderAvatar: user.photoURL || undefined,
        text: input.trim(),
      });

      // Refresh messages
      const threadMessages = await getThreadMessages(activeId);
      setMessages(threadMessages);
      
      // Refresh threads to update last message
      const userThreads = await getUserThreads(user.uid);
      setThreads(userThreads);
      
      setInput("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    
    const query = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        (user?.uid === t.hostId ? t.guestName : t.hostName).toLowerCase().includes(query) ||
        t.propertyName.toLowerCase().includes(query) ||
        t.lastMessage.toLowerCase().includes(query)
    );
  }, [threads, searchQuery, user]);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  // Format message time
  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-[#F59E0B]",
      "bg-[#10B981]",
      "bg-[#3B82F6]",
      "bg-[#8B5CF6]",
      "bg-[#EF4444]",
      "bg-[#EC4899]",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:grid lg:grid-cols-12 gap-4">
      {/* Left: conversations - Hidden on mobile when chat is open */}
      <aside className={`${showThreads ? 'block' : 'hidden'} lg:block lg:col-span-4 xl:col-span-3`}>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden h-full flex flex-col">
          <div className="h-14 px-4 flex items-center gap-3 border-b border-[#E5E7EB] flex-shrink-0">
            <FontAwesomeIcon icon={faSearch} className="text-[#6B7280]" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm font-lexend" 
              placeholder="Search conversations..." 
            />
          </div>
          <div className="flex-1 overflow-auto">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-lexend">
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </p>
                <p className="text-xs text-gray-500 font-lexend mt-1">
                  {searchQuery ? "Try a different search term" : "Messages will appear when guests contact you"}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.id === activeId;
                const isHost = user?.uid === t.hostId;
                const otherPersonName = isHost ? t.guestName : t.hostName;
                const otherPersonAvatar = isHost ? t.guestAvatar : t.hostAvatar;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveId(t.id);
                      setShowThreads(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[#F3F4F6] transition-colors ${
                      isActive ? "bg-[#F5FAFF] border-l-4 border-l-[#3B82F6]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {otherPersonAvatar ? (
                      <img
                        src={otherPersonAvatar}
                        alt={otherPersonName}
                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 flex-shrink-0 rounded-full ${getAvatarColor(otherPersonName)} flex items-center justify-center text-white text-sm font-semibold`}>
                        {getInitials(otherPersonName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-lexend text-[#111827] font-medium truncate">{otherPersonName}</div>
                        <div className="text-[11px] text-[#9CA3AF] font-lexend flex-shrink-0 ml-2">{formatTimeAgo(t.lastMessageAt)}</div>
                      </div>
                      <div className="text-[12px] text-[#6B7280] font-lexend truncate mb-0.5">{t.propertyName}</div>
                      <div className="text-[12px] text-[#6B7280] font-lexend truncate">{t.lastMessage || "No messages yet"}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Right: chat - Full screen on mobile when thread selected */}
      <section className={`${!showThreads ? 'block' : 'hidden'} lg:block lg:col-span-8 xl:col-span-9 h-full`}>
        {!active ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] h-full flex items-center justify-center">
            <div className="text-center px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-lexend">Select a conversation</h3>
              <p className="text-sm text-gray-600 font-lexend">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden h-full flex flex-col">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
              {/* Back button for mobile */}
              <button 
                onClick={() => setShowThreads(true)}
                className="lg:hidden mr-3 h-9 w-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-lexend text-[#111827] font-semibold truncate">
                  {user?.uid === active.hostId ? active.guestName : active.hostName}
                </div>
                <div className="text-[11px] text-[#6B7280] font-lexend flex items-center gap-1 truncate">
                  <FontAwesomeIcon icon={faLocationDot} className="text-[#1078CF] flex-shrink-0" />
                  <span className="truncate">{active.propertyName}</span>
                </div>
              </div>
            <div className="flex items-center gap-2 text-[#6B7280] ml-3">
              <button className="h-9 w-9 rounded-full bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors">
                <FontAwesomeIcon icon={faPhone} className="text-sm" />
              </button>
              <button className="hidden sm:flex h-9 w-9 rounded-full bg-[#F3F4F6] items-center justify-center hover:bg-[#E5E7EB] transition-colors">
                <FontAwesomeIcon icon={faVideo} className="text-sm" />
              </button>
              <button className="h-9 w-9 rounded-full bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors">
                <FontAwesomeIcon icon={faEllipsisVertical} className="text-sm" />
              </button>
            </div>
          </div>

            {/* Chat body */}
            <div className="flex-1 px-4 py-4 space-y-3 overflow-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-lexend">No messages yet</p>
                    <p className="text-xs text-gray-500 font-lexend mt-1">Start the conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMyMessage = m.senderId === user?.uid;
                  return (
                    <div key={m.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] text-[13px] px-3 py-2 rounded-2xl ${
                        isMyMessage ? "bg-[#3B82F6] text-white rounded-br-md" : "bg-[#F3F4F6] text-[#111827] rounded-bl-md"
                      }`}>
                        <div className="leading-relaxed">{m.text}</div>
                        <div className={`mt-1 text-[10px] ${isMyMessage ? "text-white/80" : "text-[#6B7280]"}`}>
                          {formatMessageTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex-shrink-0">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E5E7EB] px-3 h-12">
                <button className="text-[#6B7280] hover:text-[#111827] transition-colors">
                  <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 outline-none text-sm font-lexend"
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-9 w-9 flex-shrink-0 rounded-full bg-[#1078CF] text-white flex items-center justify-center hover:bg-[#0D6AB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-[10px] text-[#9CA3AF] font-lexend hidden sm:block">Press Enter to send, Shift+Enter for new line</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
