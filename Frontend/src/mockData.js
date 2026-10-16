export const studentProfile = {
  name: 'Alex Morgan',
  title: 'Frontend developer & product designer',
  location: 'Boston, MA',
  university: 'Northeastern University',
  year: 'Junior',
  email: 'alex.morgan@campus.edu',
  bio: 'Curious builder passionate about creating thoughtful digital experiences. I love turning complex ideas into simple, useful products and collaborating with people who care about their craft.',
  availability: 'Available for projects',
  rating: 4.9,
  reviews: 12,
  skills: [
    { name: 'React', level: 90, proficiency: 'Expert' },
    { name: 'UI/UX Design', level: 78, proficiency: 'Advanced' },
    { name: 'Figma', level: 85, proficiency: 'Advanced' },
    { name: 'TypeScript', level: 62, proficiency: 'Intermediate' },
  ],
  wantedSkills: ['Product management', 'Node.js', 'User research', 'Motion design'],
  certifications: [
    { name: 'Google UX Design Professional Certificate', issuer: 'Google · 2025' },
    { name: 'Meta Front-End Developer', issuer: 'Meta · 2024' },
  ],
  portfolio: [
    {
      title: 'Campus Eats',
      category: 'Mobile app · Product design',
      description: 'A campus food discovery app designed to help students find their next favorite local spot.',
      skills: ['Figma', 'React Native'],
    },
    {
      title: 'Study Circle',
      category: 'Web app · Frontend',
      description: 'A collaborative study planner that helps classmates stay on track together.',
      skills: ['React', 'TypeScript'],
    },
  ],
}

export const activeProjects = [
  {
    id: 'campus-connect',
    title: 'Campus Connect',
    category: 'Web',
    status: 'In Progress',
    client: 'BrightPath Labs',
    deadline: 'Nov 18, 2026',
    duration: '4-6 weeks',
    budget: '$1,200 - $1,800',
    description: 'Build a welcoming platform that helps new students find communities, events, and resources on campus.',
    skills: ['React', 'Figma', 'TypeScript'],
    requirements: ['Responsive desktop and mobile experience', 'Reusable component library', 'Weekly progress updates'],
    studentsRequired: 3,
    clientVerified: true,
  },
  {
    id: 'wellness-companion',
    title: 'Student Wellness Companion',
    category: 'Mobile',
    status: 'Open',
    client: 'Mindful Campus',
    deadline: 'Dec 02, 2026',
    duration: '6-8 weeks',
    budget: '$900 - $1,400',
    description: 'Create a supportive mobile experience for students to build healthy routines and access campus wellness resources.',
    skills: ['React Native', 'UI/UX', 'Figma'],
    requirements: ['Accessible, inclusive interface', 'Habit tracking flow', 'Prototype and handoff documentation'],
    studentsRequired: 2,
    clientVerified: true,
  },
  {
    id: 'green-campus',
    title: 'Green Campus Dashboard',
    category: 'Data / AI',
    status: 'Open',
    client: 'Earthwise Initiative',
    deadline: 'Nov 28, 2026',
    duration: '3-5 weeks',
    budget: '$700 - $1,100',
    description: 'Turn campus sustainability data into an engaging dashboard that inspires students to take action.',
    skills: ['Data visualization', 'React', 'Python'],
    requirements: ['Interactive charts and filters', 'Clear data storytelling', 'Desktop and mobile layouts'],
    studentsRequired: 2,
    clientVerified: true,
  },
  {
    id: 'makers-market',
    title: 'Makers Market Identity',
    category: 'Design',
    status: 'Open',
    client: 'The Student Foundry',
    deadline: 'Nov 07, 2026',
    duration: '2-4 weeks',
    budget: '$500 - $850',
    description: 'Develop a bright visual identity and launch-ready design system for a student maker marketplace.',
    skills: ['Branding', 'Figma', 'Illustration'],
    requirements: ['Logo and visual identity', 'Social media templates', 'Design system handoff'],
    studentsRequired: 1,
    clientVerified: false,
  },
  {
    id: 'course-compass',
    title: 'Course Compass',
    category: 'Web',
    status: 'Open',
    client: 'Northstar Learning',
    deadline: 'Jan 09, 2027',
    duration: '5-7 weeks',
    budget: '$1,000 - $1,600',
    description: 'Design and prototype an intuitive course planning tool that helps students map out their academic journey.',
    skills: ['Product design', 'React', 'User research'],
    requirements: ['Student interviews and insights', 'Interactive high-fidelity prototype', 'Design handoff'],
    studentsRequired: 3,
    clientVerified: true,
  },
]

