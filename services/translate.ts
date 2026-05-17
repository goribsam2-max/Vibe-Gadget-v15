export const translateText = async (text: string, force: boolean = false): Promise<string> => {
  if (!text) return text;
  
  // Only translate if language is bengali
  if (!force) {
    if (typeof window !== 'undefined' && localStorage.getItem('vibe_lang') !== 'bn') {
      return text;
    }
  }

  // Check cache
  const cacheKey = `tr_${text}`;
  if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;
  }

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    let translated = "";
    data[0].forEach((item: any) => {
        translated += item[0];
    });
    
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, translated);
    }
    return translated;
  } catch (error) {
    console.error("Translation error", error);
    return text;
  }
};
