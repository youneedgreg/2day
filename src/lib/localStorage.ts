export function getLocalStorage(key: string, defaultValue: any) {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue);
    } catch (error) {
      console.error('Error parsing JSON from localStorage', error);
      return defaultValue;
    }
  }
  return defaultValue;
}

export function setLocalStorage(key: string, value: any) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting JSON to localStorage', error);
  }
}
