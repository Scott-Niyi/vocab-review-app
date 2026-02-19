/**
 * Application Configuration Types
 */

export interface AppConfig {
  projectName?: string;
  createdAt?: string;
  lastOpened?: string;
  description?: string;
  reviewRecencyWeight?: number;  // 0.0 to 1.0, default 0.5 - controls balance between SR and recency scoring
  contentFontSize?: number;  // Font size multiplier for content text, default 1.0 (range: 0.8 to 1.5)
}
