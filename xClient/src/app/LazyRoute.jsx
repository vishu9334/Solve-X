import { Suspense } from "react";

const RouteLoading = () => (
  <div className="min-h-screen bg-[#050509] flex items-center justify-center text-white font-mono">
    <div className="animate-pulse">Loading page...</div>
  </div>
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={<RouteLoading />}>
    {children}
  </Suspense>
);

export default LazyRoute;
