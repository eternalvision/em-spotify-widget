import { createStore } from 'ecmact';
import type { NowPlaying } from '@em-spotify/shared/types';

export interface Snapshot {
  data: NowPlaying;
  receivedAt: number;
}

interface PlayerState {
  snapshot: Snapshot | null;
  receive: (snapshot: Snapshot) => void;
}

export const createPlayer = () =>
  createStore<PlayerState>((set) => ({
    snapshot: null,
    receive: (snapshot) => {
      set({ snapshot });
    },
  }));
