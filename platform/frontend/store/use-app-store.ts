"use client";

import { create } from "zustand";
import type { ChatMessage } from "@/lib/types";

type AppState = {
  commandOpen: boolean;
  rightPanelOpen: boolean;
  selectedCandidateId: string;
  messages: ChatMessage[];
  setCommandOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  selectCandidate: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
};

export const useAppStore = create<AppState>((set) => ({
  commandOpen: false,
  rightPanelOpen: true,
  selectedCandidateId: "",
  messages: [
    {
      id: "m1",
      role: "assistant",
      content: "Platform connected to backend API. Select a candidate or ask a scientific question to begin.",
      citations: [],
    },
  ],
  setCommandOpen: (open) => set({ commandOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  selectCandidate: (id) => set({ selectedCandidateId: id }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
