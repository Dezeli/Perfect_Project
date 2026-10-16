import { requireOptionalNativeModule } from 'expo';
export type PerfectOcr = {
  recognize(uri: string): Promise<string>;
  aiStatus(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  downloadAi(): Promise<void>;
  interpret(rawText: string): Promise<string>;
};
export default requireOptionalNativeModule<PerfectOcr>('PerfectOcr');
