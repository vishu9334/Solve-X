import { QueryClientProvider } from "@tanstack/react-query";
// import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/queryClient.js";

const Providers = ({children}) => {
  return (
    <QueryClientProvider client={queryClient}>
        {children}
        {/* <ReactQueryDevtools initialIsOpen={false}/>  */}
    </QueryClientProvider>
  )
}

export default Providers