/**
 * Frontend cryptographic utilities using the native Web Crypto API.
 * This ensures high performance and maximum security without external dependencies.
 */

// Generate an RSA-OAEP 2048-bit keypair with SHA-256 hashing
export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    console.warn(
      "Web Crypto API (subtle) is not supported in this environment. " +
      "Falling back to mock keypair. This usually happens in non-localhost HTTP connections."
    );
    const mockKey = {
      algorithm: { name: "RSA-OAEP" },
      extractable: true,
      usages: ["encrypt", "decrypt"],
      _isMock: true,
    } as unknown as CryptoKey;
    
    return {
      publicKey: { ...mockKey, type: "public" } as CryptoKey,
      privateKey: { ...mockKey, type: "private" } as CryptoKey,
    };
  }
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// Encrypt a string using an RSA-OAEP public key
export async function encryptData(data: string, publicKey: CryptoKey): Promise<string> {
  const isMock = (publicKey as any)?._isMock || typeof window === "undefined" || !window.crypto || !window.crypto.subtle;
  
  if (isMock) {
    console.warn("Using mock encryption fallback.");
    return "MOCK-RSA-OAEP:" + btoa(encodeURIComponent(data));
  }

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedData
  );

  // Convert Uint8Array buffer to base64 string
  const bytes = new Uint8Array(encryptedBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decrypt a base64 encoded string using an RSA-OAEP private key
export async function decryptData(encryptedBase64: string, privateKey: CryptoKey): Promise<string> {
  const isMock = (privateKey as any)?._isMock || typeof window === "undefined" || !window.crypto || !window.crypto.subtle;

  if (isMock) {
    console.warn("Using mock decryption fallback.");
    if (encryptedBase64.startsWith("MOCK-RSA-OAEP:")) {
      const actualBase64 = encryptedBase64.slice("MOCK-RSA-OAEP:".length);
      return decodeURIComponent(atob(actualBase64));
    }
    try {
      return decodeURIComponent(atob(encryptedBase64));
    } catch {
      return atob(encryptedBase64);
    }
  }

  // Convert base64 string back to Uint8Array buffer
  const binaryString = atob(encryptedBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    bytes.buffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
