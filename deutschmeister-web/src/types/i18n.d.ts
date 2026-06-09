// Augments next-intl's type registry so t('…') is auto-completed and
// any missing/typo key is caught at compile time. vi is the source of truth.
import type common from '../../messages/vi/common.json';
import type nav from '../../messages/vi/nav.json';
import type auth from '../../messages/vi/auth.json';
import type metadata from '../../messages/vi/metadata.json';
import type dashboard from '../../messages/vi/dashboard.json';
import type header from '../../messages/vi/header.json';
import type settings from '../../messages/vi/settings.json';
import type games from '../../messages/vi/games.json';
import type practice from '../../messages/vi/practice.json';
import type vocabulary from '../../messages/vi/vocabulary.json';
import type progress from '../../messages/vi/progress.json';
import type landing from '../../messages/vi/landing.json';
import type errors from '../../messages/vi/errors.json';
import type account from '../../messages/vi/account.json';
import type onboarding from '../../messages/vi/onboarding.json';
import type studyPlan from '../../messages/vi/studyPlan.json';
import type learn from '../../messages/vi/learn.json';
import type arena from '../../messages/vi/arena.json';
import type speakingRooms from '../../messages/vi/speakingRooms.json';
import type subscription from '../../messages/vi/subscription.json';
import type support from '../../messages/vi/support.json';

type Messages = {
  common: typeof common;
  nav: typeof nav;
  auth: typeof auth;
  metadata: typeof metadata;
  dashboard: typeof dashboard;
  header: typeof header;
  settings: typeof settings;
  games: typeof games;
  practice: typeof practice;
  vocabulary: typeof vocabulary;
  progress: typeof progress;
  landing: typeof landing;
  errors: typeof errors;
  account: typeof account;
  onboarding: typeof onboarding;
  studyPlan: typeof studyPlan;
  learn: typeof learn;
  arena: typeof arena;
  speakingRooms: typeof speakingRooms;
  subscription: typeof subscription;
  support: typeof support;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'vi' | 'en' | 'de';
    Messages: Messages;
  }
}
