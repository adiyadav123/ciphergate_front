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
  AlertCircle,
  ShieldAlert,
  Wifi,
  WifiOff,
  KeyRound,
  BarChart3,
  Image,
  Search,
  Loader2,
  Sparkles,
  Copy,
  ChevronDown,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, GIPHY_API_KEY } from "@/lib/env";
import { consumePendingAction, verifySessionWithMfa } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const POLL_PREFIX = "__poll__:";
const POLL_VOTE_PREFIX = "__poll_vote__:";
const GIF_PREFIX = "__gif__:";
const REPLY_PREFIX = "__reply__:";
const REACTION_PREFIX = "__reaction__:";
const GIF_PAGE_SIZE = 18;
const REACTION_PICKER_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👏", "😮", "😢", "😡", "🤔"];

const safeParseJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isLikelyGifUrl = (url = "") => {
  const u = String(url || "").trim().toLowerCase();
  return u.startsWith("http://") || u.startsWith("https://");
};

const SAFE_FALLBACK_GIFS = [
  {
    id: "fallback-cat-wave",
    title: "Cat Wave",
    url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
    previewUrl: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  },
  {
    id: "fallback-happy-dance",
    title: "Happy Dance",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    previewUrl: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "fallback-thumbs-up",
    title: "Thumbs Up",
    url: "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
    previewUrl: "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
  },
  {
    id: "fallback-clap",
    title: "Clapping",
    url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif",
  },
  {
    id: "fallback-celebrate",
    title: "Celebrate",
    url: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
  },
];

const getLocalGifResults = (term = "") => {
  const query = String(term || "").trim().toLowerCase();
  if (!query) return SAFE_FALLBACK_GIFS;
  const matches = SAFE_FALLBACK_GIFS.filter((gif) =>
    gif.title.toLowerCase().includes(query)
  );
  return matches.length > 0 ? matches : SAFE_FALLBACK_GIFS;
};

