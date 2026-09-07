/**
 * Track 1 Configuration (1트랙: 팀장 1명 + 팀원 5명 = 총 6명, 단일 1열 배치)
 */
export const track1Config = {
  track: {
    id: "track-1",
    title: "멋쟁이사자처럼 1트랙 팀 빌딩",
    desc: "1트랙 6명의 팀원(팀장 1명 + 팀원 5명) 라인업을 포커 덱에서 공개합니다.",
    tag: "1트랙",
    cardTheme: "track1-cyan" // Cyber Sapphire & Neon Cyan Card Theme
  },
  teams: [
    {
      id: "team-1",
      name: "1트랙",
      accentColor: "#00e5ff",
      leaders: [
        {
          id: "t1-l-1",
          name: "김현서",
          role: "기획",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Junho&backgroundColor=b6e3f4",
          tags: ["Html", "CSS", "React", "Node.js", "Django", "Python"],
          cardTier: "leader"
        }
      ],
      priorityMembers: []
    }
  ],
  remainingPool: [
    {
      id: "t1-r-1",
      name: "김경진",
      role: "백엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Haneul&backgroundColor=ffd5dc",
      tags: ["Java", "Html", "JavaScript", "CSS", "React"],
      cardTier: "regular",
      targetTeamId: "team-1"
    },
    {
      id: "t1-r-2",
      name: "김민종",
      role: "프론트엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Minseok&backgroundColor=c0aede",
      tags: ["Html", "CSS", "JavaScript", "React", "Svelte"],
      cardTier: "regular",
      targetTeamId: "team-1"
    },
    {
      id: "t1-r-3",
      name: "김수연",
      role: "기획",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sejin&backgroundColor=d1d4f9",
      tags: ["pigma"],
      cardTier: "regular",
      targetTeamId: "team-1"
    },
    {
      id: "t1-r-4",
      name: "박수홍",
      role: "백엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Yeseul&backgroundColor=ffd5dc",
      tags: ["Python", "Github Actions", "Firebase", "Supabase", "Vercel", "Figzam"],
      cardTier: "regular",
      targetTeamId: "team-1"
    },
    {
      id: "t1-r-5",
      name: "이준호",
      role: "백엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Siwan&backgroundColor=b6e3f4",
      tags: ["Java", "Kotiln", "Python", "C"],
      cardTier: "regular",
      targetTeamId: "team-1"
    }
  ]
};

/**
 * Track 2 Configuration (2트랙 팀 빌딩 - 현재 활성 데이터)
 */
export const track2Config = {
  track: {
    id: "track-2",
    title: "멋쟁이사자처럼 2트랙 팀 빌딩",
    desc: "2트랙 3개 팀의 팀장과 팀원을 포커 덱에서 공개합니다.",
    tag: "2트랙"
  },
  teams: [
    {
      id: "team-1",
      name: "1팀",
      accentColor: "#FF7710",
      leaders: [
        {
          id: "l-1",
          name: "박성수",
          role: "프론트엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Minjun&backgroundColor=b6e3f4",
          tags: ["Full-Stack"],
          cardTier: "leader"
        }
      ],
      priorityMembers: [
        {
          id: "p-1",
          name: "김채원",
          role: "기획",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Jiwon&backgroundColor=ffd5dc",
          tags: ["Figma", "Adobe"],
          cardTier: "priority"
        },
        {
          id: "p-2",
          name: "이찬희",
          role: "기획",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Dongwon&backgroundColor=c0aede",
          tags: ["PPT", "Canva", "Docs"],
          cardTier: "priority"
        }
      ]
    },
    {
      id: "team-2",
      name: "2팀",
      accentColor: "#38bdf8",
      leaders: [
        {
          id: "l-2",
          name: "안태경",
          role: "기획",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Dohyun&backgroundColor=c0aede",
          tags: ["Pigma", "Notion", "Gemini"],
          cardTier: "leader"
        }
      ],
      priorityMembers: [
        {
          id: "p-3",
          name: "김희진",
          role: "프론트엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Haeun&backgroundColor=b6e3f4",
          tags: ["Html", "CSS", "JavaScript", "Java"],
          cardTier: "priority"
        },
        {
          id: "p-4",
          name: "김민성",
          role: "백엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Minho&backgroundColor=d1d4f9",
          tags: ["Spring Boot", "MySQL", "Python", "Java", "React", "Expo"],
          cardTier: "priority"
        }
      ]
    },
    {
      id: "team-3",
      name: "3팀",
      accentColor: "#a855f7",
      leaders: [
        {
          id: "l-3a",
          name: "박정은",
          role: "프론트엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Seoyeon&backgroundColor=b6e3f4",
          tags: ["Html", "CSS", "JavaScrip"],
          cardTier: "leader",
          isCoLeader: true
        },
        {
          id: "l-3b",
          name: "김동현",
          role: "백엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Subin&backgroundColor=d1d4f9",
          tags: ["Cloud", "Docker", "DevOps"],
          cardTier: "leader",
          isCoLeader: true
        }
      ],
      priorityMembers: [
        {
          id: "p-5",
          name: "김서진",
          role: "프론트엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Jaewon&backgroundColor=ffd5dc",
          tags: ["React", "Java Script"],
          cardTier: "priority"
        },
        {
          id: "p-6",
          name: "유지효",
          role: "프론트엔드",
          avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sehun&backgroundColor=c0aede",
          tags: ["Html", "CSS", "React", "Vite", "Github"],
          cardTier: "priority"
        }
      ]
    }
  ],
  remainingPool: [
    {
      id: "r-2",
      name: "박한음",
      role: "기획",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Joohyuk&backgroundColor=b6e3f4",
      tags: ["ManyFast"],
      cardTier: "regular",
      targetTeamId: "team-2"
    },
    {
      id: "r-1",
      name: "홍지원",
      role: "백엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Taeri&backgroundColor=c0aede",
      tags: ["Django", "Spring Boot"],
      cardTier: "regular",
      targetTeamId: "team-1"
    },
    {
      id: "r-4",
      name: "문서연",
      role: "프론트엔드",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Taeri&backgroundColor=c0aede",
      tags: ["JavaScript", "Html", "CSS"],
      cardTier: "regular",
      targetTeamId: "team-3"
    }
  ]
};

/**
 * Tracks Registry and Default Config
 */
export const clubTracks = {
  track1: track1Config,
  track2: track2Config
};

// Default export is track2Config for full backward compatibility
export const clubTrackConfig = track2Config;

