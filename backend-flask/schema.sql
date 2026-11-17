CREATE DATABASE IF NOT EXISTS skillsphere
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE skillsphere;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  category ENUM('Student', 'Graduate', 'Professional', 'Entrepreneur') NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  headline VARCHAR(180) NOT NULL DEFAULT '',
  bio TEXT NOT NULL,
  avatar_url VARCHAR(500) NOT NULL DEFAULT '',
  education_or_role VARCHAR(140) NOT NULL DEFAULT '',
  organization VARCHAR(140) NOT NULL DEFAULT '',
  location VARCHAR(100) NOT NULL DEFAULT '',
  interests VARCHAR(300) NOT NULL DEFAULT '',
  achievements TEXT NOT NULL,
  github_url VARCHAR(500) NOT NULL DEFAULT '',
  linkedin_url VARCHAR(500) NOT NULL DEFAULT '',
  website_url VARCHAR(500) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_skills_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_skills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Intermediate',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_skill (user_id, skill_id),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  estimated_hours INT NOT NULL DEFAULT 20,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_roadmaps_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  roadmap_id BIGINT NOT NULL,
  step_order INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  resource_title VARCHAR(140) NOT NULL DEFAULT '',
  resource_url VARCHAR(500) NOT NULL DEFAULT '',
  estimated_minutes INT NOT NULL DEFAULT 45,
  added_by_user_id BIGINT NULL,
  INDEX idx_steps_roadmap (roadmap_id, step_order),
  CONSTRAINT fk_steps_roadmap FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  CONSTRAINT fk_steps_user FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_learning_progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  step_id BIGINT NOT NULL,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_step_progress (user_id, step_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_step FOREIGN KEY (step_id) REFERENCES roadmap_steps(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(140) NOT NULL,
  summary VARCHAR(240) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  technologies VARCHAR(255) NOT NULL DEFAULT '',
  thumbnail_url VARCHAR(500) NOT NULL DEFAULT '',
  github_url VARCHAR(500) NOT NULL DEFAULT '',
  live_url VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_user (user_id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  post_type ENUM('Question', 'Knowledge Share', 'Learning Experience') NOT NULL DEFAULT 'Knowledge Share',
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(220) NOT NULL DEFAULT '',
  last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_activity (last_activity_at),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comments_post (post_id),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collaboration_projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  required_skills VARCHAR(320) NOT NULL,
  team_size INT NOT NULL DEFAULT 4,
  status ENUM('Open', 'In Progress', 'Completed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_collab_status (status),
  CONSTRAINT fk_collab_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collaboration_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  collaboration_id BIGINT NOT NULL,
  requester_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_collab_requester (collaboration_id, requester_id),
  CONSTRAINT fk_req_collab FOREIGN KEY (collaboration_id) REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_user FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  collaboration_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'Collaborator',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_project_member (collaboration_id, user_id),
  CONSTRAINT fk_member_collab FOREIGN KEY (collaboration_id) REFERENCES collaboration_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
