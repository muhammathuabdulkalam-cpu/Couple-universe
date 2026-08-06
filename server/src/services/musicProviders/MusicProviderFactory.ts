import { DeezerProvider } from './DeezerProvider';
import { IMusicProvider } from './MusicProvider.interface';

export class MusicProviderFactory {
  private static providers: Record<string, IMusicProvider> = {
    deezer: new DeezerProvider(),
  };

  public static getProvider(name: string = 'deezer'): IMusicProvider {
    const provider = this.providers[name.toLowerCase()];
    if (!provider) {
      // Default fallback to deezer provider
      return this.providers['deezer'];
    }
    return provider;
  }
}
