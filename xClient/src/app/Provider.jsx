import { ReactLenis } from "lenis/react";
import { QueryClientProvider } from "@tanstack/react-query";
// import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/queryClient.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SocketProvider } from "../features/socket/SocketContext.jsx";

const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {children}
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        {/* <ReactQueryDevtools initialIsOpen={false}/>  */}
      </SocketProvider>
    </QueryClientProvider>
  )
}

export default Providers