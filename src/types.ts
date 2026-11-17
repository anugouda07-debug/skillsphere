export type UserCategory = 'Student' | 'Graduate' | 'Professional' | 'Entrepreneur';

export interface User {
  id: number;
  full_name: string;
  email: string;
  category: UserCategory;
  is_demo: boolean;
  created_at: string;
}

export interface Profile {
  id: number;
  user_id: number;
  headline: string;
  bio: string;
  avatar_url: string;
  education_or_role: string;
  organization: string;
  location: string;
  interests: string;
  achievements: string;
  github_url: string;
  linkedin_url: string;
  website_url: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
}

export interface UserSkill {
  id: number;
  skill_id: number;
  name: string;
  category: string;
  description?: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface RoadmapSummary {
  id: number;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_hours: number;
  description: string;
  total_steps: number;
  completed_steps: number;
  progress_percent: number;
}

export interface RoadmapStep {
  id: number;
  roadmap_id: number;
  step_order: number;
  title: string;
  description: string;
  resource_title: string;
  resource_url: string;
  estimated_minutes: number;
  status: 'pending' | 'completed';
  completed_at: string | null;
}

export interface PortfolioProject {
  id: number;
  user_id: number;
  title: string;
  summary: string;
  description: string;
  technologies: string;
  thumbnail_url: string;
  github_url: string;
  live_url: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_category?: UserCategory;
  owner_is_demo?: number;
  owner_headline?: string;
  owner_avatar?: string;
  owner_organization?: string;
}

export interface CommunityPost {
  id: number;
  user_id: number;
  post_type: 'Question' | 'Knowledge Share' | 'Learning Experience';
  title: string;
  content: string;
  tags: string;
  last_activity_at: string;
  created_at: string;
  author_name: string;
  author_category: UserCategory;
  author_is_demo: number;
  author_headline?: string;
  author_avatar?: string;
  author_organization?: string;
  comment_count?: number;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_category: UserCategory;
  author_is_demo: number;
  author_headline?: string;
  author_avatar?: string;
}

export interface CollaborationProject {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  category: string;
  required_skills: string;
  team_size: number;
  status: 'Open' | 'In Progress' | 'Completed';
  created_at: string;
  owner_name: string;
  owner_category: UserCategory;
  owner_is_demo: number;
  owner_headline?: string;
  owner_avatar?: string;
  owner_organization?: string;
  member_count?: number;
  match_score?: number;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  full_name: string;
  category: UserCategory;
  is_demo: number;
  headline?: string;
  avatar_url?: string;
}

export interface CollaborationRequest {
  id: number;
  collaboration_id: number;
  requester_id: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  project_title?: string;
  project_category?: string;
  requester_name?: string;
  requester_category?: UserCategory;
  requester_headline?: string;
  requester_avatar?: string;
  owner_name?: string;
  owner_category?: UserCategory;
}
