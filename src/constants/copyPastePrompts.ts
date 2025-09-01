/**
 * Collection of copy-paste ready prompt examples for common editing tasks
 * These prompts are battle-tested and produce reliable results
 */

export const COPY_PASTE_PROMPTS = {
  // Object replacement examples
  "Dog to Cat": {
    prompt: "replace the masked dog with a short-haired tabby cat in the same pose and position. preserve scene composition and global appearance. match lighting: existing natural lighting. match style: photorealistic. seamless integration, accurate perspective, consistent shadows, correct scale.",
    negative: "no partial transforms, no hybrids, no remnants of original dog, no double animals, no distortion, no floating elements",
    params: { guidance: 14, steps: 42, strength: 0.90 },
    mode: "replace"
  },
  
  "Person Replacement": {
    prompt: "replace the masked person with a different person of similar build and age, maintaining the same pose and clothing style. preserve scene composition and global appearance. match lighting: existing scene lighting. match style: photorealistic. natural proportions, seamless integration.",
    negative: "no partial people, no face mixing, no remnants of original person, no double faces, no distortion, no floating body parts",
    params: { guidance: 16, steps: 45, strength: 0.92 },
    mode: "replace"
  },

  "Car Replacement": {
    prompt: "replace the masked vehicle with a modern sedan car in the same orientation and approximate size. preserve scene composition and global appearance. match lighting: ambient daylight. match style: photorealistic. accurate shadows, proper perspective, realistic reflections.",
    negative: "no partial vehicles, no mixed car parts, no remnants of original vehicle, no floating elements, no wrong scale, no impossible angles",
    params: { guidance: 15, steps: 40, strength: 0.88 },
    mode: "replace"
  },

  // Object addition examples
  "Add Butterfly": {
    prompt: "add a colorful monarch butterfly flying inside the masked area. preserve scene composition and global appearance. match lighting: soft natural sunlight. match style: photorealistic. delicate wings, natural pose, correct scale and depth.",
    negative: "no unnatural colors, no floating insects, no wrong scale, no cartoon style, no multiple butterflies",
    params: { guidance: 12, steps: 36, strength: 0.85 },
    mode: "add"
  },

  "Add Flowers": {
    prompt: "add beautiful wildflowers and green grass inside the masked area. preserve scene composition and global appearance. match lighting: natural outdoor lighting. match style: photorealistic. organic growth patterns, varied heights, natural colors.",
    negative: "no artificial flowers, no floating plants, no wrong colors, no identical repetition, no unnatural arrangement",
    params: { guidance: 13, steps: 38, strength: 0.87 },
    mode: "add"
  },

  "Add Bird": {
    prompt: "add a small songbird perched naturally inside the masked area. preserve scene composition and global appearance. match lighting: existing outdoor lighting. match style: photorealistic. detailed feathers, natural pose, correct proportions.",
    negative: "no floating birds, no wrong scale, no cartoon style, no unnatural poses, no multiple birds, no blurred features",
    params: { guidance: 14, steps: 42, strength: 0.88 },
    mode: "add"
  },

  // Object removal examples  
  "Clean Removal": {
    prompt: "remove the masked objects completely and reconstruct the background naturally. maintain original lighting, perspective, and style. seamless background reconstruction, no traces of removed elements.",
    negative: "no artifacts, no remnants, no fragments, no visible seams, no unnatural patches, no color mismatches, no repetitive patterns",
    params: { guidance: 20, steps: 52, strength: 0.96 },
    mode: "remove"
  },

  "Remove Person": {
    prompt: "remove the masked person completely and fill the area with appropriate background content. maintain natural perspective, lighting, and scene continuity. seamless background reconstruction.",
    negative: "no ghost outlines, no person remnants, no body parts, no clothing fragments, no unnatural shadows, no visible patches",
    params: { guidance: 22, steps: 56, strength: 0.98 },
    mode: "remove"
  },

  "Remove Text": {
    prompt: "remove all text, logos, watermarks, and written content from the masked area. restore the original background seamlessly. maintain image quality and natural appearance.",
    negative: "no text fragments, no letter remnants, no logo pieces, no color bleeding, no artifacts, no visible editing marks",
    params: { guidance: 18, steps: 48, strength: 0.94 },
    mode: "remove"
  }
} as const;

export type PromptKey = keyof typeof COPY_PASTE_PROMPTS;

/**
 * Get all available prompt examples
 */
export function getAllPromptExamples() {
  return Object.entries(COPY_PASTE_PROMPTS).map(([key, value]) => ({
    key: key as PromptKey,
    title: key,
    ...value
  }));
}

/**
 * Get prompt examples filtered by mode
 */
export function getPromptExamplesByMode(mode: 'replace' | 'add' | 'remove') {
  return getAllPromptExamples().filter(example => example.mode === mode);
}

/**
 * Get a specific prompt example
 */
export function getPromptExample(key: PromptKey) {
  return COPY_PASTE_PROMPTS[key];
}