import { requireOptionalNativeModule } from 'expo';

export type PerfectStory = { exportStory(payload: string): Promise<string> };
export default requireOptionalNativeModule<PerfectStory>('PerfectStory');
