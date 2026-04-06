"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Link2,
  Users,
  Send,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  Heading,
  MoreVertical,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/env";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const stripHtml = (value = "") =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const sanitizeHtml = (value = "") => {
  let html = String(value || "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/javascript:/gi, "");
  return html;
};

export default function ChatRoomPage() {
  const [session, setSession] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [chatSessionId, setChatSessionId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [joinedAt, setJoinedAt] = useState("");
  const [participantsCount, setParticipantsCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputHtml, setInputHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);

  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const shareUrl = useMemo(() => {
    if (!roomId || typeof window === "undefined") return "";
    return `${window.location.origin}/dashboard/chat?room=${roomId}`;
  }, [roomId]);

  useEffect(() => {
    const raw = localStorage.getItem("cipher_session");
    if (!raw) { window.location.href = "/auth/login"; return; }
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {
      localStorage.removeItem("cipher_session");
      window.location.href = "/auth/login";
      return;
    }
    if (!parsed?.user?.id || !parsed?.mfaVerified) { window.location.href = "/auth/login"; return; }
    setSession(parsed);
    if (parsed?.user?.id) fetchChatHistory(parsed.user.id);
    const q = new URLSearchParams(window.location.search);
    const rid = q.get("room") || "";
    setRoomId(rid);
    if (rid) joinRoom(rid);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (!roomId || !chatSessionId) return;
    const poll = setInterval(() => { fetchState(); fetchMessages(); }, 2000);
    return () => clearInterval(poll);
  }, [roomId, chatSessionId, joinedAt]);

  useEffect(() => {
    if (!roomId || !chatSessionId) return;
    const heartbeat = setInterval(() => fetchState(), 10000);
    return () => clearInterval(heartbeat);
  }, [roomId, chatSessionId]);

  useEffect(() => {
    const leaveOnUnload = () => {
      if (!roomId || !chatSessionId) return;
      navigator.sendBeacon(
        `${API_BASE_URL}/chat/rooms/${roomId}/leave`,
        JSON.stringify({ session_id: chatSessionId })
      );
    };
    window.addEventListener("beforeunload", leaveOnUnload);
    return () => window.removeEventListener("beforeunload", leaveOnUnload);
  }, [roomId, chatSessionId]);

  const joinRoom = async (rid) => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unable to join room");
      setRoomId(data.room_id);
      setChatSessionId(data.session_id);
      setDisplayName(data.display_name);
      setIsCreator(!!data.is_creator);
      setJoinedAt(data.joined_at || "");
      fetchState(data.room_id, data.session_id);
      fetchMessages(data.room_id, data.session_id, data.joined_at);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchChatHistory = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/user/${userId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setChatRooms(data.rooms || []);
      }
    } catch (err) { console.error(err); }
  };

  const createRoom = async () => {
    if (!session?.user?.id) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create room");
      const nextRoom = data.room_id;
      setRoomId(nextRoom);
      setChatSessionId(data.session_id);
      setDisplayName(data.display_name);
      setIsCreator(true);
      setJoinedAt(data.joined_at || "");
      const url = new URL(window.location.href);
      url.searchParams.set("room", nextRoom);
      window.history.replaceState({}, "", url.toString());
      fetchChatHistory(session?.user?.id);
      fetchState(nextRoom, data.session_id);
      fetchMessages(nextRoom, data.session_id, data.joined_at);
    } catch (err) { console.error(err); }
    setBusy(false);
  };

  const fetchState = async (rid = roomId, sid = chatSessionId) => {
    if (!rid || !sid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/state?session_id=${sid}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setParticipantsCount(data.participants_count || 0);
      setParticipants(data.participants || []);
      setIsCreator(!!data.is_creator);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (rid = roomId, sid = chatSessionId, joined = joinedAt) => {
    if (!rid || !sid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/messages?session_id=${sid}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.messages || [];
      const scoped = joined ? list.filter((m) => String(m.created_at || "") >= String(joined)) : list;
      setMessages(scoped);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer))
      selectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    if (!selectionRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(selectionRef.current);
  };

  const applyCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    editorRef.current.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const getCurrentBlockTag = () => {
    const range = selectionRef.current;
    if (!range || !editorRef.current) return null;

    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    while (node && node !== editorRef.current) {
      if (node.tagName) return node.tagName.toLowerCase();
      node = node.parentElement;
    }

    return null;
  };

  const toggleTitle = () => {
    rememberSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    
    let blockElement = null;
    while (node && node !== editorRef.current) {
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'].includes(node.tagName)) {
        blockElement = node;
        break;
      }
      node = node.parentElement;
    }
    
    if (blockElement && blockElement.tagName === 'H2') {
      applyCommand('formatBlock', '<p>');
    } else {
      applyCommand('formatBlock', '<h2>');
    }
  };
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!session?.user?.id || !stripHtml(inputHtml) || !roomId || !chatSessionId) return;
    const payload = sanitizeHtml(inputHtml);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, session_id: chatSessionId, content: payload }),
      });
      if (res.ok) {
        setInputHtml("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        fetchMessages();
      }
    } catch (err) { console.error(err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyInviteLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteRoom = async () => {
    if (!session?.user?.id || !roomId || !chatSessionId || !isCreator) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, session_id: chatSessionId }),
      });
      if (res.ok) {
        setRoomId(""); setChatSessionId(""); setMessages([]);
        setParticipants([]); setParticipantsCount(0);
        const url = new URL(window.location.href);
        url.searchParams.delete("room");
        window.history.replaceState({}, "", url.toString());
        if (session?.user?.id) fetchChatHistory(session.user.id);
      }
    } catch (err) { console.error(err); }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isMine = (m) => m.author === displayName;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black text-white font-inconsolata flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    /**
     * fixed inset-0 — takes over the full viewport, ignores any parent
     * padding/margin/overflow that the dashboard layout injects.
     * This is the reliable fix for the "floating composer + page scrollbar" bug.
     */
    <div className="fixed inset-0 bg-black text-white font-inconsolata flex flex-col">

      {/* ── Header ── */}
      <header className="flex-none border-b border-white/10 bg-black/90 backdrop-blur-xl z-40">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-base sm:text-lg font-bitcount text-primary uppercase tracking-wider truncate">
            Anonymous Chat
          </h1>

          {roomId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2.5 py-1.5 border border-white/15 rounded-[8px] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer shrink-0">
                  <Users size={13} className="text-white/50" />
                  <span className="text-xs text-white/70">{participantsCount}</span>
                  <MoreVertical size={13} className="text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-inconsolata text-xs w-64">
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); copyInviteLink(); }}
                  className="gap-2"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
                  {copied ? "Copied!" : "Copy invite link"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1.5">
                    Participants · {participantsCount}
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {participants.map((p) => (
                      <div key={p.session_id} className="px-2 py-1 text-xs text-white/60 rounded-[5px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />
                        {p.display_name}
                        {p.display_name === displayName && (
                          <span className="text-xs text-primary/70 uppercase tracking-wider">you</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {isCreator && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-300 gap-2"
                      onSelect={(e) => { e.preventDefault(); deleteRoom(); }}
                    >
                      <Trash2 size={14} /> Delete room
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-16 shrink-0" />
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0 w-full px-4 sm:px-6">

          {!roomId ? (
            <div className="flex-1 flex flex-col gap-6 py-6 overflow-hidden">
              {/* Create Room Section */}
              <div className="flex-none">
                <div className="border border-white/10 rounded-[12px] bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="font-bitcount text-lg text-primary uppercase tracking-wider mb-1">Create Room</h2>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Start an anonymous chat. Random names, no history retention.
                      </p>
                    </div>
                    <div className="flex-none w-10 h-10 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center">
                      <Users size={16} className="text-primary" />
                    </div>
                  </div>
                  <Button
                    onClick={createRoom}
                    disabled={busy}
                    className="w-full bg-primary text-black hover:bg-white rounded-[8px] uppercase tracking-[0.15em] text-xs font-bold h-10"
                  >
                    <Plus size={13} className="mr-2" />
                    {busy ? "Creating..." : "Create New Room"}
                  </Button>
                </div>
              </div>

              {/* History Section */}
              {chatRooms.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0 gap-3">
                  <div className="flex-none flex items-center justify-between">
                    <h3 className="font-inconsolata text-xs uppercase tracking-[0.2em] text-white/40">Recent Rooms</h3>
                    <span className="text-xs text-white/35">{chatRooms.length} total</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-2 pr-2">
                      {chatRooms.map((room) => (
                        <ContextMenu key={room.id}>
                          <ContextMenuTrigger>
                            <motion.button
                              onClick={() => {
                                setRoomId(room.id);
                                const url = new URL(window.location.href);
                                url.searchParams.set("room", room.id);
                                window.history.replaceState({}, "", url.toString());
                                joinRoom(room.id);
                              }}
                              whileHover={{ x: 4 }}
                              className="w-full p-3 text-left border border-white/8 hover:border-primary/50 bg-white/[0.02] hover:bg-primary/8 rounded-[8px] transition-all group cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-inconsolata text-white/80 truncate group-hover:text-primary transition-colors">{room.id}</p>
                                    {room.creator_user_id === session?.user?.id && (
                                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-wider font-bold shrink-0">You</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/40">{room.message_count} {room.message_count === 1 ? "message" : "messages"}</p>
                                </div>
                                <div className="flex-none text-white/30 group-hover:text-primary transition-colors">
                                  <Users size={12} />
                                </div>
                              </div>
                            </motion.button>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="font-inconsolata text-xs w-56 bg-white/10 border-white/20 backdrop-blur-sm">
                            <ContextMenuItem
                              onClick={() => {
                                const shareUrl = `${window.location.origin}/dashboard/chat?room=${room.id}`;
                                navigator.clipboard.writeText(shareUrl);
                              }}
                              className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Link2 size={12} className="mr-2" />
                              Copy invite link
                            </ContextMenuItem>
                            <ContextMenuSeparator className="bg-white/10" />
                            <ContextMenuItem
                              onClick={() => {
                                setRoomId(room.id);
                                const url = new URL(window.location.href);
                                url.searchParams.set("room", room.id);
                                window.history.replaceState({}, "", url.toString());
                                joinRoom(room.id);
                              }}
                              className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Users size={12} className="mr-2" />
                              Join room
                            </ContextMenuItem>
                            {room.creator_user_id === session?.user?.id && (
                              <>
                                <ContextMenuSeparator className="bg-white/10" />
                                <ContextMenuItem
                                  onClick={deleteRoom}
                                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  <Trash2 size={12} className="mr-2" />
                                  Delete room
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {chatRooms.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-white/25 mb-2">No chat history yet</p>
                    <p className="text-xs text-white/30">Create a room to get started</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Messages (only scrollable zone) ── */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/5 hover:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs uppercase tracking-[0.15em] text-white/25">No messages yet</p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const mine = isMine(m);
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                      >
                        <div className={`flex items-center gap-2 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                          <span className={`text-[10px] uppercase tracking-[0.15em] ${mine ? "text-primary" : "text-white/35"}`}>
                            {mine ? "you" : m.author}
                          </span>
                          <span className="text-xs text-white/30">{formatTime(m.created_at)}</span>
                        </div>
                        <div
                          className={`max-w-[80%] sm:max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            [&_h2]:text-base [&_h2]:text-primary [&_h2]:font-bitcount [&_h2]:mt-1
                            [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
                            [&_strong]:font-bold [&_em]:italic [&_u]:underline
                            ${mine
                              ? "bg-primary/10 border border-primary/20 text-white rounded-tr-sm"
                              : "bg-white/5 border border-white/8 text-gray-300 rounded-tl-sm"
                            }`}
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* ── Composer (pinned to bottom) ── */}
              <div className="flex-none border-t border-white/8 bg-black/80 backdrop-blur-sm py-3 pb-4">
                <div className="space-y-2.5">
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1">
                    {[
                      { cmd: "bold", icon: <Bold size={11} />, title: "Bold" },
                      { cmd: "italic", icon: <Italic size={11} />, title: "Italic" },
                      { cmd: "underline", icon: <Underline size={11} />, title: "Underline" },
                      { cmd: "insertUnorderedList", icon: <List size={11} />, title: "List" },
                      { name: "divider" },
                      { cmd: "toggleTitle", icon: <Heading size={11} />, title: "Heading", onClick: toggleTitle },
                    ].map((btn, idx) => 
                      btn.name === "divider" ? (
                        <div key={idx} className="h-4 w-px bg-white/10 mx-0.5" />
                      ) : (
                        <button
                          key={btn.cmd || btn.title}
                          type="button"
                          title={btn.title}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={btn.onClick ? btn.onClick : () => applyCommand(btn.cmd)}
                          className="w-7 h-7 flex items-center justify-center rounded-[5px] text-white/35 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {btn.icon}
                        </button>
                      )
                    )}
                    <span className="ml-auto text-xs text-white/35 uppercase tracking-[0.1em] hidden sm:block whitespace-nowrap">
                      ↵ send · shift↵ newline
                    </span>
                  </div>

                  {/* Input Section */}
                  <div className="flex items-end gap-2">
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="Type message…"
                      onMouseUp={rememberSelection}
                      onKeyUp={rememberSelection}
                      onKeyDown={handleKeyDown}
                      onInput={(e) => setInputHtml(e.currentTarget.innerHTML)}
                      className="flex-1 min-h-[38px] max-h-32 overflow-y-auto px-3 py-2
                        border border-white/10 rounded-[8px] outline-none text-xs leading-relaxed
                        focus:border-primary/40 transition-colors
                        empty:before:content-[attr(data-placeholder)] empty:before:text-white/30 empty:before:pointer-events-none
                        [&_h2]:text-sm [&_h2]:text-primary [&_h2]:font-bitcount
                        [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5
                        [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/[0.08]"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!stripHtml(inputHtml)}
                      className="shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-black rounded-[8px]
                        hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed
                        transition-all cursor-pointer active:scale-95"
                      title="Send"
                    >
                      <Send size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.1em] text-white/35">
                      {inputHtml.trim() ? `${displayName} typing…` : "Ephemeral"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}