export {};

declare global {
  interface Window {
    loopyDesktop?: {
      platform: string;
      notifications: {
        list: () => Promise<string[]>;
        schedule: (input: { id: string; reminderId: string; title: string; body: string; dueAt: number }) => Promise<string>;
        cancel: (id: string) => Promise<void>;
        cancelAll: () => Promise<void>;
        onClick: (listener: (reminderId: string) => void) => () => void;
      };
    };
  }
}
