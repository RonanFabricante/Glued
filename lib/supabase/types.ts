export type ConnectionStatus = 'active' | 'met' | 'closed' | 'timed_out';

export interface Profile {
  id: string;
  first_name: string;
  area: string | null;
  intent_types: string[];
  availability: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  user_a: string;
  user_b: string;
  status: ConnectionStatus;
  created_at: string;
  expires_at: string;
  resolved_at: string | null;
}

export interface ConnectionWithProfile extends Connection {
  other_user: Profile;
}

export interface DashboardSlot {
  type: 'active' | 'empty';
  connection?: ConnectionWithProfile;
  daysRemaining?: number;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}