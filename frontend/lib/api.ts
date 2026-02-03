const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export const apiClient = {
  async getTasks(userId: string) {
    const res = await fetch(
      `${API_URL}/api/users/${userId}/tasks`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch tasks: ${res.status}`);
    }

    return res.json();
  },

  async createTask(userId: string, task: any) {
    const res = await fetch(
      `${API_URL}/api/users/${userId}/tasks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to create task: ${res.status}`);
    }

    return res.json();
  },
};
