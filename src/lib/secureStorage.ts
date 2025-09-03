// Enhanced secure storage utilities
import { toast } from 'sonner';

interface StorageOptions {
  encrypt?: boolean;
  expiresIn?: number; // milliseconds
}

class SecureStorage {
  private static readonly PREFIX = 'fs_secure_';
  private static readonly ENCRYPTION_KEY = 'frame_fuser_local_key';

  // Simple XOR encryption for local storage (basic obfuscation)
  private static encrypt(data: string): string {
    const key = this.ENCRYPTION_KEY;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private static decrypt(data: string): string {
    try {
      const decoded = atob(data);
      const key = this.ENCRYPTION_KEY;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: any, options: StorageOptions = {}): void {
    try {
      const item = {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        timestamp: Date.now(),
        expires: options.expiresIn ? Date.now() + options.expiresIn : null
      };

      const serialized = JSON.stringify(item);
      const finalValue = options.encrypt ? this.encrypt(serialized) : serialized;
      
      localStorage.setItem(this.PREFIX + key, finalValue);
    } catch (error) {
      console.error('SecureStorage: Failed to store item', error);
      toast.error('Failed to save data locally');
    }
  }

  static getItem(key: string, encrypted: boolean = false): any {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return null;

      const serialized = encrypted ? this.decrypt(stored) : stored;
      if (!serialized) return null;

      const item = JSON.parse(serialized);
      
      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);
        return null;
      }

      // Try to parse JSON, return string if parsing fails
      try {
        return JSON.parse(item.value);
      } catch {
        return item.value;
      }
    } catch (error) {
      console.error('SecureStorage: Failed to retrieve item', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error('SecureStorage: Failed to remove item', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('SecureStorage: Failed to clear storage', error);
    }
  }

  // API Key specific methods
  static setApiKey(provider: string, key: string): void {
    this.setItem(`api_key_${provider}`, key, { 
      encrypt: true,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Log security event (without the actual key)
    console.log(`🔐 API key stored securely for provider: ${provider}`);
  }

  static getApiKey(provider: string): string | null {
    return this.getItem(`api_key_${provider}`, true);
  }

  static removeApiKey(provider: string): void {
    this.removeItem(`api_key_${provider}`);
    console.log(`🔐 API key removed for provider: ${provider}`);
  }

  // Session security helpers
  static logSecurityEvent(event: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`🔒 CLIENT SECURITY EVENT [${timestamp}]: ${event}`, details);
    
    // Store security events for monitoring
    const events = this.getItem('security_events') || [];
    events.push({ event, details, timestamp });
    
    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    
    this.setItem('security_events', events);
  }
}

export default SecureStorage;
