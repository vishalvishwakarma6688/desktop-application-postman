import { create } from 'zustand';

export interface P2PPeer {
    userId: string;
    username: string;
    ip: string;
}

export interface P2PShareInvite {
    senderName: string;
    url: string;
    pin: string;
    workspaceName: string;
}

interface P2PState {
    peers: P2PPeer[];
    incomingShare: P2PShareInvite | null;
    setPeers: (peers: P2PPeer[]) => void;
    setIncomingShare: (share: P2PShareInvite | null) => void;
    reset: () => void;
}

export const useP2PStore = create<P2PState>((set) => ({
    peers: [],
    incomingShare: null,
    setPeers: (peers) => set({ peers }),
    setIncomingShare: (incomingShare) => set({ incomingShare }),
    reset: () => set({ peers: [], incomingShare: null }),
}));
