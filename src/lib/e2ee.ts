/**
 * Private key is non-extractable for security. Only the public key can be exported for key exchange.
 */
export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey", "deriveBits"]
  );
};

export const exportPublicKey = async (publicKey: CryptoKey) => {
  const exported = await window.crypto.subtle.exportKey("jwk", publicKey);
  return exported;
};

export const importPublicKey = async (jwk: JsonWebKey) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
};

export const importPrivateKey = async (jwk: JsonWebKey) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false, // Set extractable to false so the key cannot be exported/extracted from runtime memory
    ["deriveKey", "deriveBits"]
  );
};

export const deriveSharedKey = async (privateKey: CryptoKey, publicKey: CryptoKey) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false, // Set extractable to false so derived keys cannot be exported
    ["encrypt", "decrypt"]
  );
};

export const encryptText = async (text: string, key: CryptoKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );
  
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
};

export const decryptText = async (encryptedData: { iv: number[], data: number[] }, key: CryptoKey) => {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.data)
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed", error);
    return "[Encrypted Message]";
  }
};

export const generateSymmetricKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const exportSymmetricKey = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await window.crypto.subtle.exportKey("jwk", key);
};

export const importSymmetricKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