export const recommendedPartners = [
  { name: 'Jordan Lee', title: 'Full-stack developer', university: 'Boston University', match: 98, skills: ['Node.js', 'React', 'MongoDB'], wants: ['UI/UX', 'Product design'], rating: 4.9, color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Sam Rivera', title: 'Product designer', university: 'Northeastern University', match: 94, skills: ['Figma', 'User research', 'Prototyping'], wants: ['Frontend development', 'React'], rating: 5.0, color: 'bg-rose-100 text-rose-800' },
  { name: 'Taylor Kim', title: 'Data science student', university: 'MIT', match: 91, skills: ['Python', 'Machine learning', 'SQL'], wants: ['Data visualization', 'React'], rating: 4.8, color: 'bg-cyan-100 text-cyan-800' },
  { name: 'Casey Patel', title: 'Mobile developer', university: 'Tufts University', match: 89, skills: ['React Native', 'Expo', 'Firebase'], wants: ['Product design', 'Figma'], rating: 4.9, color: 'bg-amber-100 text-amber-900' },
  { name: 'Morgan Chen', title: 'UX researcher', university: 'Boston College', match: 86, skills: ['User research', 'Accessibility', 'Figma'], wants: ['Frontend development', 'TypeScript'], rating: 4.7, color: 'bg-emerald-100 text-emerald-800' },
  { name: 'Jamie Brooks', title: 'Visual designer', university: 'Emerson College', match: 84, skills: ['Branding', 'Illustration', 'Figma'], wants: ['Web development', 'Animation'], rating: 4.8, color: 'bg-violet-100 text-violet-800' },
]

export const applicationStatuses = [
  { project: 'Campus Connect', client: 'BrightPath Labs', status: 'In Progress', updated: '2 days ago' },
  { project: 'Student Wellness Companion', client: 'Mindful Campus', status: 'Under Review', updated: '4 days ago' },
  { project: 'Green Campus Dashboard', client: 'Earthwise Initiative', status: 'Shortlisted', updated: '1 week ago' },
  { project: 'Makers Market Identity', client: 'The Student Foundry', status: 'Submitted', updated: '1 week ago' },
]

export const teamInvitations = [
  { team: 'Project Atlas', from: 'Jordan Lee', project: 'Campus Connect', date: 'Today', color: 'bg-indigo-100 text-indigo-800' },
  { team: 'Design for Good', from: 'Sam Rivera', project: 'Student Wellness Companion', date: 'Yesterday', color: 'bg-rose-100 text-rose-800' },
]

export const activeTeam = [
  { name: 'Alex Morgan', role: 'Frontend Developer', skill: 'React, TypeScript', color: 'bg-amber-100 text-amber-900' },
  { name: 'Jordan Lee', role: 'Full-stack Developer', skill: 'Node.js, MongoDB', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Sam Rivera', role: 'Product Designer', skill: 'Figma, Research', color: 'bg-rose-100 text-rose-800' },
]

export const projectCategories = ['All categories', 'Web', 'Mobile', 'Design', 'Data / AI']

export const businessProfile = {
  name: 'BrightPath Labs',
  contact: 'Maya Chen',
  initials: 'B',
  verified: true,
  industry: 'Education technology',
  location: 'Boston, MA',
  about: 'We partner with emerging talent to build practical tools that make campus life more connected and accessible.',
}

export const clientApplicants = [
  {
    id: 'jordan',
    name: 'Jordan Lee',
    type: 'Individual',
    skills: ['React', 'Node.js', 'MongoDB'],
    rating: 4.9,
    completedProjects: 8,
    match: 98,
    color: 'bg-indigo-100 text-indigo-800',
    bio: 'Full-stack developer focused on building reliable products for student communities.',
  },
  {
    id: 'team-atlas',
    name: 'Project Atlas',
    type: 'Team',
    skills: ['React', 'Figma', 'Product strategy'],
    rating: 4.9,
    completedProjects: 5,
    match: 96,
    color: 'bg-teal-100 text-teal-800',
    bio: 'A three-person team pairing product design with frontend and backend development.',
  },
  {
    id: 'sam',
    name: 'Sam Rivera',
    type: 'Individual',
    skills: ['Figma', 'User research', 'Prototyping'],
    rating: 5.0,
    completedProjects: 6,
    match: 91,
    color: 'bg-rose-100 text-rose-800',
    bio: 'Product designer who turns user insights into clear, accessible experiences.',
  },
  {
    id: 'team-spark',
    name: 'Team Spark',
    type: 'Team',
    skills: ['TypeScript', 'React', 'Accessibility'],
    rating: 4.8,
    completedProjects: 4,
    match: 88,
    color: 'bg-amber-100 text-amber-900',
    bio: 'A student team experienced in accessible web apps and iterative delivery.',
  },
]

export const workspaceTasks = [
  { id: 'discovery', title: 'Finalize student discovery flows', assignee: 'Sam Rivera', status: 'Completed', due: 'Oct 20' },
  { id: 'components', title: 'Build shared UI component library', assignee: 'Alex Morgan', status: 'In Progress', due: 'Oct 24' },
  { id: 'api', title: 'Connect events and community API', assignee: 'Jordan Lee', status: 'In Progress', due: 'Oct 29' },
  { id: 'qa', title: 'Run accessibility and mobile QA', assignee: 'Alex Morgan', status: 'Not Started', due: 'Nov 04' },
]

export const workspaceMessages = [
  { id: 1, sender: 'Maya Chen', role: 'Client', text: 'The updated onboarding flow looks great. Could we make the campus selection step a little clearer?', time: '10:14 AM', color: 'bg-blue-100 text-blue-800' },
  { id: 2, sender: 'Sam Rivera', role: 'Team', text: 'Absolutely. I’ll add a short helper message and share the revised prototype this afternoon.', time: '10:18 AM', color: 'bg-rose-100 text-rose-800' },
  { id: 3, sender: 'Jordan Lee', role: 'Team', text: 'API endpoint is ready for the events feed. I’ve added the docs to the project files.', time: '10:31 AM', color: 'bg-indigo-100 text-indigo-800' },
]

export const adminReports = [
  { id: 'verification-northstar', item: 'Northstar Learning', type: 'Business verification', submitted: '2 hours ago', status: 'Pending' },
  { id: 'verification-student', item: 'Riley Thompson', type: 'Student verification', submitted: '5 hours ago', status: 'Pending' },
  { id: 'report-project', item: 'Unclear project listing', type: 'Project report', submitted: 'Yesterday', status: 'Review needed' },
  { id: 'report-profile', item: 'Profile content review', type: 'User report', submitted: 'Yesterday', status: 'Review needed' },
]

export const adminMetrics = [
  { label: 'Total students', value: '12,480', change: '+12.8%', icon: 'users', color: 'bg-teal-50 text-teal-800' },
  { label: 'Businesses', value: '1,264', change: '+8.4%', icon: 'building', color: 'bg-blue-50 text-blue-800' },
  { label: 'Projects', value: '3,842', change: '+16.2%', icon: 'briefcase', color: 'bg-violet-50 text-violet-800' },
  { label: 'Active projects', value: '684', change: '+5.7%', icon: 'activity', color: 'bg-amber-50 text-amber-800' },
]
