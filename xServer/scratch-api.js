async function checkApi() {
  try {
    // 1. Log in to get token
    const loginRes = await fetch("http://localhost:8001/api/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "connect.solvex99@gmail.com",
        password: "AdminPassword@123"
      })
    });
    
    const loginData = await loginRes.json();
    
    // Get token from headers or response data
    const authHeader = loginRes.headers.get("authorization") || loginRes.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : loginData?.data?.accessToken;
    
    console.log("Logged in successfully. Token length:", token?.length);
    if (!token) {
      console.log("Login Response:", loginData);
      return;
    }
    
    // 2. Fetch dashboard data
    const dashboardRes = await fetch("http://localhost:8001/api/v1/dashboard/admin", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const dashboardData = await dashboardRes.json();
    console.log("API Response Status:", dashboardRes.status);
    console.log("API Response Data structure:", JSON.stringify(dashboardData, null, 2));
  } catch (error) {
    console.error("API Call Failed:", error.message);
  }
}

checkApi();
