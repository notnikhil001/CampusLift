import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { connectSocket, getSocket } from '../lib/socket';
import { TravelGroup, Location } from '../types';
import { ReportModal } from '../components/ReportModal';
import {
  Users,
  Clock,
  MapPin,
  Send,
  ShieldCheck,
  Flag,
  LogOut,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<TravelGroup | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [messageText, setMessageText] = useState('');
  const [newTimeInput, setNewTimeInput] = useState('');
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState('');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id?: string; name?: string }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchGroup = async () => {
    if (!groupId) return;
    const res = await apiFetch<TravelGroup>(`/groups/${groupId}`);
    if (res.success && res.data) {
      setGroup(res.data);
      if (res.data.commonTime) setNewTimeInput(res.data.commonTime);
      if (res.data.meetingPointId) setSelectedMeetingPoint(res.data.meetingPointId);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  // Fetch college locations for meeting point dropdown
  useEffect(() => {
    if (group?.collegeId) {
      apiFetch<Location[]>(`/colleges/${group.collegeId}/locations`).then((res) => {
        if (res.success && res.data) setLocations(res.data);
      });
    }
  }, [group?.collegeId]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!groupId || !group?.isMember) return;

    const socket = connectSocket();
    socket.emit('join_group', { groupId });

    socket.on('new_message', (msg) => {
      setGroup((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg],
        };
      });
    });

    socket.on('time_updated', ({ commonTime, message }) => {
      setGroup((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          commonTime,
          messages: [...(prev.messages || []), message],
        };
      });
    });

    socket.on('meeting_point_updated', ({ meetingPoint, message }) => {
      setGroup((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          meetingPoint,
          meetingPointId: meetingPoint?.id,
          messages: [...(prev.messages || []), message],
        };
      });
    });

    return () => {
      socket.emit('leave_group_room', { groupId });
      socket.off('new_message');
      socket.off('time_updated');
      socket.off('meeting_point_updated');
    };
  }, [groupId, group?.isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [group?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !groupId) return;

    const socket = getSocket();
    socket.emit('send_message', { groupId, content: messageText });
    setMessageText('');
  };

  const handleJoin = async () => {
    if (!groupId) return;
    const res = await apiFetch('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    });

    setShowJoinModal(false);
    if (res.success) {
      fetchGroup();
    }
  };

  const handleLeave = async () => {
    if (!groupId) return;
    const res = await apiFetch(`/groups/${groupId}/leave`, { method: 'POST' });
    if (res.success) {
      fetchGroup();
    }
  };

  const handleUpdateTime = async () => {
    if (!groupId || !newTimeInput) return;
    const socket = getSocket();
    socket.emit('propose_time', { groupId, commonTime: newTimeInput });
  };

  const handleUpdateMeetingPoint = async (locationId: string) => {
    if (!groupId || !locationId) return;
    setSelectedMeetingPoint(locationId);
    const socket = getSocket();
    socket.emit('confirm_meeting_point', { groupId, meetingPointId: locationId });
  };

  const handleStatusTransition = async (status: string) => {
    if (!groupId) return;
    const res = await apiFetch(`/groups/${groupId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.success) fetchGroup();
  };

  if (!group) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Group Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {group.date}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {group.fromLocation.name} &rarr; {group.toLocation.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
              Status: {group.status}
            </span>

            {group.isMember ? (
              <button
                onClick={handleLeave}
                className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Group
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Join Group
              </button>
            )}
          </div>
        </div>

        {/* Coordination Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          {/* Common Travel Time */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Common Travel Time
            </label>
            {group.isMember ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 5:30 PM"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
                <button
                  onClick={handleUpdateTime}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shrink-0"
                >
                  Propose
                </button>
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-900">
                {group.commonTime || 'To be coordinated'}
              </span>
            )}
          </div>

          {/* Meeting Point */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Meeting Point
            </label>
            {group.isMember ? (
              <select
                value={selectedMeetingPoint}
                onChange={(e) => handleUpdateMeetingPoint(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Meeting Point</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900">
                {group.meetingPoint?.name || 'Not confirmed yet'}
              </span>
            )}
          </div>
        </div>

        {/* State Machine Transition Controls for Members */}
        {group.isMember && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Update Trip State:
            </span>
            {group.status === 'PLANNING' && (
              <button
                onClick={() => handleStatusTransition('READY')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Mark Ready
              </button>
            )}
            {(group.status === 'READY' || group.status === 'PLANNING') && (
              <button
                onClick={() => handleStatusTransition('ACTIVE')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
              >
                Start Trip
              </button>
            )}
            {group.status === 'ACTIVE' && (
              <button
                onClick={() => handleStatusTransition('COMPLETED')}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
              >
                Complete Trip
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Left Members, Right Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Members */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Group Members</span>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {group.members.length}
              </span>
            </h3>

            <div className="space-y-3">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                      {m.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-slate-900">{m.user.name}</span>
                        {m.user.isVerified && (
                          <span title="Verified Student">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {m.role === 'LEADER' ? '👑 Leader' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {m.userId !== user?.id && (
                    <button
                      onClick={() => {
                        setReportTarget({ id: m.userId, name: m.user.name });
                        setShowReportModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                      title="Report User"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Group Real-Time Chat */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            {/* Chat Title Bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Group Coordination Chat
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {group.isMember ? '💬 Live Socket.IO' : '🔒 Members Only'}
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
              {!group.isMember ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    🔒
                  </div>
                  <h4 className="font-bold text-slate-900">Chat is private to group members</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Join this travel group to participate in real-time coordination chat.
                  </p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Join Group to View Chat
                  </button>
                </div>
              ) : group.messages && group.messages.length > 0 ? (
                group.messages.map((msg) => {
                  if (msg.isSystemMessage) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-bold text-slate-600">
                          {isMe ? 'You' : msg.sender?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm font-medium ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-12">
                  No messages yet. Send a message to start coordinating!
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Form */}
            {group.isMember && (
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-b-3xl"
              >
                <input
                  type="text"
                  placeholder="Type a message to coordinate..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Join Confirmation Modal with Product Principle Disclaimer */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Join this travel group?</h3>

            <div className="bg-indigo-50 p-4 rounded-2xl space-y-2 text-xs text-indigo-950 font-medium">
              <p className="font-bold text-sm text-indigo-900">By joining, you can:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>See verified member details</li>
                <li>Chat with members in real-time</li>
                <li>Coordinate common travel time</li>
                <li>Coordinate campus meeting point</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Notice:</strong> CampusLift connects students for travel discovery.
                CampusLift does NOT book or pay for the auto/taxi vehicle. You will coordinate the ride together.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
              >
                Confirm &amp; Join Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {showReportModal && (
        <ReportModal
          reportedUserId={reportTarget.id}
          groupId={groupId}
          targetName={reportTarget.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