export default function ChatRoomPage() {
  const router = useRouter();
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
  const [roomError, setRoomError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [pollFailures, setPollFailures] = useState(0);
  const [roomSettings, setRoomSettings] = useState({
    invite_policy: "link",
    has_passcode: false,
    approved_count: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [queuedAction, setQueuedAction] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("Deleted by owner");
  const [historyDeleteDialog, setHistoryDeleteDialog] = useState({ open: false, roomId: "" });
  const [historyDeleteReason, setHistoryDeleteReason] = useState("Deleted by owner");
  const [passcodeDialog, setPasscodeDialog] = useState({ open: false, roomId: "", userId: "", message: "" });
  const [passcodeInput, setPasscodeInput] = useState("");
  const [setPasscodeDialogOpen, setSetPasscodeDialogOpen] = useState(false);
  const [newRoomPasscode, setNewRoomPasscode] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveUserIdInput, setApproveUserIdInput] = useState("");
  const [approvalRetry, setApprovalRetry] = useState({ active: false, roomId: "", userId: "" });
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsText, setPollOptionsText] = useState("");
  const [pollChoiceMode, setPollChoiceMode] = useState("single");
  const [gifDialogOpen, setGifDialogOpen] = useState(false);
  const [gifUrlInput, setGifUrlInput] = useState("");
  const [gifSearchTerm, setGifSearchTerm] = useState("cat");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifLoadingMore, setGifLoadingMore] = useState(false);
  const [gifOffset, setGifOffset] = useState(0);
  const [hasMoreGifResults, setHasMoreGifResults] = useState(true);
  const [gifNotice, setGifNotice] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messageReadByUser, setMessageReadByUser] = useState({});
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const optimisticMessagesRef = useRef({});
  const participantSnapshotRef = useRef({ initialized: false, ids: new Set() });

  const shareUrl = useMemo(() => {
    if (!roomId || typeof window === "undefined") return "";
    return `${window.location.origin}/dashboard/chat?room=${roomId}`;
  }, [roomId]);

  useEffect(() => {
    const parsed = verifySessionWithMfa();
    if (!parsed) return;
    
    setSession(parsed);
    setQueuedAction(consumePendingAction());
    if (parsed?.user?.id) fetchChatHistory(parsed.user.id);
    const q = new URLSearchParams(window.location.search);
    const rid = q.get("room") || "";
    setRoomId(rid);
    if (rid) joinRoom(rid, parsed.user.id, null, true);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (!roomId || !chatSessionId) return;
    const timer = window.setInterval(async () => {
      const [stateOk, messagesOk] = await Promise.all([fetchState(), fetchMessages()]);
      if (stateOk && messagesOk) {
        setConnectionStatus("connected");
        setPollFailures(0);
      } else {
        setConnectionStatus("reconnecting");
        setPollFailures((v) => Math.min(v + 1, 6));
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [roomId, chatSessionId, joinedAt, pollFailures]);

  useEffect(() => {
    optimisticMessagesRef.current = {};
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

  const goToChatHistory = () => {
    if (!roomId && !chatSessionId) {
      router.push("/dashboard");
      return;
    }
    setRoomId("");
    setChatSessionId("");
    setMessages([]);
    setParticipants([]);
    setParticipantsCount(0);
    setRoomError(null);
    setPasscodeDialog({ open: false, roomId: "", userId: "", message: "" });
    setPasscodeInput("");
    setApprovalRetry({ active: false, roomId: "", userId: "" });
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    window.history.replaceState({}, "", url.toString());
    if (session?.user?.id) fetchChatHistory(session.user.id);
  };

  const joinRoom = async (rid, userId, passcode = null, skipMfaCheck = false, backgroundRetry = false) => {
    if (!userId && !session?.user?.id) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_join_room", payload: { roomId: rid, passcode } },
      });
      if (!valid) return;
    }
    const uid = userId || session?.user?.id;
    if (!backgroundRetry) {
      setLoading(true);
      setRoomError(null);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, passcode: passcode || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail || {};
        const code = typeof detail === "object" ? detail.code : null;
        const message = typeof detail === "object" ? detail.message : (detail || "Unable to join room");
        if (res.status === 410 || code === "ROOM_DELETED") {
          setRoomError({
            type: "deleted",
            title: "Room Deleted",
            message: detail?.reason || "This chat room was deleted by the owner.",
            deletedAt: detail?.deleted_at,
          });
          return;
        }
        if (res.status === 404) {
          setRoomError({
            type: "not_found",
            title: "Room Not Found",
            message: "This chat room does not exist or the link is invalid.",
          });
          return;
        }
        if (res.status === 403 && code === "ROOM_PASSCODE_REQUIRED") {
          setPasscodeDialog({
            open: true,
            roomId: rid,
            userId: uid,
            message: "This room is passcode-protected. Enter the passcode to continue.",
          });
          setPasscodeInput("");
          return;
        }
        if (res.status === 403 && code === "ROOM_PASSCODE_INVALID") {
          setPasscodeDialog({
            open: true,
            roomId: rid,
            userId: uid,
            message: "Invalid passcode. Please try again.",
          });
          setPasscodeInput("");
          toast.error("Invalid room passcode");
          return;
        }
        if (res.status === 403 && code === "ROOM_APPROVAL_REQUIRED") {
          setRoomError({
            type: "approval",
            title: "Approval Required",
            message: "This room only allows approved users. Ask the room owner to approve your user ID.",
          });
          setApprovalRetry({ active: true, roomId: rid, userId: uid || "" });
          return;
        }
        setApprovalRetry({ active: false, roomId: "", userId: "" });
        setRoomError({ type: "unknown", title: "Unable to Join", message });
        if (!backgroundRetry) toast.error(message || "Unable to join room");
        return;
      }
      setRoomId(data.room_id);
      setChatSessionId(data.session_id);
      setDisplayName(data.display_name);
      const historyRoom = (chatRooms || []).find((room) => room?.id === data.room_id);
      setIsCreator(
        !!data.is_creator ||
        String(data.creator_user_id || "") === String(uid || "") ||
        String(historyRoom?.creator_user_id || "") === String(uid || ""),
      );
      setJoinedAt(data.joined_at || "");
      setRoomSettings(data.room_settings || { invite_policy: "link", has_passcode: false, approved_count: 0 });
      setPendingApprovals(data.pending_approval_requests || []);
      setConnectionStatus("connected");
      setPollFailures(0);
      setApprovalRetry({ active: false, roomId: "", userId: "" });
      toast.success(backgroundRetry ? "Access approved. Joined room" : "Joined room");
      fetchState(data.room_id, data.session_id);
      fetchMessages(data.room_id, data.session_id, data.joined_at);
    } catch (err) {
      console.error(err);
      if (!backgroundRetry) toast.error("Could not join room");
    }
    finally {
      if (!backgroundRetry) setLoading(false);
    }
  };

  useEffect(() => {
    if (!approvalRetry.active || !approvalRetry.roomId || !approvalRetry.userId) return;
    const timer = window.setInterval(() => {
      joinRoom(approvalRetry.roomId, approvalRetry.userId, null, true, true);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [approvalRetry.active, approvalRetry.roomId, approvalRetry.userId]);

  const fetchChatHistory = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/user/${userId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setChatRooms(data.rooms || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch room history");
    }
  };

  const createRoom = async (skipMfaCheck = false) => {
    if (!session?.user?.id) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({ pendingAction: { type: "chat_create_room", payload: {} } });
      if (!valid) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, invite_policy: "link" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create room");
      const nextRoom = data.room_id;
      setRoomId(nextRoom);
      setChatSessionId(data.session_id);
      setDisplayName(data.display_name);
      setIsCreator(true);
      setJoinedAt(data.joined_at || "");
      setRoomSettings(data.room_settings || { invite_policy: "link", has_passcode: false, approved_count: 0 });
      setRoomError(null);
      const url = new URL(window.location.href);
      url.searchParams.set("room", nextRoom);
      window.history.replaceState({}, "", url.toString());
      fetchChatHistory(session?.user?.id);
      fetchState(nextRoom, data.session_id);
      fetchMessages(nextRoom, data.session_id, data.joined_at);
      toast.success("Room created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create room");
    }
    setBusy(false);
  };

  const fetchState = async (rid = roomId, sid = chatSessionId) => {
    if (!rid || !sid) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/state?session_id=${sid}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 410) {
          const data = await res.json().catch(() => ({}));
          const detail = data?.detail || {};
          setRoomError({ type: "deleted", title: "Room Deleted", message: detail?.reason || "This room was deleted.", deletedAt: detail?.deleted_at });
        }
        return false;
      }
      const data = await res.json();
      setParticipantsCount(data.participants_count || 0);
      const nextParticipants = data.participants || [];
      const nextIds = new Set(nextParticipants.map((p) => String(p?.session_id || "")).filter(Boolean));
      const snapshot = participantSnapshotRef.current;
      if (snapshot.initialized) {
        nextParticipants.forEach((p) => {
          const sid = String(p?.session_id || "");
          const name = String(p?.display_name || "");
          if (!sid || snapshot.ids.has(sid)) return;
          if (name && name !== displayName) {
            toast.info(`${name} joined the room`);
          }
        });
      }
      participantSnapshotRef.current = { initialized: true, ids: nextIds };
      setParticipants(data.participants || []);
      const viewerId = session?.user?.id;
      const historyRoom = (chatRooms || []).find((room) => room?.id === rid);
      const computedCreator =
        !!data.is_creator ||
        String(data.creator_user_id || "") === String(viewerId || "") ||
        String(historyRoom?.creator_user_id || "") === String(viewerId || "");
      setIsCreator((prev) => prev || computedCreator);
      setRoomSettings(data.room_settings || { invite_policy: "link", has_passcode: false, approved_count: 0 });
      setPendingApprovals(data.pending_approval_requests || []);
      setTypingUsers(data.typing_users || []);
      return true;
    } catch (err) { console.error(err); }
    return false;
  };

  const fetchMessages = async (rid = roomId, sid = chatSessionId, joined = joinedAt) => {
    if (!rid || !sid) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${rid}/messages?session_id=${sid}`, { cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      const list = data.messages || [];
      const joinedMs = joined ? Date.parse(joined) : NaN;
      const scoped = Number.isFinite(joinedMs)
        ? list.filter((m) => {
            const createdMs = Date.parse(String(m.created_at || ""));
            return Number.isFinite(createdMs) ? createdMs >= joinedMs : true;
          })
        : list;

      const unresolvedOptimistic = Object.values(optimisticMessagesRef.current).filter((temp) => {
        const tempCreatedMs = Date.parse(String(temp.created_at || ""));
        const matched = scoped.some((serverMsg) => {
          if (String(serverMsg?.content || "") !== String(temp?.content || "")) return false;
          if (String(serverMsg?.author || "") !== String(temp?.author || "")) return false;
          const serverCreatedMs = Date.parse(String(serverMsg?.created_at || ""));
          if (!Number.isFinite(serverCreatedMs) || !Number.isFinite(tempCreatedMs)) return true;
          return Math.abs(serverCreatedMs - tempCreatedMs) < 120000;
        });
        if (matched) {
          delete optimisticMessagesRef.current[temp.id];
          return false;
        }
        return true;
      });

      const merged = [...scoped, ...unresolvedOptimistic];

      setMessages(merged);
      return true;
    } catch (err) { console.error(err); }
    return false;
  };

  useEffect(() => {
    if (!roomId || !chatSessionId) return undefined;
    window.clearTimeout(typingTimerRef.current);
    if (stripHtml(inputHtml)) {
      typingTimerRef.current = window.setTimeout(() => sendTypingState(true), 300);
    } else {
      sendTypingState(false);
    }
    return () => window.clearTimeout(typingTimerRef.current);
  }, [inputHtml, roomId, chatSessionId]);

  useEffect(() => {
    return () => {
      sendTypingState(false);
    };
  }, [roomId, chatSessionId]);

  const updateInvitePolicy = async (invitePolicy, skipMfaCheck = false) => {
    if (!session?.user?.id || !roomId) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_update_policy", payload: { roomId, invitePolicy } },
      });
      if (!valid) return;
    }
    const actionSessionId = chatSessionId || "admin-action";
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: actionSessionId,
          invite_policy: invitePolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoomSettings(data.room_settings || roomSettings);
        toast.success(invitePolicy === "approval" ? "Room set to approval-only" : "Room set to link access");
        fetchState();
      } else {
        const message = data?.detail?.message || data?.detail || "Failed to update room policy";
        toast.error(String(message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update room policy");
    }
  };

  const updateInvitePolicyForRoom = async (targetRoomId, invitePolicy) => {
    if (!session?.user?.id || !targetRoomId) return;
    const valid = verifySessionWithMfa({
      pendingAction: { type: "chat_update_policy_room", payload: { roomId: targetRoomId, invitePolicy } },
    });
    if (!valid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${targetRoomId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: chatSessionId || "history-admin",
          invite_policy: invitePolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (roomId === targetRoomId) {
          setRoomSettings(data.room_settings || roomSettings);
          fetchState(targetRoomId, chatSessionId);
        }
        toast.success(invitePolicy === "approval" ? "Room set to approval-only" : "Room set to link access");
      } else {
        const message = data?.detail?.message || data?.detail || "Failed to update room policy";
        toast.error(String(message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update room policy");
    }
  };

  const setRoomPasscode = async (passcodeInputValue = "", skipMfaCheck = false) => {
    if (!session?.user?.id || !roomId) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_set_passcode", payload: { roomId, passcode: passcodeInputValue } },
      });
      if (!valid) return;
    }
    const actionSessionId = chatSessionId || "admin-action";
    const passcode = (passcodeInputValue || "").trim();
    if (!passcode) {
      toast.error("Passcode is required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: actionSessionId,
          passcode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoomSettings(data.room_settings || roomSettings);
        setSetPasscodeDialogOpen(false);
        setNewRoomPasscode("");
        fetchState();
        toast.success("Passcode updated");
      } else {
        const message = data?.detail?.message || data?.detail || "Failed to update passcode";
        toast.error(String(message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update passcode");
    }
  };

  const clearRoomPasscode = async (skipMfaCheck = false) => {
    if (!session?.user?.id || !roomId) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_clear_passcode", payload: { roomId } },
      });
      if (!valid) return;
    }
    const actionSessionId = chatSessionId || "admin-action";
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: actionSessionId,
          clear_passcode: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoomSettings(data.room_settings || roomSettings);
        fetchState();
        toast.success("Passcode cleared");
      } else {
        const message = data?.detail?.message || data?.detail || "Failed to clear passcode";
        toast.error(String(message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear passcode");
    }
  };

  const approveUser = async (targetUserIdInput = "", skipMfaCheck = false) => {
    if (!session?.user?.id || !roomId) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_approve_user", payload: { roomId, targetUserId: targetUserIdInput } },
      });
      if (!valid) return;
    }
    const actionSessionId = chatSessionId || "admin-action";
    const targetUserId = (targetUserIdInput || "").trim();
    if (!targetUserId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: actionSessionId,
          target_user_id: targetUserId.trim(),
          action: "add",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoomSettings(data.room_settings || roomSettings);
        setPendingApprovals((prev) => prev.filter((req) => req?.user_id !== targetUserId));
        setApproveDialogOpen(false);
        setApproveUserIdInput("");
        fetchState();
        toast.success("User approved");
      } else {
        const message = data?.detail?.message || data?.detail || "Failed to approve user";
        toast.error(String(message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve user");
    }
  };

  useEffect(() => {
    if (!queuedAction || !session?.user?.id) return;
    if (queuedAction.type === "chat_create_room") {
      setQueuedAction(null);
      createRoom(true);
      return;
    }
    if (queuedAction.type === "chat_join_room") {
      setQueuedAction(null);
      joinRoom(queuedAction?.payload?.roomId, session.user.id, queuedAction?.payload?.passcode || null, true);
      return;
    }
    if (queuedAction.type === "chat_send" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      const savedContent = queuedAction?.payload?.content || "";
      setQueuedAction(null);
      sendMessageContent(savedContent, true);
      return;
    }
    if (queuedAction.type === "chat_delete_room" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      setQueuedAction(null);
      deleteRoom(true);
      return;
    }
    if (queuedAction.type === "chat_update_policy" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      const nextPolicy = queuedAction?.payload?.invitePolicy || "link";
      setQueuedAction(null);
      updateInvitePolicy(nextPolicy, true);
      return;
    }
    if (queuedAction.type === "chat_update_policy_room") {
      const targetRoomId = queuedAction?.payload?.roomId;
      const nextPolicy = queuedAction?.payload?.invitePolicy || "link";
      setQueuedAction(null);
      if (targetRoomId) updateInvitePolicyForRoom(targetRoomId, nextPolicy);
      return;
    }
    if (queuedAction.type === "chat_set_passcode" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      const passcode = queuedAction?.payload?.passcode || "";
      setQueuedAction(null);
      setRoomPasscode(passcode, true);
      return;
    }
    if (queuedAction.type === "chat_clear_passcode" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      setQueuedAction(null);
      clearRoomPasscode(true);
      return;
    }
    if (queuedAction.type === "chat_approve_user" && roomId && chatSessionId && queuedAction?.payload?.roomId === roomId) {
      const targetUserId = queuedAction?.payload?.targetUserId || "";
      setQueuedAction(null);
      approveUser(targetUserId, true);
      return;
    }
  }, [queuedAction, session?.user?.id, roomId, chatSessionId]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const handleScroll = () => {
      const isBottom = Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 50;
      setIsAtBottom(isBottom);
      if (isBottom) {
        setNewMessageCount(0);
      }
    };
    
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const currentCount = messages.length;
    
    if (currentCount > lastMessageCount) {
      const diff = currentCount - lastMessageCount;
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        setNewMessageCount((prev) => prev + diff);
      }
    }
    
    setLastMessageCount(currentCount);
  }, [messages.length, isAtBottom, lastMessageCount]);

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
    
    if (blockElement && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(blockElement.tagName)) {
      applyCommand('formatBlock', '<p>');
    } else {
      applyCommand('formatBlock', '<h2>');
    }
  };
  const sendTypingState = async (isTyping) => {
    if (!session?.user?.id || !roomId || !chatSessionId) return;
    try {
      await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, session_id: chatSessionId, is_typing: Boolean(isTyping) }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getQuotableContent = (msg, type) => {
    if (type === "gif") return "[GIF]";
    if (type === "poll") return "[Poll]";
    if (type === "reply") return "[Reply]";
    return stripHtml(msg?.content || "") || "Message";
  };

  const getReplyPreviewMeta = (entry) => {
    if (!entry) return null;
    if (entry.type === "gif") {
      return { type: "gif", url: entry?.gif?.url || "" };
    }
    if (entry.type === "poll") {
      return {
        type: "poll",
        question: entry?.poll?.question || "Poll",
        options: (entry?.poll?.options || []).slice(0, 2),
        mode: entry?.poll?.mode === "multiple" ? "multiple" : "single",
      };
    }
    return { type: "text", content: stripHtml(entry?.message?.content || "") || "Message" };
  };

  const resolveReplyPreviewMeta = (replyTo) => {
    if (!replyTo) return null;
    const source = (messages || []).find((msg) => String(msg?.id || "") === String(replyTo?.id || ""));
    if (source) {
      const sourceContent = String(source?.content || "");
      if (sourceContent.startsWith(GIF_PREFIX)) {
        const payload = safeParseJson(sourceContent.slice(GIF_PREFIX.length));
        return { type: "gif", url: payload?.url || "" };
      }
      if (sourceContent.startsWith(POLL_PREFIX)) {
        const payload = safeParseJson(sourceContent.slice(POLL_PREFIX.length));
        return {
          type: "poll",
          question: payload?.question || "Poll",
          options: Array.isArray(payload?.options) ? payload.options.slice(0, 2) : [],
          mode: payload?.mode === "multiple" ? "multiple" : "single",
        };
      }
      return { type: "text", content: stripHtml(sourceContent) || replyTo?.content || "Message" };
    }
    return replyTo?.preview || null;
  };

  const renderReplyPreview = (replyTo, compact = false) => {
    if (!replyTo) return <p className="line-clamp-2 break-words">Message</p>;
    const preview = resolveReplyPreviewMeta(replyTo);
    const previewType = preview?.type || replyTo.type || "text";

    if (previewType === "gif") {
      if (!preview?.url) return <p className="line-clamp-2 break-words">[GIF]</p>;
      return (
        <div className="flex items-center gap-2">
          <img
            src={preview.url}
            alt="GIF reply preview"
            className={`rounded object-cover border border-white/10 ${compact ? "h-8 w-12" : "h-10 w-14"}`}
            loading="lazy"
          />
          <span className="text-white/55 text-[11px] uppercase tracking-[0.12em]">GIF</span>
        </div>
      );
    }

    if (previewType === "poll") {
      return (
        <div className="space-y-0.5">
          <p className="line-clamp-1 break-words text-white/75">{preview?.question || replyTo.content || "[Poll]"}</p>
          {Array.isArray(preview?.options) && preview.options.length > 0 && (
            <p className="line-clamp-1 break-words text-white/45">
              {preview.options.join(" • ")}
              {replyTo?.preview?.mode === "multiple" ? " • Multi" : " • Single"}
            </p>
          )}
        </div>
      );
    }

    return <p className="line-clamp-2 break-words">{preview?.content || replyTo.content || "Message"}</p>;
  };

  const buildReplyPayload = (payload) => {
    if (!replyTarget?.message?.id) return payload;
    return `${REPLY_PREFIX}${JSON.stringify({
      reply_to: {
        id: replyTarget.message.id,
        author: replyTarget.message.author,
        created_at: replyTarget.message.created_at,
        content: getQuotableContent(replyTarget.message, replyTarget.type),
        type: replyTarget.type,
      },
      body: payload,
    })}`;
  };

  const sendMessageContent = async (contentHtml, skipMfaCheck = false) => {
    if (!session?.user?.id || !roomId || !chatSessionId) return;
    const rawContent = String(contentHtml || "");
    const payload = sanitizeHtml(contentHtml);
    if (!payload && !rawContent.startsWith(POLL_PREFIX) && !rawContent.startsWith(POLL_VOTE_PREFIX) && !rawContent.startsWith(GIF_PREFIX) && !rawContent.startsWith(REACTION_PREFIX)) return;
    const outgoingContent = rawContent.startsWith(POLL_PREFIX) || rawContent.startsWith(POLL_VOTE_PREFIX) || rawContent.startsWith(GIF_PREFIX) || rawContent.startsWith(REACTION_PREFIX)
      ? rawContent
      : buildReplyPayload(payload);
    const isAuxiliaryAction = rawContent.startsWith(POLL_VOTE_PREFIX) || rawContent.startsWith(REACTION_PREFIX);
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({
        pendingAction: { type: "chat_send", payload: { roomId, content: outgoingContent } },
      });
      if (!valid) return;
    }

    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage = {
      id: optimisticId,
      session_id: chatSessionId,
      author: displayName || "You",
      content: outgoingContent,
      created_at: new Date().toISOString(),
      pending: true,
    };
    optimisticMessagesRef.current[optimisticId] = optimisticMessage;
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      let res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, session_id: chatSessionId, content: outgoingContent }),
      });
      if (!res.ok && res.status >= 500) {
        res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: session?.user?.id, session_id: chatSessionId, content: outgoingContent }),
        });
      }
      if (res.ok) {
        if (!isAuxiliaryAction) {
          setInputHtml("");
          setReplyTarget(null);
          if (editorRef.current) editorRef.current.innerHTML = "";
          sendTypingState(false);
        }
      } else {
        delete optimisticMessagesRef.current[optimisticId];
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        const errorData = await res.json().catch(() => ({}));
        const detail = errorData?.detail;
        const detailMessage = typeof detail === "string"
          ? detail
          : detail?.message || "Message failed to send";
        toast.error(detailMessage);
      }
    } catch (err) {
      delete optimisticMessagesRef.current[optimisticId];
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error(err);
      toast.error("Message failed to send");
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    sendMessageContent(inputHtml, false);
  };

  const handleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji || !session?.user?.id || !roomId || !chatSessionId) return;
    try {
      const payload = `${REACTION_PREFIX}${JSON.stringify({ target_message_id: messageId, emoji })}`;
      await sendMessageContent(payload, true);
    } catch (err) {
      console.error("Reaction failed:", err);
      toast.error("Reaction failed to send");
    }
  };

  const sendReadReceipt = async (messageId) => {
    if (!messageId || !session?.user?.id || !roomId || !chatSessionId) return;
    if (messageReadByUser[messageId]) return;
    try {
      await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages/${messageId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, session_id: chatSessionId }),
      });
      setMessageReadByUser((prev) => ({ ...prev, [messageId]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const exportChat = async () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    try {
      const chatData = {
        room_id: roomId,
        exported_at: new Date().toISOString(),
        total_messages: messages.length,
        messages: messages.map((m) => ({
          author: m.author,
          content: m.content,
          created_at: m.created_at,
        })),
      };
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${roomId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Chat exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export chat");
    }
  };

  const handleReplyToMessage = (entry) => {
    if (!entry?.message?.id) return;
    setReplyTarget(entry);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (e.key !== "Enter") {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        if (stripHtml(inputHtml)) sendTypingState(true);
        else sendTypingState(false);
      }, 300);
    }
  };

  const copyInviteLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteRoom = async (skipMfaCheck = false, reasonInput = "") => {
    if (!session?.user?.id || !roomId) return;
    if (!skipMfaCheck) {
      const valid = verifySessionWithMfa({ pendingAction: { type: "chat_delete_room", payload: { roomId } } });
      if (!valid) return;
    }
    const actionSessionId = chatSessionId || "admin-action";
    const reason = (reasonInput || "Deleted by owner").trim() || "Deleted by owner";
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, session_id: actionSessionId, deletion_reason: reason }),
      });
      if (res.ok) {
        setRoomId(""); setChatSessionId(""); setMessages([]);
        setParticipants([]); setParticipantsCount(0);
        setRoomSettings({ invite_policy: "link", has_passcode: false, approved_count: 0 });
        setDeleteReason("Deleted by owner");
        const url = new URL(window.location.href);
        url.searchParams.delete("room");
        window.history.replaceState({}, "", url.toString());
        if (session?.user?.id) fetchChatHistory(session.user.id);
        toast.success("Room deleted");
      } else {
        toast.error("Failed to delete room");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    }
  };

  const deleteRoomById = async (targetRoomId, reasonInput = "") => {
    if (!session?.user?.id || !targetRoomId) return;
    const reason = (reasonInput || "Deleted by owner").trim() || "Deleted by owner";
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rooms/${targetRoomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          session_id: chatSessionId || "history-delete",
          deletion_reason: reason,
        }),
      });
      if (res.ok) {
        if (roomId === targetRoomId) {
          setRoomId("");
          setChatSessionId("");
          setMessages([]);
          setParticipants([]);
          setParticipantsCount(0);
        }
        const url = new URL(window.location.href);
        if (url.searchParams.get("room") === targetRoomId) {
          url.searchParams.delete("room");
          window.history.replaceState({}, "", url.toString());
        }
        fetchChatHistory(session.user.id);
        setHistoryDeleteDialog({ open: false, roomId: "" });
        setHistoryDeleteReason("Deleted by owner");
        toast.success("Room deleted");
      } else {
        toast.error("Failed to delete room");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    }
  };

  const submitPasscodeJoin = async () => {
    const value = (passcodeInput || "").trim();
    if (!value) {
      toast.error("Passcode is required");
      return;
    }
    const ctx = passcodeDialog;
    setPasscodeDialog({ open: false, roomId: "", userId: "", message: "" });
    setPasscodeInput("");
    await joinRoom(ctx.roomId, ctx.userId || session?.user?.id, value, true);
  };

  const submitSetRoomPasscode = async () => {
    await setRoomPasscode(newRoomPasscode);
  };

  const submitApproveUser = async () => {
    const value = (approveUserIdInput || "").trim();
    if (!value) {
      toast.error("User ID is required");
      return;
    }
    await approveUser(value);
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

  const derivedMessages = useMemo(() => {
    const viewerVoteKey = String(session?.user?.id || chatSessionId || "");
    const voteChoicesByPoll = {};
    const reactionVotesByMessage = {};
    const output = [];

    for (const msg of messages || []) {
      const content = String(msg?.content || "");

      if (content.startsWith(POLL_PREFIX)) {
        const payload = safeParseJson(content.slice(POLL_PREFIX.length));
        if (!payload?.id || !payload?.question || !Array.isArray(payload?.options)) continue;
        output.push({
          type: "poll",
          message: msg,
          poll: {
            id: payload.id,
            question: payload.question,
            options: payload.options,
            mode: payload.mode === "multiple" ? "multiple" : "single",
          },
        });
        continue;
      }

      if (content.startsWith(POLL_VOTE_PREFIX)) {
        const payload = safeParseJson(content.slice(POLL_VOTE_PREFIX.length));
        const pollId = String(payload?.poll_id || "");
        const voterKey = String(payload?.voter_key || "");
        let selectedIndices = [];
        if (Array.isArray(payload?.option_indices)) {
          selectedIndices = payload.option_indices
            .map((idx) => Number(idx))
            .filter((idx) => Number.isInteger(idx) && idx >= 0);
        } else {
          const optionIndex = Number(payload?.option_index);
          if (Number.isInteger(optionIndex) && optionIndex >= 0) {
            selectedIndices = [optionIndex];
          }
        }
        if (!pollId || !voterKey) continue;
        if (!voteChoicesByPoll[pollId]) voteChoicesByPoll[pollId] = {};
        voteChoicesByPoll[pollId][voterKey] = selectedIndices;
        continue;
      }

      if (content.startsWith(GIF_PREFIX)) {
        const payload = safeParseJson(content.slice(GIF_PREFIX.length));
        if (!payload?.url) continue;
        output.push({
          type: "gif",
          message: msg,
          gif: { url: payload.url },
        });
        continue;
      }

      if (content.startsWith(REACTION_PREFIX)) {
        const payload = safeParseJson(content.slice(REACTION_PREFIX.length));
        const targetMessageId = String(payload?.target_message_id || "");
        const emoji = String(payload?.emoji || "").trim();
        if (!targetMessageId || !emoji) continue;
        if (!reactionVotesByMessage[targetMessageId]) reactionVotesByMessage[targetMessageId] = {};
        reactionVotesByMessage[targetMessageId][msg.session_id || msg.id] = emoji;
        continue;
      }

      if (content.startsWith(REPLY_PREFIX)) {
        const payload = safeParseJson(content.slice(REPLY_PREFIX.length));
        if (!payload?.body) continue;
        output.push({
          type: "reply",
          message: msg,
          replyTo: payload.reply_to || null,
          body: payload.body,
        });
        continue;
      }

      output.push({ type: "text", message: msg });
    }

    return output.map((item) => {
      if (item.type === "poll") {
        const options = item.poll.options || [];
        const tally = new Array(options.length).fill(0);
        const votesMap = voteChoicesByPoll[item.poll.id] || {};
        for (const selectedIndices of Object.values(votesMap)) {
          const uniqueIndices = new Set((selectedIndices || []).map((idx) => Number(idx)));
          for (const n of uniqueIndices) {
            if (Number.isInteger(n) && n >= 0 && n < tally.length) tally[n] += 1;
          }
        }
        const totalVotes = tally.reduce((acc, n) => acc + n, 0);
        const mySelections = Array.isArray(votesMap[viewerVoteKey]) ? votesMap[viewerVoteKey] : [];
        return {
          ...item,
          poll: {
            ...item.poll,
            tally,
            totalVotes,
            mySelections,
          },
        };
      }

      if (item.message?.id) {
        const reactionMap = reactionVotesByMessage[item.message.id] || {};
        const reactionCounts = {};
        for (const key of Object.keys(reactionMap)) {
          const emoji = reactionMap[key];
          reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
        }
        return {
          ...item,
          reactions: reactionCounts,
        };
      }

      return item;
    });
  }, [messages, session?.user?.id, chatSessionId]);

  const sendPoll = async () => {
    const question = pollQuestion.trim();
    const options = pollOptionsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (!question) {
      toast.error("Poll question is required");
      return;
    }
    if (options.length < 2) {
      toast.error("Add at least 2 options");
      return;
    }

    const payload = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      question,
      options,
      mode: pollChoiceMode === "multiple" ? "multiple" : "single",
    };

    await sendMessageContent(`${POLL_PREFIX}${JSON.stringify(payload)}`, false);
    setPollDialogOpen(false);
    setPollQuestion("");
    setPollOptionsText("");
    setPollChoiceMode("single");
    toast.success("Poll created");
  };

  const votePoll = async (poll, optionIndex) => {
    const voterKey = String(session?.user?.id || chatSessionId || "");
    const pollId = String(poll?.id || "");
    if (!pollId || optionIndex < 0 || !voterKey) return;
    const isMultiple = poll?.mode === "multiple";
    const existingSelections = Array.isArray(poll?.mySelections) ? poll.mySelections : [];
    let nextSelections = [];
    if (isMultiple) {
      nextSelections = existingSelections.includes(optionIndex)
        ? existingSelections.filter((idx) => idx !== optionIndex)
        : [...existingSelections, optionIndex];
      nextSelections = [...new Set(nextSelections)].sort((a, b) => a - b);
    } else {
      nextSelections = [optionIndex];
    }
    const payload = {
      poll_id: pollId,
      option_index: nextSelections[0] ?? optionIndex,
      option_indices: nextSelections,
      voter_key: voterKey,
    };
    await sendMessageContent(`${POLL_VOTE_PREFIX}${JSON.stringify(payload)}`, false);
  };

  const sendGif = async () => {
    const url = (gifUrlInput || "").trim();
    if (!isLikelyGifUrl(url)) {
      toast.error("Enter a valid GIF URL");
      return;
    }
    await sendMessageContent(`${GIF_PREFIX}${JSON.stringify({ url })}`, false);
    setGifDialogOpen(false);
    setGifUrlInput("");
    toast.success("GIF sent");
  };

  useEffect(() => {
    if (!gifDialogOpen) return;
    setGifOffset(0);
    setHasMoreGifResults(true);
  }, [gifDialogOpen, gifSearchTerm]);

  useEffect(() => {
    if (!gifDialogOpen) return;
    const timer = window.setTimeout(async () => {
      const term = (gifSearchTerm || "").trim() || "cat";
      const initialPage = gifOffset === 0;
      if (initialPage) {
        setGifLoading(true);
        setGifNotice("");
      }
      try {
        const url = new URL("https://api.giphy.com/v1/gifs/search");
        url.searchParams.set("api_key", GIPHY_API_KEY);
        url.searchParams.set("q", term);
        url.searchParams.set("limit", String(GIF_PAGE_SIZE));
        url.searchParams.set("offset", String(gifOffset));
        url.searchParams.set("rating", "pg-13");
        url.searchParams.set("lang", "en");

        const res = await fetch(url.toString());
        const data = await res.json();
        const results = (data?.data || []).map((item) => ({
          id: item?.id || item?.images?.original?.url || item?.images?.fixed_height_small?.url || "",
          title: item?.title || term,
          url: item?.images?.original?.url || item?.images?.downsized?.url || item?.images?.fixed_height?.url || "",
          previewUrl: item?.images?.fixed_height_small?.url || item?.images?.preview_gif?.url || item?.images?.original?.url || "",
        })).filter((item) => item.url);

        if (results.length > 0) {
          setGifResults((prev) => {
            if (initialPage) return results;
            const seen = new Set(prev.map((g) => g.id));
            const unique = results.filter((g) => !seen.has(g.id));
            return [...prev, ...unique];
          });
          setHasMoreGifResults(results.length >= GIF_PAGE_SIZE);
        } else if (initialPage) {
          setGifResults(getLocalGifResults(term));
          setHasMoreGifResults(false);
          setGifNotice("No GIFs matched that search.");
        } else {
          setHasMoreGifResults(false);
        }
      } catch (err) {
        if (initialPage) {
          setGifResults(getLocalGifResults(term));
          setGifNotice("GIF search is unavailable right now.");
        }
        setHasMoreGifResults(false);
      } finally {
        setGifLoading(false);
        setGifLoadingMore(false);
      }
    }, gifOffset === 0 ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [gifDialogOpen, gifSearchTerm, gifOffset]);

  const handleGifListScroll = (e) => {
    if (gifLoading || gifLoadingMore || !hasMoreGifResults) return;
    const target = e.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
    if (!nearBottom) return;
    setGifLoadingMore(true);
    setGifOffset((prev) => prev + GIF_PAGE_SIZE);
  };

  const pickGif = async (url) => {
    if (!isLikelyGifUrl(url)) return;
    await sendMessageContent(`${GIF_PREFIX}${JSON.stringify({ url })}`, false);
    setGifDialogOpen(false);
    setGifUrlInput("");
    toast.success("GIF sent");
  };

  useEffect(() => {
    if (!gifDialogOpen) return;
    if (!gifSearchTerm.trim()) setGifSearchTerm("cat");
  }, [gifDialogOpen]);

  if (roomError) {
    return (
      <div className="fixed inset-0 bg-black text-white font-inconsolata flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              {roomError.type === "approval" ? (
                <ShieldAlert size={32} className="text-amber-400" />
              ) : (
                <AlertCircle size={32} className="text-red-500" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bitcount text-primary uppercase mb-2 tracking-wider">
            {roomError.title || "Room Unavailable"}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            {roomError.message || "This room is unavailable."}
          </p>
          {roomError.deletedAt && (
            <p className="text-xs text-white/35 mb-6">Deleted at: {formatTime(roomError.deletedAt)}</p>
          )}
          <button
            onClick={goToChatHistory}
            className="px-6 py-2.5 bg-primary text-black font-mono text-xs uppercase tracking-[0.15em] rounded-[8px] hover:bg-primary/90 transition-colors"
          >
            Back to Chat History
          </button>
        </motion.div>
      </div>
    );
  }

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
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="justify-self-start flex items-center gap-3 min-w-0">
            <button
              onClick={goToChatHistory}
              className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          <h1 className="text-base sm:text-lg font-bitcount text-primary uppercase tracking-wider text-center truncate">
            Anonymous Chat
          </h1>

          <div className="justify-self-end flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/50">
              {connectionStatus === "connected" ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-amber-400" />}
              <span>{connectionStatus === "connected" ? "Connected" : "Reconnecting"}</span>
            </div>

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
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-primary/80">
                        Creator controls
                      </p>
                      <p className="text-[10px] text-white/45 mt-1">
                        {roomSettings.invite_policy === "approval"
                          ? "Approval-only mode is active"
                          : "Link access mode is active"}
                      </p>
                    </div>
                    {pendingApprovals.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-amber-300/80 mb-1.5">
                            Approval requests · {pendingApprovals.length}
                          </p>
                          <div className="max-h-28 overflow-y-auto space-y-1">
                            {pendingApprovals.map((req, idx) => (
                              <button
                                key={`${req.user_id || req.email || "req"}-${idx}`}
                                type="button"
                                onClick={() => req?.user_id && approveUser(req.user_id)}
                                className="w-full text-left px-2 py-1 rounded-[6px] border border-white/10 hover:border-primary/40 hover:bg-primary/10 transition-colors"
                              >
                                <p className="text-xs text-white/85 truncate">{req.email || req.user_id || "Unknown requester"}</p>
                                <p className="text-[10px] text-white/40">Tap to approve</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {pendingApprovals.length === 0 && (
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] text-white/40">No pending approval requests</p>
                      </div>
                    )}
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(roomId);
                        toast.success("Room ID copied");
                      }}
                    >
                      <Copy size={14} />
                      Copy room ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={(e) => { e.preventDefault(); updateInvitePolicy(roomSettings.invite_policy === "link" ? "approval" : "link"); }}
                    >
                      <ShieldAlert size={14} />
                      {roomSettings.invite_policy === "link" ? "Switch to approval-only" : "Switch to link access"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        setSetPasscodeDialogOpen(true);
                      }}
                    >
                      <KeyRound size={14} />
                      {roomSettings.has_passcode ? "Change passcode" : "Set passcode"}
                    </DropdownMenuItem>
                    {roomSettings.has_passcode && (
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={(e) => { e.preventDefault(); clearRoomPasscode(); }}
                      >
                        <KeyRound size={14} />
                        Clear passcode
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        setApproveDialogOpen(true);
                      }}
                    >
                      <ShieldAlert size={14} /> Approve user id
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={(e) => { e.preventDefault(); exportChat(); }}
                    >
                      <Sparkles size={14} /> Export chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-300 gap-2"
                      onSelect={(e) => { e.preventDefault(); setDeleteDialogOpen(true); }}
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
                                joinRoom(room.id, session?.user?.id);
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
                                joinRoom(room.id, session?.user?.id);
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
                                  onClick={() => updateInvitePolicyForRoom(room.id, "approval")}
                                  className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                                >
                                  <ShieldAlert size={12} className="mr-2" />
                                  Set approval-only
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => updateInvitePolicyForRoom(room.id, "link")}
                                  className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                                >
                                  <Link2 size={12} className="mr-2" />
                                  Set link access
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => {
                                    setRoomId(room.id);
                                    const url = new URL(window.location.href);
                                    url.searchParams.set("room", room.id);
                                    window.history.replaceState({}, "", url.toString());
                                    joinRoom(room.id, session?.user?.id);
                                  }}
                                  className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                                >
                                  <MoreVertical size={12} className="mr-2" />
                                  Open creator controls
                                </ContextMenuItem>
                                <ContextMenuSeparator className="bg-white/10" />
                                <ContextMenuItem
                                  onClick={() => {
                                    setHistoryDeleteDialog({ open: true, roomId: room.id });
                                    setHistoryDeleteReason("Deleted by owner");
                                  }}
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
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/5 hover:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs uppercase tracking-[0.15em] text-white/25">No messages yet</p>
                  </div>
                )}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-primary/60">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="uppercase tracking-[0.12em]">
                      {typingUsers.slice(0, 2).map((u) => u.display_name).join(", ")} {typingUsers.length > 2 ? `+${typingUsers.length - 2}` : ""} typing…
                    </span>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {derivedMessages.map((entry, idx) => {
                    const m = entry.message;
                    const mine = isMine(m);
                    const reactionEntries = Object.entries(entry.reactions || {});
                    const messageBodyHtml = entry.type === "reply" ? entry.body : m.content;
                    return (
                      <motion.div
                        key={`${m.id}-${entry.type}-${idx}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`group flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                      >
                        <div className={`flex items-center gap-2 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                          <span className={`text-[10px] uppercase tracking-[0.15em] ${mine ? "text-primary" : "text-white/35"}`}>
                            {mine ? "you" : m.author}
                          </span>
                          <span className="text-xs text-white/30">{formatTime(m.created_at)}</span>
                          {m.pending && (
                            <span className="text-[10px] uppercase tracking-[0.12em] text-primary/60">sending...</span>
                          )}
                        </div>
                        {(entry.type === "text" || entry.type === "reply") && (
                          <div
                            className={`max-w-[80%] sm:max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                              [&_h2]:text-base [&_h2]:text-primary [&_h2]:font-bitcount [&_h2]:mt-1
                              [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
                              [&_strong]:font-bold [&_em]:italic [&_u]:underline
                              ${mine
                                ? "bg-primary/10 border border-primary/20 text-white rounded-tr-sm"
                                : "bg-white/5 border border-white/8 text-gray-300 rounded-tl-sm"
                              }`}
                          >
                            {entry.type === "reply" && (
                              <div className="mb-2 rounded-[10px] border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] text-white/55">
                                <p className="uppercase tracking-[0.14em] text-primary/80 mb-1">Replying to {entry.replyTo?.author || "message"}</p>
                                {renderReplyPreview(entry.replyTo, false)}
                              </div>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(messageBodyHtml) }} />
                          </div>
                        )}

                        {entry.type === "gif" && (
                          <div className={`max-w-[80%] sm:max-w-[68%] p-2 rounded-2xl border ${mine ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/5"}`}>
                            <img
                              src={entry.gif.url}
                              alt="GIF"
                              className="rounded-xl max-h-64 w-auto object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {entry.type === "poll" && (
                          <div className={`max-w-[88%] sm:max-w-[72%] px-3 py-3 rounded-2xl border ${mine ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/5"}`}>
                            <p className="text-xs uppercase tracking-[0.13em] text-primary mb-1">
                              Poll • {entry.poll.mode === "multiple" ? "Multiple choice" : "Single choice"}
                            </p>
                            <p className="text-sm text-white mb-2">{entry.poll.question}</p>
                            <div className="space-y-1.5">
                              {(entry.poll.options || []).map((opt, optionIdx) => {
                                const votes = entry.poll.tally?.[optionIdx] || 0;
                                const total = entry.poll.totalVotes || 0;
                                const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                                const selected = (entry.poll.mySelections || []).includes(optionIdx);
                                return (
                                  <button
                                    key={`${entry.poll.id}-${optionIdx}`}
                                    type="button"
                                    onClick={() => votePoll(entry.poll, optionIdx)}
                                    className={`relative w-full text-left border rounded-[8px] px-2 py-2 overflow-hidden transition-colors ${selected ? "border-primary/60 bg-primary/15" : "border-white/10 hover:border-primary/40 hover:bg-primary/10"}`}
                                  >
                                    <div
                                      className="absolute inset-y-0 left-0 bg-primary/15 transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs text-white/85 truncate">{selected ? `✓ ${opt}` : opt}</span>
                                      <span className="text-[10px] text-white/45">{votes} ({pct}%)</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-white/35 mt-2">
                              {entry.poll.mode === "multiple" ? "Choose one or more options" : "Choose one option"}
                            </p>
                            <p className="text-[10px] text-white/40 mt-2">Total votes: {entry.poll.totalVotes || 0}</p>
                          </div>
                        )}

                        {reactionEntries.length > 0 && (
                          <div className={`flex flex-wrap gap-1.5 max-w-[88%] sm:max-w-[72%] ${mine ? "justify-end" : "justify-start"}`}>
                            {reactionEntries.map(([emoji, count]) => (
                              <span key={`${m.id}-${emoji}`} className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
                                {emoji} {count}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className={`flex flex-wrap items-center gap-1.5 px-1 ${mine ? "justify-end" : "justify-start"}`}>
                          <button
                            type="button"
                            onClick={() => handleReplyToMessage(entry)}
                            className="text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-primary transition-colors"
                          >
                            Reply
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[11px] rounded-full border border-white/10 bg-white/[0.03] p-1.5 text-white/55 hover:border-primary/40 hover:text-primary"
                                title="Add reaction"
                              >
                                <Smile size={13} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={mine ? "end" : "start"} className="bg-black border border-white/15 text-white min-w-[220px] p-2">
                              <div className="grid grid-cols-5 gap-1">
                                {REACTION_PICKER_EMOJIS.map((emoji) => (
                                  <DropdownMenuItem
                                    key={`${m.id}-${emoji}`}
                                    onClick={() => handleReaction(m.id, emoji)}
                                    className="cursor-pointer justify-center rounded-[6px] text-base hover:bg-white/10"
                                  >
                                    {emoji}
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {mine && messageReadByUser[m.id] && (
                            <span className="text-[10px] text-primary/50 ml-auto" title="Message read">✓✓</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Go to Bottom Button */}
              {!isAtBottom && (
                <button
                  type="button"
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="absolute bottom-24 right-6 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-black hover:bg-primary/80 shadow-lg transition-all z-40"
                  title="Go to latest messages"
                >
                  <div className="relative flex items-center justify-center">
                    <ChevronDown size={18} />
                    {newMessageCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {newMessageCount > 99 ? "99+" : newMessageCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

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
                      { name: "divider" },
                      { cmd: "poll", icon: <BarChart3 size={11} />, title: "Create Poll", onClick: () => setPollDialogOpen(true), label: "Poll" },
                      { cmd: "gif", icon: <Image size={11} />, title: "Send GIF", onClick: () => setGifDialogOpen(true), label: "GIF" },
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
                          className={`h-7 flex items-center justify-center gap-1 rounded-[5px] text-white/35 hover:text-white hover:bg-white/10 transition-all cursor-pointer px-2 ${btn.label ? "min-w-[60px]" : "w-7"}`}
                        >
                          {btn.icon}
                          {btn.label && <span className="text-[10px] uppercase tracking-[0.12em]">{btn.label}</span>}
                        </button>
                      )
                    )}
                    <span className="ml-auto text-xs text-white/35 uppercase tracking-[0.1em] hidden sm:block whitespace-nowrap">
                      ↵ send · shift↵ newline
                    </span>
                  </div>

                  {replyTarget && (
                    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-white/75">
                      <div className="min-w-0">
                        <p className="uppercase tracking-[0.14em] text-primary mb-0.5">Replying to {replyTarget.message?.author || "message"}</p>
                        <div className="truncate text-white/55">
                          {renderReplyPreview({
                            author: replyTarget.message?.author,
                            type: replyTarget.type,
                            content: getQuotableContent(replyTarget.message, replyTarget.type),
                            preview: getReplyPreviewMeta(replyTarget),
                            id: replyTarget.message?.id,
                          }, true)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyTarget(null)}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Cancel reply"
                      >
                        ×
                      </button>
                    </div>
                  )}

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
                      onInput={(e) => {
                        const html = e.currentTarget.innerHTML;
                        setInputHtml(html);
                        window.clearTimeout(typingTimerRef.current);
                        if (stripHtml(html)) {
                          typingTimerRef.current = window.setTimeout(() => sendTypingState(true), 300);
                        } else {
                          sendTypingState(false);
                        }
                      }}
                      className="flex-1 min-h-[38px] max-h-32 overflow-y-auto px-3 py-2
                        border border-white/10 rounded-[8px] outline-none text-[15px] leading-relaxed
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

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.1em] text-white/35">
                      {replyTarget ? "Reply mode" : "Ephemeral"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      <AlertDialog open={passcodeDialog.open} onOpenChange={(open) => setPasscodeDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary uppercase tracking-[0.1em]">Room Passcode</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {passcodeDialog.message || "Enter the passcode for this room."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-primary/50"
            placeholder="Enter passcode"
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPasscodeInput("");
                goToChatHistory();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={submitPasscodeJoin}>Join Room</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 uppercase tracking-[0.1em]">Delete Room</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. Everyone will lose access to this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-red-400/60"
            placeholder="Tombstone reason (optional)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                deleteRoom(false, deleteReason);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={setPasscodeDialogOpen} onOpenChange={setSetPasscodeDialogOpen}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary uppercase tracking-[0.1em]">
              {roomSettings.has_passcode ? "Change Room Passcode" : "Set Room Passcode"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Set a passcode to restrict room joins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            value={newRoomPasscode}
            onChange={(e) => setNewRoomPasscode(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-primary/50"
            placeholder="Enter new passcode"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewRoomPasscode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitSetRoomPasscode}>Save Passcode</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary uppercase tracking-[0.1em]">Approve User</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Enter the user ID to allow access to this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={approveUserIdInput}
            onChange={(e) => setApproveUserIdInput(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-primary/50"
            placeholder="Enter user ID"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApproveUserIdInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitApproveUser}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={historyDeleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryDeleteDialog({ open: false, roomId: "" });
            setHistoryDeleteReason("Deleted by owner");
          } else {
            setHistoryDeleteDialog((prev) => ({ ...prev, open: true }));
          }
        }}
      >
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 uppercase tracking-[0.1em]">Delete Room</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will delete the selected room and keep a tombstone reason for shared links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={historyDeleteReason}
            onChange={(e) => setHistoryDeleteReason(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-red-400/60"
            placeholder="Tombstone reason (optional)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteRoomById(historyDeleteDialog.roomId, historyDeleteReason)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary uppercase tracking-[0.1em]">Create Poll</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Ask a question and add options (one per line, max 8 options).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-primary/50"
            placeholder="Poll question"
          />
          <textarea
            value={pollOptionsText}
            onChange={(e) => setPollOptionsText(e.target.value)}
            className="min-h-[110px] w-full bg-black/50 border border-white/20 rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary/50"
            placeholder={"Option 1\nOption 2\nOption 3"}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPollChoiceMode("single")}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] rounded-[8px] border transition-colors ${pollChoiceMode === "single" ? "border-primary/60 bg-primary/20 text-primary" : "border-white/20 text-white/60 hover:border-primary/40 hover:text-white"}`}
            >
              Single Choice
            </button>
            <button
              type="button"
              onClick={() => setPollChoiceMode("multiple")}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] rounded-[8px] border transition-colors ${pollChoiceMode === "multiple" ? "border-primary/60 bg-primary/20 text-primary" : "border-white/20 text-white/60 hover:border-primary/40 hover:text-white"}`}
            >
              Multiple Choice
            </button>
          </div>
          {pollQuestion && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs uppercase text-white/50 mb-2">Preview:</p>
              <div className="space-y-1">
                <p className="text-sm text-white font-bold">{pollQuestion}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-primary/80">
                  {pollChoiceMode === "multiple" ? "Multiple choice" : "Single choice"}
                </p>
                {pollOptionsText
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((opt, idx) => (
                    <div key={idx} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/70">
                      {opt}
                    </div>
                  ))}
                {pollOptionsText
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean).length === 0 && <p className="text-xs text-white/30 italic">Add options above</p>}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendPoll}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={gifDialogOpen} onOpenChange={setGifDialogOpen}>
        <AlertDialogContent className="bg-black border border-white/15 text-white font-inconsolata max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary uppercase tracking-[0.1em] flex items-center gap-2">
              <Sparkles size={14} /> GIF Picker
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Search GIFs by keyword, or paste a direct URL below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <Input
                type="text"
                value={gifSearchTerm}
                onChange={(e) => setGifSearchTerm(e.target.value)}
                className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] pl-9 pr-3 text-sm outline-none focus:border-primary/50"
                placeholder="Search GIFs"
              />
            </div>

            <div className="max-h-72 overflow-y-auto pr-1" onScroll={handleGifListScroll}>
              {gifLoading ? (
                <div className="py-8 flex items-center justify-center text-white/45 gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Loading GIFs...
                </div>
              ) : gifNotice ? (
                <p className="text-xs text-white/45">{gifNotice}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gifResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => pickGif(item.url)}
                      className="group overflow-hidden rounded-[10px] border border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
                      title={item.title}
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="h-28 w-full object-cover group-hover:scale-[1.02] transition-transform"
                        loading="lazy"
                      />
                      <div className="px-2 py-1">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/55 truncate">
                          {item.title || "GIF"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {gifLoadingMore && (
                <div className="py-3 flex items-center justify-center text-white/45 gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Loading more GIFs...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Direct URL fallback</p>
              <Input
                type="text"
                value={gifUrlInput}
                onChange={(e) => setGifUrlInput(e.target.value)}
                className="h-10 w-full bg-black/50 border border-white/20 rounded-[8px] px-3 text-sm outline-none focus:border-primary/50"
                placeholder="https://..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendGif}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}