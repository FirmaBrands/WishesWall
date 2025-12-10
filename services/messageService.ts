import { Message } from '../types';

const LOCAL_STORAGE_KEY = 'birthday_wall_messages';
const API_URL_KEY = 'birthday_wall_api_url';

// ---------------------------------------------------------------------------
// DYNAMIC CONFIGURATION
// ---------------------------------------------------------------------------

export const getApiUrl = (): string | null => {
  return localStorage.getItem(API_URL_KEY);
};

export const setApiUrl = (url: string) => {
  if (!url) {
    localStorage.removeItem(API_URL_KEY);
  } else {
    localStorage.setItem(API_URL_KEY, url.trim());
  }
};

const isCloudMode = () => !!getApiUrl();

// Helper to safely parse numbers from Sheets (which might return empty strings or ints)
const parseNumber = (val: any, fallback?: number): number | undefined => {
  if (val === '' || val === null || val === undefined) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

// ---------------------------------------------------------------------------
// SERVICE METHODS
// ---------------------------------------------------------------------------

export const fetchMessages = async (): Promise<Message[]> => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const response = await fetch(`${apiUrl}?action=get`);
    const data = await response.json();
    const rawMessages = data.messages || [];

    // Map and sanitize data
    return rawMessages.map((row: any) => ({
      ...row,
      timestamp: parseNumber(row.timestamp, Date.now()),
      x: parseNumber(row.x),
      y: parseNumber(row.y),
      rotation: parseNumber(row.rotation),
      scale: parseNumber(row.scale),
    }));
  } catch (error) {
    console.error("Error fetching messages from cloud:", error);
    return [];
  }
};

export const saveMessage = async (text: string, author: string = 'Guest'): Promise<Message> => {
  // Create message object on client
  const newMessage: Message = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    text,
    author,
    timestamp: Date.now(),
    // We let the display view randomize visuals if not provided
  };

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    const current = await fetchMessages();
    const updated = [...current, newMessage];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    
    // Local tab sync
    const channel = new BroadcastChannel('birthday_wall_channel');
    channel.postMessage({ type: 'NEW_MESSAGE', payload: newMessage });
    return newMessage;
  }

  try {
    // Send to Google Sheets
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'add', message: newMessage }),
    });
  } catch (error) {
    console.error("Error saving to cloud:", error);
  }

  return newMessage;
};

export const clearMessages = async () => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const channel = new BroadcastChannel('birthday_wall_channel');
    channel.postMessage({ type: 'CLEAR_MESSAGES' });
    return;
  }

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clear' }),
    });
  } catch (e) {
    console.error("Failed to clear cloud:", e);
  }
};

export const subscribeToMessages = (callback: (msg: Message) => void) => {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    const channel = new BroadcastChannel('birthday_wall_channel');
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_MESSAGE') callback(event.data.payload);
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }

  // Cloud Polling Logic
  const POLL_INTERVAL = 3000; // 3 seconds
  let knownIds = new Set<string>();
  
  // Initial sync to populate known IDs
  fetchMessages().then(msgs => {
    msgs.forEach(m => knownIds.add(m.id));
  });

  const intervalId = setInterval(async () => {
    const messages = await fetchMessages();
    
    // Check for NEW messages
    messages.forEach(msg => {
      if (!knownIds.has(msg.id)) {
        knownIds.add(msg.id);
        callback(msg);
      }
    });

    // Handle External Reset detection
    if (messages.length === 0 && knownIds.size > 0) {
      knownIds.clear();
    }

  }, POLL_INTERVAL);

  return () => clearInterval(intervalId);
};

export const subscribeToReset = (callback: () => void) => {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    const channel = new BroadcastChannel('birthday_wall_channel');
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'CLEAR_MESSAGES') callback();
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }

  // For polling, we check if the list became empty
  const POLL_INTERVAL = 3000;
  let hadMessages = false;

  const intervalId = setInterval(async () => {
    const messages = await fetchMessages();
    if (messages.length > 0) hadMessages = true;
    
    if (hadMessages && messages.length === 0) {
      callback();
      hadMessages = false;
    }
  }, POLL_INTERVAL);

  return () => clearInterval(intervalId);
};