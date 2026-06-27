import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useGetAdminProfile, useUpdateAdminProfile } from "../hooks/adminProfile.hook";
import CustomCursor from "../../../../shared/components/CustomCursor";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";

import { platformIcons, formatExternalUrl } from "../../../../shared/utils/profile.utils";

const AdminProfile = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const { data: profileResponse, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useGetAdminProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateAdminProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState(null);

  // Form states for adding a new social link
  const [newPlatform, setNewPlatform] = useState("linkedin");
  const [newUrl, setNewUrl] = useState("");

  const profileData = profileResponse?.data || {};
  const displayedSocialLinks = socialLinks ?? profileData.socialLinks ?? [];

  if (isCheckingSession) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0c0b11",
        color: "#ffffff",
        fontFamily: "sans-serif"
      }}>
        <span style={{ fontSize: "14px", fontWeight: "500" }}>Checking admin session...</span>
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

  if (isProfileLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0c0b11",
        color: "#ffffff",
        fontFamily: "sans-serif"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#fbbf24",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Loading admin profile...</span>
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
        backgroundColor: "#0c0b11",
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

  const handleSave = () => {
    updateProfile(
      { bio, socialLinks: displayedSocialLinks },
      {
        onSuccess: () => {
          setIsEditing(false);
          setSocialLinks(null);
        },
      }
    );
  };

  const handleAddSocialLink = () => {
    if (!newUrl.trim()) return;
    setSocialLinks((currentLinks) => [
      ...(currentLinks ?? profileData.socialLinks ?? []),
      { platform: newPlatform, url: newUrl.trim() },
    ]);
    setNewUrl("");
  };

  const handleRemoveSocialLink = (indexToRemove) => {
    setSocialLinks(displayedSocialLinks.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div
      className="admin-profile-page w-full min-h-screen relative px-4 py-6 sm:px-6 lg:px-8 text-white overflow-hidden bg-[#07070d]"
    >
      <CustomCursor />
      <style>{`

        .admin-profile-page::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 82% 8%, rgba(79, 70, 229, 0.32), transparent 28%),
            radial-gradient(circle at 12% 72%, rgba(245, 158, 11, 0.12), transparent 25%);
        }
        .code-fragment {
          position: absolute;
          z-index: 0;
          color: rgba(165, 180, 252, 0.14);
          font: 500 12px/1.8 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          white-space: pre;
          user-select: none;
          pointer-events: none;
        }
        @keyframes ping-anim {
          0% { transform: scale(1); opacity: 1; }
          70%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .live-ping::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #10b981;
          animation: ping-anim 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @media (max-width: 640px) {
          .code-fragment { display: none; }
        }
      `}</style>

      <div aria-hidden="true" className="code-fragment" style={{ top: "9%", left: "3%" }}>
        {`const profile = await system.load();\nif (profile.role === "admin") {\n  grantAccess();\n}`}
      </div>
      <div aria-hidden="true" className="code-fragment" style={{ right: "3%", bottom: "8%", textAlign: "left" }}>
        {`// solve-x operator\nstatus: "online",\npermissions: ["read", "write"]`}
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">

      {/* Header Glass Navbar */}
      <nav className="relative z-20 mx-auto flex w-full items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 backdrop-blur-md">
          <Link to="/admin-landing" className="flex items-center gap-3 text-white no-underline">
              <img src="/logo.png" alt="Solve-X" className="h-6 w-6 object-contain" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Solve-X</span>
          </Link>
          <div className="flex items-center gap-5">
              <Link to="/admin-landing" className="text-xs font-semibold text-white/70 hover:text-white transition-colors no-underline">
                  Landing Page
              </Link>
              <Link to="/dashboard/admin" className="text-xs font-semibold text-white/70 hover:text-white transition-colors no-underline">
                  Dashboard
              </Link>
              <Link to="/admin/profile" className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-transform hover:scale-105 no-underline">
                  Admin Profile
              </Link>
          </div>
      </nav>

      {/* Title & Header Block */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        paddingBottom: "16px"
      }}>
        <div>
          <span style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "15px",
            letterSpacing: "0.3em",
            color: "#ffffff",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px"
          }}>
            [ ADMIN PROFILE CONTROL SYSTEM ]
          </span>
          <h1 style={{
            fontSize: "30px",
            fontWeight: "300",
            margin: 0,
            color: "#ffffff"
          }}>
            <span style={{ fontFamily: "'Edu VIC WA NT Beginner', sans-serif", fontWeight: "100", paddingLeft: "12px" }}>
              {profileData.name || "Admin"}
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="live-ping" style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            position: "relative",
            display: "inline-block"
          }}></span>
          <span style={{
            fontSize: "12px",
            color: "#a3a3a3",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>Live</span>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div style={{
        backgroundColor: "rgba(12, 11, 22, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxSizing: "border-box"
      }}>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px"
        }}>

          {/* Identity details */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "14px"
          }}>
            {/* Avatar */}
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: "300",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}>
              {profileData.name ? profileData.name[0].toUpperCase() : "A"}
            </div>

            {/* Details Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div>
                <span style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#fbbf24", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Active Operator
                </span>
                <h2 style={{ fontFamily: "'Edu VIC WA NT Beginner', sans-serif", fontSize: "30px", fontWeight: "500", color: "#ffffff", margin: 0 }}>
                  {profileData.name || "System Admin"}
                </h2>
              </div>

              {/* Email */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "6px 12px",
                borderRadius: "16px",
                width: "fit-content"
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#fcd34d" }}>mail</span>
                <span style={{ fontFamily: "monospace" }}>{profileData.email || "admin@solve-x.com"}</span>
              </div>

              {/* Role */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  backgroundColor: "rgba(251, 191, 36, 0.15)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em"
                }}>
                  {profileData.role || "Admin"}
                </span>
              </div>

              {/* Quick Social Icons Row */}
              {!isEditing && displayedSocialLinks.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", paddingTop: "8px" }}>
                  {displayedSocialLinks.map((link, idx) => {
                    const platform = link.platform?.toLowerCase() || "other";
                    const iconUrl = platformIcons[platform] || platformIcons.other;
                    return (
                      <a
                        key={idx}
                        href={formatExternalUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.3s, border-color 0.3s, background-color 0.3s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.backgroundColor = "rgba(251, 191, 36, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(251, 191, 36, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        }}
                        title={`${link.platform}: ${link.url}`}
                      >
                        {iconUrl && (
                          <img
                            src={iconUrl}
                            alt={link.platform}
                            style={{ width: "20px", height: "20px", objectFit: "contain", filter: "invert(1)" }}
                          />
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Biography */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color: "#a3a3a3", textTransform: "uppercase", fontWeight: "600" }}>Biography</span>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "16px",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "'Edu VIC WA NT Beginner', sans-serif"
                }}
                rows={5}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "280px",
                minHeight: "140px",
                backgroundColor: "#fef08a",
                color: "#1f2937",
                padding: "24px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                transform: "rotate(-2deg)",
                transition: "transform 0.3s",
                borderRadius: "2px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box"
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "rotate(0deg) scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "rotate(-2deg) scale(1)";
                }}
              >
                {/* Tape */}
                <div style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%) rotate(-1deg)",
                  width: "80px",
                  height: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}></div>

                <p style={{
                  fontFamily: "'Edu VIC WA NT Beginner', sans-serif",
                  fontSize: "16px",
                  fontWeight: "500",
                  lineHeight: "1.6",
                  margin: 0,
                  maxHeight: "140px",
                  overflowY: "auto",
                  paddingTop: "8px"
                }}>
                  {profileData.bio || "No biography added yet."}
                </p>

                <div style={{
                  fontSize: "10px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "right",
                  marginTop: "16px",
                  borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                  paddingTop: "4px"
                }}>
                  [ Admin Note ]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Links Section */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Social Links</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayedSocialLinks.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {displayedSocialLinks.map((link, idx) => {
                  const platform = link.platform?.toLowerCase() || "other";
                  const iconUrl = platformIcons[platform] || platformIcons.other;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        padding: "8px 16px",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    >
                      <a
                        href={formatExternalUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        {iconUrl && (
                          <img
                            src={iconUrl}
                            alt={link.platform}
                            style={{ width: "20px", height: "20px", objectFit: "contain", filter: "invert(1)" }}
                          />
                        )}
                        <span style={{ textTransform: "capitalize", fontSize: "12px", fontWeight: "500", letterSpacing: "0.05em" }}>{link.platform}</span>
                      </a>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSocialLink(idx)}
                          style={{
                            background: "transparent",
                            border: "0",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "18px",
                            fontWeight: "bold",
                            padding: "0",
                            marginLeft: "8px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Remove Link"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#a3a3a3", fontStyle: "italic", margin: 0 }}>No social links added.</p>
            )}
          </div>

          {/* Form to add a link - only visible when editing */}
          {isEditing && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxSizing: "border-box"
            }}>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#ffffff",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="linkedin" style={{ backgroundColor: "#171717", color: "#ffffff" }}>LinkedIn</option>
                <option value="github" style={{ backgroundColor: "#171717", color: "#ffffff" }}>GitHub</option>
                <option value="twitter" style={{ backgroundColor: "#171717", color: "#ffffff" }}>Twitter</option>
                <option value="instagram" style={{ backgroundColor: "#171717", color: "#ffffff" }}>Instagram</option>
                <option value="youtube" style={{ backgroundColor: "#171717", color: "#ffffff" }}>YouTube</option>
                <option value="portfolio" style={{ backgroundColor: "#171717", color: "#ffffff" }}>Portfolio</option>
                <option value="other" style={{ backgroundColor: "#171717", color: "#ffffff" }}>Other</option>
              </select>
              <input
                type="url"
                placeholder="Enter link URL (e.g. https://linkedin.com/...)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSocialLink();
                }}
                style={{
                  flexGrow: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#ffffff",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={handleAddSocialLink}
                style={{
                  padding: "6px 16px",
                  backgroundColor: "#f59e0b",
                  color: "#171717",
                  border: "0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d97706"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f59e0b"}
              >
                Add Link
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setBio(profileData.bio || "");
                  setSocialLinks(null);
                }}
                style={{
                  padding: "8px 24px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  fontSize: "14px",
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
                onClick={handleSave}
                disabled={isUpdating}
                style={{
                  padding: "8px 24px",
                  borderRadius: "9999px",
                  border: "0",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4338ca"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setBio(profileData.bio || "");
                setSocialLinks(profileData.socialLinks || []);
                setIsEditing(true);
              }}
              style={{
                padding: "8px 24px",
                borderRadius: "9999px",
                border: "0",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4338ca"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
      </main>
    </div >
  );
};

export default AdminProfile;
