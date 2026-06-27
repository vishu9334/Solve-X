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
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        ...pageBackgroundStyle,
        color: "#ffffff",
        fontFamily: "sans-serif"
      }}>
        <span style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "0.05em" }}>Checking student session...</span>
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
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        ...pageBackgroundStyle,
        color: "#ffffff",
        fontFamily: "sans-serif"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#6366f1",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Loading profile details...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        ...pageBackgroundStyle,
        padding: "24px",
        fontFamily: "sans-serif"
      }}>
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold" }}>Error Loading Profile</h3>
          <p style={{ margin: 0, fontSize: "14px" }}>{profileError?.message || "Check network connection or credentials."}</p>
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

  return (
    <div 
      className="student-profile-page w-full min-h-screen relative px-4 py-24 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={pageBackgroundStyle}
    >
      <CustomCursor />



      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <span style={{
              fontFamily: "monospace",
              fontSize: "12px",
              letterSpacing: "0.3em",
              color: "#6366f1",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "4px"
            }}>
              [ STUDENT IDENTITY SYSTEM ]
            </span>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "300",
              margin: 0,
              color: "#ffffff"
            }}>
              {name || "Student profile"}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link 
              to="/dashboard/student" 
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                fontWeight: "600",
                letterSpacing: "0.05em",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "6px 16px",
                borderRadius: "16px",
                backgroundColor: "rgba(255,255,255,0.02)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Back to Dashboard
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-ping" style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                position: "relative",
                display: "inline-block"
              }}></span>
              <span style={{
                fontSize: "11px",
                color: "#a3a3a3",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          
          {/* LEFT: Identity Details & Subscription Info */}
          <div style={{
            backgroundColor: "rgba(12, 11, 22, 0.78)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Avatar Circle */}
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "300",
                boxShadow: "0 10px 20px rgba(99, 102, 241, 0.25)"
              }}>
                {name ? name[0].toUpperCase() : "S"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Solve-X Scholar
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("name")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "18px",
                      fontWeight: "bold",
                      outline: "none",
                      width: "180px"
                    }}
                  />
                ) : (
                  <h3 style={{ fontSize: "20px", fontWeight: "500", margin: 0 }}>{name}</h3>
                )}
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {profileData.email || currentUser.email}
                </span>
              </div>
            </div>

            {/* Subscription Box */}
            <div style={{
              backgroundColor: "rgba(99, 102, 241, 0.05)",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Membership Status
                </span>
                <span style={{
                  fontSize: "9px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: profileData.subscriptionStatus === 'active' ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: profileData.subscriptionStatus === 'active' ? "#34d399" : "#f87171",
                  border: profileData.subscriptionStatus === 'active' ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                }}>
                  {profileData.subscriptionStatus || "inactive"}
                </span>
              </div>
              {profileData.subscriptionStatus === 'active' && profileData.subscriptionExpiresAt ? (
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                  Expires: {new Date(profileData.subscriptionExpiresAt).toLocaleDateString()}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Subscribe to access unlimited mentor sessions.
                </span>
              )}
            </div>

            {/* Quick Details List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
              {/* Education */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                  Education
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("education")}
                    placeholder="e.g. B.Tech Computer Science"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                    {education || "Not specified"}
                  </span>
                )}
              </div>

              {/* Language */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                  Preferred Language
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("preferredLanguage")}
                    placeholder="e.g. Hindi, English"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                    {preferredLanguage || "Not specified"}
                  </span>
                )}
              </div>

              {/* Timezone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                  Timezone
                </span>
                {isEditing ? (
                  <select
                    {...register("timezone")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="" style={{ backgroundColor: "#121116" }}>Select timezone</option>
                    <option value="GMT+5:30" style={{ backgroundColor: "#121116" }}>IST (GMT+5:30)</option>
                    <option value="GMT+0:00" style={{ backgroundColor: "#121116" }}>UTC (GMT+0:00)</option>
                    <option value="GMT-5:00" style={{ backgroundColor: "#121116" }}>EST (GMT-5:00)</option>
                    <option value="GMT-8:00" style={{ backgroundColor: "#121116" }}>PST (GMT-8:00)</option>
                  </select>
                ) : (
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                    {timezone || "Not specified"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Bio, Skills & Social Links */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            
            {/* Bio Card */}
            <div style={{
              backgroundColor: "rgba(12, 11, 22, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                Biography
              </span>
              {isEditing ? (
                <textarea
                  {...register("bio")}
                  placeholder="Tell us about your learning journey..."
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    outline: "none",
                    width: "100%",
                    minHeight: "120px",
                    resize: "none",
                    boxSizing: "border-box"
                  }}
                />
              ) : (
                <p style={{
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: 0,
                  fontStyle: bio ? "normal" : "italic"
                }}>
                  {bio || "Write a short bio to let mentors know more about your goals."}
                </p>
              )}
            </div>

            {/* Skills Card */}
            <div style={{
              backgroundColor: "rgba(12, 11, 22, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                My Tech Stack / Focus Areas
              </span>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <div 
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "rgba(99, 102, 241, 0.08)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        color: "#a5b4fc",
                        borderRadius: "12px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    >
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "14px",
                            padding: 0,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                    No skills added yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g. React, Node.js)"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); }}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      borderRadius: "12px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      outline: "none",
                      flexGrow: 1
                    }}
                  />
                  <button
                    onClick={handleAddSkill}
                    style={{
                      backgroundColor: "#6366f1",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: "12px",
                      padding: "0 16px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Social Links Card */}
            <div style={{
              backgroundColor: "rgba(12, 11, 22, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>
                Connected Profiles
              </span>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {socialLinks.length > 0 ? (
                  socialLinks.map((link, index) => {
                    const platform = link.platform?.toLowerCase() || "other";
                    const iconUrl = platformIcons[platform] || platformIcons.other;
                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "14px",
                          padding: "8px 14px",
                          fontSize: "12px",
                          boxSizing: "border-box"
                        }}
                      >
                        <a
                          href={formatExternalUrl(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            textDecoration: "none",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "500"
                          }}
                        >
                          {iconUrl && (
                            <img
                              src={iconUrl}
                              alt={link.platform}
                              style={{ width: "16px", height: "16px", filter: "invert(1)" }}
                            />
                          )}
                          <span style={{ textTransform: "capitalize" }}>{link.platform}</span>
                        </a>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSocialLink(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "14px",
                              padding: 0,
                              lineHeight: 1,
                              marginLeft: "4px"
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                    No social profiles linked yet.
                  </span>
                )}
              </div>

              {isEditing && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  boxSizing: "border-box",
                  marginTop: "8px"
                }}>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "#ffffff",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="linkedin" style={{ backgroundColor: "#121116" }}>LinkedIn</option>
                    <option value="github" style={{ backgroundColor: "#121116" }}>GitHub</option>
                    <option value="twitter" style={{ backgroundColor: "#121116" }}>Twitter</option>
                    <option value="instagram" style={{ backgroundColor: "#121116" }}>Instagram</option>
                    <option value="portfolio" style={{ backgroundColor: "#121116" }}>Portfolio</option>
                    <option value="other" style={{ backgroundColor: "#121116" }}>Other</option>
                  </select>
                  <input
                    type="url"
                    placeholder="Enter URL (https://...)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSocialLink(); }}
                    style={{
                      flexGrow: 1,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "#ffffff",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleAddSocialLink}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#6366f1",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginTop: "12px"
        }}>
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
                style={{
                  padding: "8px 24px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isUpdating}
                style={{
                  padding: "8px 24px",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: "#6366f1",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6366f1"}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "8px 24px",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#6366f1",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6366f1"}
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
