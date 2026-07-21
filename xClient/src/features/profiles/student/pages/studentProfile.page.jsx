import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useGetStudentProfile, useUpdateStudentProfile } from "../hooks/studentProfile.hook";
import CustomCursor from "../../../../shared/components/CustomCursor";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser";

import { platformIcons, formatExternalUrl } from "../../../../shared/utils/profile.utils";

const StudentProfile = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const { data: profileResponse, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useGetStudentProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateStudentProfile();

  const [isEditing, setIsEditing] = useState(false);

  const pageBackgroundStyle = {
    background: `url("data:image/svg+xml,%30Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.055'/%3E%3C/svg%3E"), radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.75) 0%, rgba(200, 220, 255, 0.5) 25%, transparent 60%), radial-gradient(circle at 80% 80%, #16247d 0%, #0d123d 60%, #000000 100%)`
  };
  
  // useForm setup
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      bio: "",
      name: "",
      education: "",
      preferredLanguage: "",
      timezone: ""
    }
  });

  // Watch form fields for view mode rendering
  const bio = watch("bio");
  const name = watch("name");
  const education = watch("education");
  const preferredLanguage = watch("preferredLanguage");
  const timezone = watch("timezone");

  // Keep array lists as state since they are edited dynamically outside standard form inputs
  const [socialLinks, setSocialLinks] = useState([]);
  const [skills, setSkills] = useState([]);

  // Form states for adding items
  const [newPlatform, setNewPlatform] = useState("linkedin");
  const [newUrl, setNewUrl] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const profileData = profileResponse?.data || {};

  // Sync state when profile data is loaded
  useEffect(() => {
    if (profileResponse?.data) {
      reset({
        bio: profileData.bio || "",
        name: profileData.name || currentUser?.name || "",
        education: profileData.education || "",
        preferredLanguage: profileData.preferredLanguage || "",
        timezone: profileData.timezone || ""
      });
      setSocialLinks(profileData.socialLinks || []);
      setSkills(profileData.skills || []);
    }
  }, [profileResponse, currentUser, reset]);

  if (isCheckingSession) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen text-white font-sans"
        style={pageBackgroundStyle}
      >
        <span className="text-sm font-medium tracking-wide">Checking student session...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== 'student') {
    if (currentUser.role === 'admin') return <Navigate to="/admin-landing" replace />;
    return <Navigate to="/mentor-landing" replace />;
  }

  if (isProfileLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen text-white font-sans"
        style={pageBackgroundStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
          <span className="text-sm font-medium">Loading profile details...</span>
        </div>
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen p-6 font-sans"
        style={pageBackgroundStyle}
      >
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-6 max-w-[400px] w-full shadow-lg">
          <h3 className="m-0 mb-2 text-lg font-bold">Error Loading Profile</h3>
          <p className="m-0 text-sm">{profileError?.message || "Check network connection or credentials."}</p>
        </div>
      </div>
    );
  }

  const onSubmit = (data) => {
    updateProfile(
      {
        ...data,
        socialLinks,
        skills
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleAddSocialLink = () => {
    if (!newUrl.trim()) return;
    setSocialLinks([...socialLinks, { platform: newPlatform, url: newUrl.trim() }]);
    setNewUrl("");
  };

  const handleRemoveSocialLink = (indexToRemove) => {
    setSocialLinks(socialLinks.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // --- Profile Completion Ratio (real data-driven) ---
  const completionFields = [
    { label: "Bio",         filled: Boolean(profileData.bio?.trim()) },
    { label: "Education",  filled: Boolean(profileData.education?.trim()) },
    { label: "Language",   filled: Boolean(profileData.preferredLanguage?.trim()) },
    { label: "Timezone",   filled: Boolean(profileData.timezone?.trim()) },
    { label: "Skills",     filled: (profileData.skills?.length || 0) > 0 },
    { label: "Social Links", filled: (profileData.socialLinks?.length || 0) > 0 },
  ];
  const completedCount = completionFields.filter(f => f.filled).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);
  const completionColor =
    completionPct === 100 ? "#34d399"
    : completionPct >= 60 ? "#818cf8"
    : "#f87171";

  return (
    <div 
      className="student-profile-page w-full min-h-screen relative px-4 py-24 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={pageBackgroundStyle}
    >
      <CustomCursor />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <span className="font-mono text-xs tracking-[0.3em] text-indigo-500 uppercase block mb-1">
              [ STUDENT IDENTITY SYSTEM ]
            </span>
            <h1 className="text-3xl font-light m-0 text-white">
              {name || "Student profile"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/student" 
              className="text-xs text-white/70 hover:text-white font-semibold tracking-wide border border-white/15 hover:border-indigo-500 px-4 py-1.5 rounded-2xl bg-white/[0.02] transition-all duration-200 cursor-pointer no-underline"
            >
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="live-ping w-2 h-2 rounded-full bg-emerald-500 relative inline-block animate-pulse"></span>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: Identity Details & Subscription Info */}
          <div className="bg-[#0c0b16]/35 border border-white/10 rounded-3xl p-7 flex flex-col gap-6 box-border">
            <div className="flex items-center gap-5">
              {/* Avatar Circle */}
              <div className="w-[72px] h-[72px] rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-light shadow-[0_10px_20px_rgba(99,102,241,0.25)]">
                {name ? name[0].toUpperCase() : "S"}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-indigo-500 font-bold uppercase tracking-wider">
                  Solve-X Scholar
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("name")}
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-2.5 py-1 text-lg font-bold outline-none w-[180px] focus:border-indigo-500/50"
                  />
                ) : (
                  <h3 className="text-xl font-medium m-0">{name}</h3>
                )}
                <span className="text-xs text-white/50 font-mono">
                  {profileData.email || currentUser.email}
                </span>
              </div>
            </div>

            {/* Subscription Box */}
            <div className="bg-mist-300/4 border border-indigo-500/100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-green-500 font-bold uppercase tracking-wider">
                  Membership Status
                </span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  profileData.subscriptionStatus === 'active' 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                    : "bg-red-500/15 text-red-400 border-red-500/30"
                }`}>
                  {profileData.subscriptionStatus || "inactive"}
                </span>
              </div>
              {profileData.subscriptionStatus === 'active' && profileData.subscriptionExpiresAt ? (
                <span className="text-xs text-white/70">
                  Expires: {new Date(profileData.subscriptionExpiresAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-xs text-white/50">
                  Subscribe to access unlimited mentor sessions.
                </span>
              )}
            </div>

            {/* Profile Completion Ratio */}
            <div className="flex flex-col gap-2 border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider">Profile Completion</span>
                <span className="text-[13px] font-bold" style={{ color: completionColor }}>{completionPct}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%`, background: completionColor }}
                />
              </div>
              {/* Missing fields */}
              {completionPct < 100 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {completionFields.filter(f => !f.filled).map(f => (
                    <span
                      key={f.label}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/40"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              )}
              {completionPct === 100 && (
                <span className="text-[11px] text-emerald-400 font-semibold">✓ Profile fully complete</span>
              )}
            </div>

            {/* Quick Details List */}
            <div className="flex flex-col gap-4 border-t border-white/10 pt-5">
              {/* Education */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Education
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("education")}
                    placeholder="e.g. B.Tech Computer Science"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none w-full box-border focus:border-indigo-500/50"
                  />
                ) : (
                  <span className="text-sm text-white/85">
                    {education || "Not specified"}
                  </span>
                )}
              </div>

              {/* Language */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Preferred Language
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("preferredLanguage")}
                    placeholder="e.g. Hindi, English"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none w-full box-border focus:border-indigo-500/50"
                  />
                ) : (
                  <span className="text-sm text-white/85">
                    {preferredLanguage || "Not specified"}
                  </span>
                )}
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Timezone
                </span>
                {isEditing ? (
                  <select
                    {...register("timezone")}
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none w-full box-border cursor-pointer focus:border-indigo-500/50"
                  >
                    <option value="" className="bg-[#121116]">Select timezone</option>
                    <option value="GMT+5:30" className="bg-[#121116]">IST (GMT+5:30)</option>
                    <option value="GMT+0:00" className="bg-[#121116]">UTC (GMT+0:00)</option>
                    <option value="GMT-5:00" className="bg-[#121116]">EST (GMT-5:00)</option>
                    <option value="GMT-8:00" className="bg-[#121116]">PST (GMT-8:00)</option>
                  </select>
                ) : (
                  <span className="text-sm text-white/85">
                    {timezone || "Not specified"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Bio, Skills & Social Links */}
          <div className="flex flex-col gap-6">
            
            {/* Bio Card */}
            <div className="bg-[#0c0b16]/15 border border-white/30 rounded-3xl p-7 flex flex-col gap-4 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                Biography
              </span>
              {isEditing ? (
                <textarea
                  {...register("bio")}
                  placeholder="Tell us about your learning journey..."
                  className="bg-white/5 border border-white/15 text-white rounded-2xl p-3.5 text-sm leading-relaxed outline-none w-full min-h-[120px] resize-none box-border focus:border-indigo-500/50"
                />
              ) : (
                <p className={`text-sm leading-relaxed text-white/80 m-0 ${bio ? "" : "italic"}`}>
                  {bio || "Write a short bio to let mentors know more about your goals."}
                </p>
              )}
            </div>

            {/* Skills Card */}
            <div className="bg-[#0c0b16]/15 border border-white/30 rounded-3xl p-7 flex flex-col gap-4 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                My Tech Stack / Focus Areas
              </span>
              
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="bg-transparent border-none text-red-400 hover:text-red-300 cursor-pointer text-sm p-0 leading-none flex items-center"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-white/40 italic">
                    No skills added yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2.5 mt-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g. React, Node.js)"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); }}
                    className="bg-white/5 border border-white/15 text-white rounded-xl px-3.5 py-2 text-xs outline-none flex-1 focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="bg-indigo-500 hover:bg-indigo-600 border-none text-white rounded-xl px-4 text-xs font-bold cursor-pointer transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Social Links Card */}
            <div className="bg-[#0c0b16]/15 border border-white/30 rounded-3xl p-7 flex flex-col gap-4 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                Connected Profiles
              </span>

              <div className="flex flex-wrap gap-3">
                {socialLinks.length > 0 ? (
                  socialLinks.map((link, index) => {
                    const platform = link.platform?.toLowerCase() || "other";
                    const iconUrl = platformIcons[platform] || platformIcons.other;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs box-border"
                      >
                        <a
                          href={formatExternalUrl(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 no-underline text-white/80 hover:text-white font-medium"
                        >
                          {iconUrl && (
                            <img
                              src={iconUrl}
                              alt={link.platform}
                              className="w-4 h-4 invert"
                            />
                          )}
                          <span className="capitalize">{link.platform}</span>
                        </a>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSocialLink(index)}
                            className="bg-transparent border-none text-red-400 hover:text-red-300 cursor-pointer text-sm p-0 leading-none ml-1"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-sm text-white/40 italic">
                    No social profiles linked yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="flex flex-wrap gap-2.5 items-center bg-black/35 p-3 rounded-2xl border border-white/5 box-border mt-2">
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-indigo-500/50"
                  >
                    <option value="linkedin" className="bg-[#121116]">LinkedIn</option>
                    <option value="github" className="bg-[#121116]">GitHub</option>
                    <option value="twitter" className="bg-[#121116]">Twitter</option>
                    <option value="instagram" className="bg-[#121116]">Instagram</option>
                    <option value="portfolio" className="bg-[#121116]">Portfolio</option>
                    <option value="other" className="bg-[#121116]">Other</option>
                  </select>
                  <input
                    type="url"
                    placeholder="Enter URL (https://...)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSocialLink(); }}
                    className="flex-1 min-w-[150px] bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleAddSocialLink}
                    className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-lg text-xs font-bold cursor-pointer transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-end gap-3 mt-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  reset({
                    name: profileData.name || currentUser?.name || "",
                    bio: profileData.bio || "",
                    education: profileData.education || "",
                    preferredLanguage: profileData.preferredLanguage || "",
                    timezone: profileData.timezone || ""
                  });
                  setSocialLinks(profileData.socialLinks || []);
                  setSkills(profileData.skills || []);
                }}
                className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 bg-transparent text-white text-sm font-semibold cursor-pointer transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isUpdating}
                className="px-6 py-2 rounded-full border-none bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 rounded-full border-none bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-colors duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>

      </main>
    </div>
  );
};

export default StudentProfile;
