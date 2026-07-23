import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useGetMentorProfile, useUpdateMentorProfile } from "../hooks/mentorProfile.hook";
import CustomCursor from "../../../../shared/components/CustomCursor";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser";

import { platformIcons, formatExternalUrl } from "../../../../shared/utils/profile.utils";

const MentorProfile = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const { data: profileResponse, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useGetMentorProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateMentorProfile();

  const [isEditing, setIsEditing] = useState(false);

  // useForm setup
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      jobTitle: "",
      company: "",
      experienceYears: 0,
      education: "",
      timezone: "",
      preferredLanguage: "",
      payoutDetails: {
        upiId: "",
        bankName: "",
        accountNumber: "",
        ifscCode: ""
      }
    }
  });

  // Watch form fields so they can be rendered correctly in view mode
  const jobTitle = useWatch({ control, name: "jobTitle" });
  const company = useWatch({ control, name: "company" });
  const experienceYears = useWatch({ control, name: "experienceYears" });
  const education = useWatch({ control, name: "education" });
  const timezone = useWatch({ control, name: "timezone" });
  const preferredLanguage = useWatch({ control, name: "preferredLanguage" });
  const payoutDetails = useWatch({ control, name: "payoutDetails" });

  // Keep array lists as state since they are edited dynamically outside standard form inputs
  const [socialLinks, setSocialLinks] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Form states for adding items
  const [newPlatform, setNewPlatform] = useState("linkedin");
  const [newUrl, setNewUrl] = useState("");
  const [newCert, setNewCert] = useState("");

  const profileData = profileResponse?.data || {};

  // Sync state when profile data is loaded
  useEffect(() => {
    const data = profileResponse?.data;
    if (data) {
      reset({
        jobTitle: data.jobTitle || "",
        company: data.company || "",
        experienceYears: data.experienceYears || 0,
        education: data.education || "",
        timezone: data.timezone || "",
        preferredLanguage: data.preferredLanguage || "",
        payoutDetails: {
          upiId: data.payoutDetails?.upiId || "",
          bankName: data.payoutDetails?.bankName || "",
          accountNumber: data.payoutDetails?.accountNumber || "",
          ifscCode: data.payoutDetails?.ifscCode || ""
        }
      });
      const t = setTimeout(() => {
        setSocialLinks(data.socialLinks || []);
        setCertifications(data.certifications || []);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [profileResponse?.data, reset]);

  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0b11] text-white font-sans">
        <span className="text-[14px] font-medium tracking-[0.05em]">Checking mentor session...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== "mentor") {
    if (currentUser.role === "admin") return <Navigate to="/admin-landing" replace />;
    return <Navigate to="/student-landing" replace />;
  }

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0b11] text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#fbbf24] animate-spin" />
          <span className="text-[14px] font-medium">Loading mentor profile details...</span>
        </div>
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0b11] p-6 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-6 max-w-[400px] w-full shadow-lg">
          <h3 className="m-0 mb-2 text-[18px] font-bold">Error Loading Profile</h3>
          <p className="m-0 text-[14px]">{profileError?.message || "Check network connection or credentials."}</p>
        </div>
      </div>
    );
  }

  const onSubmit = (data) => {
    updateProfile(
      {
        ...data,
        experienceYears: Number(data.experienceYears),
        socialLinks,
        certifications
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        }
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

  const handleAddCert = () => {
    if (!newCert.trim()) return;
    if (!certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
    }
    setNewCert("");
  };

  const handleRemoveCert = (certToRemove) => {
    setCertifications(certifications.filter((c) => c !== certToRemove));
  };

  const isVerifiedMentor = Boolean(profileData.isVerifiedMentor);
  const rating = Number(profileData.rating || 5.0).toFixed(1);

  // --- Profile Completion Ratio (real data-driven) ---
  const completionFields = [
    { label: "Job Title",   filled: Boolean(profileData.jobTitle?.trim()) },
    { label: "Company",     filled: Boolean(profileData.company?.trim()) },
    { label: "Experience",  filled: (profileData.experienceYears || 0) > 0 },
    { label: "Education",   filled: Boolean(profileData.education?.trim()) },
    { label: "Language",    filled: Boolean(profileData.preferredLanguage?.trim()) },
    { label: "Timezone",    filled: Boolean(profileData.timezone?.trim()) },
    { label: "Social Links",filled: (profileData.socialLinks?.length || 0) > 0 },
    { label: "Certifications", filled: (profileData.certifications?.length || 0) > 0 },
  ];
  const completedCount = completionFields.filter(f => f.filled).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);
  const completionColor =
    completionPct === 100 ? "#34d399"
    : completionPct >= 60 ? "#fbbf24"
    : "#f87171";

  return (
    <div className="min-h-screen flex flex-col px-6 text-white bg-[radial-gradient(circle_at_82%_30%,rgba(255,255,255,0.40),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(0,62,244,0.45),transparent_20%),radial-gradient(circle_at_0%_80%,rgba(20,12,220,0.50),transparent_38%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)]">
      <CustomCursor />

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-3 pb-4">
        {/* TOP SECTION - Pill Navbar (matches PublicPage style) */}
        <div className="sticky top-4 z-50 shrink-0 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center px-4 py-3 sm:px-6 sm:py-3.5 rounded-3xl sm:rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.37)]">
          {/* Left: Logo + Profile Name */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Solve-X" className="w-6 h-6 object-contain" />
            <span className="text-[13px] font-semibold tracking-[0.15em] uppercase text-white">
              {profileData.name || currentUser.name || "Mentor Profile"}
            </span>
          </div>

          {/* Right: Nav Actions */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <Link
              to="/dashboard/mentor"
              className="text-[13px] text-white/80 no-underline hover:text-white transition-colors duration-200 tracking-[-0.01em]"
            >
              Back to Dashboard
            </Link>
            <span className="w-px h-[22px] bg-white/25 shrink-0 hidden xs:inline" />
            <div className="flex items-center gap-1.5">
              <span className="live-ping w-2 h-2 rounded-full bg-emerald-500 inline-flex"></span>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-[0.05em]">ACTIVE</span>
            </div>
            <span className="w-px h-[22px] bg-white/25 shrink-0 hidden xs:inline" />
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    reset({
                      jobTitle: profileData.jobTitle || "",
                      company: profileData.company || "",
                      experienceYears: profileData.experienceYears || 0,
                      education: profileData.education || "",
                      timezone: profileData.timezone || "",
                      preferredLanguage: profileData.preferredLanguage || "",
                      payoutDetails: {
                        upiId: profileData.payoutDetails?.upiId || "",
                        bankName: profileData.payoutDetails?.bankName || "",
                        accountNumber: profileData.payoutDetails?.accountNumber || "",
                        ifscCode: profileData.payoutDetails?.ifscCode || ""
                      }
                    });
                    setSocialLinks(profileData.socialLinks || []);
                    setCertifications(profileData.certifications || []);
                  }}
                  className="inline-flex h-[38px] w-[84px] items-center justify-center rounded-full border border-white/20 bg-gradient-to-b from-white to-[#e2e2e2] text-[13px] font-medium text-black cursor-pointer transition-colors duration-200 hover:from-neutral-100 hover:to-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 h-[38px] rounded-full border border-white/25 bg-gradient-to-b from-[#242424] from-[19%] to-black px-5 text-[13px] font-medium text-white cursor-pointer transition-colors duration-200 hover:from-[#2e2e2e] hover:to-neutral-900 disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save"}
                  {!isUpdating && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 h-[38px] rounded-full border border-white/25 bg-gradient-to-b from-[#242424] from-[19%] to-black px-5 text-[13px] font-medium text-white cursor-pointer transition-colors duration-200 hover:from-[#2e2e2e] hover:to-neutral-900"
              >
                Edit Profile
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 sm:pt-10">
          
          {/* LEFT COLUMN: Identity Details & Professional info */}
          <div className="w-full h-fit bg-blue-500/15 border border-white/25 rounded-[24px] p-8 flex flex-col gap-4 box-border">
            <div className="flex items-center gap-5">
              {/* Avatar Circle */}
              <div className="w-14 h-14 rounded-full text-[#0c0b11] flex items-center justify-center text-[20px] font-bold overflow-hidden shadow-[0_10px_20px_rgba(251,191,36,0.2)]">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Mentor Avatar" className="w-full h-full object-cover" />
                ) : (
                  (profileData.name || currentUser.name || "M")[0].toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500 font-bold uppercase tracking-[0.15em]">
                  Verified Mentor
                </span>
                <h3 className="text-[16px] font-medium m-0">{profileData.name || currentUser.name}</h3>
                <span className="text-[12px] text-emerald-400/70 font-mono">
                  {profileData.email || currentUser.email}
                </span>
              </div>
            </div>

            {/* Profile Completion Ratio */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
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
            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
              
              {/* Job Title */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Job Title
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("jobTitle")}
                    placeholder="e.g. Senior Software Engineer"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border focus:border-[#fbbf24]"
                  />
                ) : (
                  <span className="text-[14px] text-white/85">
                    {jobTitle || "Not specified"}
                  </span>
                )}
              </div>

              {/* Company */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Company
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("company")}
                    placeholder="e.g. Google, Meta"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border focus:border-[#fbbf24]"
                  />
                ) : (
                  <span className="text-[14px] text-white/85">
                    {company || "Not specified"}
                  </span>
                )}
              </div>

              {/* Experience Years */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Experience (Years)
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    {...register("experienceYears", { valueAsNumber: true })}
                    placeholder="e.g. 5"
                    min="0"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border focus:border-[#fbbf24]"
                  />
                ) : (
                  <span className="text-[14px] text-white/85">
                    {experienceYears ? `${experienceYears} years` : "0 years"}
                  </span>
                )}
              </div>

              {/* Education */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Education
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("education")}
                    placeholder="e.g. M.S. in Computer Science"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border focus:border-[#fbbf24]"
                  />
                ) : (
                  <span className="text-[14px] text-white/85">
                    {education || "Not specified"}
                  </span>
                )}
              </div>

              {/* Preferred Language */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-white/40 uppercase font-bold">
                  Preferred Language
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("preferredLanguage")}
                    placeholder="e.g. English, Hindi"
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border focus:border-[#fbbf24]"
                  />
                ) : (
                  <span className="text-[14px] text-white/85">
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
                    className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[13px] outline-none w-full box-border cursor-pointer focus:border-[#fbbf24]"
                  >
                    <option value="" className="bg-[#121116]">Select timezone</option>
                    <option value="GMT+5:30" className="bg-[#121116]">IST (GMT+5:30)</option>
                    <option value="GMT+0:00" className="bg-[#121116]">UTC (GMT+0:00)</option>
                    <option value="GMT-5:00" className="bg-[#121116]">EST (GMT-5:00)</option>
                    <option value="GMT-8:00" className="bg-[#121116]">PST (GMT-8:00)</option>
                  </select>
                ) : (
                  <span className="text-[14px] text-white/85">
                    {timezone || "Not specified"}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Skill/Verification, Payouts, Certifications, Social links */}
          <div className="flex flex-col gap-3">
            
            {/* Verification & Skill Badge Card */}
            <div className="border border-white/30 bg-blue-600/10 rounded-[24px] p-4 flex flex-col gap-3 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                Verification & Expertise
              </span>
              <div className="flex flex-wrap justify-between gap-3 items-center">
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                  isVerifiedMentor 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : profileData.verificationStatus === 'rejected' 
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}>
                  {isVerifiedMentor ? "Verified Mentor" : profileData.verificationStatus || "pending"}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#fbbf24] text-[16px]">★</span>
                  <span className="text-[14px] font-bold">{rating}</span>
                  <span className="text-[12px] text-white/40">({profileData.ratingCount || 0} reviews)</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5">
                <p className="m-0 text-[11px] text-[#fbbf24] uppercase font-bold tracking-[0.05em]">
                  Primary Skill Focus
                </p>
                <p className="m-0 mt-1.5 text-[15px] font-bold">
                  {profileData.specialization?.name || profileData.skill?.name || "No skill selected"}
                </p>
                <p className="m-0 mt-1 text-[12px] text-white/50 leading-relaxed">
                  {profileData.specialization?.description || profileData.skill?.description || "Skill focus area details not provided yet."}
                </p>
              </div>

              {profileData.rejectionReason && (
                <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-3.5 text-rose-400 text-[12px]">
                  <strong>Rejection Reason:</strong> {profileData.rejectionReason}
                </div>
              )}
            </div>

            {/* Payout Details Card */}
            <div className=" border border-white/30 bg-blue-600/10 rounded-[24px] p-4 flex flex-col gap-3 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                Payout Information
              </span>
              
              <div className="flex flex-col gap-3">
                {/* UPI ID */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/50">UPI ID</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("payoutDetails.upiId")}
                      placeholder="e.g. name@upi"
                      className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[12px] outline-none w-full box-border focus:border-[#fbbf24]"
                    />
                  ) : (
                    <span className="text-[13px] font-medium font-mono">
                      {payoutDetails.upiId || "Not specified"}
                    </span>
                  )}
                </div>

                {/* Bank Name */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/50">Bank Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("payoutDetails.bankName")}
                      placeholder="e.g. HDFC Bank"
                      className="bg-white/9 border border-white/15 text-white rounded-lg px-3 py-2 text-[12px] outline-none w-full box-border focus:border-[#fbbf24]"
                    />
                  ) : (
                    <span className="text-[13px] font-medium">
                      {payoutDetails.bankName || "Not specified"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  {/* Account Number */}
                  <div className="col-span-7 flex flex-col gap-1">
                    <span className="text-[10px] text-white/50">Account Number</span>
                    {isEditing ? (
                      <input
                        type="text"
                        {...register("payoutDetails.accountNumber")}
                        placeholder="e.g. 501002345678"
                        className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[12px] outline-none w-full box-border focus:border-[#fbbf24]"
                      />
                    ) : (
                      <span className="text-[13px] font-medium font-mono">
                        {payoutDetails.accountNumber ? payoutDetails.accountNumber.replace(/.(?=.{4})/g, "•") : "Not specified"}
                      </span>
                    )}
                  </div>

                  {/* IFSC Code */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <span className="text-[10px] text-white/50">IFSC Code</span>
                    {isEditing ? (
                      <input
                        type="text"
                        {...register("payoutDetails.ifscCode", {
                          onChange: (e) => {
                            e.target.value = e.target.value.toUpperCase();
                          }
                        })}
                        placeholder="e.g. HDFC0000123"
                        className="bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-[12px] outline-none w-full box-border focus:border-[#fbbf24]"
                      />
                    ) : (
                      <span className="text-[13px] font-medium font-mono">
                        {payoutDetails.ifscCode || "Not specified"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications Card */}
            <div className=" border border-white/30 bg-blue-600/10  rounded-[24px] p-4 flex flex-col gap-3 box-border">
              <span className="text-[11px] text-white/40 uppercase font-bold">
                Certifications
              </span>

              <div className="flex flex-col gap-2">
                {certifications.length > 0 ? (
                  certifications.map((cert, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between bg-amber-500/[0.04] border border-amber-500/12 text-white/85 rounded-xl px-3.5 py-2 text-[13px]"
                    >
                      <span>{cert}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveCert(cert)}
                          className="bg-none border-none text-red-500 cursor-pointer text-[16px] p-0 leading-none"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[13px] text-white/40 italic">
                    No certifications added yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2.5 mt-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add certification (e.g. AWS Solution Architect)"
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddCert(); }}
                    className="bg-white/5 border border-white/15 text-white rounded-xl px-3.5 py-2 text-[12px] outline-none flex-grow focus:border-[#fbbf24]"
                  />
                  <button
                    onClick={handleAddCert}
                    className="bg-[#fbbf24] border-none text-[#0c0b11] rounded-xl px-4 text-[12px] font-bold cursor-pointer hover:bg-amber-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Social Links Card */}
            <div className="border border-white/30 bg-blue-600/10 rounded-[24px] p-4 flex flex-col gap-3 box-border">
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
                        className="flex items-center gap-2 bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-2 text-[12px] box-border"
                      >
                        <a
                          href={formatExternalUrl(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 no-underline text-white/80 font-medium hover:text-white transition-colors"
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
                            className="bg-none border-none text-red-500 cursor-pointer text-[14px] p-0 leading-none ml-1"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[13px] text-white/40 italic">
                    No social profiles linked yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="flex flex-wrap gap-2.5 items-center bg-black/30 p-3 rounded-xl border border-white/5 box-border mt-2">
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="bg-white/8 border border-white/15 rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-[#fbbf24]"
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
                    className="flex-grow bg-white/8 border border-white/15 rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[#fbbf24]"
                  />
                  <button
                    onClick={handleAddSocialLink}
                    className="px-3 py-1.5 bg-[#fbbf24] text-[#0c0b11] border-none rounded-lg text-[12px] font-bold cursor-pointer hover:bg-amber-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>



      </main>
    </div>
  );
};

export default MentorProfile;
