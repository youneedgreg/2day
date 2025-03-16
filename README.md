# Productivity & Habit Tracker Application

## Application Overview

This application combines a robust habit tracker with comprehensive productivity tools. The habit tracker allows users to build positive habits or quit negative ones, with streak tracking and data visualization. The productivity section includes todo lists, reminders, notes, and more - all stored in local storage.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **State Management**: React Context API + Local Storage
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Application Structure


## Core Features

### 1. Habit Tracker

- **Habit Building & Quitting**: Track both habits you want to build and ones you want to quit
- **Streaks**: Visual representation of habit streaks with "don't break the chain" methodology
- **Analytics**: Charts showing progress over time, success rates, trends
- **Customization**: Frequency settings (daily, specific days, multiple times per day)
- **Reminders**: Option to set reminders for habits

### 2. Todo Lists

- **Task Management**: Create, edit, delete tasks
- **Categories**: Organize tasks by project or category
- **Priority Levels**: Set importance/urgency levels
- **Due Dates**: Add deadlines to tasks
- **Filtering**: View tasks by status, category, or date

### 3. Reminders

- **Time-based Notifications**: Set reminders for specific times
- **Recurring Reminders**: Daily, weekly, monthly options
- **Categories**: Organize reminders by type
- **Quick Add**: Easily add simple reminders

### 4. Notes

- **Rich Text Editing**: Format notes with basic styling
- **Categories**: Organize notes by topic
- **Search**: Find notes by content or title
- **Favorites**: Mark important notes for quick access

### 5. Dashboard

- **Overview**: See today's habits, upcoming tasks, and reminders
- **Progress**: View habit streaks and completion rates
- **Quick Add**: Add new items from the dashboard
- **Customization**: Arrange dashboard widgets based on preference

## Data Management

All data will be stored in the browser's localStorage with the following structure:

```typescript
interface AppData {
  habits: Habit[];
  todos: Todo[];
  reminders: Reminder[];
  notes: Note[];
  settings: AppSettings;
  lastUpdated: string;
}
```

The app will include data export/import functionality to allow users to backup their data.