export async function uploadToIPFS(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, "encrypted-payload.bin");

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data.IpfsHash) {
    throw new Error("Invalid response from upload API");
  }

  return data.IpfsHash;
}

export async function fetchFromIPFS(cid: string): Promise<Blob> {
  try {
    const pinataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

    if (pinataResponse.ok) {
      return await pinataResponse.blob();
    }
  } catch {
    // Suppress error and fall back
  }

  const fallbackResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);

  if (!fallbackResponse.ok) {
    throw new Error("Failed to fetch payload from IPFS networks");
  }

  return await fallbackResponse.blob();
}
