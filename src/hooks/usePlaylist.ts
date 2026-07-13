import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Playlist, Song } from '../types';

export const usePlaylist = (playlistId: string) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (!playlistId) return;
    const unsub = onSnapshot(doc(db, 'playlists', playlistId), (docSnap) => {
      if (docSnap.exists()) {
        setPlaylist({ id: docSnap.id, ...docSnap.data() } as Playlist);
      }
    });
    return unsub;
  }, [playlistId]);

  const addSong = async (song: Song) => {
    await updateDoc(doc(db, 'playlists', playlistId), { songs: arrayUnion(song) });
  };

  const removeSong = async (song: Song) => {
    await updateDoc(doc(db, 'playlists', playlistId), { songs: arrayRemove(song) });
  };

  const vote = async (songId: string, increment: number) => {
    // Implement vote logic
  };

  const reorder = async (songs: Song[]) => {
    await updateDoc(doc(db, 'playlists', playlistId), { songs });
  };

  return { playlist, addSong, removeSong, vote, reorder };
};
