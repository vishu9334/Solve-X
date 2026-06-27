import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import useNotificationStore from "../../features/notifications/store/notification.store.js";
import { useSelectMentor } from "../../features/doubt/hooks/useDoubt.js";
import api from "../../lib/axios.js";
import NotificationSendingOverlay from "./NotificationSendingOverlay";
import AcceptSuccessOverlay from "./AcceptSuccessOverlay";
import { RiMailUnreadLine, RiMailAiLine, RiCheckboxCircleLine, RiMailCloseLine, RiMessage2Line, RiPassExpiredLine, RiErrorWarningLine, RiAwardLine } from "react-icons/ri";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return past.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const NotificationIcon = ({ notif }) => {
  if (notif.icon === "RiMailUnreadLine") {
    return <RiMailUnreadLine className="w-4.5 h-4.5 text-blue-400" />;
  }
  if (notif.icon === "RiMailAiLine") {
    return <RiMailAiLine className="w-4.5 h-4.5 text-blue-400" />;
  }
  if (notif.icon === "RiCheckboxCircleLine") {
    return <RiCheckboxCircleLine className="w-4.5 h-4.5 text-emerald-400" />;
  }
  if (notif.icon === "RiMailCloseLine") {
    return <RiMailCloseLine className="w-4.5 h-4.5 text-rose-400" />;
  }
  if (notif.icon === "RiMessage2Line") {
    return <RiMessage2Line className="w-4.5 h-4.5 text-blue-400" />;
  }
  if (notif.icon === "RiPassExpiredLine") {
    return <RiPassExpiredLine className="w-4.5 h-4.5 text-amber-400" />;
  }
  if (notif.icon === "RiErrorWarningLine") {
    return <RiErrorWarningLine className="w-4.5 h-4.5 text-rose-500 animate-pulse" />;
  }
  if (notif.icon === "RiAwardLine") {
    return <RiAwardLine className="w-4.5 h-4.5 text-amber-400" />;
  }

  if (notif.type === "new_doubt" || notif.type === "offer" || notif.type === "chat") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-blue-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-indigo-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  );
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAllRead, markOneRead, removeNotification, clearAll } = useNotificationStore();
  const { mutate: selectMentor, isPending: isAccepting } = useSelectMentor();

  // Local state for mentor inputs
  const [offerInputs, setOfferInputs] = useState({}); // { [notifId]: { price: '', duration: '' } }
  const [isSendingOffer, setIsSendingOffer] = useState({}); // { [notifId]: boolean }
  const isAnySendingOffer = Object.values(isSendingOffer).some(Boolean);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState("");

  const handleInputChange = (notifId, field, value) => {
    setOfferInputs((prev) => ({
      ...prev,
      [notifId]: {
        ...prev[notifId],
        [field]: value,
      },
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    markOneRead(notif.id);
    setIsOpen(false);
    if (notif.route) {
      navigate(notif.route);
    }
  };

  const handleAcceptOffer = (e, notif) => {
    e.stopPropagation();
    const { doubtSessionId, mentorId } = notif.payload || {};
    if (!doubtSessionId || !mentorId) {
      toast.error("Invalid offer details.");
      return;
    }

    selectMentor(
      { doubtSessionId, selectedMentorId: mentorId },
      {
        onSuccess: (data) => {
          markOneRead(notif.id);
          setIsOpen(false);
          const chatRoomId = data?.data?.chatRoomId || data?.chatRoomId;
          const targetUrl = chatRoomId ? `/chat/${chatRoomId}` : "/dashboard/student";
          setSuccessRedirectUrl(targetUrl);
          setShowSuccess(true);
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to accept offer.");
        }
      }
    );
  };

  const handleDeclineOffer = (e, notif) => {
    e.stopPropagation();
    removeNotification(notif.id);
    toast.info("Offer dismissed.");
  };

  const handleSendOffer = async (e, notif) => {
    e.stopPropagation();
    const notifId = notif.id;
    const inputs = offerInputs[notifId] || {};
    const price = parseFloat(inputs.price);
    const date = inputs.date?.trim();
    const time = inputs.time?.trim();

    if (!price || price <= 0 || isNaN(price)) {
      toast.error("Please enter a valid positive price.");
      return;
    }
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    if (!time) {
      toast.error("Please select a time.");
      return;
    }

    const availableTime = `${date} at ${time}`;

    setIsSendingOffer((prev) => ({ ...prev, [notifId]: true }));
    try {
      const response = await api.post("/mentor/reply-doubt", {
        doubtSessionId: notif.payload.doubtSessionId,
        price,
        availableTime,
      });

      toast.success(response.data?.message || "Offer sent successfully!");
      markOneRead(notifId);
      removeNotification(notifId);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send offer.");
    } finally {
      setIsSendingOffer((prev) => ({ ...prev, [notifId]: false }));
    }
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <NotificationSendingOverlay isOpen={isAnySendingOffer || isAccepting} message={isAccepting ? "Accepting offer..." : "Sending offer..."} />
      <AcceptSuccessOverlay
        isOpen={showSuccess}
        onComplete={() => {
          setShowSuccess(false);
          if (successRedirectUrl) {
            navigate(successRedirectUrl);
          }
        }}
      />
      {/* Bell Icon Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-xl select-none">
          notifications
        </span>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[2000] font-sans"
            style={{
              background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.055'/%3E%3C/svg%3E"), radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.75) 0%, rgba(200, 220, 255, 0.45) 25%, transparent 60%), radial-gradient(circle at 20% 30%, #16247d 0%, #0d123d 60%, #06081e 100%)`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider uppercase font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="bg-transparent border-none text-[10px] font-bold text-sky-400 hover:text-sky-350 cursor-pointer uppercase tracking-wider transition-colors"
                  >
                    Mark all
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="bg-transparent border-none text-[10px] font-bold text-rose-400 hover:text-rose-350 cursor-pointer uppercase tracking-wider transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5 scrollbar-hide" data-lenis-prevent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-400/80">
                  <span className="material-symbols-outlined text-4xl mb-2 text-neutral-500">
                    notifications_off
                  </span>
                  <p className="text-xs font-semibold tracking-widest uppercase font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 p-3.5 hover:bg-white/[0.07] transition-colors cursor-pointer ${!notif.isRead ? "bg-white/[0.04]" : ""
                      }`}
                  >
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                      <NotificationIcon notif={notif} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 font-sans">
                      <p className={`font-sans text-[13px] leading-relaxed tracking-wide break-words ${!notif.isRead ? "text-white font-semibold" : "text-neutral-200"
                        }`}>
                        {notif.message}
                      </p>

                      {notif.type === "new_doubt" && notif.payload && (
                        <div className="flex flex-col gap-2 mt-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-1">
                            <span>Send Bid Offer</span>
                            <span className="bg-amber-300/10 px-2 py-0.5 rounded border border-amber-300/20 text-[9px] font-mono normal-case">
                              Duration: {notif.payload.sessionDuration || "N/A"} mins
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <div className="w-1/2 flex flex-col gap-1">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase">Price</span>
                                <input
                                  type="number"
                                  placeholder="Price ($)"
                                  value={offerInputs[notif.id]?.price || ""}
                                  onChange={(e) => handleInputChange(notif.id, "price", e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-300 transition-colors"
                                />
                              </div>
                              <div className="w-1/2 flex flex-col gap-1">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase">Date</span>
                                <input
                                  type="date"
                                  value={offerInputs[notif.id]?.date || ""}
                                  onChange={(e) => handleInputChange(notif.id, "date", e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-amber-300 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-neutral-400 font-bold uppercase">Available Time</span>
                              <input
                                type="time"
                                value={offerInputs[notif.id]?.time || ""}
                                onChange={(e) => handleInputChange(notif.id, "time", e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-300 transition-colors"
                              />
                            </div>
                          </div>

                          <button
                            disabled={isSendingOffer[notif.id]}
                            onClick={(e) => handleSendOffer(e, notif)}
                            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-[#0c0b11] font-bold text-[9px] uppercase tracking-wider py-1.5 rounded-lg cursor-pointer transition-colors border-none mt-1"
                          >
                            {isSendingOffer[notif.id] ? "Sending..." : "Send Offer"}
                          </button>
                        </div>
                      )}

                      {notif.type === "offer" && notif.payload && (
                        <div className="text-[11px] text-emerald-400 font-bold font-mono my-0.5">
                          Price: ${notif.payload.price} | Session Slot: {notif.payload.availableTime}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                        {notif.isOffline && (
                          <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[8.5px] font-medium text-sky-400">
                            📬 Pending Delivery
                          </span>
                        )}
                      </div>

                      {notif.type === "offer" && notif.payload && (
                        <div className="flex gap-2 mt-2">
                          <button
                            disabled={isAccepting}
                            onClick={(e) => handleAcceptOffer(e, notif)}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-full cursor-pointer transition-colors border-none"
                          >
                            Accept
                          </button>
                          <button
                            disabled={isAccepting}
                            onClick={(e) => handleDeclineOffer(e, notif)}
                            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-full cursor-pointer transition-colors border-none"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator or Dismiss close button */}
                    <div className="flex items-center justify-center shrink-0 min-w-[20px] self-center">
                      {!notif.isRead ? (
                        <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                          className="bg-transparent border-none p-0 text-white/30 hover:text-white/60 cursor-pointer flex items-center justify-center transition-colors"
                          title="Dismiss"
                        >
                          <span className="material-symbols-outlined text-sm select-none">
                            close
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
