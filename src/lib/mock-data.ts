
export const MOCK_USER = {
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
  role: "Senior Product Manager",
  experience: "8 years",
  skills: ["Product Strategy", "Agile", "User Research", "Data Analytics"],
  stats: {
    totalInterviews: 12,
    avgScore: 84,
    streak: 5,
    badges: ["Fast Learner", "High Confidence", "Clarity Master"]
  }
};

export const MOCK_INTERVIEW_HISTORY = [
  {
    id: "int-1",
    role: "Senior Technical PM",
    date: "2025-02-15",
    score: 88,
    status: "Completed",
    feedback: "Strong technical understanding, but could improve situational leadership examples."
  },
  {
    id: "int-2",
    role: "Head of Product",
    date: "2025-02-10",
    score: 76,
    status: "Completed",
    feedback: "Good confidence, tone was slightly aggressive at times."
  },
  {
    id: "int-3",
    role: "Product Strategy Lead",
    date: "2025-02-02",
    score: 92,
    status: "Completed",
    feedback: "Excellent clarity and structure. Perfect use of STAR method."
  }
];

export const MOCK_DRILLS = [
  {
    id: "drill-1",
    title: "The STAR Method Master",
    category: "Behavioral",
    duration: "10 mins",
    difficulty: "Medium"
  },
  {
    id: "drill-2",
    title: "Handling Stress Questions",
    category: "Stress Mode",
    duration: "15 mins",
    difficulty: "Hard"
  },
  {
    id: "drill-3",
    title: "Product Case Study",
    category: "Technical",
    duration: "20 mins",
    difficulty: "Hard"
  }
];
