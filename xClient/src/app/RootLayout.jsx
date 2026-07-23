import { Outlet } from "react-router-dom";
import { SocketProvider } from "../features/socket/SocketContext.jsx";

const RootLayout = () => (
  <SocketProvider>
    <Outlet />
  </SocketProvider>
);

export default RootLayout;
