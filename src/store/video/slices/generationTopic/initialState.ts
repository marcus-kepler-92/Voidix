import { type ImageGenerationTopic } from '@/types/generation';

export interface GenerationTopicState {
  activeGenerationTopicId: string | null;
  generationTopics: ImageGenerationTopic[];
  loadingGenerationTopicIds: string[];
}

export const initialGenerationTopicState: GenerationTopicState = {
  activeGenerationTopicId: null,
  generationTopics: [],
  loadingGenerationTopicIds: [],
};
