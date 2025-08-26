function decodeContentFromURL(encodedContent: string): string {
  try {
    return decodeURIComponent(encodedContent);
  } catch (error) {
    console.error("Failed to decode URL content:", error);
    return "";
  }
}

export function getSharedContentFromURL(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith("#src=")) {
    // remove "#src=" prefix
    return decodeContentFromURL(hash.substring(5));
  }
  return null;
}

function encodeContentToUrl(content: string): string {
  const encodedContent = encodeURIComponent(content);
  return `${window.location.pathname}${window.location.search}#src=${encodedContent}`;
}

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export async function shareContentViaURL(content: string): Promise<void> {
  const newURL = encodeContentToUrl(content);
  window.history.replaceState(null, "", newURL);

  if (navigator.share && isMobileDevice()) {
    try {
      await navigator.share({
        title: "Brew Recipe",
        url: newURL,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(newURL);
    } catch (error) {
      console.error("Failed to copy URL to clipboard:", error);
    }
  }
}
