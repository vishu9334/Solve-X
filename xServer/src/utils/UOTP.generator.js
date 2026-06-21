export const f4R = () => {
    if (process.env.NODE_ENV === "test") {
        return "9999";
    }
    return String(Math.floor(Math.random() * 9000) + 1000);
  };