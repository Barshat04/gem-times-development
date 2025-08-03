const mockApi = {
    login: async (credentials) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
        console.log(credentials);
      // Simulate login validation
      if (credentials.username && credentials.pin) {
        return { username: credentials.username, siteID: credentials.siteID };
      }
      throw new Error('Invalid credentials');
    },
  
    getTimesheetStatus: async (userId) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
  
      // Mock logic to return different statuses based on conditions
      const statuses = ['no_timesheet', 'in_progress', 'submitted'];
      const randomIndex = Math.floor(Math.random() * statuses.length);
      return { status: statuses[0] };
    }
  };
  
  export default mockApi;