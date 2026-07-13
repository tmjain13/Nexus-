import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface QRCodeScannerProps {
  onClose: () => void;
  onSuccess: (displayName: string) => void;
  onError: (message: string) => void;
}

export function QRCodeScanner({ onClose, onSuccess, onError }: QRCodeScannerProps) {
  const { user } = useAuth();
  const [scannerReady, setScannerReady] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "enclave-qr-reader";

  useEffect(() => {
    // Check permission or set up camera
    const initializeScanner = async () => {
      try {
        // Request camera permission list
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setHasCameraPermission(true);
          const html5Qrcode = new Html5Qrcode(scannerId);
          html5QrcodeRef.current = html5Qrcode;
          setScannerReady(true);
          startScanning(html5Qrcode);
        } else {
          setHasCameraPermission(false);
          onError("No camera devices found");
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        setHasCameraPermission(false);
        onError("Camera access denied or unsupported");
      }
    };

    initializeScanner();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async (scanner: Html5Qrcode) => {
    try {
      setIsScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Success callback
          await handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent feedback on verbose scan updates
        }
      );
    } catch (err: any) {
      console.error("Failed to start scanning:", err);
      onError(err.message || "Failed to start camera scan");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (text: string) => {
    await stopScanning();
    setIsScanning(false);

    try {
      const payload = JSON.parse(text);
      if (payload.type === 'enclave_invite' && payload.userId) {
        if (!user) {
          onError("Please sign in to add contacts");
          onClose();
          return;
        }

        if (payload.userId === user.uid) {
          onError("You cannot add yourself as a contact!");
          onClose();
          return;
        }

        // Fetch scanned user profile
        const friendRef = doc(db, 'users', payload.userId);
        const friendSnap = await getDoc(friendRef);

        if (friendSnap.exists()) {
          const friendData = friendSnap.data();
          const displayName = friendData.displayName || "User";

          // Save mutual contact
          // 1. Add them to my contacts
          await setDoc(doc(db, 'users', user.uid, 'contacts', payload.userId), {
            displayName: friendData.displayName,
            username: friendData.username || '',
            photoURL: friendData.photoURL || '',
            addedAt: serverTimestamp()
          });

          // 2. Also retrieve my data and add myself to their contacts
          const myRef = doc(db, 'users', user.uid);
          const mySnap = await getDoc(myRef);
          if (mySnap.exists()) {
            const myData = mySnap.data();
            await setDoc(doc(db, 'users', payload.userId, 'contacts', user.uid), {
              displayName: myData.displayName,
              username: myData.username || '',
              photoURL: myData.photoURL || '',
              addedAt: serverTimestamp()
            });
          }

          // 3. Create a chat room and mutual connection welcome message
          const chatId = [user.uid, payload.userId].sort().join('_');
          const chatRef = doc(db, 'chats', chatId);
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              participants: [user.uid, payload.userId],
              isGroup: false,
              peerName: friendData.displayName,
              peerPhoto: friendData.photoURL,
              updatedAt: serverTimestamp()
            });
          }

          // Send welcome message in the chat
          const messageId = `welcome_${Date.now()}`;
          await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
            senderId: 'system',
            text: `You and ${displayName} are now connected on Enclave OS.`,
            type: 'text',
            status: 'sent',
            createdAt: serverTimestamp()
          });

          onSuccess(displayName);
          onClose();
        } else {
          onError("Inviting user profile not found");
          onClose();
        }
      } else {
        onError("Invalid QR code payload: Not an Enclave OS invite");
        onClose();
      }
    } catch (err) {
      console.error("QR Parse/Save error:", err);
      onError("Failed to parse QR content. Make sure it is an Enclave invite.");
      onClose();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-sm mx-auto text-white">
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
          <Camera size={16} /> Scan QR Invite
        </h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
        <div id={scannerId} className="w-full h-full object-cover" />
        
        {(!scannerReady || !isScanning) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4 text-center">
            {hasCameraPermission === false ? (
              <>
                <AlertCircle size={32} className="text-red-500 mb-2" />
                <p className="text-xs font-semibold text-red-400">Camera Access Denied</p>
                <p className="text-[10px] text-slate-500 mt-1">Please enable camera permissions in your browser settings.</p>
              </>
            ) : (
              <>
                <RefreshCw size={32} className="text-amber-500 animate-spin mb-2" />
                <p className="text-xs font-semibold text-amber-400">Starting Camera...</p>
              </>
            )}
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 border-[3px] border-amber-500/40 rounded-2xl pointer-events-none animate-pulse">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-amber-500/80 animate-bounce" />
          </div>
        )}
      </div>

      <p className="mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center">
        Position QR code inside the green/orange window
      </p>
    </div>
  );
}
