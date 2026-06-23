import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetAdminDashboard } from '../hooks/adminDashboard.hook.js';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";

const StatCard = ({ label, value, accentClass }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-md box-border">
    <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 m-0">{label}</p>
    <p className={`mt-2 text-3xl font-bold m-0 ${accentClass}`}>{value}</p>
  </div>
);

const AdminDashboard = () => {
    const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
    const { data: adminResponse, isLoading: isAdminLoading, isError: isAdminError, error: adminError } = useGetAdminDashboard();

    if (isCheckingSession) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-white/60 font-mono animate-pulse">Checking admin session...</div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (currentUser.role !== 'admin') {
        if (currentUser.role === 'mentor') return <Navigate to="/mentor-landing" replace />;
        return <Navigate to="/student-landing" replace />;
    }

    if (isAdminLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-48 h-48">
                    <DotLottieReact
                        src="https://lottie.host/9afc5d4a-2c61-442d-a9bf-3d2fb40fd9e3/aqVwXNG7Kj.lottie"
                        loop
                        autoplay
                    />
                </div>
            </div>
        );
    }

    if (isAdminError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-64 h-64">
                    <DotLottieReact
                        src="https://lottie.host/8e039cbf-c1db-4ecb-85f8-37e14bbb277e/PWiyGNpCea.lottie"
                        loop
                        autoplay
                    />
                </div>
                <p className="text-red-500 font-semibold tracking-wider uppercase text-sm m-0">
                    {adminError?.message || "Failed to load dashboard metrics"}
                </p>
            </div>
        );
    }

    const dashboardData = adminResponse?.data || {};
    const { users = {}, mentors = {}, subscriptions = {}, proctoringFlagStats = {}, doubtSessions = {}, recentSessions = [], popularSkills = [] } = dashboardData;

    return (
        <div className="font-sans p-6 text-white bg-admin-dashboard h-full flex-1 flex flex-col gap-6 box-border overflow-hidden">
            {/* Page Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <div className="flex justify-center items-center">
                  <span className="text-[10px] tracking-[0.3em] text-mauve-400 uppercase">
                    [ Solve-X Administrator ]
                  </span>
                </div>
                <h1 className="text-2xl font-light m-0 mt-1 font-shantell-sans text-neutral-300">
                  Admin{' '}
                  <span className="relative inline-block text-cyan-500 px-2 pb-1">
                    Overview metrics
                    <svg
                      className="absolute -inset-x-3 -inset-y-1 w-[calc(100%+1.5rem)] h-[calc(100%+0.5rem)] pointer-events-none overflow-visible"
                      viewBox="0 0 200 50"
                      preserveAspectRatio="none"
                      fill="none"
                      stroke="#ff7a00"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M 10,25 C 10,8 50,6 100,6 C 150,6 190,8 190,25 C 190,42 150,44 100,44 C 45,44 8,40 13,20 C 16,14 40,10 70,8"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                      />
                    </svg>
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  System Monitor Live
                </span>
              </div>
            </div>

            {/* Section 1: User Enrollment & Subscription Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard 
                label="Total Students" 
                value={users.totalStudents || 0} 
                accentClass="text-blue-400" 
              />
              <StatCard 
                label="Total Mentors" 
                value={users.totalMentors || 0} 
                accentClass="text-amber-500" 
              />
              <StatCard 
                label="Active Subscriptions" 
                value={subscriptions.activeSubscriptions || 0} 
                accentClass="text-emerald-400" 
              />
              <StatCard 
                label="Online Users" 
                value={(users.onlineStudents || 0) + (users.onlineMentors || 0)} 
                accentClass="text-indigo-400" 
              />
            </div>

            {/* Section 2: Doubt Session Metrics & Proctoring Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard 
                label="Open Doubts" 
                value={doubtSessions.open || 0} 
                accentClass="text-amber-400" 
              />
              <StatCard 
                label="Live Sessions" 
                value={doubtSessions.live || 0} 
                accentClass="text-sky-400" 
              />
              <StatCard 
                label="Completed Doubts" 
                value={doubtSessions.completed || 0} 
                accentClass="text-emerald-500" 
              />
              <StatCard 
                label="Proctoring Warnings" 
                value={proctoringFlagStats.totalWarnings || 0} 
                accentClass="text-red-500" 
              />
            </div>

            {/* Section 3: Dual Column layout for Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
              
              {/* Recent Doubt Sessions (Feed) */}
              <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-4 shadow-lg box-border overflow-hidden">
                <h3 className="text-sm font-semibold tracking-wider text-amber-400 uppercase m-0">
                  Recent Doubt Sessions
                </h3>
                <hr className="border-0 border-t border-white/10 m-0" />
                
                <div className="scrollbar-custom flex flex-col gap-4 flex-1 overflow-y-auto pr-2">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <div 
                        key={session._id} 
                        className="flex flex-wrap justify-between items-center p-4 bg-white/[0.03] border border-white/[0.03] rounded-2xl gap-4 transition-all duration-300 hover:border-white/15 box-border"
                      >
                        <div className="flex flex-col gap-1">
                          <h4 className="text-sm font-medium text-white m-0">
                            {session.question || "No Question"}
                          </h4>
                          <p className="text-xs text-white/50 m-0">
                            Student: <span className="text-white/80">{session.studentId?.name || "N/A"}</span> | 
                            Mentor: <span className="text-white/80">{session.selectedMentorId?.name || "Unassigned"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-white/40 font-mono">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            session.status === "completed" ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                            session.status === "in_session" ? 'bg-sky-500/15 text-sky-400 border-sky-500/25' :
                            'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40 italic m-0">No doubt sessions found.</p>
                  )}
                </div>
              </div>

              {/* Popular Skills Tag / Counts */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-4 shadow-lg box-border overflow-hidden">
                <h3 className="text-sm font-semibold tracking-wider text-amber-400 uppercase m-0">
                  Popular Skills
                </h3>
                <hr className="border-0 border-t border-white/10 m-0" />

                <div className="scrollbar-custom flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
                  {popularSkills.length > 0 ? (
                    popularSkills.map((skill, index) => (
                      <div 
                        key={skill._id || index}
                        className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.03] rounded-xl text-xs box-border"
                      >
                        <span className="font-semibold text-white/90">{skill.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">
                          {skill.mentorCount} Mentors
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40 italic m-0">No popular skills recorded.</p>
                  )}
                </div>
              </div>

            </div>
        </div>
    );
};

export default AdminDashboard;