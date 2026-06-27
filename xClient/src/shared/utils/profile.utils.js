export const platformIcons = {
  linkedin: "https://img.icons8.com/ios-filled/50/linkedin.png",
  instagram: "https://img.icons8.com/ios-filled/50/instagram-new--v1.png",
  github: "https://img.icons8.com/ios-glyphs/30/github.png",
  twitter: "https://img.icons8.com/ios-filled/50/twitterx--v1.png",
  youtube: "https://img.icons8.com/ios-filled/50/youtube-play.png",
  portfolio: "https://img.icons8.com/ios-filled/50/domain.png",
  other: "https://img.icons8.com/ios-filled/50/link.png"
};

export const formatExternalUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};
