import { QueryClientProvider } from "@tanstack/react-query";
// import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/queryClient.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Providers = ({children}) => {
  return (
    <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        {/* <ReactQueryDevtools initialIsOpen={false}/>  */}
    </QueryClientProvider>
  )
}

export default Providers